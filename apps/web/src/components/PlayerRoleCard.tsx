'use client';

import React, { useState } from 'react';
import { Role, Team } from '@werewolf/shared';
import {
  ALL_40_ROLES,
  getFactionVisuals,
  getRoleDetailExtra,
  getRoleInfo,
} from '../constants/roles-data';
import { werewolfAudio } from './LiarsBar3DExperience';

export interface PlayerRoleCardProps {
  role: Role;
  team?: Team | null;
  wolfTeammates?: Array<{ id: string; nickname: string }>;
  lover?: { partnerId: string; partnerNickname: string; partnerRole?: Role };
  isCardRevealed: boolean;
  onToggleReveal: () => void;
  onRoleAction?: (actionType: string) => void;
  onSelectRoleTest?: (role: Role) => void;
  isAlive?: boolean;
}

export const PlayerRoleCard: React.FC<PlayerRoleCardProps> = ({
  role,
  team,
  wolfTeammates = [],
  lover,
  isCardRevealed,
  onToggleReveal,
  onRoleAction,
  onSelectRoleTest,
  isAlive = true,
}) => {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRolePickerOpen, setIsRolePickerOpen] = useState(false);

  const roleInfo = getRoleInfo(role);
  const roleExtra = getRoleDetailExtra(role);
  const visuals = getFactionVisuals(roleInfo.category);

  return (
    <>
      {/* =========================================================================
          1. DOCKED INTERACTIVE 3D ROLE CARD WIDGET (BOTTOM LEFT HUD)
         ========================================================================= */}
      <div className="relative group select-none pointer-events-auto">
        {/* Glow Aura behind card */}
        <div
          className={`absolute -inset-2 rounded-2xl blur-xl opacity-60 transition-all duration-500 pointer-events-none ${
            isCardRevealed ? visuals.glowColor : 'shadow-[0_0_15px_rgba(255,255,255,0.15)]'
          }`}
          style={{ background: isCardRevealed ? visuals.auraColor : 'rgba(0,0,0,0.5)' }}
        />

        {/* 3D Card Flip Perspective Container */}
        <div
          className="relative w-64 md:w-72 h-[340px] cursor-pointer"
          style={{ perspective: '1000px' }}
          onClick={() => {
            werewolfAudio.playVoteStamp();
            onToggleReveal();
          }}
          title="Click hoặc nhấn [C] để Lật / Ẩn lá bài chống nhìn lén"
        >
          <div
            className="w-full h-full relative transition-transform duration-700 ease-out"
            style={{
              transformStyle: 'preserve-3d',
              transform: isCardRevealed ? 'rotateY(0deg)' : 'rotateY(180deg)',
            }}
          >
            {/* =============================================================
                CARD FRONT: FULL ARTWORK, ROLE NAME, FACTION, ABILITIES
               ============================================================= */}
            <div
              className={`absolute inset-0 rounded-2xl overflow-hidden border-2 ${visuals.cardBorder} bg-[#0b0f17] shadow-2xl flex flex-col justify-between`}
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
            >
              {/* Top Banner Image with Gradient Overlay */}
              <div className="relative h-44 w-full overflow-hidden bg-black/60">
                <img
                  src={roleInfo.image}
                  alt={roleInfo.nameVN}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f17] via-transparent to-black/60" />

                {/* Top Badges */}
                <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between">
                  <div
                    className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full ${visuals.badgeBg} border ${visuals.badgeBorder} backdrop-blur-md shadow-md`}
                  >
                    <span className="text-xs">{visuals.sealEmoji}</span>
                    <span className={`text-[10px] font-black uppercase font-display tracking-wider ${visuals.badgeText}`}>
                      {visuals.teamLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 text-[10px] font-mono text-amber-300">
                    <span>{roleInfo.points}</span>
                  </div>
                </div>

                {/* Alive / Dead status watermark */}
                {!isAlive && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center">
                    <span className="px-3 py-1 bg-red-950 border border-red-500 rounded-lg text-red-200 font-display font-black text-xs uppercase tracking-widest shadow-2xl animate-pulse">
                      💀 ĐÃ HI SINH
                    </span>
                  </div>
                )}
              </div>

              {/* Middle Section: Title & Role Identity */}
              <div className="px-3.5 -mt-3 relative z-10">
                <div className="flex items-baseline justify-between">
                  <div>
                    <h3 className={`font-display font-black text-lg leading-tight uppercase tracking-wide ${visuals.titleColor}`}>
                      {roleInfo.nameVN}
                    </h3>
                    <p className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">
                      {roleInfo.nameEN}
                    </p>
                  </div>

                  <span className="text-xs px-2 py-0.5 rounded bg-zinc-900 border border-white/10 text-stone-300 font-mono">
                    {roleInfo.time}
                  </span>
                </div>

                {/* Ability snippet */}
                <p className="text-[11px] text-slate-300 line-clamp-2 mt-1 leading-snug font-sans">
                  {roleInfo.desc}
                </p>

                {/* Extra badge if Werewolf Pack or Lovers */}
                {roleInfo.category === 'werewolf' && wolfTeammates.length > 0 && (
                  <div className="mt-1.5 px-2 py-1 bg-red-950/80 border border-red-500/40 rounded flex items-center gap-1.5 text-[10px] text-red-300">
                    <span>🐺</span>
                    <span className="font-bold">Đồng đội:</span>
                    <span className="truncate">
                      {wolfTeammates.map((w) => w.nickname).join(', ')}
                    </span>
                  </div>
                )}

                {lover && (
                  <div className="mt-1.5 px-2 py-1 bg-rose-950/80 border border-rose-500/40 rounded flex items-center gap-1.5 text-[10px] text-rose-300">
                    <span>💘</span>
                    <span className="font-bold">Người yêu:</span>
                    <span className="truncate">{lover.partnerNickname}</span>
                  </div>
                )}
              </div>

              {/* Bottom Quick Controls & Actions */}
              <div className="p-2.5 bg-black/80 border-t border-white/10 flex items-center justify-between gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    werewolfAudio.playBell();
                    setIsDetailModalOpen(true);
                  }}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-stone-300 hover:text-white text-[10px] font-bold font-display uppercase tracking-wider flex items-center justify-center gap-1 transition"
                >
                  <span className="material-symbols-outlined text-[13px] text-amber-400">menu_book</span>
                  <span>Sổ Tay Vai</span>
                </button>

                {onSelectRoleTest && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      werewolfAudio.playVoteStamp();
                      setIsRolePickerOpen(true);
                    }}
                    className="py-1.5 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-amber-400 hover:text-amber-300 text-[10px] font-bold font-mono flex items-center gap-0.5 transition"
                    title="Đổi thử vai khác (Dành cho kiểm thử)"
                  >
                    <span>🎴 Đổi</span>
                  </button>
                )}

                <div
                  className="px-2 py-1.5 rounded-lg bg-zinc-900/90 border border-white/10 text-[9px] font-mono text-stone-400 flex items-center gap-1"
                  title="Nhấn C hoặc click bài để úp bài"
                >
                  <span className="material-symbols-outlined text-[12px] text-emerald-400">visibility</span>
                  <span className="font-bold text-emerald-400">[C]</span>
                </div>
              </div>
            </div>

            {/* =============================================================
                CARD BACK: VINTAGE NOIR WATERMARK SEAL (ANTI-PEEK MODE)
               ============================================================= */}
            <div
              className="absolute inset-0 rounded-2xl overflow-hidden border-2 border-amber-600/60 bg-[#0a0d14] shadow-2xl flex flex-col items-center justify-between p-4"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              {/* Top Seal Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/50 text-[10px] font-mono text-amber-300 uppercase tracking-widest">
                <span>🛡️ BẢO VỆ DANH TÍNH</span>
              </div>

              {/* Mystic Werewolf Emblem */}
              <div className="relative flex flex-col items-center justify-center my-auto">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-amber-500/40 flex items-center justify-center bg-black/60 shadow-[0_0_30px_rgba(217,119,6,0.3)] animate-pulse">
                  <span className="text-5xl">🐺</span>
                </div>
                <h4 className="mt-3 font-display font-black text-sm uppercase tracking-widest text-amber-400 neon-text-red">
                  LÁ BÀI ĐANG ẨN
                </h4>
                <p className="text-[10px] font-mono text-stone-400 text-center max-w-[180px] mt-1">
                  Đã kích hoạt chế độ chống nhìn lén. Click hoặc nhấn phím <kbd className="text-amber-300 font-bold">[C]</kbd> để mở bài.
                </p>
              </div>

              {/* Bottom hint */}
              <div className="text-[9px] font-mono text-stone-500 uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">lock</span>
                <span>LIAR&apos;S BAR COUNCIL &bull; CONFIDENTIAL</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. FULL ROLE DETAILS, LORE & TACTICAL MANUAL MODAL
         ========================================================================= */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn pointer-events-auto">
          <div className="bg-[#0e131d] border border-amber-500/50 rounded-2xl max-w-2xl w-full overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="relative h-48 w-full overflow-hidden shrink-0 bg-black">
              <img
                src={roleInfo.image}
                alt={roleInfo.nameVN}
                className="w-full h-full object-cover object-top opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e131d] via-[#0e131d]/60 to-transparent" />

              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 hover:bg-black border border-white/20 text-white flex items-center justify-center transition"
              >
                ✕
              </button>

              <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{roleInfo.icon}</span>
                    <span className={`text-xs font-bold uppercase font-display px-2.5 py-0.5 rounded-full ${visuals.badgeBg} border ${visuals.badgeBorder} ${visuals.badgeText}`}>
                      {roleInfo.categoryLabel}
                    </span>
                    <span className="text-xs font-mono text-amber-300 bg-black/60 px-2 py-0.5 rounded border border-white/10">
                      {roleInfo.points}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black font-display text-white tracking-wide uppercase">
                    {roleInfo.nameVN} ({roleInfo.nameEN})
                  </h2>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-mono text-stone-400 block uppercase">Thời Điểm Thức Dậy</span>
                  <span className="text-xs font-bold text-amber-400 bg-amber-950/80 px-2.5 py-0.5 rounded border border-amber-500/40">
                    {roleInfo.time}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Content Scrollable Area */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs font-sans text-gray-200">
              {/* Lore / Story */}
              <div className="p-3 rounded-xl bg-black/50 border border-white/10 italic text-stone-300">
                &ldquo;{roleExtra.lore}&rdquo;
              </div>

              {/* Win Condition Box */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/40 to-black border border-amber-500/30">
                <div className="flex items-center gap-2 text-amber-400 font-display font-bold text-xs uppercase mb-1">
                  <span className="material-symbols-outlined text-[16px]">trophy</span>
                  <span>Mục Tiêu Chiến Thắng</span>
                </div>
                <p className="text-stone-200 leading-relaxed font-sans">
                  {roleExtra.winCondition}
                </p>
              </div>

              {/* Ability & How to Play */}
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-white/10">
                <div className="flex items-center gap-2 text-red-400 font-display font-bold text-xs uppercase mb-1">
                  <span className="material-symbols-outlined text-[16px]">bolt</span>
                  <span>Kỹ Năng: {roleExtra.abilityTitle}</span>
                </div>
                <p className="text-stone-300 leading-relaxed font-sans mb-2">
                  {roleInfo.desc}
                </p>
                <div className="p-2.5 bg-black/60 rounded-lg border border-white/5 text-[11px] text-amber-200/90 font-mono">
                  💡 <span className="font-bold">Mẹo thực chiến:</span> {roleExtra.abilityInstruction}
                </div>
              </div>

              {/* Role specific extras */}
              {roleInfo.category === 'werewolf' && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-[11px]">
                  <span className="font-bold block mb-1">🐺 QUY TẮC BẦY SÓI:</span>
                  Ban đêm, kênh chat [SÓI] sẽ mở khóa. Toàn bộ Sói phải đồng thuận mục tiêu trước khi hết giờ. Nếu không đồng thuận, phiếu của Sói Đầu Đàn sẽ được ưu tiên.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-black/80 border-t border-white/10 flex items-center justify-between">
              <span className="text-[10px] font-mono text-stone-400">
                Bách Khoa Ma Sói &bull; Liar&apos;s Bar Council
              </span>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-bold font-display uppercase tracking-wider text-xs transition"
              >
                Đã Hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          3. TESTING ROLE PICKER DRAWER (SWITCH TO ANY OF THE 40 ROLES)
         ========================================================================= */}
      {isRolePickerOpen && onSelectRoleTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn pointer-events-auto">
          <div className="bg-[#0e131d] border border-amber-500/50 rounded-2xl max-w-3xl w-full p-5 max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div>
                <h3 className="font-display font-black text-lg text-amber-400 uppercase tracking-wide">
                  CHỌN THỬ VAI TRÒ (40 ROLES)
                </h3>
                <p className="text-xs text-stone-400">
                  Click chọn bất kỳ vai nào dưới đây để lập tức gán vào người chơi và kiểm thử hiển thị.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRolePickerOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 text-white flex items-center justify-center hover:bg-zinc-700"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {ALL_40_ROLES.map((r) => {
                const isCurrent = r.role === role;
                const faction = getFactionVisuals(r.category);

                return (
                  <div
                    key={r.role}
                    onClick={() => {
                      werewolfAudio.playWolfHowl();
                      onSelectRoleTest(r.role);
                      setIsRolePickerOpen(false);
                    }}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-amber-950/80 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                        : 'bg-zinc-900/70 border-white/10 hover:border-amber-400/60 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xl">{r.icon}</span>
                      <div className="truncate">
                        <span className={`text-xs font-bold block truncate font-display ${faction.titleColor}`}>
                          {r.nameVN}
                        </span>
                        <span className="text-[9px] font-mono text-stone-400 block truncate">
                          {r.nameEN}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-mono text-stone-400 pt-1 border-t border-white/5">
                      <span className={`px-1 rounded ${faction.badgeBg} ${faction.badgeText}`}>
                        {r.categoryLabel}
                      </span>
                      <span>{r.points}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PlayerRoleCard;
