'use client';

import React, { useState, useMemo } from 'react';
import { Role, RoomSettings } from '@werewolf/shared';
import { werewolfAudio } from './LiarsBar3DExperience';

export interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (settings: Partial<RoomSettings>, hostNickname: string) => void;
  initialNickname?: string;
}

import { ALL_40_ROLES, RoleCatalogItem } from '../constants/roles-data';
export type { RoleCatalogItem };
export { ALL_40_ROLES };

// Curated Preset Templates for any game size & style
const PRESETS: { [key: string]: { name: string; players: number; roles: Partial<Record<Role, number>> } } = {
  p4: {
    name: 'Tốc Chiến (4 Người)',
    players: 4,
    roles: { WEREWOLF: 1, SEER: 1, BODYGUARD: 1, VILLAGER: 1 },
  },
  p6: {
    name: 'Kinh Điển (6 Người)',
    players: 6,
    roles: { WEREWOLF: 2, SEER: 1, BODYGUARD: 1, VILLAGER: 2 },
  },
  p8: {
    name: 'Tiêu Chuẩn (8 Người)',
    players: 8,
    roles: { WEREWOLF: 2, SEER: 1, BODYGUARD: 1, HUNTER: 1, WITCH: 1, VILLAGER: 2 },
  },
  p10: {
    name: 'Huyết Sát (10 Người)',
    players: 10,
    roles: { WEREWOLF: 2, WOLF_CUB: 1, SEER: 1, BODYGUARD: 1, HUNTER: 1, WITCH: 1, CUPID: 1, VILLAGER: 2 },
  },
  p12: {
    name: 'Đại Hội Đồng (12 Người)',
    players: 12,
    roles: { WEREWOLF: 3, BIG_BAD_WOLF: 1, SEER: 1, BODYGUARD: 1, HUNTER: 1, WITCH: 1, CUPID: 1, TANNER: 1, MAYOR: 1, VILLAGER: 1 },
  },
  p16: {
    name: 'Tử Chiến Rừng Đêm (16 Người)',
    players: 16,
    roles: {
      WEREWOLF: 4,
      BIG_BAD_WOLF: 1,
      WOLF_CUB: 1,
      SEER: 1,
      AURA_SEER: 1,
      BODYGUARD: 1,
      HUNTER: 1,
      WITCH: 1,
      CUPID: 1,
      TANNER: 1,
      MAYOR: 1,
      SPELLCASTER: 1,
      VILLAGER: 2,
    },
  },
  p12_chaos: {
    name: 'Hỗn Loạn Tà Giáo (12 Người)',
    players: 12,
    roles: {
      WEREWOLF: 2,
      DIRE_WOLF: 1,
      CULT_LEADER: 1,
      VAMPIRE: 1,
      TANNER: 1,
      SEER: 1,
      BODYGUARD: 1,
      WITCH: 1,
      CURSED: 1,
      VILLAGER: 2,
    },
  },
  p10_magic: {
    name: 'Học Viện Thần Bí (10 Người)',
    players: 10,
    roles: {
      WEREWOLF: 2,
      SORCERESS: 1,
      SEER: 1,
      AURA_SEER: 1,
      APPRENTICE_SEER: 1,
      SPELLCASTER: 1,
      BODYGUARD: 1,
      WITCH: 1,
      VILLAGER: 1,
    },
  },
};

