'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { GameStateManager } from '../../../stores/game.store';
import { useWerewolfSocket } from '../../../hooks/useWerewolfSocket';

// Dynamically import 3D Game Client with SSR disabled to eliminate hydration mismatch
const WerewolfGameApp = dynamic(
  () => import('../../../components/WerewolfGameApp').then((mod) => mod.WerewolfGameApp),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0a0706] text-amber-200">
        <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-4" />
        <p className="font-display uppercase tracking-widest text-sm font-bold">Đang tải bàn Hội Đồng 3D...</p>
      </div>
    ),
  }
);

export default function GameRoomPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params?.code as string)?.toUpperCase();

  const [isMounted, setIsMounted] = useState(false);
  const store = useMemo(() => new GameStateManager(), []);
  const [nickname, setNickname] = useState<string>('Người Làng');
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
      // Tạo phòng mới với cấu hình tùy chỉnh (nếu có)
      let pendingSettings = {};
      try {
        const stored = sessionStorage.getItem('werewolf_pending_create_settings');
        if (stored) {
          pendingSettings = JSON.parse(stored);
        }
      } catch (e) {
        console.error('Failed to parse pending create settings:', e);
      }

      emitAction('room:create', { settings: pendingSettings }).then((res) => {
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
          // Nếu không vào được phòng -> Tự động tạo bàn mới với mã code này
          emitAction('room:create', {}).then((createRes) => {
            if (createRes.ok) {
              const newCode = (createRes as any).data?.code;
              if (newCode) router.replace(`/game/${newCode}`);
            } else {
              setInitError(res.error.message);
            }
          });
        }
      });
    }
  }, [isConnected, code, emitAction, router]);

  if (!isMounted) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0a0706] text-amber-200">
        <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-4" />
        <p className="font-display uppercase tracking-widest text-sm font-bold">Đang tải bàn Hội Đồng 3D...</p>
      </div>
    );
  }

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
