'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ClientRoomView } from '@werewolf/shared';

// ============================================================================
// 1. TAVERN AUDIO SYNTHESIZER (WEB AUDIO API)
// ============================================================================
class TavernAudioEngine {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  public playGunCock() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(750, now);
    osc.frequency.exponentialRampToValueAtTime(1500, now + 0.08);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playCylinderSpin() {
    this.init();
    if (!this.ctx) return;
    for (let i = 0; i < 6; i++) {
      const t = this.ctx.currentTime + i * 0.045;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1100 + i * 70, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.02);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.02);
    }
  }

  public playGunshot() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(60, now + 0.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(1.0, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + 0.5);
  }

  public playCardFlip() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(560, now + 0.06);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }
}

const tavernAudio = new TavernAudioEngine();

// ============================================================================
// 2. CHARACTER PRESETS (5 HEROES MATCHING REFERENCE ARTWORK)
// ============================================================================
export interface CharacterPreset {
  id: string;
  name: string;
  title: string;
  roleHint: string;
  quote: string;
  idleSprite: string;
  actionSprite: string;
  seatPercentX: number;
  seatPercentY: number;
  scale: number;
}

export const CHARACTER_PRESETS: CharacterPreset[] = [
  {
    id: 'cowboy',
    name: 'Arthur Vance',
    title: 'Thợ Săn Cao Bồi',
    roleHint: 'Thiện xạ, phản xạ nhanh và quyết đoán',
    quote: '"Tôi nhìn thấu từng lá bài và từng kẻ nói dối trong cái quán này."',
    idleSprite: '/assets/characters/cowboy_idle.png',
    actionSprite: '/assets/characters/cowboy_action.png',
    seatPercentX: 18,
    seatPercentY: 59,
    scale: 1.05,
  },
  {
    id: 'plague',
    name: 'Bác Sĩ Dịch Hạch',
    title: 'Thầy Thuốc Mỏ Quạ',
    roleHint: 'Bí hiểm, có khả năng cứu rỗi hoặc gieo rắc độc dược',
    quote: '"Cái chết là phương thuốc duy nhất thanh tẩy sự dối trá."',
    idleSprite: '/assets/characters/plague_idle.png',
    actionSprite: '/assets/characters/plague_action.png',
    seatPercentX: 37,
    seatPercentY: 54,
    scale: 0.98,
  },
  {
    id: 'dog',
    name: 'Quý Ngài Beagle',
    title: 'Trùm Cờ Bạc Đen',
    roleHint: 'Lão làng, bình tĩnh hút xì gà đọc vị mọi đối thủ',
    quote: '"Một ván bài đẹp không cần may mắn, chỉ cần đối thủ sơ hở."',
    idleSprite: '/assets/characters/dog_idle.png',
    actionSprite: '/assets/characters/dog_action.png',
    seatPercentX: 59,
    seatPercentY: 54,
    scale: 0.94,
  },
  {
    id: 'wolf',
    name: 'Fenrir Sói Xám',
    title: 'Ma Sói Khát Máu',
    roleHint: 'Sát thủ bóng đêm, che giấu thân phận dưới áo choàng rách',
    quote: '"Khi ánh trăng lên, máu sẽ nhuộm đỏ mặt bàn gỗ này!"',
    idleSprite: '/assets/characters/wolf_idle.png',
    actionSprite: '/assets/characters/wolf_action.png',
    seatPercentX: 74,
    seatPercentY: 48,
    scale: 1.02,
  },
  {
    id: 'girl',
    name: 'Elena Dân Làng',
    title: 'Thiếu Nữ May Mắn',
    roleHint: 'Trực giác nhạy bén, cảnh giác với mọi ánh nhìn',
    quote: '"Làm ơn... tôi chỉ muốn sống sót rời khỏi quán rượu này thôi."',
    idleSprite: '/assets/characters/girl_idle.png',
    actionSprite: '/assets/characters/girl_action.png',
    seatPercentX: 86,
    seatPercentY: 60,
    scale: 0.96,
  },
];

