import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GameGateway, ClientSocket, ServerSocketBroadcaster } from '../game.gateway';
import { GameRoomManager } from '../game-room.manager';
import { GameLoopService } from '../game-loop.service';
import { TimerWorker, InMemoryZSetRedisAdapter } from '../timer.worker';

class MockSocket implements ClientSocket {
  public id: string;
  public data: any = {};
  public rooms = new Set<string>();
  public emitted: { event: string; payload: any }[] = [];

  constructor(id: string) {
    this.id = id;
  }

  join(room: string | string[]): void {
    if (Array.isArray(room)) {
      room.forEach((r) => this.rooms.add(r));
    } else {
      this.rooms.add(room);
    }
  }

  leave(room: string): void {
    this.rooms.delete(room);
  }

  emit(event: string, payload: unknown): void {
    this.emitted.push({ event, payload });
  }
}

class MockServerBroadcaster implements ServerSocketBroadcaster {
  public roomBroadcasts: { room: string; event: string; payload: any }[] = [];

  to(room: string) {
    return {
      emit: (event: string, payload: unknown) => {
        this.roomBroadcasts.push({ room, event, payload });
      },
    };
  }

  emitToRoom(roomId: string, event: string, payload: unknown): void {
    this.to(`room:${roomId}`).emit(event, payload);
  }
  emitToUser(userId: string, event: string, payload: unknown): void {
    this.to(`user:${userId}`).emit(event, payload);
  }
  emitToWolves(roomId: string, event: string, payload: unknown): void {
    this.to(`room:${roomId}:wolves`).emit(event, payload);
  }
  emitToLovers(roomId: string, event: string, payload: unknown): void {
    this.to(`room:${roomId}:lovers`).emit(event, payload);
  }
}

