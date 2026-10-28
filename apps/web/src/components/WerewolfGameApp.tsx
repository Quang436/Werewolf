'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ALL_ROLES_FROM_PDF,
  ChatChannel,
  PublicPlayerView,
  Role,
} from '@werewolf/shared';
import { GameStateManager } from '../stores/game.store';

export interface WerewolfGameAppProps {
  store: GameStateManager;
  onEmitAction: (event: string, payload: unknown) => void;
  onSendChat: (channel: ChatChannel, text: string) => void;
}

export const WerewolfGameApp: React.FC<WerewolfGameAppProps> = ({
  store,
  onEmitAction,
  onSendChat,
}) => {
  const [state, setState] = useState(store.getState());
  const [chatInput, setChatInput] = useState('');
  const [isPov2, setIsPov2] = useState(false);
  const [micActive, setMicActive] = useState(true);
  const [selectedActionIndex, setSelectedActionIndex] = useState<number | null>(null);

  useEffect(() => {
    return store.subscribe((newState) => {
      setState({ ...newState });
    });
  }, [store]);

  useEffect(() => {
    const timer = setInterval(() => {
      store.updateRemainingTime();
      setState({ ...store.getState() });
    }, 250);
    return () => clearInterval(timer);
  }, [store]);

  // Keybind listeners: KeyV (POV toggle), KeyE (Debate), Digit1 (Vote)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'KeyV') {
        setIsPov2((prev) => !prev);
      } else if (e.code === 'KeyE') {
        onEmitAction('day:debate', { message: 'Tôi khẳng định mình vô tội!' });
      } else if (e.code === 'Digit1') {
        onEmitAction('day:vote', { targetId: 'TARGET_DEFENDANT' });
      } else if (e.code === 'Space') {
        e.preventDefault();
        onEmitAction('day:vote', { targetId: 'SKIP' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEmitAction]);

  const room = state.room;
  if (!room) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#07090e] text-white font-geist">
        <div className="bg-[#111622] p-8 rounded-2xl border border-red-500/40 text-center shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-500/50 flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-red-500 animate-spin text-2xl">sync</span>
          </div>
          <h2 className="font-syne font-bold text-lg uppercase tracking-wider text-white">ĐANG KẾT NỐI BÀN ĐẤU...</h2>
          <p className="font-geist text-xs text-slate-400 mt-1">Đang đồng bộ dữ liệu bảo mật từ Quản Trò</p>
        </div>
      </div>
    );
  }

  const myPlayerInfo = room.players.find((p) => p.id === room.me?.id);
  const myNickname =
    myPlayerInfo?.nickname ||
    (typeof window !== 'undefined' ? sessionStorage.getItem('werewolf_nickname') || 'Thợ Săn Bạn' : 'Thợ Săn Bạn');

  const isNight = room.phase.includes('NIGHT');
  const remainingSeconds = Math.max(0, Math.ceil(state.remainingMs / 1000));
  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendChat(state.activeChatChannel, chatInput.trim());
    setChatInput('');
  };

  return (
    <div className="relative w-screen h-screen bg-black text-gray-100 overflow-hidden font-game select-none">
      {/* 1. 3D PERSPECTIVE CANVAS & POV BACKGROUND FRAME */}
      <div className="absolute inset-0 z-0 w-full h-full overflow-hidden">
        <img
          alt="Bàn Ma Sói Sinh Tử 3D POV Liar's Bar"
          src="/assets/liars_bar_table.png"
          className="w-full h-full object-cover object-center filter brightness-95 contrast-110 pointer-events-none transition-transform duration-700 ease-out"
          style={{
            transform: isPov2 ? 'scale(1.18) translateY(-4%)' : 'scale(1) translateY(0)',
          }}
        />

        {/* Cinematic Vignettes */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60 pointer-events-none" />

        {/* 2ND POV Camera Badge */}
        {isPov2 && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none bg-red-950/90 border border-red-500/80 px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.6)] flex items-center gap-2 animate-fadeIn">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="text-xs font-black uppercase text-red-200 tracking-wider font-display">
              ĐANG XEM: GÓC NHÌN THỨ 2 - CẬN CẢNH ĐỐI DIỆN / BÀN ĐẤU TOÀN CẢNH
            </span>
          </div>
        )}

        {/* 3D Werewolf Table Center Tokens (Perspective 55deg tilt) */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            transform: isPov2 ? 'scale(1.08) translateY(-3%)' : 'scale(1) translateY(0)',
            transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Center Table Verdict Badges */}
          <div
            className="absolute left-[48%] top-[56%] -translate-x-1/2 -translate-y-1/2 flex items-center gap-2"
            style={{ perspective: 500, transform: 'rotateX(55deg)' }}
          >
            <div className="w-14 h-20 rounded bg-gradient-to-b from-red-950 via-zinc-950 to-black border border-red-500/80 shadow-[0_0_15px_rgba(220,38,38,0.6)] flex flex-col items-center justify-between p-1 rotate-[-12deg]">
              <div className="text-[7px] font-display text-red-400 font-bold tracking-widest uppercase">HỘI ĐỒNG</div>
              <div className="text-lg leading-none">🌕</div>
              <div className="text-[6px] font-mono text-gray-400 uppercase">MA SÓI</div>
            </div>
            <div className="w-14 h-20 rounded bg-gradient-to-b from-amber-950 via-zinc-950 to-black border border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.5)] flex flex-col items-center justify-between p-1 rotate-[4deg]">
              <div className="text-[7px] font-display text-amber-300 font-bold tracking-widest uppercase">PHÁN QUYẾT</div>
              <div className="text-lg leading-none">⚖️</div>
              <div className="text-[6px] font-mono text-gray-400 uppercase">#02 TREO CỔ</div>
            </div>
            <div className="w-14 h-20 rounded bg-gradient-to-b from-purple-950 via-zinc-950 to-black border border-purple-500/70 shadow-[0_0_12px_rgba(168,85,247,0.4)] flex flex-col items-center justify-between p-1 rotate-[18deg]">
              <div className="text-[7px] font-display text-purple-300 font-bold tracking-widest uppercase">TIÊN TRI</div>
              <div className="text-lg leading-none">🔮</div>
              <div className="text-[6px] font-mono text-gray-400 uppercase">SOI THÂN PHẬN</div>
            </div>
          </div>

          {/* Left Table Prop */}
          <div
            className="absolute left-[20%] top-[62%] -translate-x-1/2 flex gap-1"
            style={{ perspective: 400, transform: 'rotateX(50deg) rotateZ(18deg)' }}
          >
            <div className="w-10 h-14 rounded bg-stone-900 border border-amber-600/60 shadow flex flex-col items-center justify-center">
              <span className="text-[6px] font-mono text-amber-400">THẺ LÀNG</span>
              <span className="text-xs">📜</span>
            </div>
          </div>

          {/* Right Table Prop */}
          <div
            className="absolute right-[22%] top-[63%] -translate-x-1/2 flex gap-1"
            style={{ perspective: 400, transform: 'rotateX(50deg) rotateZ(-20deg)' }}
          >
            <div className="w-10 h-14 rounded bg-red-950 border border-red-500/60 shadow flex flex-col items-center justify-center">
              <span className="text-[6px] font-mono text-red-300">PHIẾU PHẠT</span>
              <span className="text-xs">🪢</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SPATIAL SEAT OVERLAYS AROUND THE TABLE */}
      <div
        className="absolute inset-0 z-10 pointer-events-none transition-transform duration-700 ease-out"
        style={{
          transform: isPov2 ? 'scale(1.08) translateY(-3%)' : 'scale(1) translateY(0)',
        }}
      >
        <div className="absolute left-[7%] top-[45%] -translate-y-1/2 flex flex-col items-center">
          <span className="text-xs font-bold text-white tracking-wider font-display drop-shadow opacity-85">
            #01 BÁC SĨ MỎ QUẠ
          </span>
        </div>
        <div className="absolute left-[21%] top-[25%] flex flex-col items-center">
          <span className="text-xs font-bold text-red-300 tracking-wider font-display drop-shadow opacity-90 animate-pulse">
            #02 LORDVADER (3 PHIẾU)
          </span>
        </div>
        <div className="absolute left-[37%] top-[28%] flex flex-col items-center">
          <span className="text-xs font-bold text-white tracking-wider font-display drop-shadow opacity-85">
            #03 XEMESIS
          </span>
        </div>
        <div className="absolute left-[50%] top-[24%] -translate-x-1/2 flex flex-col items-center">
          <span className="text-xs font-bold text-cyan-300 tracking-wider font-display drop-shadow opacity-90">
            #04 QUẢN TRÒ (MODERATOR)
          </span>
        </div>
        <div className="absolute left-[62%] top-[29%] flex flex-col items-center">
          <span className="text-xs font-bold text-gray-500 line-through tracking-wider font-display drop-shadow opacity-60">
            #05 PEWPEW (ĐÃ CHẾT)
          </span>
        </div>
        <div className="absolute left-[73%] top-[25%] flex flex-col items-center">
          <span className="text-xs font-bold text-white tracking-wider font-display drop-shadow opacity-90">
            #06 ĐỘ MIXI
          </span>
        </div>
        <div className="absolute right-[4%] top-[34%] flex flex-col items-center">
          <span className="text-xs font-bold text-white tracking-wider font-display drop-shadow opacity-85">
            #07 MẶT NẠ VÀNG
          </span>
        </div>
      </div>

      {/* 3. TOP BAR: TURN INFO & COUNTDOWN TIMER & CAMERA TOGGLE */}
      <header className="absolute top-3 inset-x-0 z-30 flex justify-center pointer-events-none px-6">
        <div className="flex items-center gap-3 pointer-events-auto bg-black/75 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 shadow-2xl">
          <div className="flex items-center gap-2 pr-3 border-r border-white/10">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="text-xs font-bold text-red-400 font-display uppercase tracking-wider">
              {room.phase.replace(/_/g, ' ')}
            </span>
            <span className="text-lg font-black font-display text-red-500 neon-text-red leading-none">
              {formatTimer(remainingSeconds)}
              <span className="text-[10px] text-red-300 ml-0.5">s</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-950/60 border border-red-500/40 text-[11px] font-mono text-red-200">
            <span className="text-amber-400 font-bold">#02 LordVader:</span>
            <span className="font-black text-amber-300">3/5 Phiếu</span>
          </div>

          {/* POV Camera Controls */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-white/10">
            <div className="flex items-center gap-1 bg-zinc-900/80 p-0.5 rounded-full border border-white/10">
              <button
                type="button"
                onClick={() => setIsPov2(false)}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-display uppercase tracking-wider transition ${
                  !isPov2
                    ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-[0_0_10px_rgba(220,38,38,0.7)] border border-red-400'
                    : 'text-gray-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                1ST
              </button>
              <button
                type="button"
                onClick={() => setIsPov2(true)}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-display uppercase tracking-wider transition ${
                  isPov2
                    ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-[0_0_10px_rgba(220,38,38,0.7)] border border-red-400'
                    : 'text-gray-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                2ND
              </button>
            </div>
            <kbd className="px-1.5 py-0.5 bg-black/60 rounded text-[9px] font-mono text-amber-300 border border-white/10">
              [V]
            </kbd>
          </div>
        </div>
      </header>

      {/* 4. STREAMER WEBCAM & VOICE INDICATOR (TOP LEFT) */}
      <aside className="absolute top-3 left-4 z-30 flex items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-2.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
          <div className="relative w-8 h-8 rounded-full border border-amber-400/80 bg-zinc-800 flex items-center justify-center text-sm shadow">
            <span>🧔🏻‍♂️</span>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-black animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-amber-300 font-display leading-tight">
              {myNickname}
            </span>
            <div className="flex items-center gap-1 text-[9px] font-mono text-emerald-400">
              <span className="w-1 h-2 bg-emerald-400 rounded-full eq-bar-1" />
              <span className="w-1 h-3 bg-emerald-400 rounded-full eq-bar-2" />
              <span>MIC ON</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => (window.location.href = '/')}
          className="px-2.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-slate-300 hover:text-white text-[11px] font-mono flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[14px]">logout</span>
          <span>Rời Bàn</span>
        </button>
      </aside>

      {/* 5. LEFT HUD: SEAT STATUS ROSTER */}
      <aside className="absolute left-4 bottom-24 z-30 w-44 flex flex-col gap-1">
        <div className="bg-black/60 backdrop-blur-md p-2.5 rounded-xl border border-white/10 shadow-lg">
          <div className="text-[9px] font-mono uppercase tracking-wider text-gray-400 mb-1 flex items-center justify-between pb-1 border-b border-white/10">
            <span className="font-bold">BÀN CHƠI</span>
            <span className="text-emerald-400 font-bold">6/8 SỐNG</span>
          </div>
          <div className="space-y-1 text-[10px]">
            <div className="flex justify-between px-1.5 py-0.5 rounded text-gray-300">
              <span>#1 Bác Sĩ</span>
              <span className="text-emerald-400 font-bold">Sống</span>
            </div>
            <div className="flex justify-between px-1.5 py-0.5 rounded bg-red-950/70 border border-red-500/50 text-red-200 font-bold animate-pulse">
              <span>#2 LordVader</span>
              <span className="text-red-400 font-mono">3 Phiếu</span>
            </div>
            <div className="flex justify-between px-1.5 py-0.5 rounded text-gray-300">
              <span>#3 Xemesis</span>
              <span className="text-emerald-400 font-bold">Sống</span>
            </div>
            <div className="flex justify-between px-1.5 py-0.5 rounded text-cyan-300">
              <span>#4 Quản Trò</span>
              <span className="text-cyan-400">Chủ tọa</span>
            </div>
            <div className="flex justify-between px-1.5 py-0.5 rounded text-gray-500 line-through">
              <span>#5 PewPew</span>
              <span className="text-red-500">Chết</span>
            </div>
            <div className="flex justify-between px-1.5 py-0.5 rounded text-gray-300">
              <span>#6 Độ Mixi</span>
              <span className="text-emerald-400 font-bold">Sống</span>
            </div>
            <div className="flex justify-between px-1.5 py-0.5 rounded text-gray-300">
              <span>#7 Mặt Nạ</span>
              <span className="text-emerald-400 font-bold">Sống</span>
            </div>
            <div className="flex justify-between px-1.5 py-0.5 rounded bg-emerald-950/70 border border-emerald-400/50 text-emerald-200 font-bold">
              <span>#8 Bạn</span>
              <span className="text-amber-300 font-bold">Lượt bạn</span>
            </div>
          </div>
        </div>
      </aside>

      {/* 6. RIGHT HUD: COMBAT / TRIAL LOG & CHAT STREAM */}
      <aside className="absolute top-3 right-4 z-30 flex flex-col w-72 pointer-events-auto gap-2">
        <div className="bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-lg">
          <div className="flex items-center justify-between pb-1.5 border-b border-white/10 mb-2">
            <span className="text-[11px] font-bold text-amber-400 font-display tracking-wider">NHẬT KÝ BÀN ĐẤU</span>
            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-500/40">
              LIVE
            </span>
          </div>
          <div className="space-y-1.5 text-xs text-gray-300 font-sans max-h-36 overflow-y-auto pr-1">
            <div className="border-l-2 border-red-500 pl-2 text-[11px]">
              <span className="text-red-400 font-semibold">#06 Độ Mixi:</span> Cáo buộc #02 LordVader có biểu hiện mờ ám.
            </div>
            <div className="border-l-2 border-amber-500 pl-2 text-[11px]">
              <span className="text-amber-300 font-semibold">#02 LordVader:</span> "Tôi là Dân làng lương thiện!"
            </div>
            <div className="border-l-2 border-red-500 pl-2 text-[11px] text-red-200 font-bold">
              #02 LordVader đang có 3 phiếu kết tội.
            </div>
          </div>
        </div>

        {/* In-Game Live Chat Box */}
        <div className="bg-black/70 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-lg flex flex-col h-56 justify-between">
          <div className="flex items-center gap-1 border-b border-white/10 pb-1 mb-1">
            {(['public', 'wolves', 'lovers', 'dead'] as ChatChannel[]).map((ch) => (
              <button
                key={ch}
                onClick={() => store.setActiveChatChannel(ch)}
                className={`flex-1 py-0.5 rounded text-[10px] font-mono uppercase font-bold transition-colors ${
                  state.activeChatChannel === ch
                    ? 'bg-red-950 text-red-300 border border-red-500/40'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {ch === 'public' ? 'Làng' : ch === 'wolves' ? 'Sói' : ch === 'lovers' ? 'Đôi' : 'Ma'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 text-[11px] pr-1">
            {(state.chatMessages[state.activeChatChannel] || []).map((msg) => (
              <div key={msg.id} className="text-slate-300">
                <span className="text-amber-300 font-mono font-bold mr-1">
                  {msg.senderNickname || msg.senderId}:
                </span>
                <span>{msg.text}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendChat} className="flex gap-1 pt-1.5 border-t border-white/10">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Nói gì đó..."
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-red-500"
            />
            <button
              type="submit"
              className="px-2 py-1 bg-red-800 hover:bg-red-700 text-white text-xs rounded font-mono"
            >
              Gửi
            </button>
          </form>
        </div>
      </aside>

      {/* 7. BOTTOM POV CARDS & PLAYER HAND (FANNED OUT) */}
      <section className="absolute bottom-16 inset-x-0 z-20 flex justify-center items-end pointer-events-auto">
        <div className="flex flex-col items-center pointer-events-auto select-none relative">
          <div className="werewolf-card-fan flex items-end justify-center mb-1 -space-x-8 pointer-events-auto">
            {/* Card 1: Tiên Tri */}
            <div
              onClick={() => setSelectedActionIndex(0)}
              className="werewolf-tarot-card werewolf-card-back border border-amber-500/80 p-1.5 flex flex-col justify-between items-center text-center cursor-pointer shadow-2xl rotate-[-15deg] -translate-y-1 hover:border-amber-300 bg-gradient-to-b from-stone-900 via-zinc-950 to-black"
            >
              <div className="w-full flex justify-between items-center px-1 text-[8px] font-mono text-amber-400/80">
                <span>✦</span>
                <span className="tracking-wider">VILLAGE</span>
                <span>✦</span>
              </div>
              <div className="flex flex-col items-center my-auto">
                <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(245,158,11,0.7)]">🔮</span>
                <span className="text-[9px] font-black font-display text-amber-300 tracking-wider mt-1">TIÊN TRI</span>
                <span className="text-[7px] text-gray-400 font-mono scale-90">SOI ĐÊM NAY</span>
              </div>
              <div className="w-full text-center pb-0.5 text-[7px] text-amber-500 font-mono border-t border-amber-500/30">
                BẢO VỆ LÀNG
              </div>
            </div>

            {/* Card 2: Treo Cổ */}
            <div
              onClick={() => setSelectedActionIndex(1)}
              className="werewolf-tarot-card werewolf-card-back border border-red-500/90 p-1.5 flex flex-col justify-between items-center text-center cursor-pointer shadow-2xl rotate-[-5deg] -translate-y-4 hover:border-red-400 bg-gradient-to-b from-red-950 via-zinc-950 to-black"
            >
              <div className="w-full flex justify-between items-center px-1 text-[8px] font-mono text-red-400">
                <span>☠</span>
                <span className="tracking-wider">TÒA ÁN</span>
                <span>☠</span>
              </div>
              <div className="flex flex-col items-center my-auto">
                <span className="text-3xl filter drop-shadow-[0_0_10px_rgba(220,38,38,0.9)]">🪢</span>
                <span className="text-[9px] font-black font-display text-red-200 tracking-wider mt-1">TREO CỔ</span>
                <span className="text-[7px] text-red-400 font-mono">#02 LORDVADER</span>
              </div>
              <div className="w-full text-center pb-0.5 text-[7px] text-red-400 font-mono border-t border-red-500/30">
                3/5 PHIẾU TỘI
              </div>
            </div>

            {/* Card 3: Dân Làng */}
            <div
              onClick={() => setSelectedActionIndex(2)}
              className="werewolf-tarot-card werewolf-card-back border border-amber-400/90 p-1.5 flex flex-col justify-between items-center text-center cursor-pointer shadow-2xl rotate-[5deg] -translate-y-4 hover:border-yellow-300 bg-gradient-to-b from-amber-950 via-zinc-950 to-black"
            >
              <div className="w-full flex justify-between items-center px-1 text-[8px] font-mono text-amber-400">
                <span>🌕</span>
                <span className="tracking-wider">VAI TRÒ</span>
                <span>🌕</span>
              </div>
              <div className="flex flex-col items-center my-auto">
                <span className="text-3xl filter drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]">👨‍🌾</span>
                <span className="text-[9px] font-black font-display text-amber-300 tracking-wider mt-1">DÂN LÀNG</span>
                <span className="text-[7px] text-emerald-400 font-mono">LƯƠNG THIỆN</span>
              </div>
              <div className="w-full text-center pb-0.5 text-[7px] text-amber-400 font-mono border-t border-amber-500/30">
                BẦU CHỌN TREO
              </div>
            </div>

            {/* Card 4: Phiếu Trắng */}
            <div
              onClick={() => setSelectedActionIndex(3)}
              className="werewolf-tarot-card werewolf-card-back border border-zinc-600 p-1.5 flex flex-col justify-between items-center text-center cursor-pointer shadow-2xl rotate-[15deg] -translate-y-1 hover:border-zinc-400 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black"
            >
              <div className="w-full flex justify-between items-center px-1 text-[8px] font-mono text-gray-400">
                <span>⚖</span>
                <span className="tracking-wider">BỎ PHIẾU</span>
                <span>⚖</span>
              </div>
              <div className="flex flex-col items-center my-auto">
                <span className="text-3xl filter drop-shadow">🕊️</span>
                <span className="text-[9px] font-black font-display text-gray-200 tracking-wider mt-1">PHIẾU TRẮNG</span>
                <span className="text-[7px] text-gray-400 font-mono">TRUNG LẬP</span>
              </div>
              <div className="w-full text-center pb-0.5 text-[7px] text-gray-400 font-mono border-t border-zinc-700/60">
                KHÔNG KẾT TỘI
              </div>
            </div>
          </div>

          {/* Quick Action Badges */}
          <div className="flex items-center justify-center gap-2 mt-1">
            <div
              onClick={() => setSelectedActionIndex(0)}
              className="hand-card-skew px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md border border-amber-400/80 text-amber-300 flex items-center gap-2 cursor-pointer shadow-lg hover:border-yellow-300"
            >
              <span className="text-base">👨‍🌾</span>
              <div className="text-left leading-tight">
                <div className="text-[10px] font-extrabold font-display">DÂN LÀNG / TIÊN TRI</div>
                <div className="text-[8px] text-amber-200/80">Tìm diệt Ma Sói trong làng</div>
              </div>
            </div>

            <div
              onClick={() => {
                setSelectedActionIndex(1);
                onEmitAction('day:vote', { targetId: '#02_LORDVADER' });
              }}
              className="hand-card-skew px-3 py-1.5 rounded-lg bg-red-950/90 backdrop-blur-md border border-red-500 text-red-200 flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(220,38,38,0.5)] -translate-y-1 hover:border-red-400"
            >
              <span className="text-base">🪢</span>
              <div className="text-left leading-tight">
                <div className="text-[10px] font-black font-display text-white">TREO CỔ #02 LORDVADER</div>
                <div className="text-[8px] text-red-300">Phiếu phán quyết (3/5)</div>
              </div>
            </div>

            <div
              onClick={() => {
                setSelectedActionIndex(3);
                onEmitAction('day:vote', { targetId: 'SKIP' });
              }}
              className="hand-card-skew px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md border border-zinc-600 text-gray-300 flex items-center gap-2 cursor-pointer shadow-lg hover:border-zinc-400"
            >
              <span className="text-base">🕊️</span>
              <div className="text-left leading-tight">
                <div className="text-[10px] font-bold font-display">BỎ PHIẾU TRẮNG</div>
                <div className="text-[8px] text-gray-400">Từ chối treo cổ</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. BOTTOM ACTION CONTROLLER BAR */}
      <footer className="absolute bottom-3 inset-x-0 z-30 flex justify-center px-4">
        <div className="bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 shadow-2xl flex items-center gap-2 max-w-xl w-full justify-between">
          <button
            type="button"
            onClick={() => onEmitAction('day:vote', { targetId: '#02_LORDVADER' })}
            className="flex-1 bg-red-950/80 hover:bg-red-900 border border-red-600/80 text-white rounded-lg px-3 py-1.5 flex items-center justify-between text-xs font-bold transition shadow-[0_0_10px_rgba(220,38,38,0.4)]"
          >
            <span className="flex items-center gap-1.5 font-display">
              <span>🪢</span> Bỏ phiếu Treo cổ #02
            </span>
            <kbd className="px-1 py-0.2 bg-black/60 rounded text-[9px] font-mono text-gray-300 border border-white/10">
              [1]
            </kbd>
          </button>

          <button
            type="button"
            onClick={() => onEmitAction('day:debate', { message: 'Tôi kháng cáo!' })}
            className="flex-1 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white rounded-lg px-3 py-1.5 flex items-center justify-between text-xs font-black shadow-[0_0_15px_rgba(220,38,38,0.7)] border border-red-400 transition animate-glowBeat"
          >
            <span className="flex items-center gap-1.5 font-display">
              <span>🗣️</span> Tranh luận / Bào chữa
            </span>
            <kbd className="px-1 py-0.2 bg-black/40 rounded text-[9px] font-mono text-red-200 border border-red-300/40">
              [E]
            </kbd>
          </button>

          <button
            type="button"
            onClick={() => onEmitAction('day:vote', { targetId: 'SKIP' })}
            className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-gray-300 hover:text-white rounded-lg px-3 py-1.5 flex items-center justify-between text-xs font-bold transition"
          >
            <span className="flex items-center gap-1.5 font-display">
              <span>🕊️</span> Bỏ phiếu trắng
            </span>
            <kbd className="px-1 py-0.2 bg-black/60 rounded text-[9px] font-mono text-gray-400 border border-white/10">
              [SPACE]
            </kbd>
          </button>
        </div>
      </footer>
    </div>
  );
};
