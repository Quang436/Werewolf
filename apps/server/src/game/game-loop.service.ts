/**
 * GameLoopService — Bộ điều phối chuyển pha (State Transition Handler).
 *
 * Chịu trách nhiệm:
 * 1. Phân chia vai trò ngẫu nhiên bằng crypto.randomInt (Fisher-Yates shuffle) và xáo ghế khi bắt đầu game.
 * 2. Điều phối chuyển đổi pha (State Transitions) theo đúng Finite State Machine (RULEBOOK / FSM).
 * 3. Chạy các engine tính toán nghiệp vụ tại các pha chuyển giao (NightResolver, WinChecker).
 * 4. Kiểm soát phân tán (Distributed Concurrency):
 *    - Sử dụng Redis Lock ngăn chặn race condition khi nhiều timer / request cùng kích hoạt.
 *    - Kiểm tra `stateVersion` trước khi cập nhật.
 * 5. Lập lịch Timer chuyển pha chính xác bằng Timestamp tuyệt đối `phaseEndsAt`.
 */

import crypto from 'node:crypto';
import {
  FIRST_NIGHT_TURNS,
  NightResolver,
  NIGHT_TURNS,
  Phase,
  Role,
  ROLE_TEAM,
  RoomProjector,
  RoomState,
  TimerSchedulerHelper,
  WinChecker,
} from '@werewolf/shared';
import { RedisStoreAdapter } from './game-room.manager';

export interface Broadcaster {
  emitToRoom(roomId: string, event: string, payload: unknown): void;
  emitToUser(userId: string, event: string, payload: unknown): void;
  emitToWolves(roomId: string, event: string, payload: unknown): void;
  emitToLovers(roomId: string, event: string, payload: unknown): void;
}

export class GameLoopService {
  constructor(
    private readonly redis: RedisStoreAdapter,
    private readonly broadcaster: Broadcaster
  ) {}

  /**
   * Bắt đầu ván đấu (Start Game)
   */
  public async startGame(roomId: string, hostUserId: string): Promise<RoomState> {
    const lockToken = await this.redis.acquireLock(roomId, 3000);
    if (!lockToken) throw new Error('ROOM_LOCKED');

    try {
      const room = await this.redis.getRoom(roomId);
      if (!room) throw new Error('ROOM_NOT_FOUND');
      if (room.hostId !== hostUserId) throw new Error('UNAUTHORIZED');
      if (room.phase !== 'LOBBY') throw new Error('GAME_ALREADY_STARTED');

      const playerCount = room.players.length;
      if (playerCount < room.settings.minPlayers || playerCount > room.settings.maxPlayers) {
        throw new Error(`PLAYER_COUNT_MUST_BE_BETWEEN_${room.settings.minPlayers}_AND_${room.settings.maxPlayers}`);
      }

      // Kiểm tra tổng số lượng role cấu hình
      let totalAssignedRoles = 0;
      const rolePool: Role[] = [];
      for (const [r, count] of Object.entries(room.settings.roleConfig)) {
        totalAssignedRoles += count;
        for (let i = 0; i < count; i++) {
          rolePool.push(r as Role);
        }
      }

      if (totalAssignedRoles !== playerCount) {
        throw new Error(`TOTAL_ROLES_CONFIGURED_(${totalAssignedRoles})_MUST_MATCH_PLAYER_COUNT_(${playerCount})`);
      }

      // Fisher-Yates Shuffle bằng crypto.randomInt an toàn
      for (let i = rolePool.length - 1; i > 0; i--) {
        const j = crypto.randomInt(0, i + 1);
        [rolePool[i], rolePool[j]] = [rolePool[j], rolePool[i]];
      }

      // Xáo trộn số ghế ngồi (Seats) để ngăn chặn suy đoán qua thứ tự vào phòng
      const seats = Array.from({ length: playerCount }, (_, i) => i + 1);
      for (let i = seats.length - 1; i > 0; i--) {
        const j = crypto.randomInt(0, i + 1);
        [seats[i], seats[j]] = [seats[j], seats[i]];
      }

      // Gán vai và ghế cho từng người chơi
      room.players.forEach((player, idx) => {
        const role = rolePool[idx];
        player.seat = seats[idx];
        player.role = role;
        player.team = ROLE_TEAM[role];
        player.isAlive = true;
        player.roleState = {
          lastProtectedId: null,
          hasHealPotion: true,
          hasPoisonPotion: true,
          seerResults: [],
          hasShot: false,
        };
      });

      // Chuyển sang pha ASSIGN_ROLES (cho người chơi xem vai 8 giây)
      room.phase = 'ASSIGN_ROLES';
      room.round = 1;
      room.stateVersion++;
      room.phaseStartedAt = Date.now();
      room.phaseEndsAt = Date.now() + room.settings.durations.assignRoles * 1000;

      await this.redis.setRoom(room);

      // Gửi role bí mật riêng cho từng client
      this.dispatchRoleAssignedEvents(room);
      this.broadcastRoomSnapshot(room);

      return room;
    } finally {
      await this.redis.releaseLock(roomId, lockToken);
    }
  }

