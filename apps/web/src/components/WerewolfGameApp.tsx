'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ALL_ROLES_FROM_PDF,
  ChatChannel,
  PublicPlayerView,
  Role,
} from '@werewolf/shared';
import { GameStateManager } from '../stores/game.store';
import { LiarsBar3DExperience, werewolfAudio } from './LiarsBar3DExperience';
import { PlayerRoleCard } from './PlayerRoleCard';
import { CenterRoleRevealModal } from './CenterRoleRevealModal';
import {
  generateBalancedDeck,
  getRoleInfo,
  shuffleArray,
} from '../constants/roles-data';

export interface WerewolfGameAppProps {
  store: GameStateManager;
  onEmitAction: (event: string, payload: unknown) => void;
  onSendChat: (channel: ChatChannel, text: string) => void;
}

// 16 Standard Council Members for dynamic scaling testing
const ALL_SAMPLE_PLAYERS: PublicPlayerView[] = [
  { id: 'p1', seat: 1, nickname: 'Bác Sĩ', avatarUrl: null, isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
  { id: 'p2', seat: 2, nickname: 'LordVader', avatarUrl: null, isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
  { id: 'p3', seat: 3, nickname: 'Xemesis', avatarUrl: null, isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
  { id: 'p4', seat: 4, nickname: 'Quản Trò', avatarUrl: null, isHost: true, isAlive: true, ready: true, connection: 'ONLINE' },
  { id: 'p5', seat: 5, nickname: 'PewPew', avatarUrl: null, isHost: false, isAlive: false, ready: true, connection: 'ONLINE' },
  { id: 'p6', seat: 6, nickname: 'Độ Mixi', avatarUrl: null, isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
  { id: 'p7', seat: 7, nickname: 'Mặt Nạ', avatarUrl: null, isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
  { id: 'p8', seat: 8, nickname: 'Bạn', avatarUrl: null, isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
  { id: 'p9', seat: 9, nickname: 'Thầy Bói', avatarUrl: null, isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
  { id: 'p10', seat: 10, nickname: 'Thợ Săn Huyết', avatarUrl: null, isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
  { id: 'p11', seat: 11, nickname: 'Bảo Vệ Đêm', avatarUrl: null, isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
  { id: 'p12', seat: 12, nickname: 'Phù Thủy Tối', avatarUrl: null, isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
  { id: 'p13', seat: 13, nickname: 'Dân Làng Cổ', avatarUrl: null, isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
  { id: 'p14', seat: 14, nickname: 'Sói Đầu Đàn', avatarUrl: null, isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
  { id: 'p15', seat: 15, nickname: 'Cô Gái Rừng', avatarUrl: null, isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
  { id: 'p16', seat: 16, nickname: 'Thị Trưởng', avatarUrl: null, isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
];

export const WerewolfGameApp: React.FC<WerewolfGameAppProps> = ({
  store,
  onEmitAction,
  onSendChat,
}) => {
  const [state, setState] = useState(store.getState());
  const [chatInput, setChatInput] = useState('');
  const [isPov2, setIsPov2] = useState(false);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>('p2');
  const [demoCouncilSize, setDemoCouncilSize] = useState<number>(8);
  const [demoPhase, setDemoPhase] = useState<'DAY_VOTING' | 'NIGHT_WEREWOLVES' | 'DAY_DEFENSE'>('DAY_VOTING');
  const [isDealingSequence, setIsDealingSequence] = useState(false);
  const [isCenterRevealOpen, setIsCenterRevealOpen] = useState(false);

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

  // Keybind listeners: KeyV (POV toggle), KeyE (Debate), Digit1 (Vote selected target), Space (Skip vote)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'KeyV') {
        setIsPov2((prev) => !prev);
      } else if (e.code === 'KeyE') {
        onEmitAction('day:debate', { message: 'Tôi khẳng định mình là Dân làng lương thiện!' });
      } else if (e.code === 'Digit1') {
        if (selectedTargetId) {
          werewolfAudio.playGavel();
          onEmitAction('day:vote', { targetId: selectedTargetId });
        }
      } else if (e.code === 'Space') {
        e.preventDefault();
        werewolfAudio.playVoteStamp();
        onEmitAction('day:vote', { targetId: 'SKIP' });
      } else if (e.code === 'KeyC') {
        store.toggleCardReveal();
        werewolfAudio.playCardDeal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEmitAction, selectedTargetId, store]);

  // Dynamic players list resolution (from live room or demo council size)
  const activePlayers: PublicPlayerView[] = useMemo(() => {
    if (state.room?.players && state.room.players.length > 0) {
      return state.room.players;
    }
    return ALL_SAMPLE_PLAYERS.slice(0, demoCouncilSize);
  }, [state.room?.players, demoCouncilSize]);

  // Dynamic effective room object
  const effectiveRoom = useMemo(() => {
    if (state.room) {
      return state.room;
    }
    return {
      id: 'room_council_demo',
      code: 'DEMO88',
      hostId: 'p4',
      phase: demoPhase,
      round: 1,
      stateVersion: 1,
      phaseEndsAt: Date.now() + 60000,
      serverNow: Date.now(),
      settings: { maxPlayers: demoCouncilSize, isPrivate: false },
      players: activePlayers,
      me: {
        id: activePlayers[activePlayers.length - 1]?.id || 'p8',
        role: 'VILLAGER' as Role,
        isAlive: true,
      },
      day: {
        tally: { p2: 3, p6: 1 },
        voted: ['p1', 'p3', 'p6'],
        accusedId: 'p2',
      },
      winner: null as any,
    };
  }, [state.room, activePlayers, demoPhase, demoCouncilSize]);

  const myPlayerInfo = activePlayers.find((p) => p.id === effectiveRoom.me?.id) || activePlayers[activePlayers.length - 1];
  const myNickname =
    myPlayerInfo?.nickname ||
    (typeof window !== 'undefined' ? sessionStorage.getItem('werewolf_nickname') || 'Thợ Săn Bạn' : 'Thợ Săn Bạn');

  const [dealNotification, setDealNotification] = useState<string | null>(null);

  // Resolved current role: prioritizes state.assignedRole, then room.me.role, then fallback
  const myCurrentRole: Role = useMemo(() => {
    return state.assignedRole || (effectiveRoom.me?.role as Role) || 'SEER';
  }, [state.assignedRole, effectiveRoom.me?.role]);

  // Trigger dealing animation automatically when game phase enters ASSIGN_ROLES
  useEffect(() => {
    if (effectiveRoom.phase === 'ASSIGN_ROLES') {
      setIsDealingSequence(true);
      setIsCenterRevealOpen(false);
      werewolfAudio.playCardDeal();
      const timer = setTimeout(() => {
        setIsDealingSequence(false);
        setIsCenterRevealOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [effectiveRoom.phase]);

  const handleRandomDeal = () => {
    // 1. Play dealing audio and trigger 3D table card flight
    setIsDealingSequence(true);
    setIsCenterRevealOpen(false);

    werewolfAudio.playCardDeal();
    setTimeout(() => werewolfAudio.playCardDeal(), 220);
    setTimeout(() => werewolfAudio.playCardDeal(), 450);
    setTimeout(() => werewolfAudio.playCardDeal(), 700);

    const count = activePlayers.length;
    const balancedDeck = generateBalancedDeck(count);
    const shuffled = shuffleArray(balancedDeck);

    const myIndex = activePlayers.findIndex((p) => p.id === myPlayerInfo?.id);
    const myNewRole = shuffled[myIndex >= 0 ? myIndex : shuffled.length - 1];
    const myRoleInfo = getRoleInfo(myNewRole);
    const myTeam =
      myRoleInfo.category === 'werewolf'
        ? 'WEREWOLF'
        : myRoleInfo.category === 'third'
        ? 'NEUTRAL'
        : 'VILLAGE';

    const wolves = activePlayers
      .filter((_, idx) => {
        const r = shuffled[idx];
        return r === 'WEREWOLF' || r === 'BIG_BAD_WOLF' || r === 'WOLF_CUB' || r === 'LONE_WOLF';
      })
      .map((p) => ({ id: p.id, nickname: p.nickname }));

    store.setAssignedRole({
      role: myNewRole,
      team: myTeam as any,
      teammates: wolves,
    });
    store.setCardRevealed(true);

    setDealNotification(
      `🎴 Đang chia bài cho ${count} thành viên Hội Đồng...`
    );

    // 2. After 1.5s dealing animation across table, grand reveal in center of screen
    setTimeout(() => {
      setIsDealingSequence(false);
      setIsCenterRevealOpen(true);

      if (myRoleInfo.category === 'werewolf') {
        werewolfAudio.playWolfHowl();
      } else if (myRoleInfo.category === 'third') {
        werewolfAudio.playWhisper();
      } else {
        werewolfAudio.playBell();
      }

      setDealNotification(
        `✨ Bạn nhận lá bài: ${myRoleInfo.nameVN} (${myRoleInfo.categoryLabel})`
      );
      setTimeout(() => setDealNotification(null), 4000);
    }, 1500);
  };

  const isNight = effectiveRoom.phase.includes('NIGHT');
  const remainingSeconds = Math.max(0, Math.ceil(state.remainingMs ? state.remainingMs / 1000 : 45));
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

  // Selected player for voting or night action
  const selectedPlayer = activePlayers.find((p) => p.id === selectedTargetId);
  const accusedPlayerId = effectiveRoom.day?.accusedId || 'p2';
  const effectiveTally: Record<string, number> = (effectiveRoom.day?.tally as any) || { p2: 3, p6: 1 };
  const aliveCount = activePlayers.filter((p) => p.isAlive).length;

  return (
    <div className="relative w-screen h-screen bg-black text-gray-100 overflow-hidden font-game select-none">
      {/* 1. INTERACTIVE 3D WEREWOLF ROUND TABLE FIRST-PERSON ENGINE */}
      <LiarsBar3DExperience
        room={effectiveRoom}
        currentPlayerId={myPlayerInfo?.id}
        isPov2={isPov2}
        setIsPov2={setIsPov2}
        selectedTargetId={selectedTargetId}
        isDealing={isDealingSequence}
        onAimAtPlayer={(targetId: string) => {
          // Raycast hover feedback
        }}
        onSelectTarget={(targetId: string) => {
          setSelectedTargetId(targetId);
        }}
        onShootPlayer={(targetId: string) => {
          setSelectedTargetId(targetId);
          onEmitAction('day:vote', { targetId });
        }}
      />

      {/* 2ND POV Camera Badge */}
      {isPov2 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none bg-red-950/90 border border-red-500/80 px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.6)] flex items-center gap-2 animate-fadeIn">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span className="text-xs font-black uppercase text-red-200 tracking-wider font-display">
            GÓC NHÌN TOÀN CẢNH BÀN HỘI ĐỒNG (2ND POV)
          </span>
        </div>
      )}

      {/* 2. TOP BAR: TURN INFO, DYNAMIC COUNCIL SIZING & POV TOGGLE */}
      <header className="absolute top-3 inset-x-0 z-30 flex justify-center pointer-events-none px-6">
        <div className="flex items-center gap-3 pointer-events-auto bg-black/85 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 shadow-2xl">
          {/* Phase & Timer */}
          <div className="flex items-center gap-2 pr-3 border-r border-white/10">
            <span className={`w-2 h-2 rounded-full ${isNight ? 'bg-purple-500' : 'bg-red-500'} animate-ping`} />
            <span className="text-xs font-bold text-red-400 font-display uppercase tracking-wider">
              {effectiveRoom.phase.replace(/_/g, ' ')}
            </span>
            <span className="text-lg font-black font-display text-red-500 neon-text-red leading-none">
              {formatTimer(remainingSeconds)}
              <span className="text-[10px] text-red-300 ml-0.5">s</span>
            </span>
          </div>

          {/* Accused Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-950/60 border border-red-500/40 text-[11px] font-mono text-red-200">
            <span className="text-amber-400 font-bold">#02 LordVader:</span>
            <span className="font-black text-amber-300">3/{Math.ceil(aliveCount / 2) + 1} Phiếu</span>
          </div>

          {/* Dynamic Council Participant Sizer (4 to 16 seats) */}
          <div className="flex items-center gap-1 pl-2 border-l border-white/10">
            <span className="text-[9px] font-mono text-stone-400 uppercase hidden md:inline">Ghế Bàn:</span>
            <div className="flex items-center gap-0.5 bg-zinc-900/80 p-0.5 rounded-full border border-white/10">
              {[4, 6, 8, 10, 12, 16].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    setDemoCouncilSize(num);
                    werewolfAudio.playVoteStamp();
                  }}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono transition ${
                    activePlayers.length === num
                      ? 'bg-amber-600 text-white shadow-[0_0_10px_rgba(217,119,6,0.7)]'
                      : 'text-stone-400 hover:text-white hover:bg-zinc-800'
                  }`}
                  title={`${num} Người tham gia bàn hội đồng`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Random Card Deal Engine Button */}
          <div className="flex items-center pl-2 border-l border-white/10">
            <button
              type="button"
              onClick={handleRandomDeal}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-black font-black text-[11px] font-display uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.6)] border border-amber-300 transition-all transform hover:scale-105 active:scale-95"
              title="Phát bài ngẫu nhiên cho tất cả người chơi trong phòng"
            >
              <span className="text-sm">🎴</span>
              <span>Phát Bài Ngẫu Nhiên</span>
            </button>
          </div>

          {/* Phase Quick Toggle for Testing (Day / Night) */}
          <div className="flex items-center gap-1 pl-2 border-l border-white/10">
            <button
              type="button"
              onClick={() => {
                setDemoPhase('DAY_VOTING');
                werewolfAudio.playBell();
              }}
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-display transition ${
                !isNight ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              ☀️ Ngày
            </button>
            <button
              type="button"
              onClick={() => {
                setDemoPhase('NIGHT_WEREWOLVES');
                werewolfAudio.playWolfHowl();
              }}
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-display transition ${
                isNight ? 'bg-purple-950 text-purple-300 border border-purple-500/60 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              🌙 Đêm
            </button>
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

      {/* Random Deal Notification Banner */}
      {dealNotification && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 bg-gradient-to-r from-amber-950 via-zinc-950 to-amber-950 border-2 border-amber-500/80 px-6 py-2 rounded-2xl shadow-[0_0_35px_rgba(245,158,11,0.7)] flex items-center gap-3 animate-fadeIn">
          <span className="text-2xl animate-bounce">🎴</span>
          <span className="text-xs font-display font-black text-amber-200 tracking-wide uppercase">
            {dealNotification}
          </span>
        </div>
      )}

      {/* 3. STREAMER PROFILE & WEBCAM (TOP LEFT) */}
      <aside className="absolute top-3 left-4 z-30 flex items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-2.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
          <div className="relative w-8 h-8 rounded-full border border-amber-400/80 bg-zinc-900 overflow-hidden flex items-center justify-center text-sm shadow">
            <img
              src={`/assets/characters/${
                (typeof window !== 'undefined' && localStorage.getItem('werewolf_selected_character')) || 'cowboy'
              }_idle.png`}
              alt="Avatar"
              className="w-full h-full object-cover object-top"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-black animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-amber-300 font-display leading-tight">
              {myNickname}
            </span>
            <div className="flex items-center gap-1 text-[9px] font-mono text-emerald-400">
              <span className="w-1 h-2 bg-emerald-400 rounded-full eq-bar-1" />
              <span className="w-1 h-3 bg-emerald-400 rounded-full eq-bar-2" />
              <span>MIC SỐNG</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => (window.location.href = '/')}
          className="px-2.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-slate-300 hover:text-white text-[11px] font-mono flex items-center gap-1 transition-colors"
        >
          <span className="material-symbols-outlined text-[14px]">logout</span>
          <span>Rời Bàn</span>
        </button>
      </aside>

      {/* 4. LEFT HUD: DYNAMIC COUNCIL ROSTER (SHOWS EXACT PARTICIPANTS) */}
      <aside className="absolute left-4 top-16 z-30 w-56 flex flex-col gap-1.5 pointer-events-auto">
        <div className="bg-black/75 backdrop-blur-md p-2.5 rounded-xl border border-white/10 shadow-2xl">
          <div className="text-[9px] font-mono uppercase tracking-wider text-gray-400 mb-1.5 flex items-center justify-between pb-1 border-b border-white/10">
            <span className="font-bold flex items-center gap-1 text-slate-200">
              <span className="material-symbols-outlined text-[12px] text-amber-400">groups</span>
              <span>HỘI ĐỒNG ({aliveCount}/{activePlayers.length})</span>
            </span>
            <span className="text-emerald-400 font-bold text-[9px]">SỐNG {aliveCount}</span>
          </div>

          <div className="space-y-1 text-[10px] max-h-48 overflow-y-auto pr-1">
            {activePlayers.map((p) => {
              const isSelected = selectedTargetId === p.id;
              const isAccused = accusedPlayerId === p.id;
              const voteCount = effectiveTally[p.id] || 0;
              const isMe = p.id === myPlayerInfo?.id || p.id === 'p8' || p.seat === activePlayers.length;

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    if (p.isAlive && !isMe) {
                      setSelectedTargetId(p.id);
                      werewolfAudio.playVoteStamp();
                    }
                  }}
                  className={`flex items-center justify-between px-2 py-1 rounded transition-all cursor-pointer ${
                    !p.isAlive
                      ? 'bg-zinc-900/40 text-stone-500 line-through cursor-not-allowed opacity-60'
                      : isSelected
                      ? 'bg-red-950/90 border border-red-500 text-white font-bold shadow-[0_0_10px_rgba(220,38,38,0.5)]'
                      : isAccused
                      ? 'bg-amber-950/70 border border-amber-500/50 text-amber-200 font-bold animate-pulse'
                      : isMe
                      ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-200'
                      : 'hover:bg-zinc-800/80 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-mono text-[9px] text-stone-400">#{p.seat < 10 ? `0${p.seat}` : p.seat}</span>
                    <span className="truncate">{p.nickname}</span>
                    {isMe && <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1 rounded">Bạn</span>}
                  </div>

                  <div className="shrink-0 flex items-center gap-1 font-mono text-[9px]">
                    {!p.isAlive ? (
                      <span className="text-stone-500 font-bold">💀 Chết</span>
                    ) : voteCount > 0 ? (
                      <span className="text-red-400 font-bold bg-red-950/80 px-1 rounded border border-red-500/40">
                        {voteCount} Phiếu
                      </span>
                    ) : (
                      <span className="text-emerald-400">Sống</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* 4.5. BOTTOM LEFT: PLAYER ROLE CARD HUD (3D FLIP, ACTIONS & LORE) */}
      <aside className="absolute left-4 bottom-3 z-40">
        <PlayerRoleCard
          role={myCurrentRole}
          team={state.assignedTeam}
          wolfTeammates={state.wolfTeammates}
          lover={(effectiveRoom.me as any)?.lover}
          isCardRevealed={state.isCardRevealed}
          onToggleReveal={() => {
            store.toggleCardReveal();
            werewolfAudio.playCardDeal();
          }}
          onOpenCenterReveal={() => setIsCenterRevealOpen(true)}
          onSelectRoleTest={(newRole) => {
            const roleInfo = getRoleInfo(newRole);
            const team =
              roleInfo.category === 'werewolf'
                ? 'WEREWOLF'
                : roleInfo.category === 'third'
                ? 'NEUTRAL'
                : 'VILLAGE';
            store.setAssignedRole({
              role: newRole,
              team: team as any,
            });
            werewolfAudio.playCardDeal();
          }}
          isAlive={myPlayerInfo?.isAlive}
        />
      </aside>

      {/* 5. RIGHT HUD: COMBAT / TRIAL LOG & IN-GAME CHAT STREAM */}
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
              <span className="text-amber-300 font-semibold">#02 LordVader:</span> &ldquo;Tôi là Dân làng lương thiện!&rdquo;
            </div>
            <div className="border-l-2 border-red-500 pl-2 text-[11px] text-red-200 font-bold">
              #02 LordVader đang có 3 phiếu kết tội.
            </div>
          </div>
        </div>

        {/* Live Chat Box */}
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

      {/* 6. BOTTOM ACTION CONTROLLER BAR (PURE WEREWOLF GAME RULES) */}
      <footer className="absolute bottom-3 inset-x-0 z-30 flex justify-center px-4 pointer-events-auto">
        <div className="bg-black/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/15 shadow-2xl flex items-center gap-2.5 max-w-2xl w-full justify-between">
          {/* Main Action Button */}
          {selectedPlayer && selectedPlayer.isAlive && selectedPlayer.id !== myPlayerInfo?.id ? (
            <button
              type="button"
              onClick={() => {
                if (isNight) {
                  werewolfAudio.playWolfHowl();
                  onEmitAction('night:wolfVote', { targetId: selectedPlayer.id });
                } else {
                  werewolfAudio.playGavel();
                  onEmitAction('day:vote', { targetId: selectedPlayer.id });
                }
              }}
              className="flex-1 bg-gradient-to-r from-red-700 to-rose-800 hover:from-red-600 hover:to-rose-700 border border-red-400/80 text-white rounded-xl px-3.5 py-2 flex items-center justify-between text-xs font-bold transition shadow-[0_0_20px_rgba(220,38,38,0.6)] animate-pulse"
            >
              <span className="flex items-center gap-2 font-display">
                <span>{isNight ? '🐺' : '🪢'}</span>
                <span>
                  {isNight ? 'Biểu quyết Cắn' : 'Bỏ phiếu Treo cổ'} #{selectedPlayer.seat} {selectedPlayer.nickname}
                </span>
              </span>
              <kbd className="px-1.5 py-0.5 bg-black/50 rounded text-[9px] font-mono text-red-200 border border-white/20">
                [1]
              </kbd>
            </button>
          ) : (
            <div className="flex-1 bg-zinc-900/60 border border-white/5 rounded-xl px-3 py-2 flex items-center justify-center gap-2 text-xs text-stone-400 font-mono">
              <span className="material-symbols-outlined text-[16px] text-amber-400">touch_app</span>
              <span>Click chọn 1 người chơi trên bàn 3D để biểu quyết</span>
            </div>
          )}

          {/* Quick Debate Button */}
          <button
            type="button"
            onClick={() => {
              onEmitAction('day:debate', { message: 'Tôi khẳng định mình là Dân làng lương thiện!' });
            }}
            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-slate-200 hover:text-white rounded-xl px-3.5 py-2 flex items-center gap-2 text-xs font-bold transition shadow"
          >
            <span className="flex items-center gap-1.5 font-display">
              <span>🗣️</span> Tranh Luận
            </span>
            <kbd className="px-1.5 py-0.5 bg-black/60 rounded text-[9px] font-mono text-gray-400 border border-white/10">
              [E]
            </kbd>
          </button>

          {/* Skip / Blank Vote Button */}
          <button
            type="button"
            onClick={() => {
              werewolfAudio.playVoteStamp();
              onEmitAction('day:vote', { targetId: 'SKIP' });
            }}
            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-gray-300 hover:text-white rounded-xl px-3.5 py-2 flex items-center gap-2 text-xs font-bold transition"
          >
            <span className="flex items-center gap-1.5 font-display">
              <span>🕊️</span> Phiếu Trắng
            </span>
            <kbd className="px-1.5 py-0.5 bg-black/60 rounded text-[9px] font-mono text-gray-400 border border-white/10">
              [SPACE]
            </kbd>
          </button>
        </div>
      </footer>

      {/* 7. GAME OVER VICTORY / DEFEAT MODAL */}
      {(effectiveRoom.phase === 'GAME_OVER' || (effectiveRoom as any).winner) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="bg-[#111622] border border-amber-500/50 rounded-2xl p-8 max-w-lg w-full text-center shadow-[0_0_50px_rgba(245,158,11,0.3)] animate-fadeIn">
            <span className="text-4xl block mb-2">{(effectiveRoom as any).winner === 'WEREWOLF' ? '🐺' : '🏆'}</span>
            <h2 className="font-syne font-extrabold text-2xl uppercase text-amber-400 tracking-wider">
              {(effectiveRoom as any).winner === 'WEREWOLF'
                ? 'PHE MA SÓI THẮNG!'
                : (effectiveRoom as any).winner === 'VILLAGE'
                ? 'PHE DÂN LÀNG THẮNG!'
                : 'TRÒ CHƠI KẾT THÚC!'}
            </h2>
            <p className="font-geist text-xs text-slate-300 mt-2">
              Toàn bộ danh tính đã được hé lộ. Thành tích và phần thưởng đã được cập nhật vào cơ sở dữ liệu!
            </p>

            <div className="my-6 grid grid-cols-3 gap-2">
              <div className="bg-[#1a2030] p-3 rounded-xl border border-white/10">
                <span className="text-[10px] text-slate-400 font-space uppercase block">Điểm Danh Vọng</span>
                <span className="text-lg font-bold text-emerald-400 font-syne">+25 Elo</span>
              </div>
              <div className="bg-[#1a2030] p-3 rounded-xl border border-white/10">
                <span className="text-[10px] text-slate-400 font-space uppercase block">Tiền Thưởng Bạc</span>
                <span className="text-lg font-bold text-amber-400 font-syne">+180 Bạc</span>
              </div>
              <div className="bg-[#1a2030] p-3 rounded-xl border border-white/10">
                <span className="text-[10px] text-slate-400 font-space uppercase block">Kinh Nghiệm</span>
                <span className="text-lg font-bold text-purple-400 font-syne">+90 EXP</span>
              </div>
            </div>

            <button
              onClick={() => (window.location.href = '/')}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-800 to-red-600 hover:from-red-700 hover:to-red-500 text-white font-space font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-950/60 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">home</span>
              <span>QUAY VỀ SẢNH CHỜ</span>
            </button>
          </div>
        </div>
      )}

      {/* 8. DEALING ANIMATION BANNER */}
      {isDealingSequence && (
        <div className="fixed inset-0 z-40 pointer-events-none flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] animate-fadeIn">
          <div className="bg-zinc-950/95 border-2 border-amber-500/90 px-6 py-3.5 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.6)] flex items-center gap-3.5 animate-pulse">
            <span className="text-3xl animate-bounce">🎴</span>
            <div className="flex flex-col">
              <span className="text-sm font-display font-black text-amber-300 tracking-wider uppercase">
                QUẢN TRÒ ĐANG CHIA BÀI CHO HỘI ĐỒNG...
              </span>
              <span className="text-[11px] font-mono text-stone-300">
                Lá bài số phận đang bay tới từng vị trí trên bàn phán quyết
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 9. CENTER-SCREEN GRAND ROLE CARD REVEAL (100% COMPLETE UNCROPPED ARTWORK) */}
      <CenterRoleRevealModal
        isOpen={isCenterRevealOpen}
        role={myCurrentRole}
        team={state.assignedTeam}
        wolfTeammates={state.wolfTeammates}
        lover={(effectiveRoom.me as any)?.lover}
        onClose={() => setIsCenterRevealOpen(false)}
      />
    </div>
  );
};

export default WerewolfGameApp;
