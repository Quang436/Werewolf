/**
 * TimerWorker — Background Worker điều phối Timer phân tán trên Redis Sorted Set.
 *
 * Cơ chế hoạt động:
 * 1. Chạy định kỳ (polling interval 500ms).
 * 2. Tìm tất cả timer trong `ww:timers` có `score <= Date.now()`.
 * 3. Lấy ra và xóa khỏi ZSET một cách nguyên tử.
 * 4. Kiểm tra Optimistic Concurrency:
 *    - Nếu `stateVersion` và `phase` trong room state khớp với member của timer -> Chuyển pha kế tiếp!
 *    - Nếu không khớp (do tất cả đã vote xong sớm và phòng đã chuyển pha trước đó) -> Bỏ qua.
 * 5. Áp dụng DisconnectHandler.resolveTimeoutAction cho các người chơi chưa gửi hành động trước khi chuyển pha.
 */

import {
  DisconnectHandler,
  Phase,
  RoomState,
  TimerSchedulerHelper,
} from '@werewolf/shared';
import { GameLoopService } from './game-loop.service';
import { RedisStoreAdapter } from './game-room.manager';
import { NightQueueManager } from './night-queue.manager';

export interface RedisZSetStore extends RedisStoreAdapter {
  zadd(key: string, score: number, member: string): Promise<void>;
  zpopExpired(key: string, maxScore: number, limit: number): Promise<string[]>;
  zrem(key: string, member: string): Promise<void>;
}

export class InMemoryZSetRedisAdapter implements RedisZSetStore {
  private rooms = new Map<string, string>();
  private codes = new Map<string, string>();
  private locks = new Map<string, { token: string; expiresAt: number }>();
  private zsets = new Map<string, { score: number; member: string }[]>();

  async getRoom(roomId: string): Promise<RoomState | null> {
    const raw = this.rooms.get(roomId);
    return raw ? JSON.parse(raw) : null;
  }
  async setRoom(room: RoomState): Promise<void> {
    this.rooms.set(room.id, JSON.stringify(room));
  }
  async deleteRoom(roomId: string): Promise<void> {
    this.rooms.delete(roomId);
  }
  async getRoomIdByCode(code: string): Promise<string | null> {
    return this.codes.get(code.toUpperCase()) || null;
  }
  async setRoomCodeMapping(code: string, roomId: string): Promise<void> {
    this.codes.set(code.toUpperCase(), roomId);
  }
  async acquireLock(roomId: string, ttlMs: number): Promise<string | null> {
    const now = Date.now();
    const existing = this.locks.get(roomId);
    if (existing && existing.expiresAt > now) return null;
    const token = Math.random().toString(36).substring(2);
    this.locks.set(roomId, { token, expiresAt: now + ttlMs });
    return token;
  }
  async releaseLock(roomId: string, token: string): Promise<boolean> {
    const existing = this.locks.get(roomId);
    if (existing && existing.token === token) {
      this.locks.delete(roomId);
      return true;
    }
    return false;
  }

  async zadd(key: string, score: number, member: string): Promise<void> {
    let list = this.zsets.get(key);
    if (!list) {
      list = [];
      this.zsets.set(key, list);
    }
    list = list.filter((item) => item.member !== member);
    list.push({ score, member });
    list.sort((a, b) => a.score - b.score);
    this.zsets.set(key, list);
  }

  async zpopExpired(key: string, maxScore: number, limit: number): Promise<string[]> {
    const list = this.zsets.get(key) || [];
    const expired: string[] = [];
    const remaining: { score: number; member: string }[] = [];

    for (const item of list) {
      if (item.score <= maxScore && expired.length < limit) {
        expired.push(item.member);
      } else {
        remaining.push(item);
      }
    }

    this.zsets.set(key, remaining);
    return expired;
  }

  async zrem(key: string, member: string): Promise<void> {
    const list = this.zsets.get(key) || [];
    this.zsets.set(
      key,
      list.filter((item) => item.member !== member)
    );
  }
}

export class TimerWorker {
  private timerKey = 'ww:timers';
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(
    private readonly redis: RedisZSetStore,
    private readonly gameLoop: GameLoopService
  ) {}

