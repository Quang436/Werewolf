/**
 * GameGateway — Realtime WebSocket Gateway (Socket.io) cho Game Ma Sói.
 *
 * Chịu trách nhiệm:
 * 1. Xác thực JWT tại Handshake (chống giả mạo userId).
 * 2. Quản lý phân luồng Socket Rooms:
 *    - `user:${userId}` — Kênh riêng tư từng user
 *    - `room:${roomId}` — Toàn bộ phòng chơi
 *    - `room:${roomId}:wolves` — Kênh riêng của bầy Sói
 *    - `room:${roomId}:lovers` — Kênh riêng của Cặp đôi
 *    - `room:${roomId}:dead` — Kênh trò chuyện của người đã chết
 * 3. Tiếp nhận và Validate mọi sự kiện Client gửi lên (C2S) bằng Zod Schema.
 * 4. Tích hợp GameRoomManager, GameLoopService, TimerWorker và RoomProjector.
 */

import {
  Ack,
  C2S,
  ChatChannel,
  ErrorCode,
  Phase,
  Role,
  RoomProjector,
  RoomState,
  SeerAppearance,
} from '@werewolf/shared';
import { GameLoopService } from './game-loop.service';
import { GameRoomManager, RedisStoreAdapter } from './game-room.manager';
import { TimerWorker } from './timer.worker';

export interface SocketUserSession {
  userId: string;
  nickname: string;
  avatarUrl?: string | null;
  roomId?: string;
}

export interface ClientSocket {
  id: string;
  data: SocketUserSession;
  join(room: string | string[]): Promise<void> | void;
  leave(room: string): Promise<void> | void;
  emit(event: string, payload: unknown): void;
}

export interface ServerSocketBroadcaster {
  to(room: string): { emit(event: string, payload: unknown): void };
}

export class GameGateway {
  constructor(
    private readonly roomManager: GameRoomManager,
    private readonly gameLoop: GameLoopService,
    private readonly timerWorker: TimerWorker,
    private readonly redis: RedisStoreAdapter,
    private readonly io: ServerSocketBroadcaster
  ) {
    this.gameLoop.setTimerScheduler(this.timerWorker);
  }

  /**
   * Xác thực kết nối và gán thông tin định danh
   */
  public handleConnection(socket: ClientSocket, session: SocketUserSession): void {
    socket.data = session;
    socket.join(`user:${session.userId}`);
  }

  /**
   * Xử lý khi socket ngắt kết nối
   */
  public async handleDisconnect(socket: ClientSocket): Promise<void> {
    const { userId, roomId } = socket.data;
    if (!roomId) return;

    const room = await this.redis.getRoom(roomId);
    if (!room) return;

    const player = room.players.find((p) => p.id === userId);
    if (player) {
      player.connection = 'DISCONNECTED';
      player.disconnectedAt = Date.now();
      room.stateVersion++;
      await this.redis.setRoom(room);

      // Thông báo cập nhật danh sách người chơi
      this.broadcastRoomSnapshot(room);
    }
  }

  /* ============================== ROOM MANAGEMENT ============================== */

  public async onRoomCreate(socket: ClientSocket, rawPayload: unknown): Promise<Ack<{ roomId: string; code: string }>> {
    const parsed = C2S['room:create'].safeParse(rawPayload);
    if (!parsed.success) return { ok: false, error: { code: 'INVALID_PAYLOAD', message: 'Dữ liệu không hợp lệ' } };

    try {
      const room = await this.roomManager.createRoom(
        { id: socket.data.userId, nickname: socket.data.nickname, avatarUrl: socket.data.avatarUrl },
        parsed.data.settings
      );

      socket.data.roomId = room.id;
      socket.join(`room:${room.id}`);

      return { ok: true, data: { roomId: room.id, code: room.code } };
    } catch (err: any) {
      return { ok: false, error: { code: 'CONFLICT', message: err.message } };
    }
  }

