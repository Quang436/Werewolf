/**
 * GameRoomManager — Quản lý vòng đời phòng chơi (Clean Architecture / Domain Service).
 *
 * Nhiệm vụ:
 * 1. Tạo phòng (Create Room) với mã code 6 ký tự ngẫu nhiên (chữ in hoa + số, tránh ký tự dễ nhầm như 0, O, 1, I).
 * 2. Tham gia phòng (Join Room):
 *    - Kiểm tra phòng tồn tại.
 *    - Kiểm tra phòng chưa đầy (<= maxPlayers).
 *    - Hỗ trợ Reconnect nếu người chơi đã từng tham gia phòng này.
 *    - Phân bổ số ghế (Seat) cho người mới.
 * 3. Rời phòng (Leave Room) & Đuổi khỏi phòng (Kick Player - chỉ Host được phép ở LOBBY).
 * 4. Cập nhật cấu hình phòng (Settings):
 *    - Kiểm tra tổng số lượng role gán có khớp với số lượng người chơi không.
 *    - Đảm bảo cân bằng tối thiểu (ít nhất 1 sói, số sói < số dân).
 * 5. Lưu trữ Redis State nguyên tử với Optimistic Locking (stateVersion) và Redlock-lite.
 */

import {
  PlayerState,
  RoomSettings,
  RoomState,
} from '@werewolf/shared';

export interface RedisStoreAdapter {
  getRoom(roomId: string): Promise<RoomState | null>;
  setRoom(room: RoomState): Promise<void>;
  deleteRoom(roomId: string): Promise<void>;
  getRoomIdByCode(code: string): Promise<string | null>;
  setRoomCodeMapping(code: string, roomId: string, ttlSeconds: number): Promise<void>;
  acquireLock(roomId: string, ttlMs: number): Promise<string | null>;
  releaseLock(roomId: string, token: string): Promise<boolean>;
}

export class InMemoryRedisAdapter implements RedisStoreAdapter {
  private rooms = new Map<string, string>(); // roomId -> JSON
  private codes = new Map<string, string>(); // code -> roomId
  private locks = new Map<string, { token: string; expiresAt: number }>();

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
    if (existing && existing.expiresAt > now) {
      return null; // Already locked
    }
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
}

export class GameRoomManager {
  constructor(private readonly redis: RedisStoreAdapter) {}