describe('GameGateway Realtime Events Tests', () => {
  it('Socket Gateway: Tạo phòng, Join phòng, và Ping-Pong đồng bộ thời gian', async () => {
    const redis = new InMemoryZSetRedisAdapter();
    const roomManager = new GameRoomManager(redis);
    const broadcaster = new MockServerBroadcaster();
    const gameLoop = new GameLoopService(redis, broadcaster);
    const timerWorker = new TimerWorker(redis, gameLoop);
    const gateway = new GameGateway(roomManager, gameLoop, timerWorker, redis, broadcaster);

    const socket1 = new MockSocket('sock_1');
    gateway.handleConnection(socket1, { userId: 'u1', nickname: 'HostQuang' });
    assert.ok(socket1.rooms.has('user:u1'));

    // 1. Tạo phòng
    const createRes = await gateway.onRoomCreate(socket1, {});
    assert.equal(createRes.ok, true);
    if (!createRes.ok) return;

    const roomId = createRes.data?.roomId!;
    const code = createRes.data?.code!;
    assert.ok(socket1.rooms.has(`room:${roomId}`));

    // 2. Client 2 Join phòng qua code
    const socket2 = new MockSocket('sock_2');
    gateway.handleConnection(socket2, { userId: 'u2', nickname: 'Player2' });

    const joinRes = await gateway.onRoomJoin(socket2, { code });
    assert.equal(joinRes.ok, true);
    assert.ok(socket2.rooms.has(`room:${roomId}`));

    // 3. NTP Ping-Pong
    gateway.onTimePing(socket1, { t0: 1000 });
    const pongEvent = socket1.emitted.find((e) => e.event === 'time:pong');
    assert.ok(pongEvent);
    assert.equal(pongEvent?.payload.t0, 1000);
    assert.ok(pongEvent?.payload.serverNow > 0);
  });

  it('Bảo mật Chat: Kiểm soát phân quyền chat theo kênh (wolves, dead, public)', async () => {
    const redis = new InMemoryZSetRedisAdapter();
    const roomManager = new GameRoomManager(redis);
    const broadcaster = new MockServerBroadcaster();
    const gameLoop = new GameLoopService(redis, broadcaster);
    const timerWorker = new TimerWorker(redis, gameLoop);
    const gateway = new GameGateway(roomManager, gameLoop, timerWorker, redis, broadcaster);

    const socketHost = new MockSocket('sock_host');
    gateway.handleConnection(socketHost, { userId: 'host', nickname: 'Host' });
    const createRes = await gateway.onRoomCreate(socketHost, {});
    const roomId = createRes.ok ? createRes.data?.roomId : '';

    // Lấy room và ép trạng thái sang đang chơi
    const room = await redis.getRoom(roomId!);
    assert.ok(room);
    room.phase = 'NIGHT_START';
    room.players[0].role = 'VILLAGER';
    room.players[0].team = 'VILLAGE';
    await redis.setRoom(room);

    // Dân thường thử chat vào kênh 'wolves' -> Bị chặn NOT_ALLOWED
    const wolfChatRes = await gateway.onChatSend(socketHost, {
      channel: 'wolves',
      text: 'Chào các bạn sói',
    });
    assert.equal(wolfChatRes.ok, false);
    assert.equal(wolfChatRes.ok ? '' : wolfChatRes.error.code, 'NOT_ALLOWED');

    // Dân còn sống thử chat vào kênh 'dead' -> Bị chặn NOT_ALLOWED
    const deadChatRes = await gateway.onChatSend(socketHost, {
      channel: 'dead',
      text: 'Nói chuyện với ma',
    });
    assert.equal(deadChatRes.ok, false);

    // Chat kênh public hợp lệ
    const publicChatRes = await gateway.onChatSend(socketHost, {
      channel: 'public',
      text: 'Chào cả làng!',
    });
    assert.equal(publicChatRes.ok, true);
    assert.ok(broadcaster.roomBroadcasts.some((b) => b.event === 'chat:message'));
  });

  it('Night Actions: Tiên tri soi bài và nhận kết quả chuẩn xác qua socket', async () => {
    const redis = new InMemoryZSetRedisAdapter();
    const roomManager = new GameRoomManager(redis);
    const broadcaster = new MockServerBroadcaster();
    const gameLoop = new GameLoopService(redis, broadcaster);
    const timerWorker = new TimerWorker(redis, gameLoop);
    const gateway = new GameGateway(roomManager, gameLoop, timerWorker, redis, broadcaster);

    const socketSeer = new MockSocket('sock_seer');
    gateway.handleConnection(socketSeer, { userId: 'seer_id', nickname: 'Tiên Tri' });
    const createRes = await gateway.onRoomCreate(socketSeer, {});
    const roomId = createRes.ok ? createRes.data?.roomId! : '';

    const room = await redis.getRoom(roomId);
    assert.ok(room);
    room.phase = 'SEER_TURN';
    room.players[0].role = 'SEER';
    room.players[0].team = 'VILLAGE';

    // Thêm 1 người chơi Sói vào phòng
    room.players.push({
      id: 'wolf_target',
      seat: 2,
      nickname: 'Sói Đen',
      avatarUrl: null,
      isAlive: true,
      connection: 'ONLINE',
      disconnectedAt: null,
      ready: true,
      role: 'WEREWOLF',
      team: 'WEREWOLF',
      loverId: null,
      deathInfo: null,
      roleState: {
        lastProtectedId: null,
        hasHealPotion: false,
        hasPoisonPotion: false,
        seerResults: [],
        hasShot: false,
      },
    });
    await redis.setRoom(room);

    // Tiên tri soi con Sói
    const inspectRes = await gateway.onNightSeerInspect(socketSeer, {
      targetId: 'wolf_target',
    });
    assert.equal(inspectRes.ok, true);
    if (!inspectRes.ok) return;

    assert.equal(inspectRes.data?.result, 'WEREWOLF');

    // Kiểm tra socket nhận được event seer:result
    const seerEvent = socketSeer.emitted.find((e) => e.event === 'seer:result');
    assert.ok(seerEvent);
    assert.equal(seerEvent?.payload.data.result, 'WEREWOLF');
  });
});

