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

// Role metadata for rich display
interface RoleInfo {
  role: Role;
  nameVN: string;
  category: 'wolf' | 'village' | 'neutral';
  icon: string;
  badge: string;
  desc: string;
}

const ROLES_CATALOG: RoleInfo[] = [
  // 1. Phe Ma Sói
  {
    role: 'WEREWOLF',
    nameVN: 'Ma Sói Thường',
    category: 'wolf',
    icon: '🐺',
    badge: 'Phe Sói',
    desc: 'Thức giấc mỗi đêm cùng bầy sói thống nhất cắn hạ 1 nạn nhân.',
  },
  {
    role: 'WOLF_CUB',
    nameVN: 'Sói Con',
    category: 'wolf',
    icon: '🐾',
    badge: 'Phe Sói',
    desc: 'Nếu Sói Con bị giết, đêm tiếp theo bầy sói được cắn 2 nạn nhân liên tiếp.',
  },
  {
    role: 'BIG_BAD_WOLF',
    nameVN: 'Sói Đầu Đàn',
    category: 'wolf',
    icon: '🩸',
    badge: 'Phe Sói',
    desc: 'Thức giấc riêng biệt và được quyền cắn thêm 1 nạn nhân nữa mỗi đêm.',
  },
  {
    role: 'MINION',
    nameVN: 'Kẻ Phản Bội',
    category: 'wolf',
    icon: '🗡️',
    badge: 'Phe Sói',
    desc: 'Biết danh tính toàn bộ bầy Ma Sói, giúp sói giành chiến thắng.',
  },

  // 2. Phe Dân Làng
  {
    role: 'SEER',
    nameVN: 'Tiên Tri',
    category: 'village',
    icon: '🔮',
    badge: 'Phe Dân',
    desc: 'Mỗi đêm chọn 1 người chơi để soi thân phận thật hoặc phát hiện Ma Sói.',
  },
  {
    role: 'BODYGUARD',
    nameVN: 'Bảo Vệ',
    category: 'village',
    icon: '🛡️',
    badge: 'Phe Dân',
    desc: 'Mỗi đêm chọn 1 người để hộ vệ không bị Ma Sói cắn sát hại.',
  },
  {
    role: 'WITCH',
    nameVN: 'Phù Thủy',
    category: 'village',
    icon: '🧪',
    badge: 'Phe Dân',
    desc: 'Sở hữu 1 bình thuốc giải cứu sống và 1 bình độc dược đoạt mạng.',
  },
  {
    role: 'HUNTER',
    nameVN: 'Thợ Săn',
    category: 'village',
    icon: '🏹',
    badge: 'Phe Dân',
    desc: 'Khi bị chết, lập tức giương súng bắn hạ 1 kẻ đáng ngờ khác theo cùng.',
  },
  {
    role: 'CUPID',
    nameVN: 'Thần Tình Yêu',
    category: 'village',
    icon: '💘',
    badge: 'Phe Dân',
    desc: 'Đêm đầu tiên ghép đôi 2 người. Một người chết, người kia sẽ chết theo.',
  },
  {
    role: 'VILLAGER',
    nameVN: 'Dân Làng Thường',
    category: 'village',
    icon: '🌾',
    badge: 'Phe Dân',
    desc: 'Không có năng lực ban đêm; dùng tài lập luận và biểu quyết ban ngày.',
  },

  // 3. Phe Thứ Ba
  {
    role: 'TANNER',
    nameVN: 'Kẻ Bán Da',
    category: 'neutral',
    icon: '🎭',
    badge: 'Phe Thứ 3',
    desc: 'Thắng ngay lập tức nếu bị dân làng biểu quyết treo cổ trên giàn thiêu!',
  },
  {
    role: 'CULT_LEADER',
    nameVN: 'Giáo Chủ',
    category: 'neutral',
    icon: '👁️',
    badge: 'Phe Thứ 3',
    desc: 'Mỗi đêm thu nạp 1 đệ tử. Thắng khi toàn bộ người còn sống đều theo giáo phái.',
  },
];

