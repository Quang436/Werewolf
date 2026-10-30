'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const [hasDealt, setHasDealt] = useState(false);
  const [isCouncilCollapsed, setIsCouncilCollapsed] = useState(false);
  const [isBattleLogCollapsed, setIsBattleLogCollapsed] = useState(false);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);

  // Mic & Speaker controls
  const [isMicOn, setIsMicOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [nightNotification, setNightNotification] = useState<string | null>(null);

  const handleSwitchToNight = useCallback(() => {
    setDemoPhase('NIGHT_WEREWOLVES');
    werewolfAudio.playWolfHowl();
    werewolfAudio.playWhisper();
    setNightNotification('🌙 ĐÊM XUỐNG: Toàn bộ ngôi làng chìm vào giấc ngủ... [Tất cả người chơi gục đầu xuống bàn]');
    setTimeout(() => setNightNotification(null), 6000);
  }, []);

  const handleSwitchToDay = useCallback(() => {
    setDemoPhase('DAY_VOTING');
    werewolfAudio.playBell();
    setNightNotification('☀️ TRỜI SÁNG: Mọi người thức dậy và kiểm tra người sống sót!');
    setTimeout(() => setNightNotification(null), 6000);
  }, []);

  const handleCloseCenterReveal = useCallback(() => {
    setIsCenterRevealOpen(false);
    // Tự động kích hoạt chế độ Đi Ngủ sau khi xem xong bài!
    handleSwitchToNight();
  }, [handleSwitchToNight]);

  const handleOpenCenterReveal = useCallback(() => {
    setIsCenterRevealOpen(true);
  }, []);

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
        if (isCenterRevealOpen) {
          handleCloseCenterReveal();
        } else {
          store.toggleCardReveal();
        }
        werewolfAudio.playCardDeal();
      } else if (e.code === 'KeyM') {
        setIsMicOn((prev) => !prev);
        werewolfAudio.playVoteStamp();
      } else if (e.code === 'KeyU') {
        setIsSpeakerOn((prev) => {
          const next = !prev;
          werewolfAudio.setMuted(!next);
          if (next) werewolfAudio.playVoteStamp();
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEmitAction, selectedTargetId, store]);

  // Dynamic players list resolution (from live room or demo council size)
  // Combines real joined human players with council member seats up to room capacity
  // so the table is NEVER empty and always has full 3D characters sitting at all seats!
  const activePlayers: PublicPlayerView[] = useMemo(() => {
    const realPlayers = state.room?.players || [];
    const targetCapacity = Math.max(
      state.room?.settings?.maxPlayers || 8,
      realPlayers.length,
      demoCouncilSize || 8,
      6
    );

    // If no real room or no real players, use sample players
    if (!state.room || realPlayers.length === 0) {
      return ALL_SAMPLE_PLAYERS.slice(0, targetCapacity);
    }

    // When real players exist in room:
    // Take real players, and fill remaining seats with council members from ALL_SAMPLE_PLAYERS
    const result: PublicPlayerView[] = [...realPlayers];
    const usedSeats = new Set(realPlayers.map((p) => p.seat));
    const usedIds = new Set(realPlayers.map((p) => p.id));

    let sampleIdx = 0;
    for (let seatNum = 1; seatNum <= targetCapacity; seatNum++) {
      if (result.length >= targetCapacity) break;
      if (usedSeats.has(seatNum)) continue;

      // Find an unused sample player
      while (
        sampleIdx < ALL_SAMPLE_PLAYERS.length &&
        usedIds.has(ALL_SAMPLE_PLAYERS[sampleIdx].id)
      ) {
        sampleIdx++;
      }

      const sample = ALL_SAMPLE_PLAYERS[sampleIdx % ALL_SAMPLE_PLAYERS.length];
      sampleIdx++;

      result.push({
        ...sample,
        id: `bot_${seatNum}_${sample.id}`,
        seat: seatNum,
        nickname: `${sample.nickname}`,
        connection: 'ONLINE',
      });
      usedSeats.add(seatNum);
    }

    // Sort by seat number so seating arrangement is perfectly ordered around table
    return result.sort((a, b) => a.seat - b.seat);
  }, [state.room, demoCouncilSize]);

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

  const myPlayerInfo = useMemo(() => {
    return (
      activePlayers.find((p) => p.id === effectiveRoom.me?.id) ||
      activePlayers.find((p) => !p.id.startsWith('bot_')) ||
      activePlayers[0]
    );
  }, [activePlayers, effectiveRoom.me?.id]);

  const myNickname =
    myPlayerInfo?.nickname ||
    (typeof window !== 'undefined' ? sessionStorage.getItem('werewolf_nickname') || 'Thợ Săn Bạn' : 'Thợ Săn Bạn');

  const [dealNotification, setDealNotification] = useState<string | null>(null);

  // Resolved current role: prioritizes state.assignedRole, then room.me.role, then fallback
  const myCurrentRole: Role = useMemo(() => {
    return state.assignedRole || (effectiveRoom.me?.role as Role) || 'SEER';
  }, [state.assignedRole, effectiveRoom.me?.role]);

  // If entering an ongoing active game where roles are already assigned and not in lobby:
  useEffect(() => {
    if (state.assignedRole || (effectiveRoom.phase !== 'LOBBY' && (effectiveRoom.me as any)?.role && effectiveRoom.phase !== 'ASSIGN_ROLES')) {
      setHasDealt(true);
    }
  }, [state.assignedRole, effectiveRoom.phase, effectiveRoom.me]);

  // Unified Majestic 5.0-Second Dealing Sequence Function
  const runDealingSequence = useCallback(() => {
    setIsDealingSequence(true);
    setHasDealt(false);
    setIsCenterRevealOpen(false);

    const count = activePlayers.length;
    setDealNotification(null);

    // Sequential audio swooshes synchronized with 3D card flight (0 to 3.6s)
    const launchDuration = 3600;
    for (let i = 0; i < count; i++) {
      const delay = (i / count) * launchDuration;
      setTimeout(() => {
        werewolfAudio.playCardDeal();
      }, delay);
    }

    // At 5.0 seconds: all cards land smoothly, secret role modal opens in center of screen
    const timer = setTimeout(() => {
      setIsDealingSequence(false);
      setHasDealt(true);
      werewolfAudio.playCardDeal();
      setIsCenterRevealOpen(true);
      setDealNotification(`✨ Lá bài định mệnh đã được phát! Hãy đọc kỹ năng vai trò của bạn.`);
      setTimeout(() => setDealNotification(null), 5000);
    }, 5000);

    return () => clearTimeout(timer);
  }, [activePlayers.length]);

  // 1. Listen for room broadcast dealing event via socket (state.dealNonce)
  const lastDealNonceRef = useRef(0);
  useEffect(() => {
    if (state.dealNonce && state.dealNonce > lastDealNonceRef.current) {
      lastDealNonceRef.current = state.dealNonce;
      runDealingSequence();
    }
  }, [state.dealNonce, runDealingSequence]);

  // 2. Trigger dealing animation automatically when game phase enters ASSIGN_ROLES (only once per phase entry)
  const lastPhaseRef = useRef<string | null>(null);
  useEffect(() => {
    if (effectiveRoom.phase === 'ASSIGN_ROLES' && lastPhaseRef.current !== 'ASSIGN_ROLES') {
      lastPhaseRef.current = 'ASSIGN_ROLES';
      runDealingSequence();
    } else if (effectiveRoom.phase !== 'ASSIGN_ROLES') {
      lastPhaseRef.current = effectiveRoom.phase;
    }
  }, [effectiveRoom.phase, runDealingSequence]);

  // 3. User clicks "Phát Bài Ngẫu Nhiên" button (Host or local testing)
  const handleRandomDeal = useCallback(() => {
    if (isDealingSequence) return;

    // A. If connected to a multiplayer room, broadcast to ALL other players via socket!
    if (state.room) {
      onEmitAction('room:deal', {});
    }

    // B. Generate balanced roles locally as fallback or for local simulation
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

    // C. Run 5.0-second dealing sequence
    runDealingSequence();
  }, [activePlayers, isDealingSequence, myPlayerInfo?.id, onEmitAction, runDealingSequence, state.room, store]);

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
        hasDealtCards={hasDealt}
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

      {/* 2. UNIFIED TOP NAVIGATION & CONTROLS BAR (RESPONSIVE & ZERO OVERLAPPING) */}
      <header className="absolute top-2.5 inset-x-3 md:inset-x-4 z-30 flex items-center justify-between pointer-events-none gap-2">
        {/* Left: Streamer Profile + Mic / Speaker Controls + Rời Bàn */}
        <div className="flex items-center gap-1.5 md:gap-2 pointer-events-auto bg-black/85 backdrop-blur-md px-2.5 md:px-3 py-1.5 rounded-full border border-white/10 shadow-2xl shrink-0">
          <div className="relative w-8 h-8 rounded-full border border-amber-400/80 bg-zinc-900 overflow-hidden flex items-center justify-center text-sm shadow shrink-0">
            <img
              src={`/assets/characters/${
                (typeof window !== 'undefined' && localStorage.getItem('werewolf_selected_character')) || 'cowboy'
              }_idle.png`}
              alt="Avatar"
              className="w-full h-full object-cover object-top"
            />
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-black ${
                isMicOn ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
              }`}
            />
          </div>

          <div className="hidden sm:flex flex-col pr-1 text-left">
            <span className="text-[11px] font-bold text-amber-300 font-display leading-tight truncate max-w-[90px] md:max-w-[120px]">
              {myNickname}
            </span>
            <span className="text-[9px] font-mono text-stone-400">
              Ghế #{myPlayerInfo?.seat || 1}
            </span>
          </div>

          {/* Mic Toggle Button */}
          <button
            type="button"
            onClick={() => {
              setIsMicOn((prev) => !prev);
              werewolfAudio.playVoteStamp();
            }}
            className={`px-2 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 transition cursor-pointer ${
              isMicOn
                ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/80 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                : 'bg-red-950/80 border border-red-500/50 text-red-300 hover:bg-red-900/80'
            }`}
            title={isMicOn ? 'Tắt Microphone [M]' : 'Bật Microphone [M]'}
          >
            <span className="material-symbols-outlined text-[13px]">
              {isMicOn ? 'mic' : 'mic_off'}
            </span>
            <span className="hidden md:inline">{isMicOn ? 'BẬT MIC' : 'TẮT MIC'}</span>
            {isMicOn && (
              <span className="flex items-center gap-0.5">
                <span className="w-0.5 h-2 bg-emerald-400 rounded-full eq-bar-1" />
                <span className="w-0.5 h-3 bg-emerald-400 rounded-full eq-bar-2" />
              </span>
            )}
          </button>

          {/* Speaker / Loa Toggle Button */}
          <button
            type="button"
            onClick={() => {
              const next = !isSpeakerOn;
              setIsSpeakerOn(next);
              werewolfAudio.setMuted(!next);
              if (next) werewolfAudio.playVoteStamp();
            }}
            className={`px-2 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 transition cursor-pointer ${
              isSpeakerOn
                ? 'bg-amber-950/80 border border-amber-500/50 text-amber-300 hover:bg-amber-900/80 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                : 'bg-zinc-900/80 border border-zinc-700 text-stone-400 hover:text-white'
            }`}
            title={isSpeakerOn ? 'Tắt Loa / Âm thanh [U]' : 'Bật Loa / Âm thanh [U]'}
          >
            <span className="material-symbols-outlined text-[13px]">
              {isSpeakerOn ? 'volume_up' : 'volume_off'}
            </span>
            <span className="hidden md:inline">{isSpeakerOn ? 'BẬT LOA' : 'TẮT LOA'}</span>
          </button>

          {/* Rời Bàn */}
          <button
            type="button"
            onClick={() => (window.location.href = '/')}
            className="px-2 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-stone-400 hover:text-white text-[10px] font-mono flex items-center gap-1 transition cursor-pointer"
            title="Rời phòng chơi"
          >
            <span className="material-symbols-outlined text-[13px]">logout</span>
            <span className="hidden lg:inline">Rời Bàn</span>
          </button>
        </div>

        {/* Center: Phase & Countdown Timer + Accused Status */}
        <div className="flex items-center gap-2 bg-black/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 shadow-2xl pointer-events-auto shrink-0">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isNight ? 'bg-purple-500' : 'bg-red-500'} animate-ping`} />
            <span className="text-xs font-bold text-red-400 font-display uppercase tracking-wider">
              {isNight ? '🌙 ' : '☀️ '}
              {effectiveRoom.phase.replace(/_/g, ' ')}
            </span>
            <span className="text-base font-black font-display text-red-500 neon-text-red leading-none">
              {formatTimer(remainingSeconds)}s
            </span>
          </div>

          <div className="hidden xl:flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-950/60 border border-red-500/40 text-[10px] font-mono text-red-200">
            <span className="text-amber-400 font-bold">#02 LordVader:</span>
            <span className="font-black text-amber-300">3/{Math.ceil(aliveCount / 2) + 1} Phiếu</span>
          </div>
        </div>

        {/* Right: Quick Controls (Phát bài, Ngày/Đêm, POV toggle, Sizer) */}
        <div className="flex items-center gap-1.5 md:gap-2 pointer-events-auto bg-black/85 backdrop-blur-md px-2.5 md:px-3 py-1.5 rounded-full border border-white/10 shadow-2xl shrink-0">
          {/* Dynamic Council Sizer (Hidden on small screens) */}
          <div className="hidden 2xl:flex items-center gap-0.5 bg-zinc-900/80 p-0.5 rounded-full border border-white/10">
            {[4, 6, 8, 12, 16].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => {
                  setDemoCouncilSize(num);
                  werewolfAudio.playVoteStamp();
                }}
                className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold font-mono transition ${
                  activePlayers.length === num
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-stone-400 hover:text-white'
                }`}
                title={`${num} Người tham gia`}
              >
                {num}
              </button>
            ))}
          </div>

          {/* Random Card Deal Button */}
          <button
            type="button"
            onClick={handleRandomDeal}
            disabled={isDealingSequence}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-black font-black text-[10px] font-display uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.5)] border border-amber-300 transition-all transform hover:scale-105 active:scale-95 ${
              isDealingSequence ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
            title="Phát bài ngẫu nhiên cho tất cả người chơi"
          >
            <span>🎴</span>
            <span className="hidden sm:inline">Phát Bài</span>
          </button>

          {/* Day / Night Quick Toggle */}
          <div className="flex items-center gap-0.5 bg-zinc-900 p-0.5 rounded-full border border-white/10">
            <button
              type="button"
              onClick={handleSwitchToDay}
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-display transition cursor-pointer ${
                !isNight
                  ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50 shadow'
                  : 'text-stone-500 hover:text-stone-300'
              }`}
              title="Chuyển sang Ban Ngày (Thức dậy)"
            >
              ☀️ Ngày
            </button>
            <button
              type="button"
              onClick={handleSwitchToNight}
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-display transition cursor-pointer ${
                isNight
                  ? 'bg-purple-950 text-purple-300 border border-purple-500/60 shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                  : 'text-stone-500 hover:text-stone-300'
              }`}
              title="Chuyển sang Ban Đêm (Cả làng đi ngủ)"
            >
              🌙 Đêm
            </button>
          </div>

          {/* 1ST / 2ND POV Camera */}
          <div className="flex items-center gap-0.5 bg-zinc-900 p-0.5 rounded-full border border-white/10">
            <button
              type="button"
              onClick={() => setIsPov2(false)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-display uppercase tracking-wider transition cursor-pointer ${
                !isPov2
                  ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow border border-red-400'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Góc nhìn người chơi [V]"
            >
              1ST
            </button>
            <button
              type="button"
              onClick={() => setIsPov2(true)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-display uppercase tracking-wider transition cursor-pointer ${
                isPov2
                  ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow border border-red-400'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Góc nhìn toàn cảnh [V]"
            >
              2ND
            </button>
          </div>
        </div>
      </header>

      {/* Night Fall / Day Break Cinematic Notification Banner */}
      {nightNotification && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 bg-zinc-950/95 backdrop-blur-md border border-purple-500/60 px-5 py-2 rounded-full shadow-[0_0_30px_rgba(168,85,247,0.4)] flex items-center gap-3 animate-fadeIn pointer-events-none">
          <span className="text-xl animate-bounce">🌙</span>
          <span className="text-xs font-display font-black text-purple-200 tracking-wider uppercase">
            {nightNotification}
          </span>
        </div>
      )}

      {/* Status Notification Pill (Only shown when NOT dealing, leaving 3D table completely unobstructed) */}
      {!isDealingSequence && dealNotification && !nightNotification && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 bg-zinc-950/85 backdrop-blur-md border border-amber-500/50 px-5 py-1.5 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.35)] flex items-center gap-2.5 animate-fadeIn pointer-events-none">
          <span className="text-base animate-bounce">🎴</span>
          <span className="text-[11px] font-display font-bold text-amber-200 tracking-wider uppercase">
            {dealNotification}
          </span>
        </div>
      )}

      {/* 4. LEFT HUD: DYNAMIC COUNCIL ROSTER (SHOWS EXACT PARTICIPANTS) */}
      <aside className="absolute left-4 top-16 z-30 pointer-events-auto">
        {isCouncilCollapsed ? (
          <button
            type="button"
            onClick={() => {
              werewolfAudio.playVoteStamp();
              setIsCouncilCollapsed(false);
            }}
            className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/80 hover:bg-black/95 backdrop-blur-md border border-amber-500/40 hover:border-amber-400 text-stone-200 hover:text-white shadow-[0_0_15px_rgba(0,0,0,0.8)] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer text-xs font-mono animate-fadeIn"
            title="Mở rộng danh sách Hội Đồng"
          >
            <div className="w-5 h-5 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
              <span className="material-symbols-outlined text-[13px]">groups</span>
            </div>
            <span className="font-bold font-display uppercase tracking-wider text-amber-300">
              Hội Đồng ({aliveCount}/{activePlayers.length})
            </span>
            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-500/40 font-bold">
              SỐNG {aliveCount}
            </span>
            <span className="text-[10px] text-stone-400 font-mono flex items-center gap-0.5 ml-0.5 group-hover:text-amber-200">
              <span>👁️ Mở</span>
            </span>
          </button>
        ) : (
          <div className="w-56 bg-black/75 backdrop-blur-md p-2.5 rounded-xl border border-white/10 shadow-2xl animate-fadeIn">
            <div className="text-[9px] font-mono uppercase tracking-wider text-gray-400 mb-1.5 flex items-center justify-between pb-1 border-b border-white/10">
              <span className="font-bold flex items-center gap-1 text-slate-200">
                <span className="material-symbols-outlined text-[12px] text-amber-400">groups</span>
                <span>HỘI ĐỒNG ({aliveCount}/{activePlayers.length})</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold text-[9px]">SỐNG {aliveCount}</span>
                <button
                  type="button"
                  onClick={() => {
                    werewolfAudio.playVoteStamp();
                    setIsCouncilCollapsed(true);
                  }}
                  className="w-5 h-5 rounded hover:bg-white/15 text-stone-400 hover:text-amber-300 flex items-center justify-center transition cursor-pointer"
                  title="Ẩn danh sách Hội Đồng"
                >
                  <span className="material-symbols-outlined text-[13px]">visibility_off</span>
                </button>
              </div>
            </div>

            <div className="space-y-1 text-[10px] max-h-48 overflow-y-auto pr-1">
              {activePlayers.map((p) => {
                const isSelected = selectedTargetId === p.id;
                const isAccused = accusedPlayerId === p.id;
                const voteCount = effectiveTally[p.id] || 0;
                const isMe = p.id === myPlayerInfo?.id || (!myPlayerInfo && p.seat === 1);

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
        )}
      </aside>

      {/* 4.5. BOTTOM LEFT: PLAYER ROLE CARD HUD (3D FLIP, ACTIONS & LORE) */}
      <aside className="absolute left-4 bottom-3 z-40">
        <PlayerRoleCard
          role={myCurrentRole}
          team={state.assignedTeam}
          wolfTeammates={state.wolfTeammates}
          lover={(effectiveRoom.me as any)?.lover}
          isCardRevealed={state.isCardRevealed}
          hasDealt={hasDealt}
          onDealNow={handleRandomDeal}
          onToggleReveal={() => {
            store.toggleCardReveal();
            werewolfAudio.playCardDeal();
          }}
          onOpenCenterReveal={handleOpenCenterReveal}
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
            setHasDealt(true);
            werewolfAudio.playCardDeal();
          }}
          isAlive={myPlayerInfo?.isAlive}
        />
      </aside>

      {/* 5. RIGHT HUD: COMBAT / TRIAL LOG & IN-GAME CHAT STREAM */}
      <aside className="absolute top-16 right-4 z-30 flex flex-col items-end pointer-events-auto gap-2">
        {/* Battle Log Box */}
        {isBattleLogCollapsed ? (
          <button
            type="button"
            onClick={() => {
              werewolfAudio.playVoteStamp();
              setIsBattleLogCollapsed(false);
            }}
            className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/80 hover:bg-black/95 backdrop-blur-md border border-amber-500/40 hover:border-amber-400 text-stone-200 hover:text-white shadow-[0_0_15px_rgba(0,0,0,0.8)] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer text-xs font-mono animate-fadeIn"
            title="Mở rộng Nhật Ký Bàn Đấu"
          >
            <div className="w-5 h-5 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400">
              <span className="material-symbols-outlined text-[13px]">history_edu</span>
            </div>
            <span className="text-[11px] font-bold text-amber-400 font-display tracking-wider">
              NHẬT KÝ BÀN ĐẤU
            </span>
            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-500/40 font-bold">
              LIVE
            </span>
            <span className="text-[10px] text-stone-400 font-mono flex items-center gap-0.5 ml-0.5 group-hover:text-amber-200">
              <span>👁️ Mở</span>
            </span>
          </button>
        ) : (
          <div className="w-72 bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-lg animate-fadeIn">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/10 mb-2">
              <span className="text-[11px] font-bold text-amber-400 font-display tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px] text-amber-400">history_edu</span>
                <span>NHẬT KÝ BÀN ĐẤU</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-500/40 font-bold">
                  LIVE
                </span>
                <button
                  type="button"
                  onClick={() => {
                    werewolfAudio.playVoteStamp();
                    setIsBattleLogCollapsed(true);
                  }}
                  className="w-5 h-5 rounded hover:bg-white/15 text-stone-400 hover:text-amber-300 flex items-center justify-center transition cursor-pointer"
                  title="Ẩn Nhật Ký Bàn Đấu"
                >
                  <span className="material-symbols-outlined text-[13px]">visibility_off</span>
                </button>
              </div>
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
        )}

        {/* Live Chat Box */}
        {isChatCollapsed ? (
          <button
            type="button"
            onClick={() => {
              werewolfAudio.playVoteStamp();
              setIsChatCollapsed(false);
            }}
            className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/80 hover:bg-black/95 backdrop-blur-md border border-white/20 hover:border-amber-400 text-stone-200 hover:text-white shadow-[0_0_15px_rgba(0,0,0,0.8)] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer text-xs font-mono animate-fadeIn"
            title="Mở rộng khung Trò Chuyện"
          >
            <div className="w-5 h-5 rounded-lg bg-zinc-800 border border-white/20 flex items-center justify-center text-slate-300">
              <span className="material-symbols-outlined text-[13px]">chat</span>
            </div>
            <span className="font-bold text-[11px] font-mono tracking-wider text-slate-200">
              TRÒ CHUYỆN
            </span>
            <span className="text-[10px] text-stone-400 font-mono flex items-center gap-0.5 ml-0.5 group-hover:text-amber-200">
              <span>👁️ Mở</span>
            </span>
          </button>
        ) : (
          <div className="w-72 bg-black/70 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-lg flex flex-col h-56 justify-between animate-fadeIn">
            <div className="flex items-center justify-between border-b border-white/10 pb-1 mb-1">
              <div className="flex items-center gap-1 flex-1">
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
              <button
                type="button"
                onClick={() => {
                  werewolfAudio.playVoteStamp();
                  setIsChatCollapsed(true);
                }}
                className="w-5 h-5 ml-1.5 rounded hover:bg-white/15 text-stone-400 hover:text-amber-300 flex items-center justify-center transition cursor-pointer"
                title="Ẩn khung Trò Chuyện"
              >
                <span className="material-symbols-outlined text-[13px]">visibility_off</span>
              </button>
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
        )}
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


      {/* 9. CENTER-SCREEN GRAND ROLE CARD REVEAL (100% COMPLETE UNCROPPED ARTWORK) */}
      <CenterRoleRevealModal
        isOpen={isCenterRevealOpen}
        role={myCurrentRole}
        team={state.assignedTeam}
        wolfTeammates={state.wolfTeammates}
        lover={(effectiveRoom.me as any)?.lover}
        onClose={handleCloseCenterReveal}
      />
    </div>
  );
};

export default WerewolfGameApp;
