'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length !== 6) {
      setError('Mã phòng phải gồm đúng 6 ký tự!');
      return;
    }
    if (!nickname.trim()) {
      setError('Vui lòng nhập biệt danh của bạn!');
      return;
    }

    // Lưu nickname vào session và chuyển hướng tới phòng
    sessionStorage.setItem('werewolf_nickname', nickname.trim());
    router.push(`/game/${cleanCode}`);
  };

  const handleCreateRoom = async () => {
    setError(null);
    if (!nickname.trim()) {
      setError('Vui lòng nhập biệt danh của bạn trước khi tạo phòng!');
      return;
    }

    setLoading(true);
    sessionStorage.setItem('werewolf_nickname', nickname.trim());
    // Chuyển tới trang game với query param tạo mới
    router.push(`/game/new`);
  };

  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '24px',
      }}
    >
      {/* Hero Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>🐺</div>
        <h1
          style={{
            fontSize: 48,
            fontWeight: 800,
            letterSpacing: -1,
            background: 'linear-gradient(135deg, #f8fafc 0%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          MA SÓI MULTIPLAYER
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 16, marginTop: 8 }}>
          Đấu Trí, Lừa Lọc & Sinh Tồn — Nền tảng Realtime Clean Architecture
        </p>
      </div>

      {/* Main Glass Action Card */}
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 440,
          padding: 32,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: 'var(--wolf-red)',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
            BIỆT DANH CỦA BẠN
          </label>
          <input
            type="text"
            className="chat-input-field"
            placeholder="Nhập tên hiển thị trong làng..."
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            style={{ width: '100%', padding: '12px 14px', fontSize: 15 }}
            maxLength={20}
          />
        </div>

        <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />

        {/* Join Room Form */}
        <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
            VÀO PHÒNG CÓ SẴN
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              className="chat-input-field"
              placeholder="MÃ 6 KÝ TỰ"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              style={{
                flex: 1,
                padding: '12px 14px',
                fontSize: 18,
                letterSpacing: 3,
                fontWeight: 700,
                textAlign: 'center',
              }}
              maxLength={6}
            />
            <button
              type="submit"
              style={{
                padding: '0 24px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--village-blue)',
                color: '#000',
                border: 'none',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Vào phòng
            </button>
          </div>
        </form>

        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-dim)', margin: '4px 0' }}>— HOẶC —</div>

        {/* Create Room Button */}
        <button
          type="button"
          disabled={loading}
          onClick={handleCreateRoom}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--wolf-red)',
            color: '#fff',
            border: 'none',
            fontSize: 16,
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 16px var(--wolf-red-glow)',
          }}
        >
          {loading ? 'Đang tạo phòng...' : '👑 Tạo Phòng Mới'}
        </button>
      </div>

      {/* Rules Quick Badges */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          marginTop: 36,
          flexWrap: 'wrap',
          justifyContent: 'center',
          color: 'var(--text-dim)',
          fontSize: 13,
        }}
      >
        <span>🛡️ Chống Hack Map Data Masking</span>
        <span>•</span>
        <span>⏱️ Đồng Bộ Đồng Hồ NTP</span>
        <span>•</span>
        <span>💬 4 Kênh Chat Riêng Biệt</span>
        <span>•</span>
        <span>🎯 6 Đến 12 Người Chơi</span>
      </div>
    </main>
  );
}
