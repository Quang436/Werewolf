'use client';

import React, { useState } from 'react';
import Link from 'next/navigation';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ tài khoản và mật khẩu!');
      return;
    }

    const finalNick = nickname.trim() || username.trim();
    sessionStorage.setItem('werewolf_nickname', finalNick);
    router.push('/');
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', backgroundColor: '#07090e', color: 'var(--on-surface)', display: 'flex', flexDirection: 'column' }}>
      {/* 3D Background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden' }}>
        <img
          src="/assets/auth.png"
          alt="Quán Rượu Vực Thẳm 3D"
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.6) contrast(1.15)' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, rgba(10,14,24,0.4) 0%, rgba(7,9,14,0.92) 100%)' }} />
      </div>

      {/* Header */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 64,
          zIndex: 50,
          backgroundColor: 'rgba(6, 9, 16, 0.85)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--outline-variant)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--error-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--error)' }}>nights_stay</span>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-headline)', fontSize: 16, fontWeight: 800, textTransform: 'uppercase' }}>MA SÓI HUYẾT NGUYỆT</div>
            <div style={{ fontFamily: 'var(--font-label)', fontSize: 9, color: 'var(--tertiary-container)', letterSpacing: '0.1em' }}>CỬA VÀO QUÁN RƯỢU</div>
          </div>
        </div>

        <nav style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', fontSize: 12, fontFamily: 'var(--font-label)', cursor: 'pointer', padding: '6px 12px' }}>
            SẢNH CHỜ
          </button>
          <button onClick={() => router.push('/cards')} style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', fontSize: 12, fontFamily: 'var(--font-label)', cursor: 'pointer', padding: '6px 12px' }}>
            BÁCH KHOA THẺ BÀI
          </button>
        </nav>
      </header>

      {/* Main Auth Form Modal */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '90px 20px 40px', position: 'relative', zIndex: 10 }}>
        <div
          className="glass-panel"
          style={{
            width: '100%',
            maxWidth: 440,
            padding: 32,
            border: '1px solid rgba(239, 68, 68, 0.4)',
            boxShadow: '0 0 50px rgba(147, 0, 10, 0.4)',
          }}
        >
          {/* Top Sigil */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: 'rgba(147, 0, 10, 0.3)', border: '1px solid rgba(239, 68, 68, 0.5)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'var(--blood-red)' }}>pets</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: 24, fontWeight: 900, textTransform: 'uppercase', color: 'var(--error)' }}>
              QUÁN RƯỢU VỰC THẲM
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Bàn cược sinh tử ma sói đang diễn ra
            </p>
          </div>

          {/* Tab Switcher */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: 4, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--surface-container-low)', marginBottom: 20 }}>
            <button
              type="button"
              onClick={() => setTab('LOGIN')}
              style={{
                padding: '8px 0',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: tab === 'LOGIN' ? 'var(--error-container)' : 'transparent',
                color: tab === 'LOGIN' ? '#fff' : 'var(--text-dim)',
                fontFamily: 'var(--font-label)',
                fontSize: 12,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              ĐĂNG NHẬP
            </button>
            <button
              type="button"
              onClick={() => setTab('REGISTER')}
              style={{
                padding: '8px 0',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: tab === 'REGISTER' ? 'var(--error-container)' : 'transparent',
                color: tab === 'REGISTER' ? '#fff' : 'var(--text-dim)',
                fontFamily: 'var(--font-label)',
                fontSize: 12,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              ĐĂNG KÝ
            </button>
          </div>

          {error && (
            <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--wolf-red)', color: 'var(--error)', fontSize: 12, marginBottom: 16 }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-label)', color: 'var(--text-dim)', marginBottom: 6, textTransform: 'uppercase' }}>
                Tên đăng nhập
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tài khoản..."
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)', color: '#fff', fontSize: 14, outline: 'none' }}
              />
            </div>

            {tab === 'REGISTER' && (
              <div>
                <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-label)', color: 'var(--text-dim)', marginBottom: 6, textTransform: 'uppercase' }}>
                  Biệt danh hiển thị trong bàn
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Biệt danh..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)', color: '#fff', fontSize: 14, outline: 'none' }}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-label)', color: 'var(--text-dim)', marginBottom: 6, textTransform: 'uppercase' }}>
                Mật khẩu
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)', color: '#fff', fontSize: 14, outline: 'none' }}
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px 18px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--blood-red)',
                color: '#fff',
                border: 'none',
                fontFamily: 'var(--font-headline)',
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-glow-red)',
                marginTop: 8,
              }}
            >
              {tab === 'LOGIN' ? 'BƯỚC VÀO QUÁN RƯỢU' : 'TẠO HỒ SƠ THỢ SĂN'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