describe('TimerWorker Distributed Scheduler Tests', () => {
  it('TimerWorker: Xử lý hết hạn timer phân tán, tự động chuyển pha và bỏ qua timer cũ', async () => {
    const redis = new InMemoryZSetRedisAdapter();
    const broadcaster = new MockServerBroadcaster();
    const gameLoop = new GameLoopService(redis, broadcaster);
    const timerWorker = new TimerWorker(redis, gameLoop);
    const roomManager = new GameRoomManager(redis);

    // 1. Tạo phòng
    const room = await roomManager.createRoom({ id: 'host1', nickname: 'Quang' });
    room.phase = 'BODYGUARD_TURN';
    room.stateVersion = 5;
    await redis.setRoom(room);

    // 2. Lập lịch timer hết hạn tại timestamp = 1000
    await timerWorker.scheduleTimer(room.id, 5, 'BODYGUARD_TURN', 1000);

    // Khi time = 900 (chưa đến hạn) -> tick không xử lý gì
    const processedBefore = await timerWorker.tick(900);
    assert.equal(processedBefore, 0);

    // Khi time = 1050 (đã đến hạn) -> tick kích hoạt chuyển pha sang WEREWOLF_TURN
    const processedAt = await timerWorker.tick(1050);
    assert.equal(processedAt, 1);

    const updatedRoom = await redis.getRoom(room.id);
    assert.equal(updatedRoom?.phase, 'WEREWOLF_TURN');
    assert.equal(updatedRoom?.stateVersion, 6);

    // 3. Nếu có một timer cũ với stateVersion = 5 đến hạn trễ -> Bị bỏ qua vì version hiện tại là 6
    await timerWorker.scheduleTimer(room.id, 5, 'BODYGUARD_TURN', 1100);
    const processedLate = await timerWorker.tick(1200);
    assert.equal(processedLate, 0); // Không chạy vì version không khớp!
  });

  it('State Machine: Luồng biểu quyết ban ngày VOTE_RESOLVE, Biện hộ, Phán quyết và Treo cổ', async () => {
    const redis = new InMemoryZSetRedisAdapter();
    const broadcaster = new MockServerBroadcaster();
    const gameLoop = new GameLoopService(redis, broadcaster);
    const timerWorker = new TimerWorker(redis, gameLoop);
    gameLoop.setTimerScheduler(timerWorker);

    // Tạo phòng mẫu ở pha DAY_VOTING với 4 người chơi
    const roomManager = new GameRoomManager(redis);
    const room = await roomManager.createRoom({ id: 'u1', nickname: 'Dân 1' });
    await roomManager.joinRoom(room.code, { id: 'u2', nickname: 'Bị Cáo Sói' });
    await roomManager.joinRoom(room.code, { id: 'u3', nickname: 'Dân 2' });
    await roomManager.joinRoom(room.code, { id: 'u4', nickname: 'Dân 3' });

    const activeRoom = (await redis.getRoom(room.id))!;
    activeRoom.phase = 'DAY_VOTING';
    activeRoom.players[0].role = 'VILLAGER';
    activeRoom.players[1].role = 'WEREWOLF';
    activeRoom.players[1].team = 'WEREWOLF';
    activeRoom.players[2].role = 'VILLAGER';
    activeRoom.players[3].role = 'VILLAGER';

    // 3 người bầu u2, 1 người SKIP
    activeRoom.day.votes = {
      u1: 'u2',
      u3: 'u2',
      u4: 'u2',
      u2: 'SKIP',
    };
    await redis.setRoom(activeRoom);

    // Chuyển sang VOTE_RESOLVE -> u2 phải thành accusedId và chuyển sang DAY_DEFENSE
    await gameLoop.transition(activeRoom.id, 'VOTE_RESOLVE');
    const roomAfterVote = (await redis.getRoom(activeRoom.id))!;
    assert.equal(roomAfterVote.phase, 'DAY_DEFENSE');
    assert.equal(roomAfterVote.day.accusedId, 'u2');
    assert.ok(roomAfterVote.phaseEndsAt! > Date.now());

    // Sau khi biện hộ xong -> Chuyển sang DAY_JUDGMENT
    await gameLoop.transition(activeRoom.id, 'DAY_JUDGMENT');
    const roomInJudgment = (await redis.getRoom(activeRoom.id))!;
    assert.equal(roomInJudgment.phase, 'DAY_JUDGMENT');

    // 3 người dân vote GUILTY cho bị cáo u2
    roomInJudgment.day.judgment = {
      u1: 'GUILTY',
      u3: 'GUILTY',
      u4: 'GUILTY',
    };
    await redis.setRoom(roomInJudgment);

    // Hết giờ phán quyết hoặc đủ phiếu -> Chuyển sang DAY_EXECUTION
    await gameLoop.transition(roomInJudgment.id, 'DAY_EXECUTION');
    const roomAfterExecution = (await redis.getRoom(roomInJudgment.id))!;
    assert.equal(roomAfterExecution.phase, 'DAY_EXECUTION');
    const executedPlayer = roomAfterExecution.players.find((p) => p.id === 'u2')!;
    assert.equal(executedPlayer.isAlive, false);
    assert.equal(executedPlayer.deathInfo?.cause, 'EXECUTION');

    // Tiếp theo từ DAY_EXECUTION chuyển sang CHECK_WIN -> Vì con sói duy nhất đã chết, Dân Làng Thắng!
    await gameLoop.transition(roomAfterExecution.id, 'CHECK_WIN');
    const finalRoom = (await redis.getRoom(roomAfterExecution.id))!;
    assert.equal(finalRoom.phase, 'GAME_OVER');
    assert.equal(finalRoom.winner, 'VILLAGE');
  });
});
