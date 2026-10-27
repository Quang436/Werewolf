import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GameRoomManager, InMemoryRedisAdapter } from '../game-room.manager';
import { Broadcaster, GameLoopService } from '../game-loop.service';

class MockBroadcaster implements Broadcaster {
  public roomEvents: { roomId: string; event: string; payload: any }[] = [];
  public userEvents: { userId: string; event: string; payload: any }[] = [];

  emitToRoom(roomId: string, event: string, payload: unknown): void {
    this.roomEvents.push({ roomId, event, payload });
  }
  emitToUser(userId: string, event: string, payload: unknown): void {
    this.userEvents.push({ userId, event, payload });
  }
  emitToWolves(): void {}
  emitToLovers(): void {}
}

describe('GameRoomManager & GameLoopService Integration Boilerplate Tests', () => {
  it('Quản lý vòng đời phòng: Tạo phòng, Join 6 người, Bắt đầu Game chia vai ngẫu nhiên', async () => {
    const redis = new InMemoryRedisAdapter();
    const roomManager = new GameRoomManager(redis);
    const broadcaster = new MockBroadcaster();
    const gameLoop = new GameLoopService(redis, broadcaster);

    // 1. Tạo phòng bởi Host (P1)
    const hostUser = { id: 'u1', nickname: 'Host_Quang' };
    const room = await roomManager.createRoom(hostUser, {
      roleConfig: {
        WEREWOLF: 1,
        SEER: 1,
        BODYGUARD: 1,
        WITCH: 1,
        HUNTER: 1,
        VILLAGER: 1,
      },
    });

    assert.equal(room.players.length, 1);
    assert.equal(room.phase, 'LOBBY');
    assert.equal(room.code.length, 6);

    // 2. 5 người chơi khác join vào
    for (let i = 2; i <= 6; i++) {
      const joinRes = await roomManager.joinRoom(room.code, {
        id: `u${i}`,
        nickname: `Player_${i}`,
      });
      assert.equal(joinRes.isReconnect, false);
    }

    const fullRoom = await redis.getRoom(room.id);
    assert.equal(fullRoom?.players.length, 6);

    // 3. Bắt đầu Game (Start Game)
    const startedRoom = await gameLoop.startGame(room.id, hostUser.id);
    assert.equal(startedRoom.phase, 'ASSIGN_ROLES');
    assert.equal(startedRoom.round, 1);
    assert.ok(startedRoom.phaseEndsAt !== null);

    // Kiểm tra tất cả người chơi đều được gán vai
    for (const p of startedRoom.players) {
      assert.ok(p.role !== null);
      assert.ok(p.team !== null);
      assert.ok(p.seat >= 1 && p.seat <= 6);
    }

    // Đếm số lượng vai gán phải đúng với roleConfig
    const roleCounts: Record<string, number> = {};
    for (const p of startedRoom.players) {
      roleCounts[p.role!] = (roleCounts[p.role!] || 0) + 1;
    }
    assert.equal(roleCounts['WEREWOLF'], 1);
    assert.equal(roleCounts['SEER'], 1);
    assert.equal(roleCounts['BODYGUARD'], 1);
    assert.equal(roleCounts['WITCH'], 1);
    assert.equal(roleCounts['HUNTER'], 1);
    assert.equal(roleCounts['VILLAGER'], 1);

    // 4. Kiểm tra broadcaster đã gửi role:assigned và state:snapshot cho cả 6 người
    const roleEvents = broadcaster.userEvents.filter((e) => e.event === 'role:assigned');
    assert.equal(roleEvents.length, 6);

    const snapshotEvents = broadcaster.userEvents.filter((e) => e.event === 'state:snapshot');
    assert.equal(snapshotEvents.length, 6);

    // 5. Chuyển pha sang NIGHT_START -> BODYGUARD_TURN
    const nightRoom = await gameLoop.transition(room.id, 'NIGHT_START');
    assert.equal(nightRoom.phase, 'NIGHT_START');

    const bodyguardRoom = await gameLoop.transition(room.id, 'BODYGUARD_TURN');
    assert.equal(bodyguardRoom.phase, 'BODYGUARD_TURN');
  });

  it('Bảo mật: Người không phải host không thể bắt đầu game hoặc kick người khác', async () => {
    const redis = new InMemoryRedisAdapter();
    const roomManager = new GameRoomManager(redis);
    const broadcaster = new MockBroadcaster();
    const gameLoop = new GameLoopService(redis, broadcaster);

    const host = { id: 'host_id', nickname: 'Chủ phòng' };
    const room = await roomManager.createRoom(host);

    await roomManager.joinRoom(room.code, { id: 'guest_id', nickname: 'Khách' });

    // Khách gọi startGame -> văng lỗi UNAUTHORIZED
    await assert.rejects(async () => {
      await gameLoop.startGame(room.id, 'guest_id');
    }, /UNAUTHORIZED/);

    // Khách gọi kick -> văng lỗi UNAUTHORIZED
    await assert.rejects(async () => {
      await roomManager.kickPlayer(room.id, 'guest_id', host.id);
    }, /UNAUTHORIZED/);
  });
});
