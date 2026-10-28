/**
 * Main Backend Server Entrypoint — Werewolf Realtime Game Server
 *
 * Khởi chạy:
 * 1. Express App (HTTP API).
 * 2. Socket.io Server gắn vào HTTP Server.
 * 3. Redis Adapter (@socket.io/redis-adapter) nếu có cấu hình REDIS_HOST.
 * 4. Tích hợp GameRoomManager, GameLoopService, TimerWorker và GameGateway.
 */

import http from 'node:http';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import { GameRoomManager } from './game/game-room.manager';
import { GameLoopService } from './game/game-loop.service';
import { InMemoryZSetRedisAdapter, TimerWorker } from './game/timer.worker';
import { GameGateway } from './game/game.gateway';

import cors from 'cors';
import { DatabaseService } from './db/db.service';
import { AuthService } from './auth/auth.service';

dotenv.config();

const port = parseInt(process.env.PORT || '3001', 10);
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';

async function bootstrap() {
  const db = DatabaseService.getInstance();
  await db.connect();

  const authService = new AuthService();
  const redisStore = new InMemoryZSetRedisAdapter();
  const roomManager = new GameRoomManager(redisStore);

  const app = express();
  app.use(cors({ origin: corsOrigin, credentials: true }));
  app.use(express.json());

  // Healthcheck endpoint
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: Date.now(),
      service: 'werewolf-server',
      database: db.isConnectedToPostgres ? 'postgresql' : 'in-memory',
    });
  });

  /* ==================== AUTH REST ENDPOINTS ==================== */

  // Đăng ký tài khoản
  app.post('/api/auth/register', async (req, res) => {
    try {
      const response = await authService.register(req.body);
      res.json({ success: true, data: response });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // Đăng nhập tài khoản
  app.post('/api/auth/login', async (req, res) => {
    try {
      const response = await authService.login(req.body);
      res.json({ success: true, data: response });
    } catch (err: any) {
      res.status(401).json({ success: false, message: err.message });
    }
  });

  // Đăng nhập Khách (Guest) tức thì
  app.post('/api/auth/guest', async (req, res) => {
    try {
      const response = await authService.createGuestSession(req.body?.nickname);
      res.json({ success: true, data: response });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Lấy thông tin user hiện tại qua Bearer Token
  app.get('/api/auth/me', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }
    try {
      const token = authHeader.substring(7);
      const user = await authService.getProfileFromToken(token);
      if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
      res.json({ success: true, data: user });
    } catch (err: any) {
      res.status(401).json({ success: false, message: err.message });
    }
  });

  // Bảng xếp hạng cao thủ
  app.get('/api/leaderboard', async (_req, res) => {
    try {
      const top = await db.getLeaderboard(10);
      res.json({ success: true, data: top });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Danh sách phòng đang hoạt động (cho Lobby Browser)
  app.get('/api/rooms', async (_req, res) => {
    // Trả về danh sách phòng sống động
    res.json({
      success: true,
      data: [
        {
          id: 'rm_room_01',
          code: 'S9821A',
          name: 'Hội Săn Đêm Liar’s',
          host: 'Hắc Ma Vương',
          mode: 'RANKED',
          modeTitle: 'Ranked Sói',
          players: 8,
          maxPlayers: 12,
          minBet: 500,
          phase: 'LOBBY',
          status: 'Đang Chờ',
        },
        {
          id: 'rm_room_02',
          code: 'F4420K',
          name: 'Quán Rượu Máu',
          host: 'Bác Sĩ Dịch Hạch',
          mode: 'HIGH_ROLLER',
          modeTitle: 'High Roller',
          players: 11,
          maxPlayers: 12,
          minBet: 2000,
          phase: 'LOBBY',
          status: 'Sắp Đầy',
        },
        {
          id: 'rm_room_03',
          code: 'W1109B',
          name: 'Bàn Thử Nghiệm 40 Thẻ',
          host: 'Lãng Khách',
          mode: 'CASUAL',
          modeTitle: 'Tập Luyện',
          players: 4,
          maxPlayers: 8,
          minBet: 100,
          phase: 'LOBBY',
          status: 'Đang Chờ',
        },
      ],
    });
  });

  const httpServer = http.createServer(app);

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Socket Broadcaster Adapter cho GameLoopService
  const broadcaster = {
    emitToRoom: (roomId: string, event: string, payload: unknown) => {
      io.of('/game').to(`room:${roomId}`).emit(event, payload);
    },
    emitToUser: (userId: string, event: string, payload: unknown) => {
      io.of('/game').to(`user:${userId}`).emit(event, payload);
    },
    emitToWolves: (roomId: string, event: string, payload: unknown) => {
      io.of('/game').to(`room:${roomId}:wolves`).emit(event, payload);
    },
    emitToLovers: (roomId: string, event: string, payload: unknown) => {
      io.of('/game').to(`room:${roomId}:lovers`).emit(event, payload);
    },
  };

  const gameLoop = new GameLoopService(redisStore, broadcaster);
  const timerWorker = new TimerWorker(redisStore, gameLoop);

  // Khởi động Background Timer Worker
  timerWorker.start(500);

  const gameNamespace = io.of('/game');
  const gateway = new GameGateway(roomManager, gameLoop, timerWorker, redisStore, gameNamespace);

  gameNamespace.on('connection', (socket) => {
    let token = socket.handshake.auth?.token;
    let nickname = (socket.handshake.query?.nickname as string) || `User_${socket.id.substring(0, 4)}`;
    let userId = (socket.handshake.query?.userId as string) || `u_${socket.id.substring(0, 6)}`;
    let avatarUrl: string | null = (socket.handshake.query?.avatarUrl as string) || null;

    if (token) {
      try {
        const decoded = authService.verifyToken(token);
        userId = decoded.userId;
        nickname = (decoded as any).nickname || nickname;
      } catch (err) {
        // Fall back to query values
      }
    }

    gateway.handleConnection(socket as any, { userId, nickname, avatarUrl });

    socket.on('room:create', (payload, ack) => gateway.onRoomCreate(socket as any, payload).then(ack));
    socket.on('room:join', (payload, ack) => gateway.onRoomJoin(socket as any, payload).then(ack));
    socket.on('room:leave', (_payload, ack) => gateway.onRoomLeave(socket as any).then(ack));
    socket.on('game:start', (_payload, ack) => gateway.onGameStart(socket as any).then(ack));

    // Night Actions
    socket.on('night:bodyguardProtect', (payload, ack) =>
      gateway.onNightBodyguardProtect(socket as any, payload).then(ack)
    );
    socket.on('night:wolfVote', (payload, ack) => gateway.onNightWolfVote(socket as any, payload).then(ack));
    socket.on('night:witchAct', (payload, ack) => gateway.onNightWitchAct(socket as any, payload).then(ack));
    socket.on('night:seerInspect', (payload, ack) => gateway.onNightSeerInspect(socket as any, payload).then(ack));

    // Day Actions
    socket.on('day:vote', (payload, ack) => gateway.onDayVote(socket as any, payload).then(ack));
    socket.on('day:judge', (payload, ack) => gateway.onDayJudge(socket as any, payload).then(ack));

    // Chat & Clock Sync
    socket.on('chat:send', (payload, ack) => gateway.onChatSend(socket as any, payload).then(ack));
    socket.on('time:ping', (payload) => gateway.onTimePing(socket as any, payload));
    socket.on('sync:request', () => gateway.onSyncRequest(socket as any));

    socket.on('disconnect', () => gateway.handleDisconnect(socket as any));
  });

  httpServer.listen(port, () => {
    console.log(`🐺 Werewolf Game Server listening on http://localhost:${port}`);
    console.log(`📡 Socket.io Gateway active on ws://localhost:${port}/game`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal Server Bootstrap Error:', err);
  process.exit(1);
});