export interface LiarsBar3DProps {
  room?: ClientRoomView | any;
  currentPlayerId?: string;
  isPov2?: boolean;
  setIsPov2?: (v: boolean | ((p: boolean) => boolean)) => void;
  onAimAtPlayer?: (targetId: string, nickname: string) => void;
  onShootPlayer?: (targetId: string, nickname: string) => void;
  onPlayCard?: (cardName: string) => void;
  onSpinChamber?: () => void;
  onPullRouletteTrigger?: () => boolean;
}

export function LiarsBar3DExperience({
  room,
  currentPlayerId,
  isPov2,
  setIsPov2,
  onAimAtPlayer,
  onShootPlayer,
  onPlayCard,
  onSpinChamber,
  onPullRouletteTrigger,
}: LiarsBar3DProps) {
  // 1. User Selected Character
  const [selectedCharId, setSelectedCharId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('werewolf_selected_character') || 'cowboy';
    }
    return 'cowboy';
  });
  const [charSelectOpen, setCharSelectOpen] = useState(false);

  // 2. Weapon & Targeting States
  const [isAimingGun, setIsAimingGun] = useState(false);
  const [hoveredTargetId, setHoveredTargetId] = useState<string | null>(null);
  const [revolverFired, setRevolverFired] = useState(false);
  const [shotTargetId, setShotTargetId] = useState<string | null>(null);
  const [rouletteOpen, setRouletteOpen] = useState(false);
  const [chamberSlot, setChamberSlot] = useState(1);
  const [bulletLoadedSlot] = useState(() => Math.floor(Math.random() * 6) + 1);
  const [rouletteResult, setRouletteResult] = useState<string | null>(null);

  // 3. Parallax Camera Coordinates (Smooth 2.5D Mouse Look)
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // 4. Player Cards in Hand
  const [handCards, setHandCards] = useState([
    { id: 1, name: 'DÂN LÀNG', type: 'village', icon: '🧑‍🌾' },
    { id: 2, name: 'TIÊN TRI', type: 'seer', icon: '🔮' },
    { id: 3, name: 'BẢO VỆ', type: 'guard', icon: '🛡️' },
    { id: 4, name: 'PHIẾU TRẮNG', type: 'skip', icon: '🕊️' },
    { id: 5, name: 'QUỶ ÁM', type: 'devil', icon: '🃏' },
  ]);
  const [inspectedCard, setInspectedCard] = useState<number | null>(null);
  const [playedCards, setPlayedCards] = useState<Array<{ id: number; name: string; x: number; y: number; rot: number }>>([]);

  // Active Accused / Target in Room
  const accusedId = room?.day?.accusedId || null;

  // Handle Mouse Parallax
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 -> 0.5
    const normY = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 -> 0.5
    setParallax({
      x: normX * 24, // max 24px pan
      y: normY * 16, // max 16px tilt
    });
  };

  // Keyboard shortcut [R] to toggle gun
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'r' || e.key === 'R') {
        tavernAudio.playGunCock();
        setIsAimingGun((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Trigger Revolver Shot on a character
  const handleShootAtTarget = (targetChar: CharacterPreset) => {
    tavernAudio.playGunCock();
    setTimeout(() => {
      tavernAudio.playGunshot();
      setRevolverFired(true);
      setShotTargetId(targetChar.id);

      setTimeout(() => {
        setRevolverFired(false);
      }, 150);

      setTimeout(() => {
        setShotTargetId(null);
      }, 800);

      if (onShootPlayer) {
        onShootPlayer(targetChar.id, targetChar.name);
      }
    }, 100);
  };

  // Play card to table
  const handlePlayCard = (card: { id: number; name: string }) => {
    tavernAudio.playCardFlip();
    const randX = (Math.random() - 0.5) * 120;
    const randY = (Math.random() - 0.5) * 40;
    const randRot = (Math.random() - 0.5) * 45;

    setPlayedCards((prev) => [
      ...prev,
      { id: Date.now(), name: card.name, x: randX, y: randY, rot: randRot },
    ]);
    if (onPlayCard) onPlayCard(card.name);
  };

  // Russian Roulette Trigger
  const handlePullRouletteTrigger = () => {
    tavernAudio.playGunCock();
    setTimeout(() => {
      if (chamberSlot === bulletLoadedSlot) {
        tavernAudio.playGunshot();
        setRouletteResult('💥 BANG! BẠN ĐÃ TRÚNG ĐẠN!');
        setRevolverFired(true);
        setTimeout(() => setRevolverFired(false), 200);
      } else {
        tavernAudio.playGunCock();
        setRouletteResult('🕊️ CLICK! Ổ đạn rỗng, bạn an toàn!');
        setChamberSlot((prev) => (prev % 6) + 1);
      }
    }, 160);
  };

  // Characters shown at the table
  // In 1ST POV: All characters except your selected one (or all 5 if you want to see the complete artwork circle)
  // In 2ND POV: All 5 characters seated together around the table!
  const tableOpponents = useMemo(() => {
    if (isPov2) return CHARACTER_PRESETS;
    // In 1st POV, show the other 4 characters sitting opposite you
    return CHARACTER_PRESETS;
  }, [isPov2]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-screen h-screen overflow-hidden bg-[#06080d] select-none cursor-default font-geist"
    >
      {/* ==================== 1. TAVERN PARALLAX BACKGROUND (EMPTY TABLE) ==================== */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none transition-transform duration-100 ease-out"
        style={{
          transform: `scale(1.08) translate(${-parallax.x * 0.4}px, ${-parallax.y * 0.4}px)`,
        }}
      >
        <img
          src="/assets/tavern_bg.jpg"
          alt="Bàn cược Quán rượu Liar's Bar"
          className="w-full h-full object-cover object-center filter brightness-[0.95] contrast-[1.08]"
        />

        {/* Ambient Lantern Glow Pulsing in Center */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[500px] rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 50% 25%, rgba(251, 191, 36, 0.28) 0%, rgba(217, 119, 6, 0.12) 40%, transparent 70%)',
            animation: 'pulse 3.5s ease-in-out infinite alternate',
          }}
        />
      </div>

      {/* ==================== 2. SEATED CHARACTERS WITH REAL GAMEPLAY STATES ==================== */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          transform: `translate(${-parallax.x * 0.7}px, ${-parallax.y * 0.7}px)`,
        }}
      >
        {tableOpponents.map((char, idx) => {
          const isTargeted = hoveredTargetId === char.id;
          const isAccused = accusedId === char.id || (idx === 1 && !accusedId); // #02 LordVader demo
          const isShot = shotTargetId === char.id;
          const isMe = char.id === selectedCharId;

          // Switch between Idle Sprite and Action Sprite based on game events
          const currentSprite =
            isTargeted && isAimingGun
              ? char.actionSprite
              : isAccused
              ? char.actionSprite
              : char.idleSprite;

          return (
            <div
              key={char.id}
              onClick={() => {
                setHoveredTargetId(char.id);
                if (isAimingGun) {
                  handleShootAtTarget(char);
                } else if (onAimAtPlayer) {
                  onAimAtPlayer(char.id, char.name);
                }
              }}
              onMouseEnter={() => setHoveredTargetId(char.id)}
              onMouseLeave={() => setHoveredTargetId(null)}
              className="absolute pointer-events-auto cursor-pointer group transition-all duration-300"
              style={{
                left: `${char.seatPercentX}%`,
                top: `${char.seatPercentY}%`,
                transform: `translate(-50%, -50%) scale(${
                  char.scale * (isTargeted ? 1.05 : 1) * (isShot ? 0.94 : 1)
                })`,
                zIndex: Math.round(char.seatPercentY * 10),
              }}
            >
              {/* Target Reticle when Gun is Aimed */}
              {isAimingGun && isTargeted && (
                <div className="absolute inset-0 -m-8 border-2 border-dashed border-red-500 rounded-full animate-spin pointer-events-none shadow-[0_0_30px_rgba(239,68,68,0.9)]" />
              )}

              {/* Shot Blood/Flinch Effect */}
              {isShot && (
                <div className="absolute inset-0 bg-red-600/40 rounded-full animate-ping pointer-events-none" />
              )}

              {/* Character Floating Name & Status Badge */}
              <div
                className={`absolute -top-16 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-xl backdrop-blur-md border text-center transition-all shadow-2xl whitespace-nowrap ${
                  isAccused
                    ? 'bg-red-950/95 border-red-500 text-red-200 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.8)]'
                    : isTargeted
                    ? 'bg-amber-950/95 border-amber-400 text-amber-200 scale-110 shadow-[0_0_25px_rgba(251,191,36,0.6)]'
                    : isMe
                    ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200'
                    : 'bg-[#0f141f]/85 border-[#334155]/60 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isAccused
                        ? 'bg-red-500 animate-ping'
                        : isMe
                        ? 'bg-emerald-400'
                        : 'bg-amber-400'
                    }`}
                  />
                  <span className="font-space font-bold text-xs uppercase tracking-wider">
                    {char.name}
                  </span>
                  {isMe && (
                    <span className="px-1.5 py-0.2 rounded bg-emerald-700/80 text-[9px] font-bold text-white">
                      BẠN
                    </span>
                  )}
                </div>
                <span className="font-geist text-[10px] text-amber-300/80 block mt-0.5">
                  {char.title}
                </span>

                {isAimingGun && isTargeted && (
                  <span className="mt-1 px-2 py-0.5 rounded bg-red-600 text-white font-space text-[9px] font-bold block animate-bounce">
                    CLICK ĐỂ BẮN 💥
                  </span>
                )}
              </div>

              {/* Accusation / Chat Dialogue Bubble */}
              {isAccused && (
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-56 p-2.5 rounded-2xl bg-black/90 border border-red-500/80 text-white text-[11px] shadow-2xl font-geist text-center animate-bounce">
                  <span className="text-amber-400 font-bold block text-[10px] uppercase font-space">
                    ⚠️ ĐANG BỊ BUỘC TỘI
                  </span>
                  {char.quote}
                  <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-black border-r border-b border-red-500 rotate-45" />
                </div>
              )}

              {/* REAL HIGH-QUALITY CHARACTER SPRITE */}
              <div
                className="relative select-none"
                style={{
                  animation: `characterBreathe ${3 + idx * 0.4}s ease-in-out infinite alternate`,
                }}
              >
                <img
                  src={currentSprite}
                  alt={char.name}
                  className={`w-auto h-[380px] object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)] transition-all duration-200 ${
                    isShot ? 'brightness-150 contrast-125 saturate-200' : ''
                  }`}
                  draggable={false}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* ==================== 3. FOREGROUND PLAYED CARDS ON WOODEN TABLE ==================== */}
      <div
        className="absolute left-1/2 top-[66%] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
        style={{
          transform: `translate(calc(-50% - ${parallax.x * 0.9}px), calc(-50% - ${parallax.y * 0.9}px))`,
        }}
      >
        {playedCards.map((c) => (
          <div
            key={c.id}
            className="absolute w-20 h-28 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-gradient-to-b from-amber-900 via-stone-950 to-black border border-amber-500/90 shadow-[0_10px_30px_rgba(0,0,0,0.9)] flex flex-col items-center justify-center p-2 animate-fadeIn"
            style={{
              left: `${c.x}px`,
              top: `${c.y}px`,
              transform: `rotate(${c.rot}deg)`,
            }}
          >
            <span className="text-2xl">📜</span>
            <span className="font-space text-[10px] font-bold text-amber-300 text-center uppercase mt-1">
              {c.name}
            </span>
          </div>
        ))}
      </div>

      {/* ==================== 4. MUZZLE FLASH ON SHOT ==================== */}
      {revolverFired && (
        <div className="fixed inset-0 z-50 bg-white/45 pointer-events-none animate-ping" />
      )}

      {/* ==================== 5. RETICLE WHEN AIMING GUN ==================== */}
      {isAimingGun && (
        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-red-500/90 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.9)]">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          </div>
          <div className="absolute w-16 h-[1.5px] bg-red-500/80" />
          <div className="absolute h-16 w-[1.5px] bg-red-500/80" />
        </div>
      )}

      {/* ==================== 6. BOTTOM HUD: TAROT CARDS ON HAND & WEAPON ==================== */}
      <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none flex items-end justify-between px-8 pb-3">
        {/* CARDS FAN ON HAND */}
        <div className="pointer-events-auto relative flex items-end -space-x-8 mb-2">
          {handCards.map((card, idx) => {
            const isHovered = inspectedCard === card.id;
            const tilt = (idx - 2) * 6;
            const translateY = isHovered ? -40 : 0;

            return (
              <div
                key={card.id}
                onMouseEnter={() => {
                  setInspectedCard(card.id);
                  tavernAudio.playCardFlip();
                }}
                onMouseLeave={() => setInspectedCard(null)}
                onClick={() => handlePlayCard(card)}
                className="relative cursor-pointer transition-all duration-300 ease-out group"
                style={{
                  transform: `translateY(${translateY}px) rotate(${tilt}deg) scale(${
                    isHovered ? 1.15 : 1
                  })`,
                  transformOrigin: 'bottom center',
                  zIndex: isHovered ? 50 : idx + 10,
                }}
              >
                <div
                  className={`w-32 h-48 rounded-2xl p-3 border flex flex-col justify-between backdrop-blur-xl transition-all shadow-2xl ${
                    isHovered
                      ? 'bg-gradient-to-t from-amber-950 via-slate-900 to-amber-900/90 border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.6)]'
                      : 'bg-gradient-to-t from-slate-950 via-slate-900 to-slate-800/90 border-slate-700/80 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-space font-bold uppercase text-amber-400">
                    <span>{card.type}</span>
                    <span>{card.icon}</span>
                  </div>

                  <div className="text-center my-auto">
                    <span className="text-4xl block group-hover:scale-125 transition-transform">
                      {card.icon}
                    </span>
                    <span className="font-space font-bold text-xs uppercase tracking-wider block mt-2 text-white">
                      {card.name}
                    </span>
                  </div>

                  <div className="text-center">
                    <span className="text-[9px] font-geist text-slate-400 block group-hover:text-amber-300">
                      {isHovered ? 'CLICK ĐỂ ĐÁNH' : 'LÁ BÀI TRÊN TAY'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CONTROLS: CHARACTER SELECTION, ROULETTE, REVOLVER */}
        <div className="pointer-events-auto flex items-center gap-3">
          {/* Change Character Button */}
          <button
            onClick={() => setCharSelectOpen(true)}
            className="px-4 py-3 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-amber-500/80 text-amber-300 font-space font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            <span>🎭</span>
            <span>ĐỔI NHÂN VẬT</span>
          </button>

          {/* Russian Roulette Button */}
          <button
            onClick={() => {
              tavernAudio.playCylinderSpin();
              setRouletteOpen(true);
            }}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-red-950 to-stone-900 border border-red-500/80 hover:border-red-400 text-red-200 hover:text-white font-space font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_25px_rgba(220,38,38,0.4)] transition-all hover:scale-105 active:scale-95"
          >
            <span>🎲</span>
            <span>CÒ SÚNG NGA (1/6)</span>
          </button>

          {/* Raise / Lower Revolver */}
          <button
            onClick={() => {
              tavernAudio.playGunCock();
              setIsAimingGun((prev) => !prev);
            }}
            className={`px-6 py-3 rounded-xl border font-space font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-2xl transition-all hover:scale-105 active:scale-95 ${
              isAimingGun
                ? 'bg-red-600 border-red-400 text-white shadow-[0_0_30px_rgba(239,68,68,0.8)] animate-pulse'
                : 'bg-stone-900/90 border-amber-500/80 text-amber-300 hover:border-amber-400 hover:bg-stone-800'
            }`}
          >
            <span>🔫</span>
            <span>{isAimingGun ? 'HẠ SÚNG [R]' : 'RÚT SÚNG [R]'}</span>
          </button>
        </div>
      </div>

      {/* ==================== 7. CHARACTER SELECTION MODAL ==================== */}
      {charSelectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative w-full max-w-4xl bg-stone-950 border border-amber-500/80 rounded-2xl p-6 shadow-[0_0_80px_rgba(245,158,11,0.4)] font-geist">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div>
                <h3 className="font-space font-black text-2xl text-amber-400 uppercase tracking-wider">
                  🎭 CHỌN NHÂN VẬT CỦA BẠN
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Chọn nhân vật đại diện cho bạn tại bàn cược Liar's Bar
                </p>
              </div>
              <button
                onClick={() => setCharSelectOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-slate-300 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-5 gap-3">
              {CHARACTER_PRESETS.map((char) => {
                const isSelected = selectedCharId === char.id;
                return (
                  <div
                    key={char.id}
                    onClick={() => {
                      setSelectedCharId(char.id);
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('werewolf_selected_character', char.id);
                      }
                      tavernAudio.playCardFlip();
                      setCharSelectOpen(false);
                    }}
                    className={`cursor-pointer rounded-2xl border p-3 flex flex-col items-center justify-between text-center transition-all duration-300 group hover:scale-105 ${
                      isSelected
                        ? 'bg-gradient-to-t from-amber-950 to-stone-900 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.6)]'
                        : 'bg-stone-900/60 border-stone-800 hover:border-amber-500/60 hover:bg-stone-900'
                    }`}
                  >
                    <div className="w-full h-44 overflow-hidden rounded-xl bg-black/40 mb-3 flex items-center justify-center">
                      <img
                        src={char.idleSprite}
                        alt={char.name}
                        className="w-full h-full object-contain filter group-hover:brightness-110 transition-all"
                      />
                    </div>
                    <span className="font-space font-bold text-xs text-white uppercase block">
                      {char.name}
                    </span>
                    <span className="text-[10px] text-amber-400 font-semibold block mb-2">
                      {char.title}
                    </span>
                    <p className="text-[9px] text-slate-400 leading-tight mb-3">
                      {char.roleHint}
                    </p>
                    <span
                      className={`w-full py-1.5 rounded-lg font-space text-[10px] font-bold uppercase transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-black shadow'
                          : 'bg-stone-800 group-hover:bg-amber-600 group-hover:text-white text-slate-300'
                      }`}
                    >
                      {isSelected ? '✓ ĐANG CHỌN' : 'CHỌN'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================== 8. RUSSIAN ROULETTE MODAL ==================== */}
      {rouletteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative w-full max-w-md bg-stone-950 border border-red-600/80 rounded-2xl p-6 shadow-[0_0_60px_rgba(220,38,38,0.5)] text-center font-geist">
            <h3 className="font-space font-black text-xl text-red-400 tracking-wider uppercase mb-1">
              🎲 CÒ QUAY NGA — RUSSIAN ROULETTE
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Ổ đạn 6 lỗ có đúng 1 viên đạn. Thử vận may của bạn!
            </p>

            <div className="relative w-44 h-44 mx-auto mb-6 flex items-center justify-center">
              <div className="w-36 h-36 rounded-full bg-stone-900 border-2 border-stone-700 flex items-center justify-center relative">
                {[1, 2, 3, 4, 5, 6].map((slot) => {
                  const ang = ((slot - 1) / 6) * Math.PI * 2;
                  const x = Math.sin(ang) * 45;
                  const y = -Math.cos(ang) * 45;
                  const isCurrent = slot === chamberSlot;

                  return (
                    <div
                      key={slot}
                      className={`absolute w-7 h-7 rounded-full border flex items-center justify-center text-xs font-space font-bold transition-all ${
                        isCurrent
                          ? 'bg-red-600 border-red-300 text-white scale-125 shadow-[0_0_15px_rgba(239,68,68,1)]'
                          : 'bg-stone-800 border-stone-600 text-slate-400'
                      }`}
                      style={{ transform: `translate(${x}px, ${y}px)` }}
                    >
                      {slot}
                    </div>
                  );
                })}
                <span className="text-2xl">💀</span>
              </div>
            </div>

            {rouletteResult && (
              <div
                className={`p-3 rounded-xl mb-4 font-space font-bold text-sm uppercase ${
                  rouletteResult.includes('BANG')
                    ? 'bg-red-950/90 border border-red-500 text-red-200 animate-bounce'
                    : 'bg-emerald-950/90 border border-emerald-500 text-emerald-200'
                }`}
              >
                {rouletteResult}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  tavernAudio.playCylinderSpin();
                  setChamberSlot((prev) => (prev % 6) + 1);
                  setRouletteResult(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-600 text-slate-200 font-space text-xs font-bold uppercase transition-all"
              >
                🔄 XOAY Ổ ĐẠN
              </button>
              <button
                onClick={handlePullRouletteTrigger}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-space text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(239,68,68,0.7)]"
              >
                💥 BÓP CÒ
              </button>
              <button
                onClick={() => setRouletteOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-slate-400 font-space text-xs font-bold uppercase"
              >
                ĐÓNG
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Keyframe Animations for Natural Breathing */}
      <style jsx global>{`
        @keyframes characterBreathe {
          0% {
            transform: translateY(0px) scale(1);
          }
          100% {
            transform: translateY(-4px) scale(1.008);
          }
        }
      `}</style>
    </div>
  );
}

export default LiarsBar3DExperience;
