'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ClientRoomView } from '@werewolf/shared';

// ============================================================================
// 1. TAVERN WEB AUDIO SYNTHESIZER (IMMERSIVE SFX)
// ============================================================================
class TavernAudioEngine {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  // Tiếng lên búa súng / cocking
  public playGunCock() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(750, now);
    osc.frequency.exponentialRampToValueAtTime(1550, now + 0.08);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  // Tiếng xoay ổ đạn 6 lỗ
  public playCylinderSpin() {
    this.init();
    if (!this.ctx) return;
    for (let i = 0; i < 7; i++) {
      const t = this.ctx.currentTime + i * 0.04;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1100 + i * 65, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.02);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.02);
    }
  }

  // Tiếng bóp cò khan (Dry fire - Russian Roulette trống)
  public playDryFire() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Tiếng súng nổ vang rền quán rượu (Gunshot with Tavern Reverb)
  public playGunshot() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.65;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600, now);
    filter.frequency.exponentialRampToValueAtTime(40, now + 0.55);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(1.0, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + 0.6);
  }

  // Tiếng lật / ném bài lên thảm nỉ
  public playCardFlip() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.06);
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }
}

const tavernAudio = new TavernAudioEngine();

// ============================================================================
// 2. DYNAMIC MOBSTER CHARACTERS AT POKER TABLE
// ============================================================================
export interface TableOpponent {
  id: string;
  seatNumber: number;
  nickname: string;
  roleHint: string;
  isDead: boolean;
  votes: number;
  xPercent: number; // Tọa độ X trên ảnh bàn rỗng (%)
  yPercent: number; // Tọa độ Y trên ảnh bàn rỗng (%)
  idleImg: string;
  actionImg: string;
  dialogue?: string;
}

