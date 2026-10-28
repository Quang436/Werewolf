'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GameStateManager } from '../../../stores/game.store';
import { useWerewolfSocket } from '../../../hooks/useWerewolfSocket';
import { WerewolfGameApp } from '../../../components/WerewolfGameApp';

export default function GameRoomPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params?.code as string)?.toUpperCase();

  const store = useMemo(() => new GameStateManager(), []);
  const [nickname, setNickname] = useState<string>('Người Làng');
  const [initError, setInitError] = useState<string | null>(null);

  // Khởi tạo socket connection
  const { isConnected, emitAction, sendChat } = useWerewolfSocket({
    store,
  });

  useEffect(() => {
    const savedNickname = sessionStorage.getItem('werewolf_nickname');
    if (!savedNickname) {
      router.push('/');
      return;
    }
    setNickname(savedNickname);
  }, [router]);

  // Khi socket kết nối -> Gọi join hoặc create room
  useEffect(() => {
    if (!isConnected || !code) return;

    if (code === 'NEW') {
      // Tạo phòng mới
      emitAction('room:create', {}).then((res) => {
        if (res.ok) {
          const roomCode = (res as any).data?.code;
          if (roomCode) {
            router.replace(`/game/${roomCode}`);
          }
        } else {
          setInitError(res.error.message);
        }
      });
    } else {
      // Tham gia phòng
      emitAction('room:join', { code }).then((res) => {
        if (!res.ok) {
          setInitError(res.error.message);
        }
      });
    }
  }, [isConnected, code, emitAction, router]);

  if (initError) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: 24 }}>
        <div className="glass-panel" style={{ padding: 36, textAlign: 'center', maxWidth: 420 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ color: 'var(--wolf-red)', marginBottom: 12 }}>Không Thể Vào Phòng</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: 14 }}>{initError}</p>
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '10px 24px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--village-blue)',
              color: '#000',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Quay Về Trang Chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <WerewolfGameApp
      store={store}
      onEmitAction={emitAction}
      onSendChat={sendChat}
    />
  );
}