  public start(pollIntervalMs: number = 500): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.intervalId = setInterval(async () => {
      await this.tick();
    }, pollIntervalMs);
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  /**
   * Một chu kỳ xử lý Timer
   */
  public async tick(now: number = Date.now()): Promise<number> {
    const expiredMembers = await this.redis.zpopExpired(this.timerKey, now, 50);
    let processedCount = 0;

    for (const rawMember of expiredMembers) {
      const parsed = TimerSchedulerHelper.deserializeMember(rawMember);
      if (!parsed) continue;

      const { roomId, stateVersion, expectedPhase } = parsed;

      try {
        const room = await this.redis.getRoom(roomId);
        if (!room) continue;

        // Kiểm tra phiên bản trạng thái và pha dự kiến
        if (room.stateVersion === stateVersion && room.phase === expectedPhase) {
          // Xử lý Timeout Fallback cho các người chơi chưa kịp thao tác
          this.applyTimeoutFallbacks(room);
          await this.redis.setRoom(room);

          // Xác định pha kế tiếp và chuyển pha (transition đã tích hợp lock an toàn)
          const nextPhase = this.determineNextPhase(room);
          if (nextPhase) {
            await this.gameLoop.transition(roomId, nextPhase);
            processedCount++;
          }
        }
      } catch (err) {
        console.error(`[TimerWorker Error] Failed processing room ${roomId}:`, err);
      }
    }

    return processedCount;
  }

  /**
   * Đăng ký một timer đếm ngược chuyển pha vào Redis ZSET
   */
  public async scheduleTimer(roomId: string, stateVersion: number, phase: Phase, phaseEndsAt: number): Promise<void> {
    const member = TimerSchedulerHelper.serializeMember({
      roomId,
      stateVersion,
      expectedPhase: phase,
    });
    await this.redis.zadd(this.timerKey, phaseEndsAt, member);
  }

  /**
   * Áp dụng fallback tự động khi hết giờ (và AI bot tự hành động nếu là ghế bot)
   */
  private applyTimeoutFallbacks(room: RoomState): void {
    // Nếu đang ở lượt Sói mà có bot Sói chưa vote -> bot Sói tự chọn 1 người dân còn sống
    if (room.phase === 'NIGHT_WEREWOLF' || room.phase === 'WEREWOLF_TURN') {
      const nonWolfAlive = room.players.filter((p) => p.isAlive && p.team !== 'WEREWOLF');
      for (const wolf of room.players) {
        if (wolf.isAlive && wolf.team === 'WEREWOLF' && wolf.id.startsWith('bot_') && !room.night.wolfVotes[wolf.id]) {
          if (nonWolfAlive.length > 0) {
            const victim = nonWolfAlive[Math.floor(Math.random() * nonWolfAlive.length)];
            room.night.wolfVotes[wolf.id] = victim.id;
          }
        }
      }
    }

    // Nếu đang ở lượt Bảo Vệ mà Bảo Vệ là bot -> tự chọn bảo vệ 1 người hợp lệ
    if ((room.phase === 'NIGHT_BODYGUARD' || room.phase === 'BODYGUARD_TURN') && !room.night.bodyguardTarget) {
      const botBg = room.players.find((p) => p.isAlive && p.role === 'BODYGUARD' && p.id.startsWith('bot_'));
      if (botBg) {
        const candidates = room.players.filter((p) => p.isAlive && p.id !== botBg.roleState.lastProtectedId);
        if (candidates.length > 0) {
          const picked = candidates[Math.floor(Math.random() * candidates.length)];
          room.night.bodyguardTarget = picked.id;
          botBg.roleState.lastProtectedId = picked.id;
        }
      }
    }

    for (const player of room.players) {
      if (!player.isAlive) continue;

      const fallback = DisconnectHandler.resolveTimeoutAction(room, player.id, room.phase);
      if (fallback.actionType === 'DAY_VOTE') {
        const p = fallback.payload as { targetId: string };
        if (!room.day.votes[player.id]) {
          // Nếu là bot và đang ở pha DAY_VOTING -> bot bỏ phiếu cho 1 nghi phạm ngẫu nhiên hoặc theo người chơi
          if (player.id.startsWith('bot_')) {
            const existingTargets = Object.values(room.day.votes).filter((v) => v && v !== 'SKIP');
            if (existingTargets.length > 0 && Math.random() < 0.65) {
              room.day.votes[player.id] = existingTargets[0];
            } else {
              const aliveOthers = room.players.filter((pl) => pl.isAlive && pl.id !== player.id);
              if (aliveOthers.length > 0) {
                room.day.votes[player.id] = aliveOthers[Math.floor(Math.random() * aliveOthers.length)].id;
              } else {
                room.day.votes[player.id] = p.targetId;
              }
            }
          } else {
            room.day.votes[player.id] = p.targetId;
          }
        }
      } else if (fallback.actionType === 'DAY_JUDGE') {
        const p = fallback.payload as { verdict: 'GUILTY' | 'INNOCENT' };
        if (!room.day.judgment[player.id] && player.id !== room.day.accusedId) {
          room.day.judgment[player.id] = p.verdict;
        }
      }
    }
  }

