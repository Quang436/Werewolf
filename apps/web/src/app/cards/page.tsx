'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ALL_40_ROLES } from '../../constants/roles-data';

export interface CardRole {
  id: number;
  nameVN: string;
  nameEN: string;
  faction: 'villager' | 'werewolf' | 'third';
  factionLabel: string;
  points: string;
  pointsType: 'pos' | 'neg' | 'neu';
  time: string;
  badge: string;
  desc: string;
  image: string;
}

const ROLES_DATA: CardRole[] = ALL_40_ROLES.map((r, idx) => ({
  id: idx + 1,
  nameVN: r.nameVN,
  nameEN: r.nameEN,
  faction: r.category,
  factionLabel: r.categoryLabel,
  points: r.points,
  pointsType: r.pointsType,
  time: r.time,
  badge: r.badge,
  desc: r.desc,
  image: r.image,
}));

export default function CardsPage() {
  const router = useRouter();
  const [faction, setFaction] = useState<'all' | 'villager' | 'werewolf' | 'third'>('all');
  const [pageSize, setPageSize] = useState<number>(8);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [search, setSearch] = useState<string>('');

  const counts = useMemo(() => {
    return {
      all: ROLES_DATA.length,
      villager: ROLES_DATA.filter((r) => r.faction === 'villager').length,
      werewolf: ROLES_DATA.filter((r) => r.faction === 'werewolf').length,
      third: ROLES_DATA.filter((r) => r.faction === 'third').length,
    };
  }, []);

  const filteredRoles = useMemo(() => {
    return ROLES_DATA.filter((r) => {
      const matchFaction = faction === 'all' || r.faction === faction;
      const matchSearch =
        search === '' ||
        r.nameVN.toLowerCase().includes(search.toLowerCase()) ||
        r.nameEN.toLowerCase().includes(search.toLowerCase()) ||
        r.desc.toLowerCase().includes(search.toLowerCase()) ||
        r.badge.toLowerCase().includes(search.toLowerCase());
      return matchFaction && matchSearch;
    });
  }, [faction, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRoles.length / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const paginatedRoles = filteredRoles.slice(startIndex, startIndex + pageSize);

  const meta = {
    all: {
      title: 'TẤT CẢ CÁC PHE PHÁI',
      desc: 'Khám phá toàn bộ 40 vai trò trong cuộc đối đầu sinh tử giữa Dân Làng, bầy Ma Sói khát máu và những thế lực Phe Thứ Ba mưu mô.',
      icon: 'apps',
      color: 'primary',
    },
    villager: {
      title: 'PHE DÂN LÀNG (22 VAI TRÒ)',
      desc: 'Lực lượng đông đảo nhất bảo vệ sự yên bình của ngôi làng thông qua lý luận, bỏ phiếu ban ngày và các quyền năng thần thánh bảo hộ.',
      icon: 'shield',
      color: 'primary',
    },
    werewolf: {
      title: 'PHE MA SÓI (11 VAI TRÒ)',
      desc: 'Bầy quái vật khát máu ngụy trang giữa bầy cừu với Sói Đầu Đàn, Wolverine, Mặt Nanh... Mỗi đêm thức dậy cắn xé nạn nhân và thao túng biểu quyết.',
      icon: 'skull',
      color: 'tertiary',
    },
    third: {
      title: 'PHE THỨ BA / ĐỘC LẬP (7 VAI TRÒ)',
      desc: 'Những thế lực cá nhân huyền bí: Vampire, Kẻ Bán Da Tanner, Virginia Woolf, Giáo Chủ Tà Giáo... Mỗi nhân vật sở hữu điều kiện thắng độc lập.',
      icon: 'balance',
      color: 'secondary',
    },
  }[faction];

  return (
    <div className="bg-[#0a0d16] text-[#f1f5f9] min-h-screen flex">
      {/* 1. LEFT SIDEBAR (Chuẩn 100% Stitch) */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-lowest/90 backdrop-blur-xl border-r border-outline-variant/30 flex flex-col justify-between p-4 z-50">
        <div className="flex flex-col gap-6">
          <div onClick={() => router.push('/')} className="flex items-center gap-3 px-2 cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(56,189,248,0.2)]">
              <span className="material-symbols-outlined text-[24px]">nightlight</span>
            </div>
            <div>
              <h1 className="font-syne font-bold text-base uppercase tracking-tight text-white">MA SÓI HUD</h1>
              <p className="font-space text-[10px] uppercase tracking-widest text-primary font-semibold">Bách Khoa Thẻ Bài</p>
            </div>
          </div>

          {/* Faction Filter Buttons */}
          <div className="flex flex-col gap-1.5">
            <span className="px-2 font-space text-[11px] uppercase tracking-wider text-outline">Bộ Lọc Phe Phái</span>

            <button
              onClick={() => { setFaction('all'); setCurrentPage(1); }}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                faction === 'all'
                  ? 'bg-surface-container text-white border border-primary/40 shadow-md'
                  : 'text-on-surface-variant hover:bg-surface-container/60 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-outline">apps</span>
                Tất Cả Thẻ Bài
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-space">
                {counts.all}
              </span>
            </button>

            <button
              onClick={() => { setFaction('villager'); setCurrentPage(1); }}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                faction === 'villager'
                  ? 'bg-surface-container text-white border border-primary/40 shadow-md'
                  : 'text-on-surface-variant hover:bg-surface-container/60 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-primary">shield</span>
                Phe Dân Làng
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-space font-semibold">
                {counts.villager}
              </span>
            </button>

            <button
              onClick={() => { setFaction('werewolf'); setCurrentPage(1); }}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                faction === 'werewolf'
                  ? 'bg-surface-container text-white border border-tertiary/40 shadow-md'
                  : 'text-on-surface-variant hover:bg-surface-container/60 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-tertiary">skull</span>
                Phe Ma Sói
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-tertiary/10 text-tertiary font-space font-semibold">
                {counts.werewolf}
              </span>
            </button>

            <button
              onClick={() => { setFaction('third'); setCurrentPage(1); }}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                faction === 'third'
                  ? 'bg-surface-container text-white border border-secondary/40 shadow-md'
                  : 'text-on-surface-variant hover:bg-surface-container/60 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-secondary">balance</span>
                Phe Thứ Ba
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-secondary/10 text-secondary font-space font-semibold">
                {counts.third}
              </span>
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col gap-1.5 pt-4 border-t border-outline-variant/20">
            <span className="px-2 font-space text-[11px] uppercase tracking-wider text-outline">Chuyển Giao Diện</span>
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container/60 hover:text-white text-sm transition-all text-left"
            >
              <span className="material-symbols-outlined text-[18px]">home</span>Sảnh Chờ Huyết Nguyệt
            </button>
            <button
              onClick={() => router.push('/auth')}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container/60 hover:text-white text-sm transition-all text-left"
            >
              <span className="material-symbols-outlined text-[18px]">lock</span>Đăng Nhập / Đăng Ký
            </button>
            <button
              onClick={() => router.push('/game/NEW')}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container/60 hover:text-white text-sm transition-all text-left"
            >
              <span className="material-symbols-outlined text-[18px]">casino</span>Bàn Chơi 3D POV
            </button>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="font-space text-[10px] uppercase text-outline">Đêm Trăng Máu</span>
            <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
          </div>
          <p className="text-[11px] text-on-surface-variant">Bộ quy tắc chuẩn hóa theo Ultimate Werewolf Deluxe.</p>
        </div>
      </aside>

      {/* 2. MAIN CONTENT (Offset by Sidebar 256px) */}
      <div className="ml-64 flex-1 flex flex-col min-w-0">
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-40 bg-surface-container-lowest/80 backdrop-blur-xl border-b border-outline-variant/30 px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-outline">search</span>
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Tìm kiếm vai trò theo tên, kỹ năng, chức năng..."
                className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-outline focus:outline-none focus:border-primary/60 transition-colors font-geist"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-surface-container-low border border-outline-variant/30 rounded-xl px-3 py-1.5">
              <span className="text-xs text-outline font-space">Hiển thị:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-transparent text-xs font-space font-bold text-primary focus:outline-none cursor-pointer"
              >
                <option value="8" className="bg-surface-container text-white">8 Thẻ</option>
                <option value="12" className="bg-surface-container text-white">12 Thẻ</option>
                <option value="16" className="bg-surface-container text-white">16 Thẻ</option>
                <option value="40" className="bg-surface-container text-white">Tất Cả</option>
              </select>
            </div>

            <button
              onClick={() => router.push('/game/NEW')}
              className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-space font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_12px_rgba(56,189,248,0.25)] hover:bg-sky-300 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">play_arrow</span>Vào Bàn Chơi Ngay
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-8 max-w-7xl mx-auto flex flex-col gap-8 w-full">
          {/* Hero Header */}
          <section className="rounded-2xl bg-gradient-to-r from-surface-container-low via-surface-container to-surface-container-low border border-outline-variant/40 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>
            <div className="relative z-10 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary font-space text-[10px] font-bold uppercase tracking-wider">
                  Hệ Thống Thẻ Bài Mở Rộng 40 Lá
                </span>
                <span className="text-outline text-xs">•</span>
                <span className="text-on-surface-variant font-space text-xs uppercase tracking-wider">Phiên bản Quốc Tế & Tiếng Việt</span>
              </div>
              <h1 className="font-syne font-extrabold text-2xl md:text-3xl text-white uppercase tracking-tight">
                BÁCH KHOA THẺ BÀI MA SÓI — PHÂN TÁCH 3 PHE
              </h1>
              <p className="text-on-surface-variant text-sm max-w-2xl leading-relaxed">
                Tổng hợp đầy đủ 40 vai trò chia làm 3 phe chiến lược: <span className="text-primary font-semibold">Phe Dân Làng (22)</span>, <span className="text-tertiary font-semibold">Phe Ma Sói (11)</span> và <span className="text-secondary font-semibold">Phe Thứ Ba (7)</span>. Đã tích hợp trọn bộ vai trò mở rộng mới chuẩn hóa hình ảnh Poker không viền.
              </p>
            </div>

            {/* Quick Counters */}
            <div className="relative z-10 grid grid-cols-3 gap-3 bg-surface-container-lowest/80 border border-outline-variant/30 p-3 rounded-xl flex-shrink-0">
              <div className="px-3 py-1 flex flex-col">
                <span className="font-space text-[10px] uppercase text-outline">Tổng Thẻ</span>
                <span className="font-syne font-bold text-xl text-white">{counts.all}</span>
              </div>
              <div className="px-3 py-1 flex flex-col border-l border-outline-variant/30">
                <span className="font-space text-[10px] uppercase text-primary">Dân Làng</span>
                <span className="font-syne font-bold text-xl text-primary">{counts.villager}</span>
              </div>
              <div className="px-3 py-1 flex flex-col border-l border-outline-variant/30">
                <span className="font-space text-[10px] uppercase text-tertiary">Sói & Thứ 3</span>
                <span className="font-syne font-bold text-xl text-tertiary">{counts.werewolf + counts.third}</span>
              </div>
            </div>
          </section>

          {/* Faction Selector Bar */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-4 pb-2 border-b border-outline-variant/20">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => { setFaction('all'); setCurrentPage(1); }}
                  className={`px-4 py-2 rounded-xl text-xs font-space uppercase font-bold tracking-wider transition-all flex items-center gap-2 ${
                    faction === 'all'
                      ? 'bg-primary text-on-primary shadow-md'
                      : 'bg-surface-container text-on-surface-variant hover:text-primary hover:bg-surface-container-high border border-outline-variant/30'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">apps</span>
                  Tất Cả Thẻ Bài ({counts.all})
                </button>

                <button
                  onClick={() => { setFaction('villager'); setCurrentPage(1); }}
                  className={`px-4 py-2 rounded-xl text-xs font-space uppercase font-bold tracking-wider transition-all flex items-center gap-2 ${
                    faction === 'villager'
                      ? 'bg-primary text-on-primary shadow-md'
                      : 'bg-surface-container text-on-surface-variant hover:text-primary hover:bg-surface-container-high border border-outline-variant/30'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px] text-primary">shield</span>
                  PHE DÂN LÀNG ({counts.villager})
                </button>

                <button
                  onClick={() => { setFaction('werewolf'); setCurrentPage(1); }}
                  className={`px-4 py-2 rounded-xl text-xs font-space uppercase font-bold tracking-wider transition-all flex items-center gap-2 ${
                    faction === 'werewolf'
                      ? 'bg-tertiary text-white shadow-md'
                      : 'bg-surface-container text-on-surface-variant hover:text-tertiary hover:bg-surface-container-high border border-outline-variant/30'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px] text-tertiary">skull</span>
                  PHE MA SÓI ({counts.werewolf})
                </button>

                <button
                  onClick={() => { setFaction('third'); setCurrentPage(1); }}
                  className={`px-4 py-2 rounded-xl text-xs font-space uppercase font-bold tracking-wider transition-all flex items-center gap-2 ${
                    faction === 'third'
                      ? 'bg-secondary text-white shadow-md'
                      : 'bg-surface-container text-on-surface-variant hover:text-secondary hover:bg-surface-container-high border border-outline-variant/30'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px] text-secondary">balance</span>
                  PHE THỨ BA ({counts.third})
                </button>
              </div>

              <div className="flex items-center gap-2 font-space text-xs text-outline">
                <span className="px-2.5 py-1 rounded bg-surface-container border border-outline-variant/40 text-white font-medium">
                  Đang hiển thị: {meta.title}
                </span>
              </div>
            </div>

            {/* Faction Description Banner */}
            <div className="p-4 rounded-xl bg-surface-container-low border border-primary/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-${meta.color}/10 text-${meta.color} flex items-center justify-center flex-shrink-0`}>
                  <span className="material-symbols-outlined text-[24px]">{meta.icon}</span>
                </div>
                <div>
                  <h2 className="font-syne font-bold text-sm uppercase text-white tracking-wide">{meta.title}</h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">{meta.desc}</p>
                </div>
              </div>
            </div>
          </section>

          {/* 3. CARDS GRID */}
          <section>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {paginatedRoles.map((role) => {
                const isWolf = role.faction === 'werewolf';
                const isThird = role.faction === 'third';
                const badgeColor = isWolf ? 'text-tertiary' : isThird ? 'text-secondary' : 'text-primary';
                const hoverBorder = isWolf ? 'hover:border-tertiary/60' : isThird ? 'hover:border-secondary/60' : 'hover:border-primary/60';
                const pointClass =
                  role.pointsType === 'pos'
                    ? 'text-primary bg-primary/10 border border-primary/20'
                    : role.pointsType === 'neg'
                    ? 'text-tertiary bg-tertiary/10 border border-tertiary/20'
                    : 'text-outline bg-surface-container border border-outline-variant/30';

                return (
                  <article
                    key={role.id}
                    className={`role-card group flex flex-col rounded-2xl bg-surface-container-low border border-outline-variant/30 ${hoverBorder} overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1`}
                  >
                    {/* Top Pill Header */}
                    <div className="flex items-center justify-between px-3 py-2 bg-surface-container border-b border-outline-variant/20">
                      <span className={`flex items-center gap-1.5 font-space text-[11px] font-bold uppercase ${badgeColor}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {role.factionLabel}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded font-space text-[10px] font-bold ${pointClass}`}>
                        {role.points}
                      </span>
                    </div>

                    {/* Visual Aspect Image */}
                    <div className="relative w-full aspect-[7/9] bg-surface-container-lowest overflow-hidden flex items-center justify-center">
                      <img
                        alt={role.nameEN}
                        src={role.image}
                        className="w-full h-full object-cover scale-[1.03] group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-transparent to-transparent opacity-90 pointer-events-none"></div>
                      <span className={`absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded bg-surface-container-lowest/80 backdrop-blur-md font-space text-[10px] uppercase font-bold ${badgeColor}`}>
                        {role.time}
                      </span>
                      <span className="absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded bg-surface-container-lowest/80 text-[10px] font-space text-outline">
                        #{role.id.toString().padStart(2, '0')}
                      </span>
                    </div>

                    {/* Info Body */}
                    <div className="p-3.5 flex flex-col flex-1 justify-between gap-2.5">
                      <div>
                        <h3 className="font-syne font-bold text-base text-white tracking-tight uppercase leading-snug">{role.nameVN}</h3>
                        <span className="font-space text-[11px] text-outline uppercase block">{role.nameEN}</span>
                        <p className="text-xs text-on-surface-variant line-clamp-3 mt-1.5 leading-relaxed">{role.desc}</p>
                      </div>
                      <div className="pt-2 flex items-center justify-between font-space text-[11px] border-t border-outline-variant/20">
                        <span className="text-outline flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">bolt</span>{role.badge}
                        </span>
                        <span className={`${badgeColor} font-bold`}>Chuẩn PnP</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Empty State */}
            {filteredRoles.length === 0 && (
              <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-surface-container-low border border-outline-variant/30">
                <span className="material-symbols-outlined text-5xl text-outline mb-3">search_off</span>
                <h3 className="font-syne font-bold text-lg text-white uppercase">Không tìm thấy thẻ bài phù hợp</h3>
                <p className="text-sm text-on-surface-variant max-w-sm mt-1">
                  Hãy thử tìm kiếm với từ khóa khác như "Sói", "Tiên Tri", "Vampire", "Wolverine", "Tanner".
                </p>
                <button
                  onClick={() => { setFaction('all'); setSearch(''); }}
                  className="mt-4 px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-space text-xs uppercase font-bold tracking-wider transition-all"
                >
                  Đặt Lại Bộ Lọc
                </button>
              </div>
            )}
          </section>

          {/* 4. PAGINATION CONTROLS */}
          <section className="rounded-xl bg-surface-container-low border border-outline-variant/30 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-2 font-space text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-primary text-[18px]">layers</span>
              <span>
                Đang hiển thị {filteredRoles.length > 0 ? startIndex + 1 : 0} -{' '}
                {Math.min(startIndex + pageSize, filteredRoles.length)} trong tổng số {filteredRoles.length} thẻ
              </span>
              <span className="hidden md:inline px-2 py-0.5 rounded bg-surface-container text-outline text-[11px]">
                {pageSize} thẻ / trang
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={validPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-white font-space text-xs uppercase font-bold tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                <span>Trước</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pNum = idx + 1;
                  return (
                    <button
                      key={pNum}
                      onClick={() => setCurrentPage(pNum)}
                      className={`w-7 h-7 rounded-lg font-space text-xs font-bold transition-all ${
                        validPage === pNum
                          ? 'bg-primary text-on-primary shadow-md'
                          : 'bg-surface-container text-on-surface-variant hover:text-white'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={validPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-white font-space text-xs uppercase font-bold tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span>Sau</span>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </section>

          {/* 5. NIGHT ORDER CHEAT SHEET (Thứ Tự Gọi Đêm Mở Rộng) */}
          <section className="rounded-2xl bg-surface-container-low border border-outline-variant/30 p-6 shadow-xl flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/20 pb-4">
              <div>
                <span className="font-space text-[10px] uppercase tracking-wider text-primary font-bold">HƯỚNG DẪN QUẢN TRÒ & THỨ TỰ GỌI ĐÊM MỞ RỘNG</span>
                <h2 className="font-syne font-bold text-lg uppercase text-white tracking-tight mt-0.5">Trình Tự Thức Dậy Ban Đêm Toàn Diện</h2>
              </div>
              <span className="px-2.5 py-1 rounded bg-surface-container text-outline font-space text-xs">Chuẩn Quốc Tế Ultimate Werewolf</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Night */}
              <div className="p-4 rounded-xl bg-surface-container border border-secondary/20 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-space text-xs uppercase font-bold text-secondary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">wb_twilight</span>ĐÊM ĐẦU TIÊN (THIẾT LẬP LIÊN KẾT)
                  </span>
                  <span className="font-space text-[10px] text-outline">Gọi 1 lần duy nhất</span>
                </div>
                <ol className="flex flex-col gap-2 text-xs text-on-surface-variant">
                  <li className="flex items-start gap-2"><strong className="text-white font-space">1.</strong> <span><strong className="text-white uppercase">Kẻ Đổi Hồn (Doppelgänger):</strong> Thức dậy chọn 1 người làm bản sao kế thừa.</span></li>
                  <li className="flex items-start gap-2"><strong className="text-white font-space">2.</strong> <span><strong className="text-white uppercase">Kẻ Du Côn (Hoodlum):</strong> Chỉ định 2 người cần bị loại để đạt điều kiện thắng.</span></li>
                  <li className="flex items-start gap-2"><strong className="text-white font-space">3.</strong> <span><strong className="text-white uppercase">Virginia Woolf:</strong> Chọn 1 người chơi phải sợ mình.</span></li>
                  <li className="flex items-start gap-2"><strong className="text-white font-space">4.</strong> <span><strong className="text-white uppercase">Sói Hắc Ám (Dire Wolf):</strong> Chọn 1 người làm bạn đồng hành kết nối sinh tử.</span></li>
                  <li className="flex items-start gap-2"><strong className="text-white font-space">5.</strong> <span><strong className="text-white uppercase">Thần Tình Yêu (Cupid):</strong> Bắn tên ghép đôi 2 người yêu nhau.</span></li>
                  <li className="flex items-start gap-2"><strong className="text-white font-space">6.</strong> <span><strong className="text-white uppercase">Mặt Nanh (Fang Face):</strong> Thức dậy làm quen bầy Sói.</span></li>
                  <li className="flex items-start gap-2"><strong className="text-white font-space">7.</strong> <span><strong className="text-white uppercase">Hội Tam Điểm (Masons):</strong> Thức dậy nhìn nhau nhận diện đồng minh.</span></li>
                  <li className="flex items-start gap-2"><strong className="text-white font-space">8.</strong> <span><strong className="text-white uppercase">Tay Sai (Minion):</strong> Thức dậy nhìn bầy Ma Sói giơ tay.</span></li>
                </ol>
              </div>

              {/* Every Night */}
              <div className="p-4 rounded-xl bg-surface-container border border-tertiary/20 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-space text-xs uppercase font-bold text-tertiary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">bedtime</span>MỖI ĐÊM (VÒNG LẶP HÀNG ĐÊM)
                  </span>
                  <span className="font-space text-[10px] text-outline">Thực hiện theo thứ tự</span>
                </div>
                <ol className="flex flex-col gap-2 text-xs text-on-surface-variant">
                  <li className="flex items-start gap-2"><strong className="text-white font-space">1.</strong> <span><strong className="text-white uppercase">Bảo Vệ / Mục Sư:</strong> Chọn 1 người bảo hộ khỏi móng vuốt Sói.</span></li>
                  <li className="flex items-start gap-2"><strong className="text-white font-space">2.</strong> <span><strong className="text-white uppercase">Tiên Tri / Tiên Tri Hào Quang / P.I:</strong> Thức dậy soi danh tính / năng lực.</span></li>
                  <li className="flex items-start gap-2"><strong className="text-white font-space">3.</strong> <span><strong className="text-white uppercase">Bà Lão Cổ Quái & Pháp Sư:</strong> Chọn người phải rời làng hoặc bị cấm nói.</span></li>
                  <li className="flex items-start gap-2"><strong className="text-white font-space">4.</strong> <span><strong className="text-white uppercase">Bầy Ma Sói & Sói Đầu Đàn / Wolverine / Sói Ăn Chay:</strong> Cả đàn chọn cắn người.</span></li>
                  <li className="flex items-start gap-2"><strong className="text-white font-space">5.</strong> <span><strong className="text-white uppercase">Phù Thủy Hắc Ám:</strong> Thức dậy tìm Tiên Tri.</span></li>
                  <li className="flex items-start gap-2"><strong className="text-white font-space">6.</strong> <span><strong className="text-white uppercase">Ma Cà Rồng (Vampire):</strong> Chọn 1 người bị yểm bùa.</span></li>
                  <li className="flex items-start gap-2"><strong className="text-white font-space">7.</strong> <span><strong className="text-white uppercase">Phù Thủy (Witch):</strong> Quyết định dùng bình Cứu hoặc bình Độc.</span></li>
                  <li className="flex items-start gap-2"><strong className="text-white font-space">8.</strong> <span><strong className="text-white uppercase">Giáo Chủ Tà Giáo:</strong> Thu phục 1 người chơi mới vào giáo phái.</span></li>
                </ol>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