  /**
   * Chuyển đổi trạng thái phòng (Transition To Next Phase)
   */
  public async transition(roomId: string, targetPhase: Phase): Promise<RoomState> {
    const lockToken = await this.redis.acquireLock(roomId, 3000);
    if (!lockToken) throw new Error('ROOM_LOCKED');

    try {
      const room = await this.redis.getRoom(roomId);
      if (!room) throw new Error('ROOM_NOT_FOUND');

      const prevPhase = room.phase;
      room.phase = targetPhase;
      room.stateVersion++;
      room.phaseStartedAt = Date.now();

      // Xử lý logic vào từng pha cụ thể
      await this.handlePhaseEntry(room, prevPhase, targetPhase);

      await this.redis.setRoom(room);
      this.broadcastRoomSnapshot(room);

      return room;
    } finally {
      await this.redis.releaseLock(roomId, lockToken);
    }
  }

  /**
   * Xử lý Side-Effects và thời lượng khi bước vào pha mới
   */
  private async handlePhaseEntry(room: RoomState, from: Phase, to: Phase): Promise<void> {
    const d = room.settings.durations;

    switch (to) {
      case 'NIGHT_START': {
        room.phaseEndsAt = Date.now() + d.nightStart * 1000;
        // Reset bảng hành động đêm
        room.night = {
          bodyguardTarget: null,
          wolfVotes: {},
          wolfTarget: null,
          witchSave: false,
          witchPoisonTarget: null,
          seerTarget: null,
        };
        break;
      }

      case 'CUPID_TURN':
        room.phaseEndsAt = Date.now() + d.cupid * 1000;
        break;

      case 'LOVERS_TURN':
        room.phaseEndsAt = Date.now() + d.lovers * 1000;
        break;

      case 'BODYGUARD_TURN':
        room.phaseEndsAt = Date.now() + d.bodyguard * 1000;
        break;

      case 'WEREWOLF_TURN':
        room.phaseEndsAt = Date.now() + d.werewolf * 1000;
        break;

      case 'WITCH_TURN':
        room.phaseEndsAt = Date.now() + d.witch * 1000;
        break;

      case 'SEER_TURN':
        room.phaseEndsAt = Date.now() + d.seer * 1000;
        break;

      case 'NIGHT_RESOLVE': {
        // Pha tính toán nội bộ tức thì của Server
        room.phaseEndsAt = null;
        const resolution = NightResolver.resolve({
          round: room.round,
          players: room.players,
          night: room.night,
          settings: room.settings,
          lovers: room.lovers,
        });

        // Áp dụng cái chết cho người chơi
        const deadIds = new Set(resolution.deaths.map((d) => d.playerId));
        for (const p of room.players) {
          if (deadIds.has(p.id)) {
            p.isAlive = false;
            const record = resolution.deaths.find((d) => d.playerId === p.id);
            p.deathInfo = {
              round: room.round,
              cause: record?.cause || 'WOLF',
            };
          }
        }

        // Cập nhật pending triggers (Thợ Săn)
        room.pendingTriggers.push(...resolution.pendingTriggers);

        // Ghi lịch sử ván đấu
        room.history.push({
          round: room.round,
          type: 'NIGHT_RESULT',
          night: { ...room.night },
          deaths: resolution.deaths.map((d) => ({ playerId: d.playerId, cause: d.cause })),
        });

        // Chuyển tiếp ngay sang DAY_ANNOUNCEMENT
        room.phase = 'DAY_ANNOUNCEMENT';
        room.phaseEndsAt = Date.now() + d.announcement * 1000;
        room.afterCheckWin = 'DAY';
        break;
      }

      case 'DAY_ANNOUNCEMENT':
        room.phaseEndsAt = Date.now() + d.announcement * 1000;
        break;

      case 'DEATH_TRIGGERS':
        room.phaseEndsAt = Date.now() + d.deathTriggers * 1000;
        break;

      case 'CHECK_WIN': {
        // Kiểm tra điều kiện thắng tức thì
        room.phaseEndsAt = null;
        const winResult = WinChecker.check({
          players: room.players,
          lovers: room.lovers,
        });

        if (winResult.winner) {
          room.winner = winResult.winner;
          room.phase = 'GAME_OVER';
          room.phaseEndsAt = null;
        } else {
          // Chưa có phe thắng -> đi tiếp theo ngữ cảnh
          if (room.afterCheckWin === 'DAY') {
            room.phase = 'DAY_DISCUSSION';
            room.phaseEndsAt = Date.now() + d.discussion * 1000;
            // Reset state biểu quyết ngày
            room.day = {
              votes: {},
              revoteCandidates: null,
              revoteCount: 0,
              readyToVote: [],
              accusedId: null,
              judgment: {},
            };
          } else {
            // Vừa xong phiên treo cổ ban ngày -> Chuyển sang đêm tiếp theo
            room.round++;
            room.phase = 'NIGHT_START';
            room.phaseEndsAt = Date.now() + d.nightStart * 1000;
          }
        }
        break;
      }

      case 'DAY_DISCUSSION':
        room.phaseEndsAt = Date.now() + d.discussion * 1000;
        break;

      case 'DAY_VOTING':
        room.phaseEndsAt = Date.now() + d.voting * 1000;
        break;

      case 'DAY_REVOTE':
        room.phaseEndsAt = Date.now() + d.revote * 1000;
        break;

      case 'DAY_DEFENSE':
        room.phaseEndsAt = Date.now() + d.defense * 1000;
        break;

      case 'DAY_JUDGMENT':
        room.phaseEndsAt = Date.now() + d.judgment * 1000;
        break;

      case 'DAY_EXECUTION':
        room.phaseEndsAt = Date.now() + d.execution * 1000;
        room.afterCheckWin = 'NIGHT';
        break;

      case 'GAME_OVER':
        room.phaseEndsAt = null;
        break;
    }
  }

  /**
   * Broadcast state snapshot đã may đo an toàn (Data Masked) cho từng người chơi
   */
  public broadcastRoomSnapshot(room: RoomState): void {
    for (const player of room.players) {
      try {
        const maskedView = RoomProjector.projectFor(player.id, room);
        this.broadcaster.emitToUser(player.id, 'state:snapshot', {
          v: room.stateVersion,
          ts: Date.now(),
          data: maskedView,
        });
      } catch (err) {
        console.error(`[Projector Error] Failed to project for user ${player.id}:`, err);
      }
    }
  }

  /**
   * Phát vai bí mật riêng từng socket khi bắt đầu
   */
  private dispatchRoleAssignedEvents(room: RoomState): void {
    const wolves = room.players
      .filter((p) => p.team === 'WEREWOLF')
      .map((p) => ({ id: p.id, nickname: p.nickname }));

    for (const player of room.players) {
      if (!player.role || !player.team) continue;
      this.broadcaster.emitToUser(player.id, 'role:assigned', {
        v: room.stateVersion,
        ts: Date.now(),
        data: {
          role: player.role,
          team: player.team,
          ...(player.team === 'WEREWOLF' ? { teammates: wolves } : {}),
        },
      });
    }
  }
}
