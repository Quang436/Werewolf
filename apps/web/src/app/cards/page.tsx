'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ALL_ROLES_FROM_PDF, Role } from '@werewolf/shared';

export default function CardsEncyclopediaPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<'ALL' | 'VILLAGE' | 'WEREWOLF' | 'THIRD'>('ALL');
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const allRoles = useMemo(() => {
    return Object.values(ALL_ROLES_FROM_PDF);
  }, []);

  const counts = useMemo(() => {
    return {
      all: allRoles.length,
      village: allRoles.filter((r) => r.category === 'VILLAGE').length,
      werewolf: allRoles.filter((r) => r.category === 'WEREWOLF' || r.category === 'WOLFPACK').length,
      third: allRoles.filter((r) => r.category === 'INDEPENDENT' || r.category === 'FACTION_CHANGER').length,
    };
  }, [allRoles]);

  const filteredRoles = useMemo(() => {
    return allRoles.filter((r) => {
      // Category filter
      if (filter === 'VILLAGE' && r.category !== 'VILLAGE') return false;
      if (filter === 'WEREWOLF' && r.category !== 'WEREWOLF' && r.category !== 'WOLFPACK') return false;
      if (filter === 'THIRD' && r.category !== 'INDEPENDENT' && r.category !== 'FACTION_CHANGER') return false;

      // Text search
      if (search.trim()) {
        const query = search.toLowerCase();
        return (
          r.nameVi.toLowerCase().includes(query) ||
          r.nameEn.toLowerCase().includes(query) ||
          r.description.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [allRoles, filter, search]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0d16', color: 'var(--on-surface)', display: 'flex' }}>
      {/* 1. LEFT SIDEBAR */}
      <aside
        style={{
          width: 280,
          backgroundColor: 'rgba(6, 9, 16, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid var(--outline-variant)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 20,
          position: 'fixed',
          top: 0,
          bottom: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Logo */}
          <div
            onClick={() => router.push('/')}
            style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>nightlight</span>
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: 16, fontWeight: 800, textTransform: 'uppercase' }}>
                MA SÓI HUD
              </h1>
              <p style={{ fontFamily: 'var(--font-label)', fontSize: 10, color: 'var(--primary)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Bách Khoa Thẻ Bài
              </p>
            </div>
          </div>

          {/* Navigation Filters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-label)', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', paddingLeft: 8 }}>
              BỘ LỌC PHE PHÁI
            </span>

            <button
              onClick={() => setFilter('ALL')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: filter === 'ALL' ? 'var(--surface-container-high)' : 'transparent',
                color: filter === 'ALL' ? '#fff' : 'var(--on-surface-variant)',
                border: filter === 'ALL' ? '1px solid var(--primary)' : '1px solid transparent',
                fontFamily: 'var(--font-label)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>apps</span>
                Tất Cả Thẻ Bài
              </span>
              <span style={{ padding: '2px 8px', borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.08)', fontSize: 11 }}>
                {counts.all}
              </span>
            </button>

            <button
              onClick={() => setFilter('VILLAGE')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: filter === 'VILLAGE' ? 'var(--surface-container-high)' : 'transparent',
                color: filter === 'VILLAGE' ? 'var(--primary)' : 'var(--on-surface-variant)',
                border: filter === 'VILLAGE' ? '1px solid var(--primary)' : '1px solid transparent',
                fontFamily: 'var(--font-label)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>shield</span>
                Phe Dân Làng
              </span>
              <span style={{ padding: '2px 8px', borderRadius: 4, backgroundColor: 'rgba(56, 189, 248, 0.15)', color: 'var(--primary)', fontSize: 11 }}>
                {counts.village}
              </span>
            </button>

            <button
              onClick={() => setFilter('WEREWOLF')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: filter === 'WEREWOLF' ? 'var(--surface-container-high)' : 'transparent',
                color: filter === 'WEREWOLF' ? 'var(--error)' : 'var(--on-surface-variant)',
                border: filter === 'WEREWOLF' ? '1px solid var(--error)' : '1px solid transparent',
                fontFamily: 'var(--font-label)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>skull</span>
                Phe Ma Sói
              </span>
              <span style={{ padding: '2px 8px', borderRadius: 4, backgroundColor: 'rgba(239, 68, 68, 0.15)', color: 'var(--error)', fontSize: 11 }}>
                {counts.werewolf}
              </span>
            </button>

            <button
              onClick={() => setFilter('THIRD')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: filter === 'THIRD' ? 'var(--surface-container-high)' : 'transparent',
                color: filter === 'THIRD' ? 'var(--secondary)' : 'var(--on-surface-variant)',
                border: filter === 'THIRD' ? '1px solid var(--secondary)' : '1px solid transparent',
                fontFamily: 'var(--font-label)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>balance</span>
                Phe Thứ Ba & Đổi Phe
              </span>
              <span style={{ padding: '2px 8px', borderRadius: 4, backgroundColor: 'rgba(192, 132, 252, 0.15)', color: 'var(--secondary)', fontSize: 11 }}>
                {counts.third}
              </span>
            </button>
          </div>

          {/* Quick Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 16, borderTop: '1px solid var(--outline-variant)' }}>
            <button
              onClick={() => router.push('/')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'none',
                border: 'none',
                color: 'var(--on-surface-variant)',
                fontFamily: 'var(--font-label)',
                fontSize: 12,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>home</span>
              Quay Lại Sảnh Chờ
            </button>

            <button
              onClick={() => router.push('/auth')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'none',
                border: 'none',
                color: 'var(--on-surface-variant)',
                fontFamily: 'var(--font-label)',
                fontSize: 12,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>lock</span>
              Đăng Nhập / Đăng Ký
            </button>
          </div>
        </div>

        {/* Footer info in sidebar */}
        <div style={{ padding: 12, borderRadius: 'var(--radius-md)', backgroundColor: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }}>
          <div style={{ fontSize: 11, color: 'var(--amber-glow)', fontWeight: 700, marginBottom: 2 }}>Trích Xuất PDF</div>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', lineHeight: 1.4 }}>
            Bản mở rộng Ultimate Werewolf Deluxe + Wolfpack chính thức.
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main style={{ marginLeft: 280, flex: 1, padding: '32px 40px', maxWidth: 1400 }}>
        {/* Top Search & Filter Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, gap: 16 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 440 }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: 10, fontSize: 20, color: 'var(--text-dim)' }}>
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm vai trò theo tên, kỹ năng..."
              style={{
                width: '100%',
                padding: '10px 14px 10px 40px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--surface-container-low)',
                border: '1px solid var(--outline-variant)',
                color: '#fff',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => router.push('/')}
              style={{
                padding: '10px 18px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--blood-red)',
                color: '#fff',
                border: 'none',
                fontFamily: 'var(--font-headline)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>play_arrow</span>
              Vào Bàn Chơi Ngay
            </button>
          </div>
        </div>

        {/* Hero Section Banner */}
        <section
          style={{
            padding: 28,
            borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, rgba(17, 22, 34, 0.9) 0%, rgba(24, 31, 47, 0.95) 100%)',
            border: '1px solid var(--outline-variant)',
            marginBottom: 32,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, backgroundColor: 'rgba(56, 189, 248, 0.15)', color: 'var(--primary)', fontFamily: 'var(--font-label)', fontWeight: 700 }}>
                HỆ THỐNG TOÀN DIỆN {counts.all} LÁ BÀI
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>•</span>
              <span style={{ fontSize: 11, color: 'var(--on-surface-variant)', fontFamily: 'var(--font-label)' }}>Phiên bản Quốc Tế & Tiếng Việt</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: 26, fontWeight: 900, textTransform: 'uppercase', marginBottom: 8 }}>
              BÁCH KHOA THẺ BÀI MA SÓI — 3 PHE CHIẾN LƯỢC
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 650, lineHeight: 1.5 }}>
              Khám phá danh sách đầy đủ toàn bộ 39 nhân vật gồm Dân Làng (21), Ma Sói & Wolfpack (11) và Phe Thứ Ba độc lập (7). Mỗi thẻ bài sở hữu minh họa chân dung độc bản và kỹ năng riêng biệt.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ padding: '12px 20px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(6, 9, 16, 0.8)', border: '1px solid var(--outline-variant)', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-label)' }}>TỔNG SỐ</div>
              <div style={{ fontFamily: 'var(--font-headline)', fontSize: 26, fontWeight: 900, color: '#fff' }}>{counts.all}</div>
            </div>
            <div style={{ padding: '12px 20px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(6, 9, 16, 0.8)', border: '1px solid var(--outline-variant)', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--primary)', fontFamily: 'var(--font-label)' }}>DÂN LÀNG</div>
              <div style={{ fontFamily: 'var(--font-headline)', fontSize: 26, fontWeight: 900, color: 'var(--primary)' }}>{counts.village}</div>
            </div>
            <div style={{ padding: '12px 20px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(6, 9, 16, 0.8)', border: '1px solid var(--outline-variant)', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--error)', fontFamily: 'var(--font-label)' }}>SÓI & KHÁC</div>
              <div style={{ fontFamily: 'var(--font-headline)', fontSize: 26, fontWeight: 900, color: 'var(--error)' }}>{counts.werewolf + counts.third}</div>
            </div>
          </div>
        </section>

        {/* 3. GRID OF CARDS (Tarot Illustration Deck) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {filteredRoles.map((r, idx) => {
            const cardImgIndex = (idx % 44) + 1;
            const isWolf = r.category === 'WEREWOLF' || r.category === 'WOLFPACK';
            const isThird = r.category === 'INDEPENDENT' || r.category === 'FACTION_CHANGER';

            return (
              <div
                key={r.id}
                onClick={() => setSelectedRole(r.id)}
                style={{
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--surface-container-low)',
                  border: isWolf
                    ? '1px solid rgba(239, 68, 68, 0.35)'
                    : isThird
                    ? '1px solid rgba(192, 132, 252, 0.35)'
                    : '1px solid rgba(56, 189, 248, 0.25)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.25s ease',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                }}
              >
                {/* Card Top Artwork Image */}
                <div style={{ height: 160, position: 'relative', overflow: 'hidden', backgroundColor: '#07090e' }}>
                  <img
                    src={`/assets/cards/card_${cardImgIndex}.png`}
                    alt={r.nameVi}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.9) contrast(1.1)' }}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(17, 22, 34, 1) 0%, transparent 60%)' }} />

                  {/* Faction Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 10,
                      fontFamily: 'var(--font-label)',
                      fontWeight: 700,
                      backgroundColor: isWolf ? 'rgba(239, 68, 68, 0.8)' : isThird ? 'rgba(111, 0, 190, 0.8)' : 'rgba(3, 105, 161, 0.8)',
                      color: '#fff',
                    }}
                  >
                    {r.category}
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: 16, fontWeight: 800, color: isWolf ? 'var(--error)' : isThird ? 'var(--secondary)' : 'var(--primary)' }}>
                      {r.nameVi}
                    </h3>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 10, fontFamily: 'var(--font-label)' }}>
                      {r.nameEn}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, maxHeight: 72, overflow: 'hidden' }}>
                      {r.description}
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(255, 255, 255, 0.05)', fontSize: 11 }}>
                    <span style={{ color: 'var(--text-dim)' }}>
                      Thức dậy: <strong style={{ color: '#fff' }}>{r.wakeNight}</strong>
                    </span>
                    <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-label)', fontWeight: 600 }}>Chi tiết ➔</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* 4. DETAIL MODAL */}
      {selectedRole && (
        <div
          onClick={() => setSelectedRole(null)}
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
            onClick={(e) => e.stopPropagation()}
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: 520,
              padding: 32,
              textAlign: 'center',
            }}
          >
            <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: 24, fontWeight: 900, marginBottom: 4 }}>
              {ALL_ROLES_FROM_PDF[selectedRole]?.nameVi}
            </h2>
            <div style={{ fontFamily: 'var(--font-label)', fontSize: 12, color: 'var(--text-dim)', marginBottom: 16 }}>
              {ALL_ROLES_FROM_PDF[selectedRole]?.nameEn}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}>
                Phe: {ALL_ROLES_FROM_PDF[selectedRole]?.defaultTeam}
              </span>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}>
                Nhóm: {ALL_ROLES_FROM_PDF[selectedRole]?.category}
              </span>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}>
                Soi ra: {ALL_ROLES_FROM_PDF[selectedRole]?.seerAppearance}
              </span>
            </div>

            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 28 }}>
              {ALL_ROLES_FROM_PDF[selectedRole]?.description}
            </p>

            <button
              onClick={() => setSelectedRole(null)}
              style={{
                width: '100%',
                padding: '12px 20px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--surface-container-high)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                fontFamily: 'var(--font-headline)',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ĐÓNG CHI TIẾT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