export function CreateRoomModal({
  isOpen,
  onClose,
  onCreateRoom,
  initialNickname = '',
}: CreateRoomModalProps) {
  const [activeTab, setActiveTab] = useState<'basics' | 'roles' | 'rules'>('basics');
  const [nickname, setNickname] = useState(initialNickname || 'Thợ Săn Bạn');
  const [playerCount, setPlayerCount] = useState<number>(8);
  const [discussionDuration, setDiscussionDuration] = useState<number>(90);
  const [votingDuration, setVotingDuration] = useState<number>(30);
  const [seerRevealMode, setSeerRevealMode] = useState<'WOLF_OR_NOT' | 'EXACT_ROLE'>('WOLF_OR_NOT');
  const [revealRoleOnDeath, setRevealRoleOnDeath] = useState<boolean>(true);
  const [isPrivateRoom, setIsPrivateRoom] = useState<boolean>(false);
  const [roomPassword, setRoomPassword] = useState<string>('');

  // Role Filtering & Search
  const [factionFilter, setFactionFilter] = useState<'all' | 'werewolf' | 'villager' | 'third'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Initialized with standard 8-player preset
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({
    WEREWOLF: 2,
    SEER: 1,
    BODYGUARD: 1,
    HUNTER: 1,
    WITCH: 1,
    VILLAGER: 2,
  });

  // Calculate total configured roles
  const totalRoles = useMemo(() => {
    return Object.values(roleCounts).reduce((sum, count) => sum + (count || 0), 0);
  }, [roleCounts]);

  // Breakdown by faction
  const factionBreakdown = useMemo(() => {
    let wolf = 0;
    let village = 0;
    let third = 0;

    ALL_40_ROLES.forEach((r) => {
      const count = roleCounts[r.role] || 0;
      if (r.category === 'werewolf') wolf += count;
      else if (r.category === 'villager') village += count;
      else third += count;
    });

    return { wolf, village, third };
  }, [roleCounts]);

  // Filtered roles list for browsing
  const filteredRoles = useMemo(() => {
    return ALL_40_ROLES.filter((r) => {
      const matchFaction = factionFilter === 'all' || r.category === factionFilter;
      const matchSearch =
        searchTerm === '' ||
        r.nameVN.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.nameEN.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.badge.toLowerCase().includes(searchTerm.toLowerCase());
      return matchFaction && matchSearch;
    });
  }, [factionFilter, searchTerm]);

  // Update role count
  const updateRoleCount = (role: Role, delta: number) => {
    werewolfAudio.playVoteStamp();
    setRoleCounts((prev) => {
      const current = prev[role] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [role]: next };
    });
  };

  // Apply a preset
  const applyPresetByKey = (key: string) => {
    werewolfAudio.playGavel();
    const preset = PRESETS[key];
    if (preset) {
      setPlayerCount(preset.players);
      setRoleCounts({ ...(preset.roles as Record<string, number>) });
    }
  };

  // Apply seat size preset
  const applySeatCount = (num: number) => {
    werewolfAudio.playVoteStamp();
    setPlayerCount(num);
    const preset = PRESETS[`p${num}`];
    if (preset) {
      setRoleCounts({ ...(preset.roles as Record<string, number>) });
    } else {
      // Auto-adjust Villagers to fit
      const nonVillagerTotal = Object.entries(roleCounts)
        .filter(([r]) => r !== 'VILLAGER')
        .reduce((sum, [, count]) => sum + (count || 0), 0);
      setRoleCounts((prev) => ({
        ...prev,
        VILLAGER: Math.max(0, num - nonVillagerTotal),
      }));
    }
  };

  // Auto-balance: fill or reduce Villagers so total === playerCount
  const autoBalanceVillagers = () => {
    werewolfAudio.playGavel();
    const nonVillagerTotal = Object.entries(roleCounts)
      .filter(([r]) => r !== 'VILLAGER')
      .reduce((sum, [, count]) => sum + (count || 0), 0);
    const neededVillagers = Math.max(0, playerCount - nonVillagerTotal);
    setRoleCounts((prev) => ({
      ...prev,
      VILLAGER: neededVillagers,
    }));
  };

  // Clear all roles to 0
  const clearAllRoles = () => {
    werewolfAudio.playVoteStamp();
    setRoleCounts({});
  };

  // Submit Room Creation
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    werewolfAudio.playGavel();

    const finalSettings: Partial<RoomSettings> = {
      minPlayers: playerCount,
      maxPlayers: playerCount,
      roleConfig: roleCounts as any,
      seerRevealMode,
      revealRoleOnDeath,
      durations: {
        discussion: discussionDuration,
        voting: votingDuration,
        defense: 30,
        judgment: 15,
        execution: 6,
      } as any,
    };

    onCreateRoom(finalSettings, nickname.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-fadeIn select-none font-geist">
      <div className="relative w-full max-w-4xl bg-[#0b0f18] border border-amber-500/40 rounded-2xl shadow-[0_0_60px_rgba(245,158,11,0.25)] flex flex-col max-h-[92vh] overflow-hidden">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/10 bg-black/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/70 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              <span className="material-symbols-outlined text-[24px]">tune</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-syne font-bold text-base sm:text-lg text-white uppercase tracking-wider">
                  THIẾT LẬP & TẠO PHÒNG MA SÓI
                </h2>
                <span className="text-[11px] bg-red-950/90 border border-red-500/50 text-red-300 px-2.5 py-0.5 rounded-full font-mono font-bold shadow">
                  {playerCount} Người
                </span>
                <span className="text-[10px] bg-amber-950/80 border border-amber-500/40 text-amber-300 px-2 py-0.5 rounded-full font-mono hidden sm:inline">
                  40 Lá Vai Trò Sẵn Sàng
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                Tự do tùy biến quy mô bàn đấu, thời lượng tranh luận và toàn bộ 40 vai trò từ bách khoa Ma Sói.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-900 border border-white/10 hover:border-white/30 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center px-6 pt-2.5 border-b border-white/10 gap-2 bg-black/30">
          <button
            type="button"
            onClick={() => setActiveTab('basics')}
            className={`px-4 py-2 font-space text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'basics'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">groups</span>
            <span>1. Số Người & Thời Gian</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('roles')}
            className={`px-4 py-2 font-space text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'roles'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">style</span>
            <span>2. Thư Viện 40 Vai Trò ({totalRoles}/{playerCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2 font-space text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'rules'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">gavel</span>
            <span>3. Luật Chơi Mở Rộng</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* ========================================================================= */}
          {/* TAB 1: BASICS */}
          {/* ========================================================================= */}
          {activeTab === 'basics' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Host Nickname */}
              <div>
                <label className="block text-xs font-space uppercase text-slate-300 font-bold mb-1.5 flex items-center gap-1">
                  <span>Biệt Danh Của Bạn (Chủ Tọa Phòng)</span>
                  <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Nhập tên hiển thị..."
                  className="w-full bg-[#131926] border border-white/15 focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
                />
              </div>

              {/* Number of Players */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-space uppercase text-slate-300 font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-amber-400">table_restaurant</span>
                    <span>Quy Mô Bàn Đấu (Số Lượng Ghế Ngồi):</span>
                  </label>
                  <span className="text-sm font-black font-space text-amber-300 bg-amber-950/70 border border-amber-500/40 px-3 py-0.5 rounded-full shadow">
                    {playerCount} Người
                  </span>
                </div>

                {/* Quick Presets Buttons */}
                <div className="grid grid-cols-6 gap-2 mb-3">
                  {[4, 6, 8, 10, 12, 16].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => applySeatCount(num)}
                      className={`py-2 rounded-xl font-space font-bold text-xs uppercase tracking-wider transition-all border ${
                        playerCount === num
                          ? 'bg-amber-600 border-amber-400 text-white shadow-[0_0_15px_rgba(217,119,6,0.6)]'
                          : 'bg-[#131926] border-white/10 text-slate-400 hover:text-white hover:bg-zinc-800'
                      }`}
                    >
                      {num} Ghế
                    </button>
                  ))}
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min="4"
                  max="16"
                  step="1"
                  value={playerCount}
                  onChange={(e) => applySeatCount(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                  <span>4 Người (Bàn nhỏ)</span>
                  <span>8 Người (Chuẩn)</span>
                  <span>12 Người (Lớn)</span>
                  <span>16 Người (Đại hội đồng)</span>
                </div>
              </div>

              {/* Discussion Duration */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-space uppercase text-slate-300 font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-amber-400">hourglass_top</span>
                    <span>Thời Gian Thảo Luận Ban Ngày:</span>
                  </label>
                  <span className="text-sm font-black font-space text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 px-3 py-0.5 rounded-full shadow">
                    {discussionDuration} Giây
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
                  {[
                    { sec: 30, label: '30s (Nhanh)' },
                    { sec: 60, label: '60s (Vừa)' },
                    { sec: 90, label: '90s (Chuẩn)' },
                    { sec: 120, label: '120s (Sâu)' },
                    { sec: 180, label: '180s (Căng)' },
                    { sec: 240, label: '240s (Dài)' },
                  ].map((item) => (
                    <button
                      key={item.sec}
                      type="button"
                      onClick={() => {
                        werewolfAudio.playVoteStamp();
                        setDiscussionDuration(item.sec);
                      }}
                      className={`py-2 px-1 rounded-xl font-space font-bold text-[11px] uppercase transition-all border text-center ${
                        discussionDuration === item.sec
                          ? 'bg-emerald-700 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                          : 'bg-[#131926] border-white/10 text-slate-400 hover:text-white hover:bg-zinc-800'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <input
                  type="range"
                  min="15"
                  max="300"
                  step="15"
                  value={discussionDuration}
                  onChange={(e) => setDiscussionDuration(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Themed Presets Showcase */}
              <div className="bg-[#131926] p-4 rounded-xl border border-white/10">
                <span className="text-xs font-space font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">stars</span>
                  <span>Mẫu Cấu Hình Theo Chủ Đề:</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => applyPresetByKey('p8')}
                    className="p-2.5 rounded-lg bg-black/40 hover:bg-amber-950/40 border border-white/10 hover:border-amber-500/50 text-left transition"
                  >
                    <span className="font-space font-bold text-xs text-white block">⚔️ Tiêu Chuẩn (8 Người)</span>
                    <span className="text-[10px] text-slate-400 font-sans">2 Sói, Tiên Tri, Bảo Vệ, Thợ Săn, Phù Thủy, 2 Dân</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPresetByKey('p10')}
                    className="p-2.5 rounded-lg bg-black/40 hover:bg-red-950/40 border border-white/10 hover:border-red-500/50 text-left transition"
                  >
                    <span className="font-space font-bold text-xs text-white block">🩸 Huyết Sát (10 Người)</span>
                    <span className="text-[10px] text-slate-400 font-sans">2 Sói, Sói Con, Tiên Tri, Bảo Vệ, Thợ Săn, Cupid, Phù Thủy...</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPresetByKey('p12_chaos')}
                    className="p-2.5 rounded-lg bg-black/40 hover:bg-purple-950/40 border border-white/10 hover:border-purple-500/50 text-left transition"
                  >
                    <span className="font-space font-bold text-xs text-white block">🎪 Hỗn Loạn Tà Giáo (12)</span>
                    <span className="text-[10px] text-slate-400 font-sans">Ma Cà Rồng, Giáo Chủ, Kẻ Bán Da, Sói Hắc Ám...</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPresetByKey('p10_magic')}
                    className="p-2.5 rounded-lg bg-black/40 hover:bg-sky-950/40 border border-white/10 hover:border-sky-500/50 text-left transition"
                  >
                    <span className="font-space font-bold text-xs text-white block">🔮 Học Viện Ma Thuật (10)</span>
                    <span className="text-[10px] text-slate-400 font-sans">Tiên Tri Hào Quang, Tập Sự, Phù Thủy Hắc Ám, Pháp Sư...</span>
                  </button>
                </div>
              </div>

              {/* Private Room Toggle */}
              <div className="bg-[#131926] p-3.5 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs font-space font-bold text-white uppercase block">
                    Phòng Riêng Tư (Cần Mật Khẩu)
                  </span>
                  <span className="text-[11px] text-slate-400 font-sans">
                    Chỉ những người được cấp mật khẩu mới có thể tham gia bàn đấu.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isPrivateRoom}
                  onChange={(e) => setIsPrivateRoom(e.target.checked)}
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {isPrivateRoom && (
                <div>
                  <label className="block text-xs font-space uppercase text-slate-300 font-bold mb-1">
                    Mật Khẩu Vào Bàn
                  </label>
                  <input
                    type="password"
                    value={roomPassword}
                    onChange={(e) => setRoomPassword(e.target.value)}
                    placeholder="Nhập mã pin hoặc mật khẩu..."
                    className="w-full bg-[#131926] border border-white/15 focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: ROLES (FULL 40 ROLES WITH FILTER & SEARCH) */}
          {/* ========================================================================= */}
          {activeTab === 'roles' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Sticky Balance Status Header */}
              <div
                className={`sticky top-0 z-20 p-3.5 rounded-xl border backdrop-blur-md shadow-2xl flex flex-wrap items-center justify-between gap-3 ${
                  totalRoles === playerCount
                    ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-200'
                    : totalRoles < playerCount
                    ? 'bg-amber-950/90 border-amber-500/60 text-amber-200'
                    : 'bg-red-950/90 border-red-500/60 text-red-200'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {totalRoles === playerCount ? '✅' : totalRoles < playerCount ? '⚠️' : '❌'}
                    </span>
                    <span className="font-space font-black text-sm uppercase">
                      {totalRoles === playerCount
                        ? `Cân Bằng Hoàn Hảo: ${totalRoles}/${playerCount} Lá Bài`
                        : totalRoles < playerCount
                        ? `Còn Thiếu ${playerCount - totalRoles} Lá Bài (Hệ thống sẽ bù Dân Làng)`
                        : `Đang Thừa ${totalRoles - playerCount} Lá Bài (Vui lòng giảm bớt)`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono mt-0.5 opacity-90">
                    <span className="text-red-300 font-bold">🐺 Sói: {factionBreakdown.wolf}</span>
                    <span>•</span>
                    <span className="text-sky-300 font-bold">🌾 Dân: {factionBreakdown.village}</span>
                    <span>•</span>
                    <span className="text-purple-300 font-bold">🃏 Thứ Ba: {factionBreakdown.third}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={autoBalanceVillagers}
                    className="px-3 py-1.5 rounded-lg bg-black/60 hover:bg-black/90 border border-white/20 text-white font-space text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-1 shadow"
                  >
                    <span>⚡ Bù Dân Làng</span>
                  </button>
                  <button
                    type="button"
                    onClick={clearAllRoles}
                    className="px-2.5 py-1.5 rounded-lg bg-black/40 hover:bg-black/80 border border-white/10 text-slate-400 hover:text-white font-space text-[10px] font-bold uppercase transition"
                    title="Xóa trắng để chọn từ đầu"
                  >
                    🧹 Xóa Hết
                  </button>
                </div>
              </div>

              {/* Faction Filter Tabs & Search Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-1 bg-[#131926] p-1 rounded-xl border border-white/10 w-full sm:w-auto overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setFactionFilter('all')}
                    className={`px-3 py-1.5 rounded-lg font-space text-xs font-bold uppercase tracking-wider transition ${
                      factionFilter === 'all'
                        ? 'bg-amber-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Tất Cả (40)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFactionFilter('werewolf')}
                    className={`px-3 py-1.5 rounded-lg font-space text-xs font-bold uppercase tracking-wider transition ${
                      factionFilter === 'werewolf'
                        ? 'bg-red-900 text-red-100 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🐺 Ma Sói (11)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFactionFilter('villager')}
                    className={`px-3 py-1.5 rounded-lg font-space text-xs font-bold uppercase tracking-wider transition ${
                      factionFilter === 'villager'
                        ? 'bg-sky-900 text-sky-100 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🌾 Dân Làng (22)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFactionFilter('third')}
                    className={`px-3 py-1.5 rounded-lg font-space text-xs font-bold uppercase tracking-wider transition ${
                      factionFilter === 'third'
                        ? 'bg-purple-900 text-purple-100 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🃏 Thứ Ba (7)
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm theo tên hoặc kỹ năng..."
                    className="w-full bg-[#131926] border border-white/10 focus:border-amber-400 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none transition-colors"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* 40 Roles Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
                {filteredRoles.map((item) => {
                  const count = roleCounts[item.role] || 0;

                  return (
                    <div
                      key={item.role}
                      className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2.5 relative overflow-hidden ${
                        count > 0
                          ? item.category === 'werewolf'
                            ? 'bg-red-950/40 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                            : item.category === 'villager'
                            ? 'bg-sky-950/40 border-sky-500/50 shadow-[0_0_15px_rgba(14,165,233,0.2)]'
                            : 'bg-purple-950/40 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                          : 'bg-[#131926]/60 border-white/5 opacity-70 hover:opacity-100 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        {/* Artwork Thumbnail + Role Info */}
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-black/60 border border-white/15 shrink-0 shadow">
                            <img
                              src={item.image}
                              alt={item.nameVN}
                              className="w-full h-full object-cover object-top"
                              loading="lazy"
                            />
                            <span className="absolute bottom-0 inset-x-0 bg-black/80 text-center text-[9px] font-mono font-bold text-amber-300">
                              {item.points}
                            </span>
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-space font-bold text-xs text-white">
                                {item.nameVN}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({item.nameEN})
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span
                                className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase font-bold ${
                                  item.category === 'werewolf'
                                    ? 'bg-red-950 text-red-300 border border-red-500/40'
                                    : item.category === 'villager'
                                    ? 'bg-sky-950 text-sky-300 border border-sky-500/40'
                                    : 'bg-purple-950 text-purple-300 border border-purple-500/40'
                                }`}
                              >
                                {item.badge}
                              </span>

                              <span className="text-[9px] font-mono text-stone-400 bg-black/40 px-1 rounded">
                                {item.time}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Increment / Decrement Counter */}
                        <div className="flex items-center gap-1.5 bg-black/80 p-1 rounded-xl border border-white/10 shrink-0">
                          <button
                            type="button"
                            onClick={() => updateRoleCount(item.role, -1)}
                            disabled={count <= 0}
                            className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-25 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center transition"
                          >
                            -
                          </button>
                          <span
                            className={`font-space font-black text-sm w-5 text-center ${
                              count > 0 ? 'text-amber-300' : 'text-slate-600'
                            }`}
                          >
                            {count}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateRoleCount(item.role, 1)}
                            className="w-7 h-7 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center justify-center transition shadow"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-400 font-sans leading-tight">
                        {item.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: RULES */}
          {/* ========================================================================= */}
          {activeTab === 'rules' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Seer Mode */}
              <div className="bg-[#131926] p-4 rounded-xl border border-white/10 space-y-2">
                <span className="text-xs font-space font-bold text-white uppercase block flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-amber-400">visibility</span>
                  <span>Chế Độ Soi Của Tiên Tri:</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSeerRevealMode('WOLF_OR_NOT')}
                    className={`p-3 rounded-xl border text-left transition ${
                      seerRevealMode === 'WOLF_OR_NOT'
                        ? 'bg-amber-950/70 border-amber-400 text-amber-200'
                        : 'bg-black/40 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="font-space text-xs font-bold block">1. Sói Hay Không Sói (Chuẩn)</span>
                    <span className="text-[10px] block opacity-80 mt-0.5">
                      Tiên Tri chỉ biết đối tượng là Ma Sói hoặc Dân Làng (an toàn, chuẩn thi đấu).
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSeerRevealMode('EXACT_ROLE')}
                    className={`p-3 rounded-xl border text-left transition ${
                      seerRevealMode === 'EXACT_ROLE'
                        ? 'bg-amber-950/70 border-amber-400 text-amber-200'
                        : 'bg-black/40 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="font-space text-xs font-bold block">2. Tiết Lộ Chính Xác Vai Trò</span>
                    <span className="text-[10px] block opacity-80 mt-0.5">
                      Tiên Tri biết cụ thể chức năng của đối tượng (Thợ Săn, Phù Thủy, Bảo Vệ...).
                    </span>
                  </button>
                </div>
              </div>

              {/* Reveal On Death */}
              <div className="bg-[#131926] p-4 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs font-space font-bold text-white uppercase block">
                    Tiết Lộ Lá Bài Khi Chết
                  </span>
                  <span className="text-[11px] text-slate-400 font-sans">
                    Khi một người chơi bị treo cổ hoặc bị cắn, hệ thống sẽ công bố danh tính thật cho cả làng.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={revealRoleOnDeath}
                  onChange={(e) => setRevealRoleOnDeath(e.target.checked)}
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {/* Voting Duration */}
              <div className="bg-[#131926] p-4 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs font-space font-bold text-white uppercase block">
                    Thời Gian Bỏ Phiếu Treo Cổ
                  </span>
                  <span className="text-[11px] text-slate-400 font-sans">
                    Thời gian cho phép mỗi người đặt phiếu biểu quyết treo cổ (mặc định 30 giây).
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-amber-400 bg-black/60 px-3 py-1.5 rounded-lg border border-white/10">
                  <span>{votingDuration}s</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODAL FOOTER */}
          {/* ========================================================================= */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-slate-400 hover:text-white font-space font-bold text-xs uppercase tracking-wider transition"
            >
              Hủy Bỏ
            </button>

            <button
              type="submit"
              className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-red-800 via-amber-700 to-red-800 hover:from-red-700 hover:to-amber-600 text-white font-space font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all flex items-center justify-center gap-2 animate-glowBeat"
            >
              <span className="material-symbols-outlined text-[18px]">play_circle</span>
              <span>XÁC NHẬN TẠO PHÒNG ({playerCount} NGƯỜI • {totalRoles} LÁ VAI TRÒ)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateRoomModal;