// 2 Trùm Mafia Ngồi Bàn Đối Đầu Cực Nét (Tách nền độc lập)
const UE5_MOBSTER_OPPONENTS: TableOpponent[] = [
  {
    id: 'rhino',
    seatNumber: 1,
    nickname: '#01 TRÙM TÊ GIÁC',
    roleHint: 'Tê Giác Mafia Hawaii',
    isDead: false,
    votes: 1,
    xPercent: 30,
    yPercent: 49,
    idleImg: '/assets/characters_ue5/rhino_idle.png',
    actionImg: '/assets/characters_ue5/rhino_action.png',
    dialogue: 'Hai đứa mày đừng hòng qua mặt tao. Tao có 3 lá Át!',
  },
  {
    id: 'wolf',
    seatNumber: 2,
    nickname: '#02 SÁT THỦ SÓI',
    roleHint: 'Sát Thủ Sói Mobster',
    isDead: false,
    votes: 2,
    xPercent: 70,
    yPercent: 49,
    idleImg: '/assets/characters_ue5/wolf_idle.png',
    actionImg: '/assets/characters_ue5/wolf_aiming.png',
    dialogue: 'Cứ thử bóp cò đi, xem đứa nào nằm xuống trước!',
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
}: LiarsBar3DProps) {
  // 1. Góc nhìn Parallax Camera
  const [cameraPan, setCameraPan] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // 2. Trạng thái Súng & Tác Chiến
  const [isAimingGun, setIsAimingGun] = useState(false);
  const [hoveredTargetId, setHoveredTargetId] = useState<string | null>(null);
  const [revolverFired, setRevolverFired] = useState(false);
  const [recoilKick, setRecoilKick] = useState(false);
  const [shotTargetId, setShotTargetId] = useState<string | null>(null);

  // 3. Trạng thái đối thủ sống/chết cục bộ
  const [opponents, setOpponents] = useState<TableOpponent[]>(UE5_MOBSTER_OPPONENTS);

  // 4. Cò Súng Nga (Russian Roulette 1/6)
  const [rouletteOpen, setRouletteOpen] = useState(false);
  const [chamberSlot, setChamberSlot] = useState(1);
  const [bulletLoadedSlot] = useState(() => Math.floor(Math.random() * 6) + 1);
  const [rouletteResult, setRouletteResult] = useState<string | null>(null);

  // 5. Bài trên tay người chơi (Tarot / Poker Fan)
  const [handCards] = useState([
    { id: 1, name: 'TIÊN TRI', sub: 'SOI ĐÊM', type: 'seer', icon: '🔮', desc: 'Tìm diệt Ma Sói trong làng' },
    { id: 2, name: 'TREO CỔ', sub: '#02 SÁT THỦ SÓI', type: 'verdict', icon: '⚖️', desc: '3/5 Phiếu phán quyết' },
    { id: 3, name: 'DÂN LÀNG', sub: 'LƯƠNG THIỆN', type: 'village', icon: '🧑‍🌾', desc: 'Bầu chọn treo cổ kẻ ác' },
    { id: 4, name: 'PHIẾU TRẮNG', sub: 'TRUNG LẬP', type: 'skip', icon: '🕊️', desc: 'Từ chối phán quyết' },
  ]);
  const [inspectedCardId, setInspectedCardId] = useState<number | null>(null);

  // 6. Bài đã đánh ra giữa bàn nỉ
  const [playedCards, setPlayedCards] = useState<Array<{ id: number; name: string; x: number; y: number; rot: number }>>([
    { id: 101, name: 'HỘI ĐỒNG MA SÓI', x: -35, y: -10, rot: -8 },
    { id: 102, name: 'PHÁN QUYẾT TREO CỔ', x: 0, y: -18, rot: 4 },
    { id: 103, name: 'TIÊN TRI SOI ĐÊM', x: 40, y: -8, rot: 14 },
  ]);

  const accusedId = room?.day?.accusedId || 'wolf';

  // Xử lý di chuột xoay góc nhìn 3D (FPS Mouse Look Parallax)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / rect.width - 0.5;
    const normY = (e.clientY - rect.top) / rect.height - 0.5;

    setCameraPan({
      x: normX * 30,
      y: normY * 18,
    });
  };

  // Phím tắt [R] giơ / hạ súng; [F] xoay ổ đạn
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'r' || e.key === 'R') {
        tavernAudio.playGunCock();
        setIsAimingGun((prev) => !prev);
      }
      if (e.key === 'f' || e.key === 'F') {
        tavernAudio.playCylinderSpin();
        setChamberSlot((prev) => (prev % 6) + 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Bắn súng vào đối thủ
  const handleFireAtOpponent = (target: TableOpponent) => {
    if (target.isDead) return;

    tavernAudio.playGunCock();
    setTimeout(() => {
      tavernAudio.playGunshot();
      setRevolverFired(true);
      setRecoilKick(true);
      setShotTargetId(target.id);

      setTimeout(() => setRevolverFired(false), 90);
      setTimeout(() => setRecoilKick(false), 240);

      // Đối thủ trúng đạn và ngã gục
      setTimeout(() => {
        setOpponents((prev) =>
          prev.map((o) => (o.id === target.id ? { ...o, isDead: true } : o))
        );
        setShotTargetId(null);
      }, 700);

      if (onShootPlayer) {
        onShootPlayer(target.id, target.nickname);
      }
    }, 60);
  };

  // Đánh bài ra giữa bàn
  const handlePlayCardToTable = (card: { id: number; name: string }) => {
    tavernAudio.playCardFlip();
    const randX = (Math.random() - 0.5) * 70;
    const randY = (Math.random() - 0.5) * 25;
    const randRot = (Math.random() - 0.5) * 35;

    setPlayedCards((prev) => [
      ...prev,
      { id: Date.now(), name: card.name, x: randX, y: randY, rot: randRot },
    ]);

    if (onPlayCard) onPlayCard(card.name);
  };

  // Bóp cò súng Nga (Russian Roulette)
  const handlePullRouletteTrigger = () => {
    tavernAudio.playGunCock();
    setTimeout(() => {
      if (chamberSlot === bulletLoadedSlot) {
        tavernAudio.playGunshot();
        setRevolverFired(true);
        setRecoilKick(true);
        setRouletteResult('💥 BANG! BẠN ĐÃ TRÚNG ĐẠN VÀ TỬ TRẬN!');
        setTimeout(() => {
          setRevolverFired(false);
          setRecoilKick(false);
        }, 300);
      } else {
        tavernAudio.playDryFire();
        setRouletteResult('✨ CLICK! Ổ ĐẠN TRỐNG, BẠN VẪN SỐNG SÓT!');
        setChamberSlot((prev) => (prev % 6) + 1);
      }
    }, 120);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onClick={() => {
        if (isAimingGun && hoveredTargetId) {
          const target = opponents.find((o) => o.id === hoveredTargetId);
          if (target) handleFireAtOpponent(target);
        }
      }}
      className="relative w-full h-full overflow-hidden bg-black select-none cursor-crosshair"
    >
      {/* ==================== 1. FPS 3D VIEWPORT (TABLE & CHARACTERS) ==================== */}
      <div
        className={`absolute inset-0 w-full h-full pointer-events-none transition-transform duration-100 ease-out ${
          recoilKick ? '-translate-y-8 rotate-1 scale-[1.05]' : ''
        }`}
        style={{
          transform: `perspective(1000px) rotateX(${cameraPan.y * 0.22}deg) rotateY(${
            -cameraPan.x * 0.22
          }deg) scale(${isPov2 ? 1.12 : 1.05}) translate3d(${cameraPan.x * -0.25}px, ${
            cameraPan.y * -0.18
          }px, 0)`,
          transformOrigin: 'center center',
        }}
      >
        {/* Layer 0: High-Resolution Unreal Engine 5 EMPTY Poker Table Background */}
        <img
          src="/assets/ue5_empty_poker_table.jpg"
          alt="Bàn cược rỗng Liar's Bar FPS View"
          className="w-full h-full object-cover object-center filter brightness-[0.98] contrast-[1.12] drop-shadow-2xl"
        />

        {/* Layer 1: Volumetric Overhead Lantern Light Cone */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[760px] h-[600px] pointer-events-none rounded-full"
          style={{
            background:
              'radial-gradient(circle at 50% 25%, rgba(251, 191, 36, 0.28) 0%, rgba(217, 119, 6, 0.1) 45%, transparent 74%)',
            animation: 'lampFlicker 3.5s ease-in-out infinite alternate',
            transform: `translate(${cameraPan.x * 0.35}px, ${cameraPan.y * 0.25}px)`,
          }}
        />

        {/* Layer 2: INDEPENDENT DYNAMIC MOBSTER CHARACTERS SEATED AT TABLE */}
        {opponents.map((opp) => {
          const isTargeted = hoveredTargetId === opp.id;
          const isAccused = accusedId === opp.id;
          const isShot = shotTargetId === opp.id;
          const showActionPose = isAccused || isTargeted || isShot;

          return (
            <div
              key={opp.id}
              onClick={(e) => {
                e.stopPropagation();
                setHoveredTargetId(opp.id);
                if (isAimingGun) {
                  handleFireAtOpponent(opp);
                } else if (onAimAtPlayer) {
                  onAimAtPlayer(opp.id, opp.nickname);
                }
              }}
              onMouseEnter={() => {
                setHoveredTargetId(opp.id);
                tavernAudio.playCardFlip();
              }}
              onMouseLeave={() => setHoveredTargetId(null)}
              className="absolute pointer-events-auto cursor-pointer group"
              style={{
                left: `${opp.xPercent}%`,
                top: `${opp.yPercent}%`,
                transform: 'translate(-50%, -50%)',
                width: opp.id === 'rhino' ? '330px' : '290px',
                height: '420px',
                zIndex: isTargeted ? 25 : 15,
              }}
            >
              {/* Dynamic Animated Character Sprite */}
              <div
                className={`relative w-full h-full transition-all duration-500 ease-out ${
                  opp.isDead
                    ? 'translate-y-48 rotate-12 opacity-0 grayscale'
                    : isShot
                    ? 'scale-95 translate-y-6 brightness-150 rotate-3'
                    : isTargeted
                    ? 'scale-105 -translate-y-2'
                    : 'mobster-breathing'
                }`}
              >
                <img
                  src={showActionPose && !opp.isDead ? opp.actionImg : opp.idleImg}
                  alt={opp.nickname}
                  className={`w-full h-full object-contain object-bottom filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)] transition-all duration-300 ${
                    isTargeted ? 'brightness-110 drop-shadow-[0_0_35px_rgba(251,191,36,0.6)]' : ''
                  }`}
                />

                {/* Subtle Cigarette Smoke Effect for Wolf */}
                {opp.id === 'wolf' && !opp.isDead && (
                  <div className="absolute top-12 right-24 w-8 h-16 pointer-events-none opacity-60 animate-pulse">
                    <div className="w-2 h-10 bg-gradient-to-t from-slate-400/40 to-transparent blur-sm rotate-12" />
                  </div>
                )}
              </div>

              {/* Laser Reticle when Gun is Aimed */}
              {isAimingGun && isTargeted && !opp.isDead && (
                <div className="absolute inset-0 -m-4 border-2 border-dashed border-red-500 rounded-full animate-spin pointer-events-none shadow-[0_0_30px_rgba(239,68,68,0.9)]" />
              )}

              {/* Blood Impact Decal when Shot */}
              {isShot && (
                <div className="absolute inset-0 flex items-center justify-center animate-ping pointer-events-none">
                  <div className="w-24 h-24 rounded-full bg-red-600/80 blur-md" />
                </div>
              )}

              {/* Dialogue Bubble */}
              {opp.dialogue && !opp.isDead && (
                <div
                  className={`absolute -top-16 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-2xl transition-all pointer-events-none whitespace-nowrap text-center max-w-[260px] ${
                    isAccused
                      ? 'bg-red-950/95 border-red-500 text-red-200 animate-bounce'
                      : 'bg-black/85 border-amber-500/50 text-amber-200'
                  }`}
                >
                  <p className="font-space text-[10px] font-bold leading-tight line-clamp-2">
                    &ldquo;{opp.dialogue}&rdquo;
                  </p>
                </div>
              )}

              {/* Opponent Status Tag (Pinned above head) */}
              <div
                className={`absolute -top-6 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-xl backdrop-blur-md border text-center transition-all whitespace-nowrap shadow-2xl ${
                  opp.isDead
                    ? 'bg-stone-900/90 border-stone-700 text-stone-500 line-through opacity-75'
                    : isAccused
                    ? 'bg-red-950/95 border-red-500 text-red-200 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.8)]'
                    : isTargeted
                    ? 'bg-amber-950/95 border-amber-400 text-amber-200 scale-105 shadow-[0_0_25px_rgba(251,191,36,0.6)]'
                    : 'bg-[#0b0f17]/90 border-white/15 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      opp.isDead
                        ? 'bg-stone-500'
                        : isAccused
                        ? 'bg-red-500 animate-ping'
                        : isTargeted
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                  />
                  <span className="font-space font-bold text-[10px] uppercase tracking-wider">
                    {opp.nickname}
                  </span>
                  {opp.votes > 0 && (
                    <span className="px-1.5 py-0.2 rounded bg-red-600 text-white font-mono font-bold text-[9px]">
                      {opp.votes} PHIẾU
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Layer 3: Physical Played Cards Placed on Green Table Felt */}
        <div className="absolute top-[62%] left-1/2 -translate-x-1/2 pointer-events-auto flex items-center justify-center gap-4 z-20">
          {playedCards.map((c) => (
            <div
              key={c.id}
              className="relative w-16 h-24 bg-gradient-to-br from-amber-100 via-stone-200 to-amber-200/90 rounded-lg border-2 border-stone-800 shadow-[0_12px_24px_rgba(0,0,0,0.85)] flex flex-col items-center justify-between p-1.5 cursor-pointer hover:scale-110 hover:-translate-y-2 transition-all group"
              style={{
                transform: `rotate(${c.rot}deg)`,
              }}
              onClick={() => tavernAudio.playCardFlip()}
            >
              <span className="text-amber-700 text-xs font-space font-bold">★</span>
              <span className="text-xl">📜</span>
              <span className="font-space text-[7px] font-bold text-stone-900 text-center uppercase leading-tight">
                {c.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ==================== 2. MUZZLE FLASH ON GUNSHOT ==================== */}
      {revolverFired && (
        <div className="fixed inset-0 z-50 bg-white/70 pointer-events-none animate-ping" />
      )}

      {/* ==================== 3. FPS AIMING RETICLE ==================== */}
      {isAimingGun && (
        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-red-500/90 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.9)]">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          </div>
          <div className="absolute w-16 h-[1.5px] bg-red-500/80" />
          <div className="absolute h-16 w-[1.5px] bg-red-500/80" />
        </div>
      )}

      {/* ==================== 4. FIRST-PERSON VIEW: PLAYER'S HANDS OR REVOLVER ==================== */}
      {/* 4A. PLAYER'S FOREGROUND FURRY PAWS HOLDING PLAYING CARDS */}
      <div
        className={`absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none z-25 transition-transform duration-300 ease-out ${
          isAimingGun ? 'translate-y-80 opacity-0' : 'translate-y-0 opacity-100'
        }`}
        style={{
          transform: `translateX(-50%) translate(${cameraPan.x * 0.15}px, ${cameraPan.y * 0.1}px)`,
        }}
      >
        <img
          src="/assets/characters_ue5/player_fps_cards.png"
          alt="Player FPS Cards"
          className="w-[560px] max-w-none object-contain filter drop-shadow-[0_-15px_30px_rgba(0,0,0,0.95)]"
        />
      </div>

      {/* 4B. PLAYER'S FOREGROUND HEAVY SNUB-NOSED REVOLVER (RAISES ON [R]) */}
      <div
        className={`absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none z-30 transition-all duration-300 ease-out ${
          isAimingGun ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-full opacity-0 scale-90'
        } ${recoilKick ? '-translate-y-12 rotate-[-6deg]' : ''}`}
        style={{
          transform: `translateX(-50%) translate(${cameraPan.x * 0.1}px, ${cameraPan.y * 0.08}px)`,
        }}
      >
        <img
          src="/assets/characters_ue5/player_fps_revolver.png"
          alt="Player FPS Revolver"
          className="w-[540px] max-w-none object-contain filter drop-shadow-[0_-20px_40px_rgba(0,0,0,0.95)]"
        />
      </div>

      {/* 4C. INTERACTIVE CARDS FAN (HOVER & CLICK TO PLAY) */}
      {!isAimingGun && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-35 pointer-events-none flex items-end justify-center">
          <div className="pointer-events-auto relative flex items-end -space-x-8 mb-2">
            {handCards.map((card, idx) => {
              const isHovered = inspectedCardId === card.id;
              const tilt = (idx - 1.5) * 6;
              const translateY = isHovered ? -42 : 0;

              return (
                <div
                  key={card.id}
                  onMouseEnter={() => {
                    setInspectedCardId(card.id);
                    tavernAudio.playCardFlip();
                  }}
                  onMouseLeave={() => setInspectedCardId(null)}
                  onClick={() => handlePlayCardToTable(card)}
                  className="relative cursor-pointer transition-all duration-300 ease-out group"
                  style={{
                    transform: `translateY(${translateY}px) rotate(${tilt}deg) scale(${
                      isHovered ? 1.18 : 1
                    })`,
                    transformOrigin: 'bottom center',
                    zIndex: isHovered ? 60 : idx + 10,
                  }}
                >
                  <div
                    className={`w-32 h-48 rounded-2xl p-2.5 border flex flex-col justify-between backdrop-blur-xl transition-all shadow-2xl ${
                      isHovered
                        ? 'bg-gradient-to-t from-amber-950 via-slate-900 to-amber-900/95 border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.7)]'
                        : 'bg-gradient-to-t from-slate-950/95 via-slate-900/95 to-slate-800/90 border-slate-700/80 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-space font-bold uppercase text-amber-400">
                      <span>{card.type}</span>
                      <span>{card.icon}</span>
                    </div>

                    <div className="text-center my-auto">
                      <span className="text-3xl block group-hover:scale-125 transition-transform">
                        {card.icon}
                      </span>
                      <span className="font-space font-bold text-xs uppercase tracking-wider block mt-1.5 text-white">
                        {card.name}
                      </span>
                      <span className="text-[9px] font-mono text-amber-300/80 block mt-0.5">
                        {card.sub}
                      </span>
                    </div>

                    <div className="text-center">
                      <span className="text-[8px] font-geist text-slate-400 block group-hover:text-amber-300">
                        {isHovered ? 'CLICK ĐỂ ĐÁNH BÀI' : card.desc}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== 5. BOTTOM CONTROLS & WEAPON ACTIONS ==================== */}
      <div className="absolute bottom-4 right-6 z-40 pointer-events-auto flex items-center gap-2.5">
        {/* Nút Cò Súng Nga */}
        <button
          onClick={() => {
            tavernAudio.playCylinderSpin();
            setRouletteOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-950 to-stone-900 border border-red-500/80 hover:border-red-400 text-red-200 hover:text-white font-space font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all hover:scale-105 active:scale-95"
        >
          <span>🎲</span>
          <span>CÒ SÚNG NGA (1/6)</span>
        </button>

        {/* Nút Rút / Hạ Súng [R] */}
        <button
          onClick={() => {
            tavernAudio.playGunCock();
            setIsAimingGun((prev) => !prev);
          }}
          className={`px-5 py-2.5 rounded-xl border font-space font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 shadow-2xl transition-all hover:scale-105 active:scale-95 ${
            isAimingGun
              ? 'bg-red-600 border-red-400 text-white shadow-[0_0_30px_rgba(239,68,68,0.8)] animate-pulse'
              : 'bg-stone-900/90 border-amber-500/80 text-amber-300 hover:border-amber-400 hover:bg-stone-800'
          }`}
        >
          <span>🔫</span>
          <span>{isAimingGun ? 'HẠ SÚNG [R]' : 'RÚT SÚNG [R]'}</span>
        </button>
      </div>

      {/* ==================== 6. RUSSIAN ROULETTE MODAL ==================== */}
      {rouletteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative w-full max-w-md bg-stone-950 border border-red-600/80 rounded-2xl p-6 shadow-[0_0_60px_rgba(220,38,38,0.5)] text-center font-geist">
            <h3 className="font-space font-black text-xl text-red-400 tracking-wider uppercase mb-1">
              🎲 CÒ QUAY NGA — RUSSIAN ROULETTE
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Ổ đạn 6 lỗ có đúng 1 viên đạn. Thử vận may của bạn!
            </p>

            {/* Cylinder Graphic */}
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
                🔄 XOAY Ổ ĐẠN [F]
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

      {/* Mobster Breathing and Lighting Keyframes */}
      <style jsx global>{`
        @keyframes mobsterBreathing {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-8px) scale(1.012);
          }
        }
        .mobster-breathing {
          animation: mobsterBreathing 3.6s ease-in-out infinite alternate;
        }
        @keyframes lampFlicker {
          0% {
            opacity: 0.85;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.9;
          }
        }
      `}</style>
    </div>
  );
}

export default LiarsBar3DExperience;
