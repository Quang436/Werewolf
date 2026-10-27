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

dotenv.config();

const port = parseInt(process.env.PORT || '3001', 10);
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';

async function bootstrap() {
  const app = express();
  app.use(express.json());

  // Healthcheck endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: Date.now(), service: 'werewolf-server' });
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

  const redisStore = new InMemoryZSetRedisAdapter();

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

  const roomManager = new GameRoomManager(redisStore);
  const gameLoop = new GameLoopService(redisStore, broadcaster);
  const timerWorker = new TimerWorker(redisStore, gameLoop);

  // Khởi động Background Timer Worker
  timerWorker.start(500);

  const gameNamespace = io.of('/game');
  const gateway = new GameGateway(roomManager, gameLoop, timerWorker, redisStore, gameNamespace);

  gameNamespace.on('connection', (socket) => {
    const token = socket.handshake.auth?.token || 'guest_token';
    const nickname = (socket.handshake.query?.nickname as string) || `User_${socket.id.substring(0, 4)}`;
    const userId = (socket.handshake.query?.userId as string) || `u_${socket.id.substring(0, 6)}`;

    gateway.handleConnection(socket as any, { userId, nickname });

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