// Quick Presets matching standard Werewolf board game rules
const PRESETS: { [key: number]: { name: string; roles: Partial<Record<Role, number>> } } = {
  4: {
    name: 'Tốc Chiến 4 Người',
    roles: { WEREWOLF: 1, SEER: 1, BODYGUARD: 1, VILLAGER: 1 },
  },
  6: {
    name: 'Cơ Bản 6 Người',
    roles: { WEREWOLF: 2, SEER: 1, BODYGUARD: 1, VILLAGER: 2 },
  },
  8: {
    name: 'Tiêu Chuẩn 8 Người',
    roles: { WEREWOLF: 2, SEER: 1, BODYGUARD: 1, HUNTER: 1, WITCH: 1, VILLAGER: 2 },
  },
  10: {
    name: 'Huyết Sát 10 Người',
    roles: { WEREWOLF: 3, SEER: 1, BODYGUARD: 1, HUNTER: 1, WITCH: 1, CUPID: 1, VILLAGER: 2 },
  },
  12: {
    name: 'Đại Hội Đồng 12 Người',
    roles: { WEREWOLF: 3, WOLF_CUB: 1, SEER: 1, BODYGUARD: 1, HUNTER: 1, WITCH: 1, CUPID: 1, TANNER: 1, VILLAGER: 2 },
  },
  16: {
    name: 'Tử Chiến Rừng Đêm 16 Người',
    roles: { WEREWOLF: 4, BIG_BAD_WOLF: 1, SEER: 1, BODYGUARD: 1, HUNTER: 1, WITCH: 1, CUPID: 1, TANNER: 1, VILLAGER: 5 },
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

  // Role configuration state (initialized to 8-player preset)
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

  // Adjust role counts
  const updateRoleCount = (role: Role, delta: number) => {
    werewolfAudio.playVoteStamp();
    setRoleCounts((prev) => {
      const current = prev[role] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [role]: next };
    });
  };

  // Apply a preset
  const applyPreset = (count: number) => {
    werewolfAudio.playGavel();
    setPlayerCount(count);
    const preset = PRESETS[count];
    if (preset) {
      setRoleCounts({ ...(preset.roles as Record<string, number>) });
    }
  };

  // Auto-balance: fill or reduce Villagers so total === playerCount
  const autoBalanceVillagers = () => {
    werewolfAudio.playVoteStamp();
    const nonVillagerTotal = Object.entries(roleCounts)
      .filter(([r]) => r !== 'VILLAGER')
      .reduce((sum, [, count]) => sum + (count || 0), 0);
    const neededVillagers = Math.max(0, playerCount - nonVillagerTotal);
    setRoleCounts((prev) => ({
      ...prev,
      VILLAGER: neededVillagers,
    }));
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn select-none font-geist">
      <div className="relative w-full max-w-2xl bg-[#0c1019] border border-amber-500/40 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.2)] flex flex-col max-h-[90vh] overflow-hidden">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/70 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              <span className="material-symbols-outlined text-[24px]">tune</span>
            </div>
            <div>
              <h2 className="font-syne font-bold text-lg text-white uppercase tracking-wider flex items-center gap-2">
                <span>THIẾT LẬP & TẠO PHÒNG MA SÓI</span>
                <span className="text-[10px] bg-red-950 border border-red-500/50 text-red-300 px-2 py-0.5 rounded-full font-mono">
                  {playerCount} Ghế
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                Tự do điều chỉnh quy mô bàn đấu, thời lượng tranh luận và cơ cấu các lá vai trò.
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
        <div className="flex items-center px-6 pt-3 border-b border-white/10 gap-2 bg-black/20">
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
            <span>2. Cơ Cấu Vai Trò ({totalRoles}/{playerCount})</span>
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
            <span>3. Luật Chơi Bổ Sung</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: BASICS */}
          {activeTab === 'basics' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Host Nickname */}
              <div>
                <label className="block text-xs font-space uppercase text-slate-300 font-bold mb-1.5 flex items-center gap-1">
                  <span>Biệt Danh Của Bạn (Chủ Tọa)</span>
                  <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Nhập tên hiển thị..."
                  className="w-full bg-[#141a27] border border-white/15 focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
                />
              </div>

              {/* Number of Players */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-space uppercase text-slate-300 font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-amber-400">table_restaurant</span>
                    <span>Quy Mô Bàn Đấu (Số Người Chơi):</span>
                  </label>
                  <span className="text-sm font-black font-space text-amber-300 bg-amber-950/70 border border-amber-500/40 px-2.5 py-0.5 rounded-full">
                    {playerCount} Người
                  </span>
                </div>

                {/* Quick Presets Buttons */}
                <div className="grid grid-cols-6 gap-2 mb-3">
                  {[4, 6, 8, 10, 12, 16].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => applyPreset(num)}
                      className={`py-2 rounded-xl font-space font-bold text-xs uppercase tracking-wider transition-all border ${
                        playerCount === num
                          ? 'bg-amber-600 border-amber-400 text-white shadow-[0_0_15px_rgba(217,119,6,0.6)]'
                          : 'bg-[#141a27] border-white/10 text-slate-400 hover:text-white hover:bg-zinc-800'
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
                  onChange={(e) => applyPreset(parseInt(e.target.value, 10))}
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
                  <span className="text-sm font-black font-space text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
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
                          : 'bg-[#141a27] border-white/10 text-slate-400 hover:text-white hover:bg-zinc-800'
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

              {/* Private Room Toggle */}
              <div className="bg-[#141a27] p-3.5 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs font-space font-bold text-white uppercase block">
                    Phòng Riêng Tư (Có Mật Khẩu)
                  </span>
                  <span className="text-[11px] text-slate-400 font-sans">
                    Chỉ bạn bè có mật khẩu mới có thể tham gia bàn đấu.
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
                    className="w-full bg-[#141a27] border border-white/15 focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ROLES */}
          {activeTab === 'roles' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Role Balance Summary Bar */}
              <div
                className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
                  totalRoles === playerCount
                    ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-200'
                    : totalRoles < playerCount
                    ? 'bg-amber-950/70 border-amber-500/60 text-amber-200'
                    : 'bg-red-950/70 border-red-500/60 text-red-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {totalRoles === playerCount ? '✅' : totalRoles < playerCount ? '⚠️' : '❌'}
                  </span>
                  <div>
                    <span className="font-space font-bold text-xs uppercase block">
                      {totalRoles === playerCount
                        ? `Cân Bằng Hoàn Hảo (${totalRoles}/${playerCount} Lá)`
                        : totalRoles < playerCount
                        ? `Đang Thiếu ${playerCount - totalRoles} Lá Bài (Hệ thống sẽ bù Dân Làng)`
                        : `Đang Thừa ${totalRoles - playerCount} Lá Bài (Vui lòng giảm bớt)`}
                    </span>
                    <span className="text-[11px] opacity-80">
                      Mỗi người chơi khi vào bàn sẽ được chia ngẫu nhiên 1 lá bài bí mật.
                    </span>
                  </div>
                </div>

                {totalRoles !== playerCount && (
                  <button
                    type="button"
                    onClick={autoBalanceVillagers}
                    className="px-3 py-1.5 rounded-lg bg-black/50 border border-white/20 hover:border-white/50 text-white font-space text-[10px] font-bold uppercase tracking-wider transition"
                  >
                    ⚡ Tự Động Bù Dân Làng
                  </button>
                )}
              </div>

              {/* Roles Catalog Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                {ROLES_CATALOG.map((item) => {
                  const count = roleCounts[item.role] || 0;

                  return (
                    <div
                      key={item.role}
                      className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2 ${
                        count > 0
                          ? item.category === 'wolf'
                            ? 'bg-red-950/40 border-red-500/40'
                            : item.category === 'village'
                            ? 'bg-sky-950/40 border-sky-500/40'
                            : 'bg-purple-950/40 border-purple-500/40'
                          : 'bg-[#141a27]/60 border-white/5 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{item.icon}</span>
                          <div>
                            <span className="font-space font-bold text-xs text-white block">
                              {item.nameVN}
                            </span>
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase font-bold ${
                                item.category === 'wolf'
                                  ? 'bg-red-950 text-red-300'
                                  : item.category === 'village'
                                  ? 'bg-sky-950 text-sky-300'
                                  : 'bg-purple-950 text-purple-300'
                              }`}
                            >
                              {item.badge}
                            </span>
                          </div>
                        </div>

                        {/* Counter Controls */}
                        <div className="flex items-center gap-2 bg-black/60 p-1 rounded-xl border border-white/10">
                          <button
                            type="button"
                            onClick={() => updateRoleCount(item.role, -1)}
                            disabled={count <= 0}
                            className="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center transition"
                          >
                            -
                          </button>
                          <span className="font-space font-black text-xs text-amber-300 w-4 text-center">
                            {count}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateRoleCount(item.role, 1)}
                            className="w-6 h-6 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center justify-center transition"
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

          {/* TAB 3: RULES */}
          {activeTab === 'rules' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Seer Mode */}
              <div className="bg-[#141a27] p-4 rounded-xl border border-white/10 space-y-2">
                <span className="text-xs font-space font-bold text-white uppercase block flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-amber-400">visibility</span>
                  <span>Chế Độ Soi Của Tiên Tri:</span>
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSeerRevealMode('WOLF_OR_NOT')}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      seerRevealMode === 'WOLF_OR_NOT'
                        ? 'bg-amber-950/70 border-amber-400 text-amber-200'
                        : 'bg-black/40 border-white/10 text-slate-400'
                    }`}
                  >
                    <span className="font-space text-xs font-bold block">1. Sói Hay Không Sói</span>
                    <span className="text-[10px] block opacity-80">Tiên tri chỉ nhận kết quả: Ma Sói hoặc Dân Làng.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSeerRevealMode('EXACT_ROLE')}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      seerRevealMode === 'EXACT_ROLE'
                        ? 'bg-amber-950/70 border-amber-400 text-amber-200'
                        : 'bg-black/40 border-white/10 text-slate-400'
                    }`}
                  >
                    <span className="font-space text-xs font-bold block">2. Biết Rõ Vai Trò Cụ Thể</span>
                    <span className="text-[10px] block opacity-80">Biết chính xác chức năng như Thợ Săn, Phù Thủy...</span>
                  </button>
                </div>
              </div>

              {/* Reveal On Death */}
              <div className="bg-[#141a27] p-4 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs font-space font-bold text-white uppercase block">
                    Tiết Lộ Vai Trò Khi Chết
                  </span>
                  <span className="text-[11px] text-slate-400 font-sans">
                    Khi một người chơi bị treo cổ hoặc bị cắn, hệ thống sẽ công bố danh tính thật của họ cho cả làng.
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
              <div className="bg-[#141a27] p-4 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs font-space font-bold text-white uppercase block">
                    Thời Gian Bỏ Phiếu Treo Cổ
                  </span>
                  <span className="text-[11px] text-slate-400 font-sans">
                    Thời gian cho phép mỗi người đặt phiếu biểu quyết (mặc định 30 giây).
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-amber-400 bg-black/60 px-3 py-1.5 rounded-lg border border-white/10">
                  <span>{votingDuration}s</span>
                </div>
              </div>
            </div>
          )}

          {/* MODAL FOOTER */}
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
              <span>XÁC NHẬN TẠO PHÒNG ({playerCount} NGƯỜI)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateRoomModal;
