'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ClientRoomView } from '@werewolf/shared';

// Synthesizer Web Audio API cho âm thanh tương tác Liar's Bar
class TavernAudioEngine {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  // Tiếng lên đạn / kéo búa súng
  public playGunCock() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.08);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  // Tiếng xoay ổ đạn Revolver
  public playCylinderSpin() {
    this.init();
    if (!this.ctx) return;
    for (let i = 0; i < 6; i++) {
      const t = this.ctx.currentTime + i * 0.04;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1200 + i * 60, t);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.02);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.02);
    }
  }

  // Tiếng bóp cò nổ súng (Russian Roulette Gunshot)
  public playGunshot() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Noise buffer cho tiếng nổ vang quán rượu
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
    filter.frequency.setValueAtTime(1000, now);
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

  // Tiếng rút bài / lật bài Tarot
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

export const tavernAudio = new TavernAudioEngine();

export interface LiarsBar3DProps {
  room: ClientRoomView | any;
  onAimAtPlayer?: (targetId: string, nickname: string) => void;
  onShootPlayer?: (targetId: string, nickname: string) => void;
  onPlayCard?: (cardName: string) => void;
  isPov2: boolean;
  setIsPov2: (v: boolean | ((p: boolean) => boolean)) => void;
}

export const LiarsBar3DExperience: React.FC<LiarsBar3DProps> = ({
  room,
  onAimAtPlayer,
  onShootPlayer,
  onPlayCard,
  isPov2,
  setIsPov2,
}) => {
  // Góc quay Camera 3D (Pitch: nhìn lên/xuống, Yaw: nhìn trái/phải)
  const [cameraAngle, setCameraAngle] = useState({ yaw: 0, pitch: 0 });
  const [isMouseLocked, setIsMouseLocked] = useState(false);
  const [isAimingGun, setIsAimingGun] = useState(false);
  const [revolverFired, setRevolverFired] = useState(false);
  const [hoveredTarget, setHoveredTarget] = useState<string | null>(null);
  const [inspectedCard, setInspectedCard] = useState<number | null>(null);
  const [playedCards, setPlayedCards] = useState<Array<{ id: number; name: string; x: number; y: number; rot: number }>>([]);
  const [rouletteState, setRouletteState] = useState<{ open: boolean; chamber: number; result?: 'CLICK' | 'BANG' }>({
    open: false,
    chamber: 1,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const targetAngleRef = useRef({ yaw: 0, pitch: 0 });

  // 7 Nhân vật ngồi quanh bàn tròn (Chuẩn với hình ảnh liars_bar_table.png)
  const opponents = useMemo(
    () => [
      {
        id: 'ai_01',
        seat: 1,
        nickname: 'Bác Sĩ Mỏ Quạ',
        roleHint: 'Tiên Tri / Bác Sĩ',
        xPercent: 12,
        yPercent: 48,
        scale: 0.95,
        avatarImg: '/assets/plague_doctor.png',
        desc: 'Đang quan sát từng cử chỉ của bạn qua lăng kính mặt nạ chim.',
        status: 'Nghi vấn',
      },
      {
        id: 'ai_02',
        seat: 2,
        nickname: 'LordVader (Ma Sói)',
        roleHint: 'Ma Sói Áo Da',
        xPercent: 24,
        yPercent: 32,
        scale: 1.05,
        avatarImg: '/assets/cards/card_30.png',
        desc: 'Ma Sói hung tợn mặc áo da mô tô. Mắt lóe sáng trong bóng tối.',
        status: 'Bị Tố Cáo (3 Phiếu)',
        isAccused: true,
      },
      {
        id: 'ai_03',
        seat: 3,
        nickname: 'Xemesis (Cáo Thám Tử)',
        roleHint: 'Thám Tử Làng',
        xPercent: 38,
        yPercent: 30,
        scale: 0.98,
        avatarImg: '/assets/cards/card_15.png',
        desc: 'Cáo mặc áo măng-tô và mũ phớt fedora, đang lướt bài rất nhanh.',
        status: 'Bình thường',
      },
      {
        id: 'ai_04',
        seat: 4,
        nickname: 'Quản Trò (Người Máy)',
        roleHint: 'Trọng Tài Tối Cao',
        xPercent: 50,
        yPercent: 26,
        scale: 0.96,
        avatarImg: '/assets/cards/card_22.png',
        desc: 'Người máy với mắt đèn neon xanh dương, giám sát mọi phát súng.',
        status: 'Quản Trò',
      },
      {
        id: 'ai_05',
        seat: 5,
        nickname: 'PewPew (Áo Trùm)',
        roleHint: 'Kẻ Biến Hình',
        xPercent: 62,
        yPercent: 30,
        scale: 0.98,
        avatarImg: '/assets/cards/card_34.png',
        desc: 'Kẻ bí ẩn đeo mặt nạ phát sáng dưới bóng áo trùm đen.',
        status: 'Đã Bị Loại',
        isDead: true,
      },
      {
        id: 'ai_06',
        seat: 6,
        nickname: 'Độ Mixi (Heo Đồ Tể)',
        roleHint: 'Thợ Săn Rừng Sương',
        xPercent: 74,
        yPercent: 33,
        scale: 1.05,
        avatarImg: '/assets/cards/card_8.png',
        desc: 'Heo đồ tể cơ bắp mặc tạp dề, súng sáu đặt ngay trước mặt.',
        status: 'Sẵn sàng',
      },
      {
        id: 'ai_07',
        seat: 7,
        nickname: 'Quý Tộc Mặt Nạ Vàng',
        roleHint: 'Thị Trưởng Quán Rượu',
        xPercent: 88,
        yPercent: 44,
        scale: 0.98,
        avatarImg: '/assets/cards/card_27.png',
        desc: 'Quý tộc áo nhung tím đeo mặt nạ sứ Venice mỉm cười ma mị.',
        status: 'Bình thường',
      },
    ],
    []
  );

  // Bộ 4 lá bài Tarot trên tay người chơi
  const handCards = useMemo(
    () => [
      { id: 1, name: 'TIÊN TRI', icon: '🔮', color: 'from-purple-900 to-indigo-950', border: 'border-purple-500', desc: 'Soi thân phận thật của 1 đối thủ' },
      { id: 2, name: 'DÂN LÀNG', icon: '🌾', color: 'from-amber-900 to-stone-950', border: 'border-amber-500', desc: 'Lương thiện, dùng lý lẽ để sống sót' },
      { id: 3, name: 'TREO CỔ', icon: '🪢', color: 'from-red-950 to-black', border: 'border-red-600', desc: 'Bỏ phiếu thiêu kẻ tình nghi' },
      { id: 4, name: 'PHIẾU TRẮNG', icon: '🕊️', color: 'from-slate-800 to-zinc-950', border: 'border-slate-500', desc: 'Giữ bí mật, không chỉ trích ai' },
    ],
    []
  );

  // Smooth lerp camera rotation
  useEffect(() => {
    let animId: number;
    const updateLoop = () => {
      setCameraAngle((prev) => {
        const dYaw = (targetAngleRef.current.yaw - prev.yaw) * 0.12;
        const dPitch = (targetAngleRef.current.pitch - prev.pitch) * 0.12;
        if (Math.abs(dYaw) < 0.01 && Math.abs(dPitch) < 0.01) return prev;
        return { yaw: prev.yaw + dYaw, pitch: prev.pitch + dPitch };
      });
      animId = requestAnimationFrame(updateLoop);
    };
    animId = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Xử lý di chuột xoay góc nhìn 3D (360° Panoramic Look)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 -> 0.5
    const normY = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 -> 0.5

    // Giới hạn góc nhìn: Trái/Phải [-42deg, 42deg], Lên/Xuống [-22deg, 22deg]
    targetAngleRef.current = {
      yaw: normX * 45,
      pitch: -normY * 25,
    };
  };

  // Rút súng / Bắn súng
  const handleTriggerRevolver = (opponentId?: string, opponentNickname?: string) => {
    const target = opponentId || hoveredTarget || 'ai_02';
    const targetName = opponentNickname || opponents.find((o) => o.id === target)?.nickname || 'LordVader';

    tavernAudio.playGunCock();
    setTimeout(() => {
      tavernAudio.playGunshot();
      setRevolverFired(true);
      setTimeout(() => setRevolverFired(false), 200);

      if (onShootPlayer) onShootPlayer(target, targetName);
    }, 120);
  };

  // Ném bài lên bàn đấu
  const handlePlayCardToTable = (card: { id: number; name: string }) => {
    tavernAudio.playCardFlip();
    const randomOffset = (Math.random() - 0.5) * 80;
    const randomRot = (Math.random() - 0.5) * 35;
    setPlayedCards((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: card.name,
        x: randomOffset,
        y: (Math.random() - 0.5) * 40,
        rot: randomRot,
      },
    ]);
    if (onPlayCard) onPlayCard(card.name);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-screen h-screen overflow-hidden bg-[#06080d] select-none cursor-crosshair font-geist"
    >
      {/* ==================== 1. TAVERN 3D PERSPECTIVE VIEWPORT ==================== */}
      <div
        className="absolute inset-0 w-full h-full origin-center pointer-events-none transition-transform duration-100 ease-out"
        style={{
          transform: `perspective(1000px) rotateX(${cameraAngle.pitch * 0.45}deg) rotateY(${cameraAngle.yaw * 0.45}deg) scale(${
            isPov2 ? 1.15 : 1.05
          }) translateY(${cameraAngle.pitch * -0.2}%) translateX(${cameraAngle.yaw * -0.3}%)`,
        }}
      >
        {/* Main 3D Panoramic Background Scene */}
        <img
          src="/assets/liars_bar_table.png"
          alt="Bàn cược Liar's Bar 3D"
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.92] contrast-[1.12]"
        />

        {/* Dynamic Volumetric Warm Light from Ceiling Lantern */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] pointer-events-none rounded-full"
          style={{
            background:
              'radial-gradient(circle at 50% 30%, rgba(251, 191, 36, 0.22) 0%, rgba(217, 119, 6, 0.08) 45%, transparent 70%)',
            transform: `translateX(${cameraAngle.yaw * 0.4}px) translateY(${cameraAngle.pitch * 0.3}px)`,
          }}
        />

        {/* Swinging Central Lamp Element */}
        <div
          className="absolute top-6 left-1/2 -translate-x-1/2 w-32 h-44 pointer-events-none"
          style={{
            transform: `rotate(${Math.sin(Date.now() / 1200) * 3 + cameraAngle.yaw * 0.08}deg)`,
            transformOrigin: 'top center',
          }}
        >
          <div className="w-1.5 h-16 bg-gradient-to-b from-stone-900 to-amber-700 mx-auto" />
          <div className="w-16 h-12 rounded-full bg-amber-500/80 blur-md mx-auto animate-pulse" />
        </div>

        {/* ==================== 2. SPATIAL OPPONENTS AROUND CIRCULAR TABLE ==================== */}
        {opponents.map((opp) => {
          const isTargeted = hoveredTarget === opp.id;
          return (
            <div
              key={opp.id}
              onClick={() => {
                setHoveredTarget(opp.id);
                if (isAimingGun) {
                  handleTriggerRevolver(opp.id, opp.nickname);
                } else if (onAimAtPlayer) {
                  onAimAtPlayer(opp.id, opp.nickname);
                }
              }}
              onMouseEnter={() => setHoveredTarget(opp.id)}
              onMouseLeave={() => setHoveredTarget(null)}
              className="absolute pointer-events-auto cursor-pointer group transition-transform duration-300"
              style={{
                left: `${opp.xPercent}%`,
                top: `${opp.yPercent}%`,
                transform: `translate(-50%, -50%) scale(${opp.scale * (isTargeted ? 1.08 : 1)})`,
              }}
            >
              {/* Target Reticle Overlay when Gun is Raised */}
              {isAimingGun && isTargeted && (
                <div className="absolute -inset-10 border-2 border-dashed border-red-500 rounded-full animate-spin pointer-events-none opacity-90 shadow-[0_0_25px_rgba(239,68,68,0.8)]" />
              )}

              {/* Opponent Status Bubble */}
              <div
                className={`relative px-3 py-1.5 rounded-xl backdrop-blur-md border text-center transition-all shadow-xl ${
                  opp.isAccused
                    ? 'bg-red-950/90 border-red-500 text-red-200 animate-pulse'
                    : opp.isDead
                    ? 'bg-stone-900/80 border-stone-700 text-stone-500 opacity-60'
                    : isTargeted
                    ? 'bg-amber-950/95 border-amber-400 text-amber-200 scale-105'
                    : 'bg-[#0f141f]/85 border-[#334155]/60 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="font-space font-bold text-xs uppercase tracking-wide">{opp.nickname}</span>
                </div>
                <span className="font-geist text-[10px] text-slate-300 block">{opp.status}</span>

                {isAimingGun && isTargeted && (
                  <span className="mt-1 px-2 py-0.5 rounded bg-red-600 text-white font-space text-[9px] font-bold block animate-bounce">
                    CLICK ĐỂ BẮN 💥
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* ==================== 3. TABLE SURFACE PROPS & PLAYED CARDS ==================== */}
        <div
          className="absolute left-1/2 top-[62%] -translate-x-1/2 -translate-y-1/2 w-[700px] h-[220px] pointer-events-none"
          style={{ perspective: 500, transform: 'rotateX(52deg)' }}
        >
          {/* Center Table Verdict Badge */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-red-950/90 border border-red-500 text-red-300 text-xs font-space font-bold shadow-[0_0_20px_rgba(220,38,38,0.6)]">
              🌕 BẦY SÓI ĐANG RÌNH RẬP
            </div>
          </div>

          {/* Played Cards on the green felt */}
          {playedCards.map((c) => (
            <div
              key={c.id}
              className="absolute left-1/2 top-1/2 w-20 h-28 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-gradient-to-b from-amber-900 via-stone-950 to-black border border-amber-500/80 shadow-2xl flex flex-col items-center justify-center p-1.5"
              style={{
                transform: `translate(${c.x}px, ${c.y}px) rotate(${c.rot}deg)`,
                boxShadow: '0 10px 25px rgba(0,0,0,0.8)',
              }}
            >
              <span className="text-xl">📜</span>
              <span className="font-space text-[9px] font-bold text-amber-300 text-center uppercase mt-1">
                {c.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ==================== 4. MUZZLE FLASH WHEN GUN FIRED ==================== */}
      {revolverFired && (
        <div className="fixed inset-0 z-40 bg-white/40 pointer-events-none animate-ping" />
      )}

      {/* ==================== 5. FIRST-PERSON INTERACTIVE HANDS & REVOLVER ==================== */}
      <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none flex items-end justify-between px-10 pb-2">
        {/* LEFT HAND: FAN OF TAROT CARDS */}
        <div className="pointer-events-auto relative flex items-end -space-x-8 mb-2">
          {handCards.map((card, idx) => {
            const isHovered = inspectedCard === card.id;
            const tilt = (idx - 1.5) * 8; // -12, -4, 4, 12
            const translateY = isHovered ? -40 : 0;

            return (
              <div
                key={card.id}
                onMouseEnter={() => {
                  setInspectedCard(card.id);
                  tavernAudio.playCardFlip();
                }}
                onMouseLeave={() => setInspectedCard(null)}
                onClick={() => handlePlayCardToTable(card)}
                className={`relative w-28 h-40 rounded-xl bg-gradient-to-b ${card.color} border-2 ${card.border} shadow-[0_15px_30px_rgba(0,0,0,0.9)] cursor-pointer transition-all duration-300 flex flex-col justify-between p-2.5 group`}
                style={{
                  transform: `translateY(${translateY}px) rotate(${tilt}deg) scale(${isHovered ? 1.15 : 1})`,
                  zIndex: isHovered ? 50 : idx,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-space font-bold text-amber-300">{card.name}</span>
                  <span className="text-sm">{card.icon}</span>
                </div>

                <div className="text-center my-auto">
                  <span className="text-3xl filter drop-shadow">{card.icon}</span>
                </div>

                <div className="text-center bg-black/40 rounded py-1 px-0.5">
                  <span className="font-geist text-[8px] text-slate-300 leading-tight block">{card.desc}</span>
                  <span className="text-[9px] font-space font-bold text-amber-400 mt-0.5 block opacity-0 group-hover:opacity-100 transition-opacity">
                    [CLICK ĐÁNH BÀI]
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT HAND: REVOLVER WEAPON (Russian Roulette Stance) */}
        <div className="pointer-events-auto relative flex flex-col items-center">
          {isAimingGun ? (
            <div
              onClick={() => handleTriggerRevolver()}
              className="relative cursor-pointer group flex flex-col items-center"
              style={{
                transform: `translateX(${cameraAngle.yaw * -1.5}px) translateY(${cameraAngle.pitch * 0.8}px)`,
                transition: 'transform 0.08s ease-out',
              }}
            >
              {/* Revolver Silhouette & Sight */}
              <div className="relative w-64 h-56 flex items-end justify-center filter drop-shadow-[0_20px_40px_rgba(0,0,0,0.95)]">
                <div className="absolute top-4 w-4 h-8 bg-zinc-900 border border-zinc-700 rounded-t shadow" />
                <div className="w-16 h-48 bg-gradient-to-b from-zinc-700 via-zinc-900 to-black rounded-lg border-2 border-zinc-500 shadow-2xl flex flex-col items-center justify-between py-4">
                  <span className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
                  <span className="font-space text-[9px] font-bold text-amber-400 rotate-90">.44 MAGNUM</span>
                  <div className="w-8 h-8 rounded-full border-2 border-amber-500/80 bg-zinc-950 flex items-center justify-center">
                    <span className="text-xs">⚙️</span>
                  </div>
                </div>
              </div>

              {/* Gun Controls Badge */}
              <div className="bg-red-950/90 border border-red-500 px-4 py-1.5 rounded-full shadow-lg text-center mt-2 animate-bounce">
                <span className="font-space text-xs font-bold text-white uppercase tracking-wider">
                  💥 BÓP CÒ BẮN (RUSSIAN ROULETTE)
                </span>
                <span className="block text-[10px] text-red-300 font-mono">Click chuột hoặc ấn [R]</span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsAimingGun(true);
                tavernAudio.playGunCock();
              }}
              className="py-3 px-6 rounded-2xl bg-gradient-to-r from-red-900 via-zinc-900 to-red-900 hover:from-red-800 hover:to-red-800 text-white font-space font-bold text-xs uppercase tracking-wider border border-red-500/60 shadow-[0_0_30px_rgba(220,38,38,0.5)] transition-all flex items-center gap-2 mb-4 group hover:scale-105"
            >
              <span className="text-lg group-hover:rotate-45 transition-transform">🔫</span>
              <span>RÚT SÚNG CHĨA VÀO ĐỐI THỦ [R]</span>
            </button>
          )}
        </div>
      </div>

      {/* ==================== 6. TOP CAMERA CONTROLS HUD ==================== */}
      <div className="absolute top-3 right-4 z-40 flex items-center gap-2">
        <button
          onClick={() => {
            tavernAudio.playCylinderSpin();
            setRouletteState({ open: true, chamber: Math.floor(Math.random() * 6) + 1 });
          }}
          className="px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-500/60 text-amber-200 font-space text-xs font-bold flex items-center gap-1.5 shadow hover:bg-amber-900 transition-colors"
        >
          <span>🎰</span>
          <span>Russian Roulette (1/6)</span>
        </button>

        <button
          onClick={() => setIsAimingGun((prev) => !prev)}
          className={`px-3 py-1.5 rounded-xl border text-xs font-space font-bold flex items-center gap-1.5 shadow transition-colors ${
            isAimingGun
              ? 'bg-red-600 text-white border-red-400'
              : 'bg-[#181f2f] text-slate-300 border-[#334155] hover:text-white'
          }`}
        >
          <span>🎯</span>
          <span>{isAimingGun ? 'Hạ Súng Xuống' : 'Rút Súng [R]'}</span>
        </button>

        <div className="px-3 py-1.5 rounded-xl bg-black/70 border border-[#334155] text-slate-400 text-xs font-mono flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>Rê chuột: Xoay góc nhìn 360°</span>
        </div>
      </div>

      {/* ==================== 7. RUSSIAN ROULETTE MODAL (LIAR'S BAR MECHANIC) ==================== */}
      {rouletteState.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-[#10141f] border-2 border-red-500/70 rounded-3xl p-8 max-w-md w-full text-center shadow-[0_0_60px_rgba(220,38,38,0.6)] animate-fadeIn">
            <span className="text-5xl block mb-2">🔫</span>
            <h3 className="font-syne font-extrabold text-2xl text-red-400 uppercase tracking-wider">
              LIAR'S BAR: BÓP CÒ TỰ XỬ
            </h3>
            <p className="font-geist text-xs text-slate-300 mt-2">
              Bạn bị buộc tội nói dối! Hãy tự chĩa súng vào đầu mình và bóp cò. 1 trong 6 viên đạn là đạn thật!
            </p>

            {/* 6 Chambers Indicator */}
            <div className="my-6 flex items-center justify-center gap-3">
              {[1, 2, 3, 4, 5, 6].map((ch) => (
                <div
                  key={ch}
                  className={`w-9 h-9 rounded-full border-2 flex items-center justify-center font-mono font-bold text-xs transition-all ${
                    ch === rouletteState.chamber
                      ? 'bg-red-600 border-red-400 text-white animate-ping'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-500'
                  }`}
                >
                  {ch}
                </div>
              ))}
            </div>

            {rouletteState.result && (
              <div
                className={`p-3 rounded-xl mb-4 font-space font-bold text-sm uppercase ${
                  rouletteState.result === 'BANG'
                    ? 'bg-red-950 border border-red-500 text-red-200 animate-bounce'
                    : 'bg-emerald-950 border border-emerald-500 text-emerald-200'
                }`}
              >
                {rouletteState.result === 'BANG' ? '💥 ĐẠN NỔ! BẠN ĐÃ BỊ LOẠI!' : '🛡️ TÁCH! ĐẠN LÉP, BẠN SỐNG SÓT!'}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  tavernAudio.playCylinderSpin();
                  const isBullet = Math.random() < 0.166;
                  setTimeout(() => {
                    if (isBullet) {
                      tavernAudio.playGunshot();
                      setRouletteState((prev) => ({ ...prev, result: 'BANG' }));
                    } else {
                      tavernAudio.playGunCock();
                      setRouletteState((prev) => ({ ...prev, result: 'CLICK' }));
                    }
                  }, 400);
                }}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-800 to-red-600 hover:from-red-700 hover:to-red-500 text-white font-space font-bold text-xs uppercase tracking-wider shadow-lg"
              >
                BÓP CÒ TỰ XỬ
              </button>

              <button
                type="button"
                onClick={() => setRouletteState({ open: false, chamber: 1 })}
                className="px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-slate-300 font-space text-xs font-bold uppercase"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