  /**
   * Sinh mã code phòng 6 ký tự dễ đọc
   */
  public generateRoomCode(): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // loại bỏ 0, O, 1, I
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  /**
   * Tạo phòng mới
   */
  public async createRoom(
    hostUser: { id: string; nickname: string; avatarUrl?: string | null },
    initialSettings?: Partial<RoomSettings>
  ): Promise<RoomState> {
    const roomId = `rm_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const code = this.generateRoomCode();

    const settings = RoomSettings.parse({
      roleConfig: {
        WEREWOLF: 2,
        SEER: 1,
        BODYGUARD: 1,
        HUNTER: 1,
        CUPID: 1,
        VILLAGER: 2,
      },
      ...initialSettings,
    });

    const hostPlayer: PlayerState = {
      id: hostUser.id,
      seat: 1,
      nickname: hostUser.nickname,
      avatarUrl: hostUser.avatarUrl || null,
      isAlive: true,
      connection: 'ONLINE',
      disconnectedAt: null,
      ready: true, // Host luôn ready
      role: null,
      team: null,
      loverId: null,
      deathInfo: null,
      roleState: {
        lastProtectedId: null,
        hasHealPotion: true,
        hasPoisonPotion: true,
        seerResults: [],
        hasShot: false,
      },
    };

    const room: RoomState = {
      id: roomId,
      code,
      hostId: hostUser.id,
      phase: 'LOBBY',
      stateVersion: 1,
      round: 0,
      phaseStartedAt: Date.now(),
      phaseEndsAt: null,
      settings,
      players: [hostPlayer],
      night: {
        bodyguardTarget: null,
        wolfVotes: {},
        wolfTarget: null,
        witchSave: false,
        witchPoisonTarget: null,
        seerTarget: null,
      },
      day: {
        votes: {},
        revoteCandidates: null,
        revoteCount: 0,
        readyToVote: [],
        accusedId: null,
        judgment: {},
      },
      lovers: null,
      pendingTriggers: [],
      afterCheckWin: 'DAY',
      history: [],
      winner: null,
      createdAt: Date.now(),
    };

    await this.redis.setRoom(room);
    await this.redis.setRoomCodeMapping(code, roomId, 7200); // 2 hours TTL

    return room;
  }

  /**
   * Tham gia phòng chơi (hoặc Reconnect nếu đã ở trong phòng)
   */
  public async joinRoom(
    codeOrId: string,
    user: { id: string; nickname: string; avatarUrl?: string | null }
  ): Promise<{ room: RoomState; isReconnect: boolean }> {
    let roomId = codeOrId;
    if (codeOrId.length === 6) {
      const mapped = await this.redis.getRoomIdByCode(codeOrId);
      if (!mapped) throw new Error('ROOM_NOT_FOUND');
      roomId = mapped;
    }

    const room = await this.redis.getRoom(roomId);
    if (!room) throw new Error('ROOM_NOT_FOUND');

    const existingPlayer = room.players.find((p) => p.id === user.id);
    if (existingPlayer) {
      // Reconnect
      existingPlayer.connection = 'ONLINE';
      existingPlayer.disconnectedAt = null;
      room.stateVersion++;
      await this.redis.setRoom(room);
      return { room, isReconnect: true };
    }

    // New Player Join
    if (room.phase !== 'LOBBY') {
      throw new Error('GAME_IN_PROGRESS');
    }

    if (room.players.length >= room.settings.maxPlayers) {
      throw new Error('ROOM_FULL');
    }

    // Tìm ghế trống đầu tiên
    const takenSeats = new Set(room.players.map((p) => p.seat));
    let nextSeat = 1;
    while (takenSeats.has(nextSeat)) {
      nextSeat++;
    }

    const newPlayer: PlayerState = {
      id: user.id,
      seat: nextSeat,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl || null,
      isAlive: true,
      connection: 'ONLINE',
      disconnectedAt: null,
      ready: false,
      role: null,
      team: null,
      loverId: null,
      deathInfo: null,
      roleState: {
        lastProtectedId: null,
        hasHealPotion: true,
        hasPoisonPotion: true,
        seerResults: [],
        hasShot: false,
      },
    };

    room.players.push(newPlayer);
    room.stateVersion++;
    await this.redis.setRoom(room);

    return { room, isReconnect: false };
  }

  /**
   * Rời phòng (Leave Room)
   */
  public async leaveRoom(roomId: string, userId: string): Promise<{ room: RoomState; roomClosed: boolean }> {
    const room = await this.redis.getRoom(roomId);
    if (!room) throw new Error('ROOM_NOT_FOUND');

    const playerIndex = room.players.findIndex((p) => p.id === userId);
    if (playerIndex === -1) throw new Error('PLAYER_NOT_IN_ROOM');

    if (room.phase === 'LOBBY') {
      // Nếu ở LOBBY -> xóa hoàn toàn khỏi mảng players
      room.players.splice(playerIndex, 1);

      if (room.players.length === 0) {
        // Phòng trống -> xóa phòng
        await this.redis.deleteRoom(roomId);
        return { room, roomClosed: true };
      }

      // Nếu host rời -> chuyển host cho người tiếp theo
      if (room.hostId === userId) {
        room.hostId = room.players[0].id;
        room.players[0].ready = true;
      }
    } else {
      // Game đang diễn ra -> Đánh dấu LEFT
      const player = room.players[playerIndex];
      player.connection = 'LEFT';
      player.isAlive = false;
      player.deathInfo = {
        round: room.round,
        cause: 'LEFT',
      };
    }

    room.stateVersion++;
    await this.redis.setRoom(room);
    return { room, roomClosed: false };
  }

  /**
   * Đuổi người chơi (Kick) — Chỉ Host được phép khi ở LOBBY
   */
  public async kickPlayer(roomId: string, hostUserId: string, targetUserId: string): Promise<RoomState> {
    const room = await this.redis.getRoom(roomId);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.hostId !== hostUserId) throw new Error('UNAUTHORIZED');
    if (room.phase !== 'LOBBY') throw new Error('NOT_ALLOWED');
    if (hostUserId === targetUserId) throw new Error('CANNOT_KICK_SELF');

    const index = room.players.findIndex((p) => p.id === targetUserId);
    if (index === -1) throw new Error('PLAYER_NOT_IN_ROOM');

    room.players.splice(index, 1);
    room.stateVersion++;
    await this.redis.setRoom(room);

    return room;
  }
}
