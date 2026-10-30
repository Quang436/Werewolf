/**
 * useWerewolfSocket — Custom Hook React kết nối Socket.io Client với Backend GameGateway.
 *
 * Tự động:
 * 1. Khởi tạo socket connection với JWT token.
 * 2. Lắng nghe và đồng bộ toàn bộ sự kiện S2C vào GameStateManager (Zustand).
 * 3. Chạy vòng lặp NTP Ping định kỳ 10 giây để giữ đồng hồ luôn đồng bộ chuẩn xác.
 * 4. Cung cấp các helper methods để UI gọi action chỉ với 1 dòng code.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Ack,
  ChatChannel,
  ClientRoomView,
  PongPayload,
  Role,
  ServerPacket,
} from '@werewolf/shared';
import { GameStateManager } from '../stores/game.store';

import { AuthClient } from '../services/auth.client';

export interface UseWerewolfSocketOptions {
  store: GameStateManager;
  token?: string;
  serverUrl?: string;
}

export function useWerewolfSocket({
  store,
  token,
  serverUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001',
}: UseWerewolfSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const session = AuthClient.getCurrentSession();
    const effectiveToken = token || session.token || 'guest_token';
    const nickname = session.user?.nickname || 'Người Làng';
    const userId = session.user?.id || `usr_${Date.now().toString(36)}`;
    const avatarUrl = session.user?.avatarUrl || null;

    const socket = io(`${serverUrl}/game`, {
      auth: { token: effectiveToken },
      query: { nickname, userId, avatarUrl },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      // Gửi ping đầu tiên ngay khi kết nối
      socket.emit('time:ping', { t0: Date.now() });
      // Yêu cầu đồng bộ snapshot nếu đang ở trong phòng
      socket.emit('sync:request', {});
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // S2C Event Handlers
    socket.on('state:snapshot', (p: ServerPacket<ClientRoomView>) => {
      store.setRoomSnapshot(p.data);
    });

    socket.on('role:assigned', (p: ServerPacket<any>) => {
      store.setAssignedRole(p.data);
    });

    socket.on('room:deal_started', (p?: { duration?: number }) => {
      store.triggerDealingAnimation(p?.duration || 5000);
    });

    socket.on('phase:changed', (p: ServerPacket<{ phase: any; phaseEndsAt: number | null }>) => {
      store.updatePhase(p.data.phase, p.data.phaseEndsAt);
    });

    socket.on('action:request', (p: ServerPacket<any>) => {
      store.setPendingAction(p.data);
    });

    socket.on('seer:result', (p: ServerPacket<{ targetId: string; result: string }>) => {
      store.setSeerResult(p.data);
    });

    socket.on('chat:message', (p: ServerPacket<any>) => {
      store.addChatMessage(p.data);
    });

    socket.on('time:pong', (pong: PongPayload) => {
      store.handleTimePong(pong);
    });

    socket.on('game:over', (p: ServerPacket<any>) => {
      if (store.getState().room) {
        store.updatePhase('GAME_OVER', null);
      }
    });

    // Định kỳ gửi time:ping mỗi 10 giây để duy trì NTP clock sync
    const pingInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('time:ping', { t0: Date.now() });
      }
    }, 10000);

    return () => {
      clearInterval(pingInterval);
      socket.disconnect();
    };
  }, [serverUrl, token, store]);

  const emitAction = useCallback((event: string, payload: unknown): Promise<Ack> => {
    return new Promise((resolve) => {
      if (!socketRef.current || !socketRef.current.connected) {
        return resolve({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Mất kết nối tới máy chủ' } });
      }
      socketRef.current.emit(event, payload, (ack: Ack) => {
        resolve(ack || { ok: true });
      });
    });
  }, []);

  const sendChat = useCallback((channel: ChatChannel, text: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('chat:send', { channel, text });
    }
  }, []);

  return {
    isConnected,
    emitAction,
    sendChat,
  };
}