  public async onRoomJoin(socket: ClientSocket, rawPayload: unknown): Promise<Ack<{ roomId: string }>> {
    const parsed = C2S['room:join'].safeParse(rawPayload);
    if (!parsed.success) return { ok: false, error: { code: 'INVALID_PAYLOAD', message: 'Mã phòng phải gồm 6 ký tự' } };

    try {
      const { room } = await this.roomManager.joinRoom(parsed.data.code, {
        id: socket.data.userId,
        nickname: socket.data.nickname,
        avatarUrl: socket.data.avatarUrl,
      });

      socket.data.roomId = room.id;
      socket.join(`room:${room.id}`);

      // Nếu là Sói, join vào kênh wolves
      const player = room.players.find((p) => p.id === socket.data.userId);
      if (player?.team === 'WEREWOLF') {
        socket.join(`room:${room.id}:wolves`);
      }
      if (player?.loverId) {
        socket.join(`room:${room.id}:lovers`);
      }

      this.broadcastRoomSnapshot(room);

      return { ok: true, data: { roomId: room.id } };
    } catch (err: any) {
      const code: ErrorCode =
        err.message === 'ROOM_NOT_FOUND'
          ? 'ROOM_NOT_FOUND'
          : err.message === 'ROOM_FULL'
          ? 'ROOM_FULL'
          : err.message === 'GAME_IN_PROGRESS'
          ? 'GAME_IN_PROGRESS'
          : 'CONFLICT';
      return { ok: false, error: { code, message: err.message } };
    }
  }

