'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ALL_ROLES_FROM_PDF, Role } from '@werewolf/shared';

export default function HomePage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<'RANKED' | 'CASUAL'>('RANKED');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'VILLAGE' | 'WEREWOLF' | 'OTHER'>('ALL');

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

    sessionStorage.setItem('werewolf_nickname', nickname.trim());
    router.push(`/game/${cleanCode}`);
  };

  const handleCreateRoom = () => {
    setError(null);
    if (!nickname.trim()) {
      setError('Vui lòng nhập biệt danh của bạn trước khi tạo phòng!');
      return;
    }

    sessionStorage.setItem('werewolf_nickname', nickname.trim());
    router.push(`/game/new`);
  };

  const allRolesList = Object.values(ALL_ROLES_FROM_PDF);
  const filteredRoles = allRolesList.filter((r) => {
    if (roleFilter === 'ALL') return true;
    if (roleFilter === 'VILLAGE') return r.category === 'VILLAGE';
    if (roleFilter === 'WEREWOLF') return r.category === 'WEREWOLF' || r.category === 'WOLFPACK';
    return r.category === 'FACTION_CHANGER' || r.category === 'INDEPENDENT';
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--surface)', color: 'var(--on-surface)' }}>
      {/* 1. HEADER COCKPIT (Gothic Nightfall HUD) */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 72,
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
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(147, 0, 10, 0.4)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--tertiary-container)',
              boxShadow: '0 0 16px rgba(147, 0, 10, 0.6)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 26 }}>nightlight</span>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-headline)', fontSize: 18, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              MA SÓI ONLINE
            </div>
            <div style={{ fontFamily: 'var(--font-label)', fontSize: 10, letterSpacing: '0.15em', color: 'var(--tertiary-container)', textTransform: 'uppercase' }}>
              Huyết Nguyệt Trỗi Dậy
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(34, 42, 61, 0.6)',
              marginLeft: 16,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--primary)', boxShadow: '0 0 8px var(--primary)' }}></span>
            <span style={{ fontFamily: 'var(--font-label)', fontSize: 11, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>
              Máy Chủ: Vực Thẳm I
            </span>
          </div>
        </div>

        {/* Center Nav */}
        {/* Center Nav - 4 Giao Diện Từ Thư Mục Design */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--surface-container-high)',
              color: 'var(--primary)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              fontFamily: 'var(--font-label)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            SẢNH CHỜ
          </button>
          <button
            onClick={() => router.push('/cards')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'transparent',
              color: 'var(--on-surface-variant)',
              border: '1px solid transparent',
              fontFamily: 'var(--font-label)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>style</span>
            BÁCH KHOA THẺ BÀI
          </button>
          <button
            onClick={() => router.push('/auth')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'transparent',
              color: 'var(--on-surface-variant)',
              border: '1px solid transparent',
              fontFamily: 'var(--font-label)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>lock</span>
            ĐĂNG NHẬP / ĐĂNG KÝ
          </button>
        </div>

        {/* Right Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--surface-container-low)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--amber-glow)' }}>stars</span>
            <span style={{ fontFamily: 'var(--font-label)', fontSize: 12, fontWeight: 700 }}>3,240</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: 'var(--primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#000' }}>person</span>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontFamily: 'var(--font-label)', fontSize: 12, fontWeight: 700 }}>Thợ Săn</div>
              <div style={{ fontFamily: 'var(--font-label)', fontSize: 10, color: 'var(--on-surface-variant)' }}>Cấp 38</div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. MAIN COCKPIT VIEWPORT */}
      <main style={{ paddingTop: 96, paddingBottom: 40, maxWidth: 1400, margin: '0 auto', paddingLeft: 24, paddingRight: 24 }}>
        {/* SUB-HEADER METRICS BAR */}
        <div
          style={{
            marginBottom: 24,
            padding: '10px 20px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(10, 14, 24, 0.75)',
            border: '1px solid var(--outline-variant)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--error)', boxShadow: '0 0 10px var(--error)' }}></span>
              <span style={{ fontFamily: 'var(--font-label)', fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Trực Tuyến:</span>
              <span style={{ fontFamily: 'var(--font-label)', fontSize: 13, fontWeight: 700, color: 'var(--tertiary-container)' }}>14,820 Thợ Săn</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-dim)', fontSize: 13 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--primary)' }}>timer</span>
              <span>Ước tính tìm trận:</span>
              <strong style={{ color: 'var(--primary)' }}>~14s</strong>
            </div>
            <div style={{ padding: '2px 8px', borderRadius: 4, backgroundColor: 'var(--surface-container-high)', fontSize: 11, color: 'var(--on-surface-variant)' }}>
              🛡️ Mùa 4: Trăng Máu Trỗi Dậy
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--surface-container)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--primary)' }}>mic</span>
              <span style={{ fontFamily: 'var(--font-label)', fontSize: 11 }}>Micro: Khử Ồn AI</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 4 }}>
                <span className="eq-bar-1" style={{ width: 2, background: 'var(--primary)', borderRadius: 2 }}></span>
                <span className="eq-bar-2" style={{ width: 2, background: 'var(--primary)', borderRadius: 2 }}></span>
                <span className="eq-bar-3" style={{ width: 2, background: 'var(--primary)', borderRadius: 2 }}></span>
              </div>
            </div>
          </div>
        </div>

        {/* 3-COLUMN PRIMARY GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.3fr 1fr', gap: 24 }}>
          {/* COLUMN 1: TÌM TRẬN & VÀO PHÒNG */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Matchmaking Card */}
            <div
              className="glass-panel"
              style={{
                padding: 24,
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontFamily: 'var(--font-label)', fontSize: 11, color: 'var(--tertiary-container)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  🔥 SẢNH TỬ QUYẾT
                </span>
                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, backgroundColor: 'var(--surface-container)', color: 'var(--text-dim)' }}>
                  BÀN CƯỢC NGẦM
                </span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: 24, fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>
                BƯỚC VÀO TRẬN ĐẤU
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 20 }}>
                Quán rượu ngầm đang đỏ đèn. Chọn chế độ hoặc tạo phòng riêng để đối đầu cùng bạn bè.
              </p>

              {/* Mode Selectors */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                <div
                  onClick={() => setSelectedMode('RANKED')}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: selectedMode === 'RANKED' ? 'var(--surface-container-high)' : 'var(--surface-container-low)',
                    border: selectedMode === 'RANKED' ? '1px solid var(--amber-glow)' : '1px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--amber-glow)' }}>
                      <span className="material-symbols-outlined">swords</span>
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-headline)', fontSize: 14, fontWeight: 700 }}>Đấu Xếp Hạng Huyết Nguyệt</div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>12 người • Xếp hạng tính điểm ELO</div>
                    </div>
                  </div>
                  {selectedMode === 'RANKED' && <span style={{ color: 'var(--amber-glow)', fontSize: 18 }}>✓</span>}
                </div>

                <div
                  onClick={() => setSelectedMode('CASUAL')}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: selectedMode === 'CASUAL' ? 'var(--surface-container-high)' : 'var(--surface-container-low)',
                    border: selectedMode === 'CASUAL' ? '1px solid var(--primary)' : '1px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                      <span className="material-symbols-outlined">casino</span>
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-headline)', fontSize: 14, fontWeight: 700 }}>Đấu Thường Quán Rượu</div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>6 - 16 người • Giải trí tự do</div>
                    </div>
                  </div>
                  {selectedMode === 'CASUAL' && <span style={{ color: 'var(--primary)', fontSize: 18 }}>✓</span>}
                </div>
              </div>

              {/* Form Input */}
              {error && (
                <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--wolf-red)', color: 'var(--error)', fontSize: 12, marginBottom: 16 }}>
                  ⚠️ {error}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-label)', color: 'var(--text-dim)', marginBottom: 6, textTransform: 'uppercase' }}>
                    Biệt danh của bạn
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Ví dụ: VanHelsing, ThầnThám..."
                    maxLength={20}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--surface-container-low)',
                      border: '1px solid var(--outline-variant)',
                      color: '#fff',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Nút Tạo Phòng Nhanh */}
                <button
                  type="button"
                  onClick={handleCreateRoom}
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
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    marginTop: 6,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add_circle</span>
                  Tạo Phòng Mới (Làm Host)
                </button>

                {/* Hoặc Nhập Mã Phòng */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0' }}>
                  <div style={{ flex: 1, height: 1, backgroundColor: 'var(--outline-variant)' }}></div>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-label)' }}>HOẶC NHẬP MÃ PHÒNG</span>
                  <div style={{ flex: 1, height: 1, backgroundColor: 'var(--outline-variant)' }}></div>
                </div>

                <form onSubmit={handleJoin} style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="6 KÝ TỰ..."
                    maxLength={6}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--surface-container-low)',
                      border: '1px solid var(--outline-variant)',
                      color: '#fff',
                      fontSize: 14,
                      letterSpacing: 2,
                      textAlign: 'center',
                      fontFamily: 'var(--font-label)',
                      fontWeight: 700,
                      outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: '10px 20px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--surface-container-high)',
                      color: 'var(--primary)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      fontFamily: 'var(--font-headline)',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    VÀO PHÒNG
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* COLUMN 2: BÁCH KHOA VAI TRÒ PREVIEW (Stitch Gothic HUD) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="glass-panel" style={{ padding: 24, height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: 18, fontWeight: 800, textTransform: 'uppercase' }}>
                  39 VAI TRÒ CHUẨN PDF
                </h3>
                <button
                  onClick={() => setShowRoleModal(true)}
                  style={{
                    fontSize: 12,
                    color: 'var(--primary)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-label)',
                    fontWeight: 600,
                  }}
                >
                  Xem Toàn Bộ ➔
                </button>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                Hệ thống gồm đủ 39 nhân vật từ bản mở rộng Deluxe & Wolfpack. Chia theo 5 nhóm thế lực.
              </p>

              {/* Category Badges */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
                <div style={{ padding: 12, borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', textAlign: 'center' }}>
                  <div style={{ fontSize: 24 }}>🛡️</div>
                  <div style={{ fontFamily: 'var(--font-headline)', fontSize: 13, fontWeight: 700, marginTop: 4 }}>Dân Làng</div>
                  <div style={{ fontSize: 11, color: 'var(--primary)', fontFamily: 'var(--font-label)' }}>21 Vai Trò</div>
                </div>
                <div style={{ padding: 12, borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', textAlign: 'center' }}>
                  <div style={{ fontSize: 24 }}>🐺</div>
                  <div style={{ fontFamily: 'var(--font-headline)', fontSize: 13, fontWeight: 700, marginTop: 4 }}>Ma Sói</div>
                  <div style={{ fontSize: 11, color: 'var(--error)', fontFamily: 'var(--font-label)' }}>5 + 6 Sói Mở Rộng</div>
                </div>
                <div style={{ padding: 12, borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(192, 132, 252, 0.1)', border: '1px solid rgba(192, 132, 252, 0.3)', textAlign: 'center' }}>
                  <div style={{ fontSize: 24 }}>🎭</div>
                  <div style={{ fontFamily: 'var(--font-headline)', fontSize: 13, fontWeight: 700, marginTop: 4 }}>Biệt Lập / Đổi Phe</div>
                  <div style={{ fontSize: 11, color: 'var(--secondary)', fontFamily: 'var(--font-label)' }}>7 Vai Trò</div>
                </div>
              </div>

              {/* Sample Tarot Cards Preview */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { name: 'Tiên Tri', role: 'SEER', icon: '🔮', desc: 'Mỗi đêm soi danh tính 1 người' },
                  { name: 'Sói Đại Ca', role: 'BIG_BAD_WOLF', icon: '👹', desc: 'Cắn 2 người ngồi cạnh nhau' },
                  { name: 'Chán Đời', role: 'TANNER', icon: '🪢', desc: 'Thắng khi bị làng treo cổ' },
                ].map((item) => (
                  <div
                    key={item.role}
                    style={{
                      padding: 14,
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--surface-container-low)',
                      border: '1px solid var(--outline-variant)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 28, marginBottom: 6 }}>{item.icon}</div>
                    <div style={{ fontFamily: 'var(--font-headline)', fontSize: 13, fontWeight: 700 }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMN 3: SẢNH TÁN GẪU MÁY CHỦ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="glass-panel" style={{ padding: 20, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--amber-glow)' }}>campaign</span>
                <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: 15, fontWeight: 700, textTransform: 'uppercase' }}>
                  BẢNG TIN THỜI SỰ
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                <div style={{ padding: 10, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--surface-container-low)', fontSize: 12 }}>
                  <div style={{ color: 'var(--amber-glow)', fontWeight: 600, marginBottom: 2 }}>[Hệ Thống]</div>
                  <div>Cập nhật đầy đủ 39 vai trò từ file PDF luật chuẩn quốc tế!</div>
                </div>
                <div style={{ padding: 10, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--surface-container-low)', fontSize: 12 }}>
                  <div style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: 2 }}>[Mẹo Chơi]</div>
                  <div>Người Hóa Sói (Lycan) thuộc phe Dân nhưng Tiên Tri soi sẽ ra Ma Sói. Hãy cẩn trọng lời khai!</div>
                </div>
                <div style={{ padding: 10, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--surface-container-low)', fontSize: 12 }}>
                  <div style={{ color: 'var(--error)', fontWeight: 600, marginBottom: 2 }}>[Cảnh Báo]</div>
                  <div>Nếu Sói Con chết, đêm tiếp theo bầy sói được cắn 2 nạn nhân.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 3. MODAL BÁCH KHOA 39 VAI TRÒ TỪ PDF */}
      {showRoleModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: 1000,
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              padding: 28,
              border: '1px solid var(--outline-variant)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: 24, fontWeight: 800 }}>
                  📖 BÁCH KHOA TOÀN THƯ 39 VAI TRÒ
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Trích xuất chi tiết theo Luật Chơi Ma Sói (Ultimate Werewolf Deluxe + Wolfpack)
                </p>
              </div>
              <button
                onClick={() => setShowRoleModal(false)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--surface-container-high)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 18,
                }}
              >
                ✕
              </button>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {[
                { id: 'ALL', label: 'Tất Cả (39)' },
                { id: 'VILLAGE', label: 'Phe Dân Làng (21)' },
                { id: 'WEREWOLF', label: 'Phe Ma Sói (11)' },
                { id: 'OTHER', label: 'Biệt Lập & Đổi Phe (7)' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setRoleFilter(tab.id as any)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: roleFilter === tab.id ? 'var(--primary-container)' : 'var(--surface-container-low)',
                    color: roleFilter === tab.id ? '#000' : 'var(--on-surface)',
                    border: '1px solid var(--outline-variant)',
                    fontFamily: 'var(--font-label)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Grid of Role Cards */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {filteredRoles.map((r) => (
                <div
                  key={r.id}
                  style={{
                    padding: 16,
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--surface-container-low)',
                    border: r.category === 'WEREWOLF' || r.category === 'WOLFPACK' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--outline-variant)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-headline)', fontSize: 15, fontWeight: 700 }}>
                        {r.nameVi}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{r.nameEn}</div>
                    </div>
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.08)', color: 'var(--text-dim)' }}>
                      {r.category}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {r.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
