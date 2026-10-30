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
  hasDealt?: boolean;
  onToggleReveal: () => void;
  onOpenCenterReveal?: () => void;
  onRoleAction?: (actionType: string) => void;
  onSelectRoleTest?: (role: Role) => void;
  onDealNow?: () => void;
  isAlive?: boolean;
}

export const PlayerRoleCard: React.FC<PlayerRoleCardProps> = ({
  role,
  team,
  wolfTeammates = [],
  lover,
  isCardRevealed,
  hasDealt = true,
  onToggleReveal,
  onOpenCenterReveal,
  onRoleAction,
  onSelectRoleTest,
  onDealNow,
  isAlive = true,
}) => {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRolePickerOpen, setIsRolePickerOpen] = useState(false);

  const roleInfo = getRoleInfo(role);
  const roleExtra = getRoleDetailExtra(role);
  const visuals = getFactionVisuals(roleInfo.category);

  // When cards haven't been dealt yet, display waiting placeholder widget
  if (!hasDealt) {
    return (
      <div className="relative group select-none pointer-events-auto">
        {/* Subtle amber pulsing glow */}
        <div className="absolute -inset-2 rounded-2xl blur-xl opacity-40 bg-amber-600/30 transition-all pointer-events-none animate-pulse" />

        <div className="relative w-64 md:w-72 h-[340px] rounded-2xl overflow-hidden border-2 border-amber-500/40 bg-gradient-to-b from-[#131722] via-[#0d1017] to-black shadow-2xl flex flex-col justify-between p-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span>🛡️</span> HỘI ĐỒNG LIAR&apos;S BAR
            </span>
            <span className="text-[9px] font-mono bg-amber-950/80 border border-amber-500/40 text-amber-300 px-2 py-0.5 rounded-full font-bold">
              CHƯA PHÁT BÀI
            </span>
          </div>

          {/* Central Emblem & Waiting Message */}
          <div className="flex flex-col items-center justify-center text-center my-auto">
            <div className="relative w-20 h-20 rounded-2xl border border-dashed border-amber-500/50 bg-black/60 flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.2)] mb-3">
              <span className="text-4xl animate-bounce">🎴</span>
              <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-ping" />
            </div>

            <h3 className="font-display font-black text-sm uppercase tracking-wider text-amber-300 mb-1">
              CHƯA CÓ LÁ BÀI
            </h3>
            <p className="text-[11px] font-mono text-stone-400 max-w-[200px] leading-relaxed">
              Phòng đang chờ Quản Trò phát bài ngẫu nhiên cho toàn bộ thành viên.
            </p>
          </div>

          {/* Bottom Action Prompt */}
          <div className="pt-2 border-t border-white/10 flex flex-col gap-1.5 text-center">
            {onDealNow && (
              <button
                type="button"
                onClick={() => {
                  werewolfAudio.playCardDeal();
                  onDealNow();
                }}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-black font-display font-black text-[11px] uppercase tracking-wider shadow-lg shadow-amber-950/50 border border-amber-300 transition-all flex items-center justify-center gap-1.5 transform active:scale-95"
              >
                <span>🎴</span>
                <span>Phát Bài Ngay</span>
              </button>
            )}
            <span className="text-[9px] font-mono text-stone-500">
              Hoặc bấm nút [Phát Bài Ngẫu Nhiên] ở thanh trên
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* =========================================================================
          1. DOCKED COMPACT ROLE BADGE (WHEN HIDDEN - FREES UP 90% SCREEN SPACE)
         ========================================================================= */}
      {!isCardRevealed && (
        <div className="relative select-none pointer-events-auto animate-fadeIn">
          <button
            type="button"
            onClick={() => {
              werewolfAudio.playCardDeal();
              onToggleReveal();
            }}
            className="group flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-zinc-950/90 hover:bg-zinc-900 border border-amber-500/50 shadow-[0_0_20px_rgba(0,0,0,0.8)] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] backdrop-blur-md transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
            title="Mở lá bài để xem chi tiết vai trò [C]"
          >
            <div className="w-8 h-8 rounded-xl overflow-hidden border border-amber-400/60 bg-black/80 flex items-center justify-center shrink-0 shadow">
              <img
                src={roleInfo.image}
                alt={roleInfo.nameVN}
                className="w-full h-full object-cover object-top filter drop-shadow"
              />
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-display font-black text-amber-300 uppercase tracking-wide group-hover:text-amber-200">
                  {roleInfo.nameVN}
                </span>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full ${visuals.badgeBg} ${visuals.badgeBorder} ${visuals.badgeText} border font-bold`}
                >
                  {roleInfo.categoryLabel}
                </span>
              </div>
              <span className="text-[10px] font-mono text-stone-400 flex items-center gap-1">
                <span>👁️ Mở lá bài</span>
                <kbd className="text-[8px] bg-black/60 px-1 py-0.2 rounded border border-white/10 text-amber-300 font-bold">
                  [C]
                </kbd>
              </span>
            </div>
          </button>
        </div>
      )}

      {/* 2. DOCKED FULL ROLE CARD (WHEN REVEALED) */}
      {isCardRevealed && (
        <div className="relative group select-none pointer-events-auto animate-fadeIn">
          {/* Glow Aura behind card */}
          <div
            className={`absolute -inset-2 rounded-2xl blur-xl opacity-60 transition-all duration-500 pointer-events-none ${visuals.glowColor}`}
            style={{ background: visuals.auraColor }}
          />

          <div className={`relative w-64 md:w-72 h-[340px] rounded-2xl overflow-hidden border-2 ${visuals.cardBorder} bg-[#0b0f17] shadow-2xl flex flex-col justify-between`}>
            {/* Top Banner Image with 100% Complete Uncropped Artwork */}
            <div className="relative h-44 w-full overflow-hidden bg-black/85 flex items-center justify-center p-2 border-b border-white/10">
              <img
                src={roleInfo.image}
                alt={roleInfo.nameVN}
                className="max-w-full max-h-full object-contain filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)] rounded-md transition-transform duration-300 group-hover:scale-105"
              />

              {/* Top Badges & Hide Button */}
              <div className="absolute top-2 inset-x-2 flex items-center justify-between">
                <div
                  className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full ${visuals.badgeBg} border ${visuals.badgeBorder} backdrop-blur-md shadow-md pointer-events-none`}
                >
                  <span className="text-xs">{visuals.sealEmoji}</span>
                  <span className={`text-[10px] font-black uppercase font-display tracking-wider ${visuals.badgeText}`}>
                    {visuals.teamLabel}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 text-[10px] font-mono text-amber-300 pointer-events-none">
                    <span>{roleInfo.points}</span>
                  </div>

                  {/* Hide / Minimize Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      werewolfAudio.playVoteStamp();
                      onToggleReveal();
                    }}
                    className="w-6 h-6 rounded-full bg-black/80 hover:bg-zinc-800 border border-white/20 hover:border-amber-400 text-stone-300 hover:text-white flex items-center justify-center transition shadow cursor-pointer"
                    title="Ẩn lá bài thu gọn [C]"
                  >
                    <span className="material-symbols-outlined text-[14px]">expand_more</span>
                  </button>
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
            <div className="px-3.5 py-1 relative z-10 flex-1 flex flex-col justify-center">
              <div className="flex items-baseline justify-between">
                <div className="truncate pr-1">
                  <h3 className={`font-display font-black text-base md:text-lg leading-tight uppercase tracking-wide truncate ${visuals.titleColor}`}>
                    {roleInfo.nameVN}
                  </h3>
                  <p className="text-[10px] font-mono text-stone-400 uppercase tracking-wider truncate">
                    {roleInfo.nameEN}
                  </p>
                </div>

                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 border border-white/10 text-stone-300 font-mono shrink-0">
                  {roleInfo.time}
                </span>
              </div>

              {/* Ability snippet */}
              <p className="text-[11px] text-slate-300 line-clamp-2 mt-1 leading-snug font-sans">
                {roleInfo.desc}
              </p>

              {/* Extra badge if Werewolf Pack or Lovers */}
              {roleInfo.category === 'werewolf' && wolfTeammates.length > 0 && (
                <div className="mt-1 px-2 py-0.5 bg-red-950/80 border border-red-500/40 rounded flex items-center gap-1.5 text-[10px] text-red-300">
                  <span>🐺</span>
                  <span className="font-bold">Đồng đội:</span>
                  <span className="truncate">
                    {wolfTeammates.map((w) => w.nickname).join(', ')}
                  </span>
                </div>
              )}

              {lover && (
                <div className="mt-1 px-2 py-0.5 bg-rose-950/80 border border-rose-500/40 rounded flex items-center gap-1.5 text-[10px] text-rose-300">
                  <span>💘</span>
                  <span className="font-bold">Người yêu:</span>
                  <span className="truncate">{lover.partnerNickname}</span>
                </div>
              )}
            </div>

            {/* Bottom Quick Controls & Actions */}
            <div className="p-2 bg-black/80 border-t border-white/10 flex items-center justify-between gap-1">
              {onOpenCenterReveal && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    werewolfAudio.playVoteStamp();
                    onOpenCenterReveal();
                  }}
                  className="py-1 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-amber-500/40 text-amber-300 hover:text-white text-[10px] font-bold font-display uppercase tracking-wider flex items-center gap-1 transition"
                  title="Phóng to lá bài lên trung tâm màn hình"
                >
                  <span className="material-symbols-outlined text-[13px]">fullscreen</span>
                  <span>Xem Bài</span>
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  werewolfAudio.playBell();
                  setIsDetailModalOpen(true);
                }}
                className="flex-1 py-1 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-stone-300 hover:text-white text-[10px] font-bold font-display uppercase tracking-wider flex items-center justify-center gap-1 transition"
              >
                <span className="material-symbols-outlined text-[13px] text-amber-400">menu_book</span>
                <span>Sổ Tay</span>
              </button>

              {onSelectRoleTest && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    werewolfAudio.playVoteStamp();
                    setIsRolePickerOpen(true);
                  }}
                  className="py-1 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-amber-400 hover:text-amber-300 text-[10px] font-bold font-mono flex items-center gap-0.5 transition"
                  title="Đổi thử vai khác (Dành cho kiểm thử)"
                >
                  <span>🎴 Đổi</span>
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  werewolfAudio.playVoteStamp();
                  onToggleReveal();
                }}
                className="px-2 py-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-amber-500/40 hover:border-amber-400 text-[10px] font-mono text-amber-300 hover:text-white flex items-center gap-1 transition shadow cursor-pointer"
                title="Ẩn lá bài thu gọn vào góc màn hình [C]"
              >
                <span className="material-symbols-outlined text-[12px] text-amber-400">visibility_off</span>
                <span className="font-bold">Ẩn [C]</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