  public async onRoomLeave(socket: ClientSocket): Promise<Ack> {
    const { roomId, userId } = socket.data;
    if (!roomId) return { ok: true };

    try {
      const { room, roomClosed } = await this.roomManager.leaveRoom(roomId, userId);
      socket.leave(`room:${roomId}`);
      socket.data.roomId = undefined;

      if (!roomClosed) {
        this.broadcastRoomSnapshot(room);
      }
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: { code: 'NOT_ALLOWED', message: err.message } };
    }
  }

  public async onRoomDeal(socket: ClientSocket): Promise<Ack> {
    const { roomId } = socket.data;
    if (!roomId) return { ok: false, error: { code: 'ROOM_NOT_FOUND', message: 'Chưa vào phòng' } };

    // Phát sóng hoạt ảnh phát bài 5.0 giây đồng bộ cho mọi người chơi trong phòng
    this.io.to(`room:${roomId}`).emit('room:deal_started', {
      startedAt: Date.now(),
      duration: 5000,
    });

    return { ok: true };
  }

  public async onGameStart(socket: ClientSocket): Promise<Ack> {
    const { roomId, userId } = socket.data;
    if (!roomId) return { ok: false, error: { code: 'ROOM_NOT_FOUND', message: 'Chưa vào phòng' } };

    try {
      const room = await this.gameLoop.startGame(roomId, userId);

      // Phát sóng hoạt ảnh phát bài đồng bộ cho mọi người chơi trong phòng
      this.io.to(`room:${roomId}`).emit('room:deal_started', {
        startedAt: Date.now(),
        duration: 5000,
      });

      // Tham gia các room con tương ứng
      for (const p of room.players) {
        if (p.team === 'WEREWOLF') {
          this.io.to(`user:${p.id}`).emit('wolf:joined', {});
        }
      }

      // Đăng ký Timer hết pha xem vai
      if (room.phaseEndsAt) {
        await this.timerWorker.scheduleTimer(room.id, room.stateVersion, room.phase, room.phaseEndsAt);
      }

      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: { code: 'NOT_ALLOWED', message: err.message } };
    }
  }

  /* ============================== NIGHT ACTIONS ============================== */

  public async onNightBodyguardProtect(socket: ClientSocket, rawPayload: unknown): Promise<Ack> {
    const parsed = C2S['night:bodyguardProtect'].safeParse(rawPayload);
    if (!parsed.success) return { ok: false, error: { code: 'INVALID_PAYLOAD', message: 'Dữ liệu sai' } };

    const room = await this.getRoomOrThrow(socket.data.roomId);
    if (!room || room.phase !== 'BODYGUARD_TURN') {
      return { ok: false, error: { code: 'NOT_ALLOWED', message: 'Hành động không hợp lệ' } };
    }

    const player = room.players.find((p) => p.id === socket.data.userId);
    if (!player || player.role !== 'BODYGUARD' || !player.isAlive) {
      return { ok: false, error: { code: 'NOT_ALLOWED', message: 'Hành động không hợp lệ' } };
    }

    // Không được chọn 1 người 2 đêm liên tiếp
    if (player.roleState.lastProtectedId === parsed.data.targetId) {
      return { ok: false, error: { code: 'NOT_ALLOWED', message: 'Không thể bảo vệ 1 người 2 đêm liên tiếp' } };
    }

    room.night.bodyguardTarget = parsed.data.targetId;
    player.roleState.lastProtectedId = parsed.data.targetId;
    await this.redis.setRoom(room);

    socket.emit('action:accepted', { v: room.stateVersion, ts: Date.now(), data: { kind: 'BODYGUARD_PROTECT' } });
    return { ok: true };
  }

  public async onNightWolfVote(socket: ClientSocket, rawPayload: unknown): Promise<Ack> {
    const parsed = C2S['night:wolfVote'].safeParse(rawPayload);
    if (!parsed.success) return { ok: false, error: { code: 'INVALID_PAYLOAD', message: 'Dữ liệu sai' } };

    const room = await this.getRoomOrThrow(socket.data.roomId);
    if (!room || room.phase !== 'WEREWOLF_TURN') {
      return { ok: false, error: { code: 'NOT_ALLOWED', message: 'Hành động không hợp lệ' } };
    }

    const player = room.players.find((p) => p.id === socket.data.userId);
    if (!player || player.team !== 'WEREWOLF' || !player.isAlive) {
      return { ok: false, error: { code: 'NOT_ALLOWED', message: 'Hành động không hợp lệ' } };
    }

    // Cập nhật phiếu bầu của Sói
    room.night.wolfVotes[player.id] = parsed.data.targetId;
    await this.redis.setRoom(room);

    // Broadcast phiếu cho bầy sói
    this.io.to(`room:${room.id}:wolves`).emit('wolf:votesUpdated', {
      v: room.stateVersion,
      ts: Date.now(),
      data: { votes: room.night.wolfVotes },
    });

    return { ok: true };
  }

  public async onNightWitchAct(socket: ClientSocket, rawPayload: unknown): Promise<Ack> {
    const parsed = C2S['night:witchAct'].safeParse(rawPayload);
    if (!parsed.success) return { ok: false, error: { code: 'INVALID_PAYLOAD', message: 'Dữ liệu sai' } };

    const room = await this.getRoomOrThrow(socket.data.roomId);
    if (!room || room.phase !== 'WITCH_TURN') {
      return { ok: false, error: { code: 'NOT_ALLOWED', message: 'Hành động không hợp lệ' } };
    }

    const player = room.players.find((p) => p.id === socket.data.userId);
    if (!player || player.role !== 'WITCH' || !player.isAlive) {
      return { ok: false, error: { code: 'NOT_ALLOWED', message: 'Hành động không hợp lệ' } };
    }

    const { save, poisonTargetId } = parsed.data;

    // Bình cứu
    if (save) {
      if (!player.roleState.hasHealPotion) {
        return { ok: false, error: { code: 'NOT_ALLOWED', message: 'Đã hết bình cứu' } };
      }
      room.night.witchSave = true;
      player.roleState.hasHealPotion = false;
    }

    // Bình độc
    if (poisonTargetId) {
      if (!player.roleState.hasPoisonPotion) {
        return { ok: false, error: { code: 'NOT_ALLOWED', message: 'Đã hết bình độc' } };
      }
      room.night.witchPoisonTarget = poisonTargetId;
      player.roleState.hasPoisonPotion = false;
    }

    await this.redis.setRoom(room);
    socket.emit('action:accepted', { v: room.stateVersion, ts: Date.now(), data: { kind: 'WITCH_ACT' } });
    return { ok: true };
  }

  public async onNightSeerInspect(socket: ClientSocket, rawPayload: unknown): Promise<Ack<{ result: SeerAppearance | Role }>> {
    const parsed = C2S['night:seerInspect'].safeParse(rawPayload);
    if (!parsed.success) return { ok: false, error: { code: 'INVALID_PAYLOAD', message: 'Dữ liệu sai' } };

    const room = await this.getRoomOrThrow(socket.data.roomId);
    if (!room || room.phase !== 'SEER_TURN') {
      return { ok: false, error: { code: 'NOT_ALLOWED', message: 'Hành động không hợp lệ' } };
    }

    const player = room.players.find((p) => p.id === socket.data.userId);
    if (!player || player.role !== 'SEER' || !player.isAlive) {
      return { ok: false, error: { code: 'NOT_ALLOWED', message: 'Hành động không hợp lệ' } };
    }

    const target = room.players.find((p) => p.id === parsed.data.targetId);
    if (!target) return { ok: false, error: { code: 'INVALID_PAYLOAD', message: 'Mục tiêu không tồn tại' } };

    // Tính toán kết quả soi
    let inspectResult: SeerAppearance | Role;
    if (room.settings.seerRevealMode === 'EXACT_ROLE') {
      inspectResult = target.role || 'VILLAGER';
    } else {
      inspectResult = target.team === 'WEREWOLF' ? 'WEREWOLF' : 'NOT_WEREWOLF';
    }

    // Lưu vào lịch sử soi của Tiên Tri
    player.roleState.seerResults.push({
      round: room.round,
      targetId: target.id,
      result: inspectResult,
    });
    room.night.seerTarget = target.id;
    await this.redis.setRoom(room);

    socket.emit('seer:result', {
      v: room.stateVersion,
      ts: Date.now(),
      data: { targetId: target.id, result: inspectResult },
    });

    return { ok: true, data: { result: inspectResult } };
  }

  /* ============================== DAY ACTIONS ============================== */

  public async onDayVote(socket: ClientSocket, rawPayload: unknown): Promise<Ack> {
    const parsed = C2S['day:vote'].safeParse(rawPayload);
    if (!parsed.success) return { ok: false, error: { code: 'INVALID_PAYLOAD', message: 'Dữ liệu sai' } };

    const room = await this.getRoomOrThrow(socket.data.roomId);
    if (!room || (room.phase !== 'DAY_VOTING' && room.phase !== 'DAY_REVOTE')) {
      return { ok: false, error: { code: 'NOT_ALLOWED', message: 'Chưa tới pha bỏ phiếu' } };
    }

    const voter = room.players.find((p) => p.id === socket.data.userId);
    if (!voter || !voter.isAlive) {
      return { ok: false, error: { code: 'NOT_ALLOWED', message: 'Bạn không có quyền bỏ phiếu' } };
    }

    room.day.votes[voter.id] = parsed.data.targetId;
    await this.redis.setRoom(room);

    // Tính tally hiện tại
    const tally: Record<string, number> = {};
    for (const t of Object.values(room.day.votes)) {
      if (t) tally[t] = (tally[t] || 0) + 1;
    }

    this.io.to(`room:${room.id}`).emit('day:votesUpdated', {
      v: room.stateVersion,
      ts: Date.now(),
      data: {
        tally,
        voted: Object.keys(room.day.votes),
      },
    });

    // Nếu tất cả người sống đã vote -> Fast-forward sang VOTE_RESOLVE
    const aliveCount = room.players.filter((p) => p.isAlive).length;
    if (Object.keys(room.day.votes).length >= aliveCount) {
      await this.gameLoop.transition(room.id, 'VOTE_RESOLVE');
    }

    return { ok: true };
  }

  public async onDayJudge(socket: ClientSocket, rawPayload: unknown): Promise<Ack> {
    const parsed = C2S['day:judge'].safeParse(rawPayload);
    if (!parsed.success) return { ok: false, error: { code: 'INVALID_PAYLOAD', message: 'Dữ liệu sai' } };

    const room = await this.getRoomOrThrow(socket.data.roomId);
    if (!room || room.phase !== 'DAY_JUDGMENT') {
      return { ok: false, error: { code: 'NOT_ALLOWED', message: 'Chưa tới pha phán quyết' } };
    }

    const voter = room.players.find((p) => p.id === socket.data.userId);
    if (!voter || !voter.isAlive || voter.id === room.day.accusedId) {
      return { ok: false, error: { code: 'NOT_ALLOWED', message: 'Bị cáo không được tham gia phán quyết' } };
    }

    room.day.judgment[voter.id] = parsed.data.verdict;
    await this.redis.setRoom(room);

    // Fast-forward nếu tất cả người chơi đủ tư cách (trừ bị cáo) đã bỏ phiếu phán quyết
    const eligibleJudges = room.players.filter((p) => p.isAlive && p.id !== room.day.accusedId);
    if (Object.keys(room.day.judgment).length >= eligibleJudges.length) {
      let guilty = 0;
      let innocent = 0;
      for (const v of Object.values(room.day.judgment)) {
        if (v === 'GUILTY') guilty++;
        if (v === 'INNOCENT') innocent++;
      }
      const targetPhase = (guilty > innocent && room.day.accusedId) ? 'DAY_EXECUTION' : 'CHECK_WIN';
      await this.gameLoop.transition(room.id, targetPhase);
    }

    return { ok: true };
  }

  /* ============================== CHAT & UTILS ============================== */

  public async onChatSend(socket: ClientSocket, rawPayload: unknown): Promise<Ack> {
    const parsed = C2S['chat:send'].safeParse(rawPayload);
    if (!parsed.success) return { ok: false, error: { code: 'INVALID_PAYLOAD', message: 'Tin nhắn không hợp lệ' } };

    const room = await this.getRoomOrThrow(socket.data.roomId);
    if (!room) return { ok: false, error: { code: 'ROOM_NOT_FOUND', message: 'Phòng không tồn tại' } };

    const sender = room.players.find((p) => p.id === socket.data.userId);
    if (!sender) return { ok: false, error: { code: 'UNAUTHORIZED', message: 'Không thuộc phòng' } };

    const { channel, text } = parsed.data;

    // Kiểm tra quyền theo kênh
    if (channel === 'wolves' && (sender.team !== 'WEREWOLF' || !sender.isAlive)) {
      return { ok: false, error: { code: 'NOT_ALLOWED', message: 'Không có quyền chat kênh Sói' } };
    }
    if (channel === 'lovers' && (!sender.loverId || !sender.isAlive)) {
      return { ok: false, error: { code: 'NOT_ALLOWED', message: 'Không có quyền chat kênh Người Yêu' } };
    }
    if (channel === 'dead' && sender.isAlive) {
      return { ok: false, error: { code: 'NOT_ALLOWED', message: 'Chỉ người chết mới được chat kênh này' } };
    }
    if (channel === 'public' && !sender.isAlive) {
      return { ok: false, error: { code: 'NOT_ALLOWED', message: 'Người chết không được chat kênh chung' } };
    }

    const messagePacket = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      channel,
      senderId: sender.id,
      text,
      ts: Date.now(),
    };

    const targetRoom =
      channel === 'wolves'
        ? `room:${room.id}:wolves`
        : channel === 'lovers'
        ? `room:${room.id}:lovers`
        : channel === 'dead'
        ? `room:${room.id}:dead`
        : `room:${room.id}`;

    this.io.to(targetRoom).emit('chat:message', {
      v: room.stateVersion,
      ts: Date.now(),
      data: messagePacket,
    });

    return { ok: true };
  }

  public onTimePing(socket: ClientSocket, rawPayload: unknown): void {
    const parsed = C2S['time:ping'].safeParse(rawPayload);
    if (parsed.success) {
      socket.emit('time:pong', {
        t0: parsed.data.t0,
        serverNow: Date.now(),
      });
    }
  }

  public async onSyncRequest(socket: ClientSocket): Promise<void> {
    const { roomId, userId } = socket.data;
    if (!roomId) return;

    const room = await this.redis.getRoom(roomId);
    if (!room) return;

    try {
      const view = RoomProjector.projectFor(userId, room);
      socket.emit('state:snapshot', {
        v: room.stateVersion,
        ts: Date.now(),
        data: view,
      });
    } catch (err) {
      console.error(`Sync failed for ${userId}:`, err);
    }
  }

  private async getRoomOrThrow(roomId?: string): Promise<RoomState | null> {
    if (!roomId) return null;
    return this.redis.getRoom(roomId);
  }

  private broadcastRoomSnapshot(room: RoomState): void {
    this.gameLoop.broadcastRoomSnapshot(room);
  }
}
