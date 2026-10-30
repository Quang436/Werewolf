'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Role, Team } from '@werewolf/shared';
import {
  getFactionVisuals,
  getRoleDetailExtra,
  getRoleInfo,
} from '../constants/roles-data';
import { werewolfAudio } from './LiarsBar3DExperience';

export interface CenterRoleRevealModalProps {
  isOpen: boolean;
  role: Role;
  team?: Team | null;
  wolfTeammates?: Array<{ id: string; nickname: string }>;
  lover?: { partnerId: string; partnerNickname: string; partnerRole?: Role };
  onClose: () => void;
  onOpenTacticalBook?: () => void;
}

export const CenterRoleRevealModal: React.FC<CenterRoleRevealModalProps> = ({
  isOpen,
  role,
  wolfTeammates = [],
  lover,
  onClose,
  onOpenTacticalBook,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [countdown, setCountdown] = useState(12);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const roleInfo = getRoleInfo(role);
  const roleExtra = getRoleDetailExtra(role);
  const visuals = getFactionVisuals(roleInfo.category);

  // Trigger dramatic 3D card flip once when modal opens
  useEffect(() => {
    if (!isOpen) {
      setIsFlipped(false);
      return;
    }

    setIsFlipped(false);
    setCountdown(12);

    // Play card deal sound initially
    werewolfAudio.playCardDeal();

    // Flip card after 350ms
    const flipTimer = setTimeout(() => {
      setIsFlipped(true);
      const cat = getRoleInfo(role).category;
      if (cat === 'werewolf') {
        werewolfAudio.playWolfHowl();
      } else if (cat === 'third') {
        werewolfAudio.playWhisper();
      } else {
        werewolfAudio.playBell();
      }
    }, 350);

    return () => {
      clearTimeout(flipTimer);
    };
  }, [isOpen, role]);

  // 12s countdown ticker (pure state update, NO side effects during state update!)
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Clean, safe side effect when countdown reaches 0
  useEffect(() => {
    if (isOpen && countdown === 0) {
      onCloseRef.current();
    }
  }, [isOpen, countdown]);

  // Listen for Escape or KeyC to dismiss modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'KeyC') {
        e.preventDefault();
        onCloseRef.current();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      onClick={() => onCloseRef.current()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-fadeIn pointer-events-auto select-none"
    >
      {/* Background Ambience Particles / Glow */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full blur-[100px] opacity-40 pointer-events-none transition-all duration-700"
        style={{ background: visuals.auraColor }}
      />

      {/* Main Center Card Reveal Dialog */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col items-center max-w-md w-full"
      >
        {/* Close Button top-right */}
        <button
          type="button"
          onClick={() => onCloseRef.current()}
          className="absolute -top-3 -right-3 z-30 w-8 h-8 rounded-full bg-zinc-900 border border-white/20 text-stone-300 hover:text-white hover:bg-red-950 hover:border-red-500 flex items-center justify-center transition shadow-lg text-sm font-bold"
          title="Đóng lá bài (Thu nhỏ về góc màn hình)"
        >
          ✕
        </button>

        {/* Top Announcement Tag */}
        <div className="mb-3 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/90 border border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.4)]">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs font-display font-black text-amber-300 uppercase tracking-widest">
              LÁ BÀI VAI TRÒ CỦA BẠN
            </span>
          </div>
        </div>

        {/* 3D Flipping Grand Card Container */}
        <div
          className="relative w-[340px] md:w-[380px] h-[520px] md:h-[550px] cursor-pointer"
          style={{ perspective: '1200px' }}
          onClick={() => {
            setIsFlipped((prev) => !prev);
            werewolfAudio.playVoteStamp();
          }}
          title="Click để lật mở / lật úp lá bài"
        >
          <div
            className="w-full h-full relative transition-transform duration-700 ease-out"
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(0deg)' : 'rotateY(180deg)',
            }}
          >
            {/* =============================================================
                CARD FRONT: 100% COMPLETE UNCROPPED ARTWORK & FULL INFO
               ============================================================= */}
            <div
              className={`absolute inset-0 rounded-3xl overflow-hidden border-2 ${visuals.cardBorder} bg-[#0a0e17] shadow-[0_0_50px_rgba(0,0,0,0.95)] flex flex-col justify-between p-4`}
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
            >
              {/* Header Badges */}
              <div className="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${visuals.badgeBg} border ${visuals.badgeBorder} shadow-lg`}
                >
                  <span className="text-sm">{visuals.sealEmoji}</span>
                  <span className={`text-[11px] font-black uppercase font-display tracking-wider ${visuals.badgeText}`}>
                    {visuals.teamLabel}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="px-2 py-0.5 rounded-full bg-zinc-900 border border-white/10 text-stone-300">
                    {roleInfo.time}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 font-bold">
                    {roleInfo.points}
                  </span>
                </div>
              </div>

              {/* 100% COMPLETE UNCROPPED ARTWORK FRAME (OBJECT-CONTAIN) */}
              <div className="relative my-2 w-full h-[230px] md:h-[250px] rounded-2xl overflow-hidden bg-black/90 border border-white/10 flex items-center justify-center p-2.5 shrink-0">
                {/* Subtle vignette gradient in background */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e17] via-transparent to-black/60 pointer-events-none" />

                <img
                  src={roleInfo.image}
                  alt={roleInfo.nameVN}
                  className="max-w-full max-h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)] rounded-lg transition-transform duration-500 hover:scale-105"
                />
              </div>

              {/* Role Title & Identity */}
              <div className="text-center px-2 shrink-0">
                <h2 className={`font-display font-black text-2xl md:text-3xl uppercase tracking-wide leading-none ${visuals.titleColor}`}>
                  {roleInfo.nameVN}
                </h2>
                <p className="text-xs font-mono text-stone-400 uppercase tracking-widest mt-1">
                  {roleInfo.nameEN} &bull; {roleInfo.badge}
                </p>
              </div>

              {/* Ability & Win Condition Snippets */}
              <div className="my-2 space-y-1.5 overflow-hidden">
                {/* Win Condition Tag */}
                <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-200 font-sans flex items-start gap-1.5">
                  <span className="text-sm shrink-0">🏆</span>
                  <span className="leading-tight line-clamp-2">
                    <strong className="text-amber-400">Mục tiêu:</strong> {roleExtra.winCondition}
                  </span>
                </div>

                {/* Ability Tag */}
                <div className="p-2 rounded-xl bg-zinc-900/80 border border-white/10 text-[11px] text-slate-300 font-sans flex items-start gap-1.5">
                  <span className="text-sm shrink-0">⚡</span>
                  <span className="leading-tight line-clamp-2">
                    <strong className="text-white">Kỹ năng:</strong> {roleInfo.desc}
                  </span>
                </div>

                {/* Teammates or Lovers if applicable */}
                {roleInfo.category === 'werewolf' && wolfTeammates.length > 0 && (
                  <div className="p-1.5 rounded-lg bg-red-950/80 border border-red-500/40 text-[11px] text-red-200 flex items-center gap-1.5">
                    <span>🐺</span>
                    <span className="font-bold">Bầy Sói:</span>
                    <span className="truncate">
                      {wolfTeammates.map((w) => w.nickname).join(', ')}
                    </span>
                  </div>
                )}

                {lover && (
                  <div className="p-1.5 rounded-lg bg-rose-950/80 border border-rose-500/40 text-[11px] text-rose-200 flex items-center gap-1.5">
                    <span>💘</span>
                    <span className="font-bold">Người Yêu:</span>
                    <span className="truncate">{lover.partnerNickname}</span>
                  </div>
                )}
              </div>

              {/* Bottom Action Button */}
              <div className="pt-2 border-t border-white/10 flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    werewolfAudio.playVoteStamp();
                    onClose();
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-black font-display font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.6)] border border-amber-300 transition-all flex items-center justify-center gap-2 transform active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>ĐÃ HIỂU VAI TRÒ ({countdown}s)</span>
                </button>

                {onOpenTacticalBook && (
                  <button
                    type="button"
                    onClick={() => {
                      werewolfAudio.playBell();
                      onOpenTacticalBook();
                    }}
                    className="py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-stone-300 hover:text-white text-xs font-mono font-bold transition flex items-center justify-center"
                    title="Mở Sổ Tay Chiến Thuật"
                  >
                    <span className="material-symbols-outlined text-[16px]">menu_book</span>
                  </button>
                )}
              </div>
            </div>

            {/* =============================================================
                CARD BACK: MYSTIC RUNIC GOLD WAX SEAL (FLIPS OVER)
               ============================================================= */}
            <div
              className="absolute inset-0 rounded-3xl overflow-hidden border-2 border-amber-500/60 bg-[#0a0d14] shadow-[0_0_50px_rgba(217,119,6,0.5)] flex flex-col items-center justify-between p-6"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <div className="px-4 py-1.5 rounded-full bg-amber-950/80 border border-amber-500/50 text-[11px] font-mono text-amber-300 uppercase tracking-widest">
                <span>🛡️ HỘI ĐỒNG LIAR&apos;S BAR</span>
              </div>

              <div className="flex flex-col items-center my-auto">
                <div className="w-28 h-28 rounded-full border-2 border-dashed border-amber-500/50 flex items-center justify-center bg-black/70 shadow-[0_0_40px_rgba(245,158,11,0.4)] animate-pulse">
                  <span className="text-6xl">🐺</span>
                </div>
                <h3 className="mt-4 font-display font-black text-lg uppercase tracking-widest text-amber-400 neon-text-red">
                  ĐANG PHÁT BÀI...
                </h3>
                <p className="text-xs font-mono text-stone-400 text-center max-w-[220px] mt-1">
                  Quản trò đang giải mã số phận của bạn...
                </p>
              </div>

              <div className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">
                CONFIDENTIAL &bull; TOP SECRET
              </div>
            </div>
          </div>
        </div>

        {/* Quick hint below */}
        <p className="text-[11px] font-mono text-stone-400 text-center mt-3">
          Nhấn <kbd className="text-amber-300 font-bold">[C]</kbd> hoặc click nút để thu nhỏ lá bài vào góc màn hình
        </p>
      </div>
    </div>
  );
};

export default CenterRoleRevealModal;