  /**
   * Xác định pha kế tiếp theo FSM khi hết thời gian
   */
  private determineNextPhase(room: RoomState): Phase | null {
    switch (room.phase) {
      case 'ASSIGN_ROLES':
      case 'READING_CARDS':
        return 'NIGHT_FALL';

      case 'NIGHT_FALL':
      case 'NIGHT_START': {
        const queue = NightQueueManager.buildNightQueue(room.round, room.settings.roleConfig || {}, room.players);
        if (queue.length > 0) {
          return queue[0].phase;
        }
        return 'NIGHT_BODYGUARD';
      }

      // Classic 4-turn legacy support
      case 'BODYGUARD_TURN':
        return 'WEREWOLF_TURN';

      case 'WEREWOLF_TURN':
        if (room.settings.roleConfig['WITCH'] && room.settings.roleConfig['WITCH'] > 0) {
          return 'WITCH_TURN';
        }
        return 'SEER_TURN';

      case 'WITCH_TURN':
        return 'SEER_TURN';

      case 'SEER_TURN':
        return 'NIGHT_RESOLVE';

      // Các pha đêm trong Dynamic Night Queue
      case 'DOPPELGANGER_TURN':
      case 'CUPID_TURN':
      case 'LOVERS_TURN':
      case 'VIRGINIA_WOOLF_TURN':
      case 'HOODLUM_TURN':
      case 'DIRE_WOLF_TURN':
      case 'MASON_TURN':
      case 'NIGHT_BODYGUARD':
      case 'PRIEST_TURN':
      case 'SPELLCASTER_TURN':
      case 'OLD_HAG_TURN':
      case 'NIGHT_WEREWOLF':
      case 'NIGHT_SEER':
      case 'SORCERESS_TURN':
      case 'PI_TURN':
      case 'CULT_LEADER_TURN':
      case 'VAMPIRE_TURN':
      case 'DRUNK_TURN': {
        const queue = NightQueueManager.buildNightQueue(room.round, room.settings.roleConfig || {}, room.players);
        const next = NightQueueManager.getNextNightPhase(room.phase, queue);
        if (next === 'NIGHT_RESOLVE' && queue.length === 0) {
          // Fallback nếu phòng chưa cấu hình vai trò
          if (room.phase === 'NIGHT_BODYGUARD') return 'NIGHT_WEREWOLF';
          if (room.phase === 'NIGHT_WEREWOLF') return 'NIGHT_SEER';
          if (room.phase === 'NIGHT_SEER') return 'NIGHT_RESOLVE';
        }
        return next;
      }

      case 'NIGHT_RESOLVE':
        return 'DAY_ANNOUNCE';

      case 'DAY_ANNOUNCE':
      case 'DAY_ANNOUNCEMENT':
        if (room.pendingTriggers.length > 0) {
          return 'DEATH_TRIGGERS';
        }
        return 'DAY_DISCUSSION';

      case 'DEATH_TRIGGERS':
        return 'CHECK_WIN_CONDITION';

      case 'DAY_DISCUSSION':
        return 'DAY_VOTING';

      case 'DAY_VOTING':
      case 'DAY_REVOTE':
        return 'DAY_EXECUTION';

      case 'VOTE_RESOLVE':
        return 'DAY_DEFENSE';

      case 'DAY_DEFENSE':
        return 'DAY_JUDGMENT';

      case 'DAY_JUDGMENT': {
        let guilty = 0;
        let innocent = 0;
        for (const verdict of Object.values(room.day.judgment)) {
          if (verdict === 'GUILTY') guilty++;
          if (verdict === 'INNOCENT') innocent++;
        }
        if (guilty > innocent && room.day.accusedId) {
          return 'DAY_EXECUTION';
        }
        return 'CHECK_WIN_CONDITION';
      }

      case 'DAY_EXECUTION':
        if (room.pendingTriggers.length > 0) {
          return 'DEATH_TRIGGERS';
        }
        return 'CHECK_WIN_CONDITION';

      case 'CHECK_WIN_CONDITION':
      case 'CHECK_WIN':
        return 'NIGHT_FALL';

      default:
        return null;
    }
  }
}
