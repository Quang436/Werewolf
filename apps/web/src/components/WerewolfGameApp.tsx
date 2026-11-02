'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChatChannel, PublicPlayerView, Role, Team } from '@werewolf/shared';
import { GameStateManager } from '../stores/game.store';
import { GameScene3D } from './GameScene3D';
import {
  CameraPerspective,
  isNightPhase,
  resolveVoteTally,
  werewolfAudio,
} from './scene3d.helpers';
import {
  generateBalancedDeck,
  getRoleInfo,
  shuffleArray,
} from '../constants/roles-data';
import { useGameLoopDirector } from '../hooks/useGameLoopDirector';

export interface WerewolfGameAppProps {
  store: GameStateManager;
  onEmitAction: (event: string, payload: unknown) => void;
  onSendChat: (channel: ChatChannel, text: string) => void;
}

const SAMPLE_NOIR_PLAYERS: PublicPlayerView[] = [
  { id: 'p1', seat: 1, nickname: 'Bác Sĩ', avatarUrl: null, isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
  { id: 'p2', seat: 2, nickname: 'LordVader', avatarUrl: null, isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
  { id: 'p3', seat: 3, nickname: 'Xemesis', avatarUrl: null, isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
  { id: 'p4', seat: 4, nickname: 'Quản Trò', avatarUrl: null, isHost: true, isAlive: true, ready: true, connection: 'ONLINE' },
  { id: 'p5', seat: 5, nickname: 'PewPew', avatarUrl: null, isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
  { id: 'p6', seat: 6, nickname: 'Độ Mixi', avatarUrl: null, isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
  { id: 'p7', seat: 7, nickname: 'Mặt Nạ', avatarUrl: null, isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
  { id: 'p8', seat: 8, nickname: 'Bạn', avatarUrl: null, isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
];

type LocalScenePhase =
  | 'DEALING_CARDS'
  | 'NIGHT_FALL'
  | 'NIGHT_BODYGUARD'
  | 'NIGHT_WEREWOLF'
  | 'NIGHT_SEER'
  | 'DAY_ANNOUNCE'
  | 'DAY_DISCUSSION'
  | 'DAY_VOTING'
  | 'DAY_EXECUTION'
  | 'EXECUTION_PHASE'
  | 'NIGHT_WEREWOLVES';

export const WerewolfGameApp: React.FC<WerewolfGameAppProps> = ({
  store,
  onEmitAction,
  onSendChat,
}) => {
  const [state, setState] = useState(store.getState());
  const [perspective, setPerspective] = useState<CameraPerspective>('1ST');
  const [localPhase, setLocalPhase] = useState<LocalScenePhase>('DEALING_CARDS');

  // Local player mortality & role assignment map (synced with server when in live room)
  const [executedIds, setExecutedIds] = useState<Set<string>>(() => new Set());
  const [seatRoles, setSeatRoles] = useState<Record<string, Role>>({});

  // Cinematic card dealing & manual inspect state
  const [dealTrigger, setDealTrigger] = useState<number>(0);
  const [hasDealtCards, setHasDealtCards] = useState<boolean>(false);
  const [isCardInspecting, setIsCardInspecting] = useState<boolean>(false);

  // Voting tokens & verdict state
  const [localVoteTally, setLocalVoteTally] = useState<Record<string, number>>({
    p2: 2,
    p6: 1,
  });
  const [myVotedTargetId, setMyVotedTargetId] = useState<string | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [verdictBanner, setVerdictBanner] = useState<string | null>(null);
  const [isPeacefulTie, setIsPeacefulTie] = useState<boolean>(false);

  // Hanging execution state
  const [condemnedPlayerId, setCondemnedPlayerId] = useState<string | null>(null);

  // Subtle peripheral audio & optional hidden-by-default whisper drawer
  const [isMicOn, setIsMicOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    return store.subscribe((newState) => {
      setState({ ...newState });
    });
  }, [store]);

  useEffect(() => {
    const timer = setInterval(() => {
      store.updateRemainingTime();
      setState({ ...store.getState() });
    }, 500);
    return () => clearInterval(timer);
  }, [store]);

  // Merge live room players (if connected) with full noir council seats, applying executed status
  const activePlayers: PublicPlayerView[] = useMemo(() => {
    const realPlayers = state.room?.players || [];
    const targetCapacity = Math.max(state.room?.settings?.maxPlayers || 8, realPlayers.length, 8);

    const savedNick =
      typeof window !== 'undefined' ? sessionStorage.getItem('werewolf_nickname') : null;

    let baseList: PublicPlayerView[];
    if (!state.room || realPlayers.length === 0) {
      baseList = SAMPLE_NOIR_PLAYERS.slice(0, targetCapacity).map((p) =>
        p.id === 'p8' && savedNick ? { ...p, nickname: savedNick } : p
      );
    } else {
      const result: PublicPlayerView[] = [...realPlayers];
      const usedSeats = new Set(realPlayers.map((p) => p.seat));
      let sampleIdx = 0;

      for (let seatNum = 1; seatNum <= targetCapacity; seatNum++) {
        if (result.length >= targetCapacity) break;
        if (usedSeats.has(seatNum)) continue;
        const sample = SAMPLE_NOIR_PLAYERS[sampleIdx % SAMPLE_NOIR_PLAYERS.length];
        sampleIdx++;
        result.push({
          ...sample,
          id: `bot_${seatNum}_${sample.id}`,
          seat: seatNum,
          connection: 'ONLINE',
        });
        usedSeats.add(seatNum);
      }
      baseList = result.sort((a, b) => a.seat - b.seat);
    }

    return baseList.map((p) => ({
      ...p,
      isAlive: p.isAlive && !executedIds.has(p.id),
    }));
  }, [state.room, executedIds]);

  const localPlayer = useMemo(() => {
    const meId = state.room?.me?.id;
    return (
      (meId ? activePlayers.find((p) => p.id === meId) : undefined) ||
      activePlayers.find((p) => !p.id.startsWith('bot_') && p.id === 'p8') ||
      activePlayers[activePlayers.length - 1] ||
      activePlayers[0]
    );
  }, [activePlayers, state.room?.me?.id]);

  const myCurrentRole: Role = useMemo(() => {
    return (
      state.assignedRole ||
      (state.room?.me?.role as Role | undefined) ||
      (localPlayer ? seatRoles[localPlayer.id] : undefined) ||
      'SEER'
    );
  }, [state.assignedRole, state.room?.me?.role, localPlayer, seatRoles]);

  // Trigger DEALING_CARDS sequence & assign balanced deck across all seats
  const triggerDealCards = useCallback(
    (emitToRoom: boolean) => {
      if (emitToRoom && state.room) {
        onEmitAction('room:deal', {});
      }

      const count = activePlayers.length;
      const deck = shuffleArray(generateBalancedDeck(count));
      const nextSeatRoles: Record<string, Role> = {};
      activePlayers.forEach((p, idx) => {
        nextSeatRoles[p.id] = deck[idx % deck.length];
      });
      setSeatRoles(nextSeatRoles);

      if (localPlayer && !state.room?.me?.role) {
        const myNewRole = nextSeatRoles[localPlayer.id] || 'SEER';
        const info = getRoleInfo(myNewRole);
        const thirdTeams: Team[] = ['LONE_WOLF', 'CULT_LEADER', 'HOODLUM', 'TANNER', 'VAMPIRE', 'LOVERS'];
        const myTeam: Team =
          info.category === 'werewolf'
            ? myNewRole === 'LONE_WOLF'
              ? 'LONE_WOLF'
              : 'WEREWOLF'
            : info.category === 'third'
            ? thirdTeams.includes(myNewRole as Team)
              ? (myNewRole as Team)
              : 'TANNER'
            : 'VILLAGE';
        store.setAssignedRole({
          role: myNewRole,
          team: myTeam,
        });
      }

      setExecutedIds(new Set());
      setCondemnedPlayerId(null);
      setIsPeacefulTie(false);
      setVerdictBanner(null);
      setMyVotedTargetId(null);
      setSelectedTargetId(null);
      setLocalVoteTally({ p2: 2, p6: 1 });
      setIsCardInspecting(false);
      setLocalPhase('DEALING_CARDS');
      setHasDealtCards(true);
      setDealTrigger((n) => n + 1);
    },
    [activePlayers, localPlayer, onEmitAction, state.room, store]
  );

  // Automatic initial card deal on table entry so DEALING_CARDS plays right away
  const didAutoDealRef = useRef(false);
  useEffect(() => {
    if (didAutoDealRef.current || activePlayers.length === 0) return;
    didAutoDealRef.current = true;
    const t = setTimeout(() => {
      triggerDealCards(false);
    }, 450);
    return () => clearTimeout(t);
  }, [activePlayers.length, triggerDealCards]);

  // Listen to server dealNonce or ASSIGN_ROLES phase
  const lastDealNonceRef = useRef(0);
  useEffect(() => {
    if (state.dealNonce && state.dealNonce > lastDealNonceRef.current) {
      lastDealNonceRef.current = state.dealNonce;
      triggerDealCards(false);
    }
  }, [state.dealNonce, triggerDealCards]);

  const lastServerPhaseRef = useRef<string | null>(null);
  useEffect(() => {
    const serverPhase = state.room?.phase;
    if (!serverPhase || serverPhase === lastServerPhaseRef.current) return;
    lastServerPhaseRef.current = serverPhase;

    if (serverPhase === 'ASSIGN_ROLES') {
      triggerDealCards(false);
    } else if (serverPhase === 'DAY_EXECUTION') {
      const accused = state.room?.day?.accusedId;
      if (accused) {
        setCondemnedPlayerId(accused);
        setLocalPhase('EXECUTION_PHASE');
      }
    }
  }, [state.room?.phase, state.room?.day?.accusedId, triggerDealCards]);

  // Effective phase & vote tally combining live server snapshot + local interactive state
  const effectivePhase: string = useMemo(() => {
    if (localPhase === 'EXECUTION_PHASE' || localPhase === 'DEALING_CARDS') {
      return localPhase;
    }
    if (state.room && state.room.phase !== 'LOBBY') {
      return state.room.phase;
    }
    return localPhase;
  }, [localPhase, state.room]);

  const isNight = isNightPhase(effectivePhase);
  const isExecutionPhase = effectivePhase === 'EXECUTION_PHASE' || effectivePhase === 'DAY_EXECUTION';

  const director = useGameLoopDirector({
    phase: effectivePhase,
    localPlayerId: localPlayer?.id,
    localRole: myCurrentRole,
    isAlive: localPlayer ? localPlayer.isAlive : true,
    players: activePlayers,
    eliminatedTonightFromServer: state.room?.eliminatedTonight,
    wolfVotesFromServer: state.room?.wolfPack?.votes,
    isMicActive: isMicOn,
    onEmitAction,
  });

  const canVote = (!isNight && !isExecutionPhase) || director.canInteractChair;

  const effectiveVoteTally: Record<string, number> = useMemo(() => {
    const serverTally = state.room?.day?.tally as Record<string, number> | undefined;
    if (serverTally && Object.keys(serverTally).length > 0) {
      return serverTally;
    }
    return localVoteTally;
  }, [state.room?.day?.tally, localVoteTally]);

  const wolfTeammateIds = useMemo(() => {
    const set = new Set<string>();
    if (state.room?.wolfPack?.teammates) {
      for (const t of state.room.wolfPack.teammates) {
        set.add(typeof t === 'string' ? t : (t as any).id);
      }
    }
    for (const [pid, role] of Object.entries(seatRoles)) {
      if (role === 'WEREWOLF' || role === 'BIG_BAD_WOLF' || role === 'WOLF_CUB' || role === 'LONE_WOLF') {
        set.add(pid);
      }
    }
    return set;
  }, [state.room?.wolfPack?.teammates, seatRoles]);

  // Player clicks an opponent seat or an engraved token in VotingTokenTray
  const handleCastVote = useCallback(
    (targetId: string) => {
      if (isExecutionPhase) return;

      if (isNight) {
        setSelectedTargetId(targetId);
        werewolfAudio.playVoteStamp();
        if (targetId !== 'SKIP') {
          onEmitAction('night:wolfVote', { targetId });
        }
        return;
      }

      // Clicking the same opponent again retracts vote to SKIP; clicking another opponent casts/switches vote
      const effectiveTarget = myVotedTargetId === targetId ? 'SKIP' : targetId;

      setSelectedTargetId(effectiveTarget === 'SKIP' ? null : effectiveTarget);
      setIsPeacefulTie(false);
      setVerdictBanner(null);

      setLocalVoteTally((prev) => {
        const next = { ...prev };
        if (myVotedTargetId && myVotedTargetId !== 'SKIP' && next[myVotedTargetId]) {
          next[myVotedTargetId] = Math.max(0, next[myVotedTargetId] - 1);
          if (next[myVotedTargetId] === 0) delete next[myVotedTargetId];
        }
        if (effectiveTarget !== 'SKIP') {
          next[effectiveTarget] = (next[effectiveTarget] || 0) + 1;
        }
        return next;
      });

      setMyVotedTargetId(effectiveTarget);
      werewolfAudio.playVoteStamp();
      onEmitAction('day:vote', { targetId: effectiveTarget });
    },
    [isExecutionPhase, isNight, myVotedTargetId, onEmitAction]
  );

  // Resolve votes: Tie -> "Hòa phiếu - Ngày bình yên" | Unique Max -> EXECUTION_PHASE (HangingNooseEffect)
  const handleFinalizeVoteVerdict = useCallback(
    (overrideTally?: Record<string, number>) => {
      if (isExecutionPhase) return;
      const tallyToResolve = overrideTally || effectiveVoteTally;
      const resolution = resolveVoteTally(tallyToResolve, activePlayers);

      if (resolution.outcome === 'TIE_OR_PEACE' || !resolution.condemnedId) {
        werewolfAudio.playBell();
        setIsPeacefulTie(true);
        setVerdictBanner('Hòa phiếu - Ngày bình yên');
        setCondemnedPlayerId(null);
        setLocalPhase('DAY_VOTING');
      } else {
        setIsPeacefulTie(false);
        setVerdictBanner(resolution.message);
        setCondemnedPlayerId(resolution.condemnedId);
        setLocalPhase('EXECUTION_PHASE');
      }
    },
    [activePlayers, effectiveVoteTally, isExecutionPhase]
  );

  // Quick helper to test tie-vote rule ("Hòa phiếu - Ngày bình yên")
  const handleSimulateTieVote = useCallback(() => {
    const aliveOpponents = activePlayers.filter((p) => p.isAlive && p.id !== localPlayer?.id);
    if (aliveOpponents.length >= 2) {
      const tiedTally: Record<string, number> = {
        [aliveOpponents[0].id]: 3,
        [aliveOpponents[1].id]: 3,
      };
      setLocalVoteTally(tiedTally);
      setMyVotedTargetId(aliveOpponents[0].id);
      handleFinalizeVoteVerdict(tiedTally);
    } else {
      handleFinalizeVoteVerdict({});
    }
  }, [activePlayers, handleFinalizeVoteVerdict, localPlayer?.id]);

  // Called by HangingNooseEffect right as the rope settles at the neck -> character slumps & isAlive = false
  const handleExecuteSlump = useCallback((playerId: string) => {
    setExecutedIds((prev) => {
      const next = new Set(prev);
      next.add(playerId);
      return next;
    });
    setLocalVoteTally((prev) => {
      const next = { ...prev };
      delete next[playerId];
      return next;
    });
  }, []);

  const handleExecutionComplete = useCallback(() => {
    setLocalPhase('DAY_VOTING');
    setCondemnedPlayerId(null);
  }, []);

  // Keyboard shortcuts: [V] Dual Perspective, [C] Role Card Peek/Inspect, [Space] Skip Vote, [M]/[U] Audio
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'KeyV') {
        setPerspective((prev) => (prev === '1ST' ? '2ND' : '1ST'));
        werewolfAudio.playVoteStamp();
      } else if (e.code === 'KeyC') {
        setIsCardInspecting((prev) => !prev);
        werewolfAudio.playCardDeal();
      } else if (e.code === 'Space') {
        e.preventDefault();
        handleCastVote('SKIP');
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
  }, [handleCastVote]);

  // Diegetic 3D Table Plaque texts
  const remainingSeconds = Math.max(0, Math.ceil(state.remainingMs ? state.remainingMs / 1000 : 45));
  const timerStr = `${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(
    remainingSeconds % 60
  ).padStart(2, '0')}`;

  const diegeticPhaseTitle = useMemo(() => {
    if (isExecutionPhase) return 'XỬ TỬ TREO CỔ';
    if (isPeacefulTie) return 'NGÀY BÌNH YÊN';
    if (effectivePhase === 'DEALING_CARDS') return 'PHÁT BÀI ĐỊNH MỆNH';
    if (effectivePhase === 'NIGHT_FALL') return 'CẢ LÀNG ĐI NGỦ';
    if (effectivePhase === 'NIGHT_BODYGUARD' || effectivePhase === 'BODYGUARD_TURN') return 'BẢO VỆ THỨC DẬY';
    if (effectivePhase === 'NIGHT_WEREWOLF' || effectivePhase === 'WEREWOLF_TURN' || effectivePhase === 'NIGHT_WEREWOLVES') return 'MA SÓI THỨC DẬY';
    if (effectivePhase === 'NIGHT_SEER' || effectivePhase === 'SEER_TURN') return 'TIÊN TRI THỨC DẬY';
    if (effectivePhase === 'DAY_ANNOUNCE' || effectivePhase === 'DAY_ANNOUNCEMENT') return 'TRỜI SÁNG & CÔNG BỐ';
    if (effectivePhase === 'DAY_DISCUSSION') return 'THẢO LUẬN BAN NGÀY';
    if (effectivePhase === 'DAY_VOTING') return 'BỎ PHIẾU TREO CỔ';
    if (isNight) return 'ĐÊM BÓNG TỐI';
    return 'HỘI ĐỒNG BỎ PHIẾU';
  }, [effectivePhase, isExecutionPhase, isNight, isPeacefulTie]);

  const diegeticSubtitle = useMemo(() => {
    if (verdictBanner) return verdictBanner;
    if (director.interactionPrompt) return director.interactionPrompt;
    if (effectivePhase === 'DEALING_CARDS') return 'Lật xem vai trò • Sau đó bài nằm gọn vào rãnh khay gỗ';
    if (isNight) return 'Cả làng gục đầu say ngủ • Sói thức giấc';
    if (myVotedTargetId && myVotedTargetId !== 'SKIP') {
      const target = activePlayers.find((p) => p.id === myVotedTargetId);
      if (target) {
        return `Đã chỉ định phiếu cho #${String(target.seat).padStart(2, '0')} ${target.nickname}`;
      }
    }
    return 'Click ghế / tên đối thủ để tương tác • Click khay gỗ để xem bài';
  }, [activePlayers, director.interactionPrompt, effectivePhase, isNight, myVotedTargetId, verdictBanner]);

  const condemnedRole: Role = useMemo(() => {
    if (!condemnedPlayerId) return 'WEREWOLF';
    return seatRoles[condemnedPlayerId] || 'WEREWOLF';
  }, [condemnedPlayerId, seatRoles]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendChat(state.activeChatChannel, chatInput.trim());
    setChatInput('');
  };

  return (
    <div className="relative w-screen h-screen bg-[#040407] text-stone-200 overflow-hidden select-none">
      {/* ====================================================================
          FULL-VIEWPORT 3D DARK NOIR PUB SCENE (DIEGETIC UI, ZERO CLUTTER)
         ==================================================================== */}
      <GameScene3D
        players={activePlayers}
        localPlayerId={localPlayer?.id}
        localRole={myCurrentRole}
        perspective={perspective}
        phase={effectivePhase}
        isNight={isNight}
        canVote={canVote}
        voteTally={effectiveVoteTally}
        myVotedTargetId={myVotedTargetId}
        selectedTargetId={selectedTargetId}
        dealTrigger={dealTrigger}
        hasDealtCards={hasDealtCards}
        isCardInspecting={isCardInspecting}
        onToggleCardInspect={(next) =>
          setIsCardInspecting((prev) => (typeof next === 'boolean' ? next : !prev))
        }
        onDealComplete={() => {
          setLocalPhase((prev) => (prev === 'DEALING_CARDS' ? 'DAY_VOTING' : prev));
        }}
        isExecutionPhase={isExecutionPhase}
        condemnedPlayerId={condemnedPlayerId}
        condemnedRole={condemnedRole}
        onExecuteSlump={handleExecuteSlump}
        onExecutionComplete={handleExecutionComplete}
        diegeticPhaseTitle={diegeticPhaseTitle}
        diegeticTimerText={timerStr}
        diegeticSubtitle={diegeticSubtitle}
        isPeacefulTie={isPeacefulTie}
        isSleeping={director.isSleeping}
        moodLighting={director.moodLighting}
        isWolfAwake={director.isWolfAwake}
        wolfTeammateIds={wolfTeammateIds}
        wolfTargetId={director.wolfTargetId}
        seerPeekResult={director.seerPeekResult}
        speakingPlayerIds={director.speakingPlayerIds}
        eliminatedTonight={director.eliminatedTonight}
        onCastVote={(targetId) => {
          if (director.canInteractChair) {
            director.handleChairClick(targetId);
          }
          handleCastVote(targetId);
        }}
      />

      {/* ====================================================================
          WHISPER-THIN PERIPHERAL CORNER MICRO-CONTROLS (NON-INTRUSIVE)
         ==================================================================== */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 pointer-events-auto">
        <button
          type="button"
          onClick={() => {
            window.location.href = '/';
          }}
          className="h-8 px-2.5 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-sm border border-white/10 text-stone-400 hover:text-amber-200 text-[11px] font-mono transition cursor-pointer flex items-center gap-1"
          title="Rời bàn chơi"
        >
          <span>←</span>
          <span className="hidden sm:inline">Rời</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setIsMicOn((prev) => !prev);
            werewolfAudio.playVoteStamp();
          }}
          className={`h-8 w-8 rounded-full backdrop-blur-sm border text-xs transition cursor-pointer flex items-center justify-center ${
            isMicOn
              ? 'bg-black/50 border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/60'
              : 'bg-red-950/60 border-red-500/40 text-red-300'
          }`}
          title="Bật / Tắt Mic [M]"
        >
          {isMicOn ? '🎙' : '🔇'}
        </button>

        <button
          type="button"
          onClick={() => {
            const next = !isSpeakerOn;
            setIsSpeakerOn(next);
            werewolfAudio.setMuted(!next);
            if (next) werewolfAudio.playVoteStamp();
          }}
          className={`h-8 w-8 rounded-full backdrop-blur-sm border text-xs transition cursor-pointer flex items-center justify-center ${
            isSpeakerOn
              ? 'bg-black/50 border-amber-500/35 text-amber-300 hover:bg-amber-950/50'
              : 'bg-black/50 border-white/10 text-stone-500'
          }`}
          title="Bật / Tắt Âm thanh [U]"
        >
          {isSpeakerOn ? '🔊' : '🔈'}
        </button>

        <button
          type="button"
          onClick={() => setIsChatDrawerOpen((prev) => !prev)}
          className={`h-8 px-2.5 rounded-full backdrop-blur-sm border text-[11px] font-mono transition cursor-pointer flex items-center gap-1 ${
            isChatDrawerOpen
              ? 'bg-amber-950/75 border-amber-400/60 text-amber-200'
              : 'bg-black/50 border-white/10 text-stone-400 hover:text-stone-200'
          }`}
          title="Mở / Ẩn kênh thì thầm"
        >
          <span>💬</span>
          <span className="hidden md:inline">Thì thầm</span>
        </button>
      </div>

      {/* Top-Right: Dual Perspective (1ST / 2ND [V]) & Subtle Noir Table Triggers */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 pointer-events-auto flex-wrap justify-end">
        {/* Phase / Mechanic Micro-Actions & 10-Phase Director Switcher */}
        <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm px-1.5 py-1 rounded-full border border-white/10 flex-wrap">
          <select
            value={effectivePhase}
            onChange={(e) => {
              const val = e.target.value as LocalScenePhase;
              setLocalPhase(val);
              if (val === 'DEALING_CARDS') {
                triggerDealCards(false);
              } else if (val === 'NIGHT_FALL') {
                werewolfAudio.playBell();
              } else if (val === 'NIGHT_WEREWOLF') {
                werewolfAudio.playWolfHowl();
              } else if (val === 'DAY_ANNOUNCE') {
                werewolfAudio.playBell();
              } else if (val === 'EXECUTION_PHASE') {
                handleFinalizeVoteVerdict();
              }
            }}
            className="bg-black/70 text-amber-300 font-mono text-[10px] px-2 py-0.5 rounded border border-white/10 outline-none cursor-pointer"
            title="Chuyển pha thử nghiệm 10 pha chuẩn FSM"
          >
            <option value="DEALING_CARDS">1. Phát Bài (ASSIGN)</option>
            <option value="NIGHT_FALL">2. Cả Làng Ngủ (NIGHT_FALL)</option>
            <option value="NIGHT_BODYGUARD">3. Bảo Vệ Thức Dậy</option>
            <option value="NIGHT_WEREWOLF">4. Ma Sói Thức Dậy</option>
            <option value="NIGHT_SEER">5. Tiên Tri Thức Dậy</option>
            <option value="DAY_ANNOUNCE">6. Trời Sáng & Công Bố</option>
            <option value="DAY_DISCUSSION">7. Thảo Luận 60s</option>
            <option value="DAY_VOTING">8. Bỏ Phiếu Treo Cổ</option>
            <option value="EXECUTION_PHASE">9. Xử Tử Treo Cổ</option>
          </select>

          <button
            type="button"
            onClick={() => triggerDealCards(true)}
            className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold text-amber-300 hover:bg-amber-500/20 transition cursor-pointer"
            title="Phát & lật bài Tarot đầu ván (DEALING_CARDS)"
          >
            Phát Bài
          </button>

          <button
            type="button"
            onClick={() => handleFinalizeVoteVerdict()}
            disabled={isExecutionPhase}
            className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold text-rose-300 hover:bg-rose-500/20 disabled:opacity-40 transition cursor-pointer"
            title="Chốt kết quả bỏ phiếu: Hòa -> Ngày bình yên | Cao nhất duy nhất -> Treo cổ"
          >
            Chốt Phiếu
          </button>

          <button
            type="button"
            onClick={handleSimulateTieVote}
            disabled={isExecutionPhase}
            className="hidden sm:inline-block px-1.5 py-0.5 rounded-full text-[10px] font-mono text-emerald-300/90 hover:bg-emerald-500/20 disabled:opacity-40 transition cursor-pointer"
            title="Thử trường hợp Hòa phiếu cao nhất -> Hòa phiếu - Ngày bình yên"
          >
            Hòa Phiếu
          </button>

          <button
            type="button"
            onClick={() => {
              if (isNight) {
                setLocalPhase('DAY_VOTING');
                werewolfAudio.playBell();
              } else {
                setLocalPhase('NIGHT_FALL');
                werewolfAudio.playWolfHowl();
              }
            }}
            disabled={isExecutionPhase}
            className="px-2 py-0.5 rounded-full text-[10px] font-mono text-stone-300 hover:bg-white/10 disabled:opacity-40 transition cursor-pointer"
            title="Chuyển Ngày / Đêm"
          >
            {isNight ? '☀️ Ngày' : '🌙 Đêm'}
          </button>
        </div>

        {/* 1ST / 2ND DUAL PERSPECTIVE SWITCHER ([V]) */}
        <div
          className="flex items-center bg-black/60 backdrop-blur-sm p-0.5 rounded-full border border-amber-500/30 shadow-lg"
          title="Đổi góc nhìn Camera [Phím V]"
        >
          <button
            type="button"
            onClick={() => {
              setPerspective('1ST');
              werewolfAudio.playVoteStamp();
            }}
            className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-black tracking-wider transition cursor-pointer ${
              perspective === '1ST'
                ? 'bg-amber-500 text-black shadow'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            1ST
          </button>
          <button
            type="button"
            onClick={() => {
              setPerspective('2ND');
              werewolfAudio.playVoteStamp();
            }}
            className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-black tracking-wider transition cursor-pointer ${
              perspective === '2ND'
                ? 'bg-amber-500 text-black shadow'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            2ND
          </button>
          <span className="px-1.5 text-[9px] font-mono text-stone-500 hidden sm:inline">[V]</span>
        </div>
      </div>

      {/* Subtle Diegetic Center Verdict Toast (Peaceful Tie or Execution Verdict — pointer-events-none, auto-fades) */}
      {verdictBanner && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 pointer-events-none px-4 py-1.5 rounded-full bg-black/70 backdrop-blur-sm border border-amber-400/35 text-xs font-serif tracking-wide text-amber-100 shadow-xl">
          {verdictBanner}
        </div>
      )}

      {/* Optional Slide-out Whisper Popover (Hidden by default so zero UI blocks the 3D scene) */}
      {isChatDrawerOpen && (
        <div className="absolute top-13 left-3 z-30 w-64 bg-black/80 backdrop-blur-md p-2.5 rounded-xl border border-white/10 shadow-2xl pointer-events-auto">
          <div className="flex items-center justify-between gap-1 pb-1.5 mb-1.5 border-b border-white/10">
            {(['public', 'wolves', 'lovers', 'dead'] as ChatChannel[]).map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => store.setActiveChatChannel(ch)}
                className={`flex-1 py-0.5 rounded text-[10px] font-mono uppercase transition cursor-pointer ${
                  state.activeChatChannel === ch
                    ? 'bg-amber-500/25 text-amber-200 border border-amber-400/40'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                {ch === 'public' ? 'Làng' : ch === 'wolves' ? 'Sói' : ch === 'lovers' ? 'Đôi' : 'Ma'}
              </button>
            ))}
          </div>

          <div className="h-32 overflow-y-auto space-y-1 text-[11px] pr-1 mb-1.5">
            {(state.chatMessages[state.activeChatChannel] || []).length === 0 ? (
              <p className="text-stone-500 italic text-[10px]">Chưa có lời thì thầm nào...</p>
            ) : (
              (state.chatMessages[state.activeChatChannel] || []).map((msg) => (
                <div key={msg.id} className="text-stone-200">
                  <span className="text-amber-300 font-mono font-bold mr-1">
                    {msg.senderNickname || msg.senderId}:
                  </span>
                  <span>{msg.text}</span>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendChat} className="flex gap-1">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Thì thầm..."
              className="flex-1 bg-zinc-950/90 border border-white/15 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="px-2 py-1 bg-amber-600/80 hover:bg-amber-500 text-black font-bold text-[10px] rounded font-mono cursor-pointer"
            >
              Gửi
            </button>
          </form>
        </div>
      )}

      {/* Game Over Victory / Defeat Overlay (only when match concludes) */}
      {(effectivePhase === 'GAME_OVER' || Boolean(state.room?.winner)) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="bg-[#0d0c10] border border-amber-500/40 rounded-2xl p-7 max-w-md w-full text-center shadow-2xl">
            <h2 className="font-serif font-bold text-2xl uppercase text-amber-300 tracking-wider mb-2">
              {state.room?.winner === 'WEREWOLF' ? 'Phe Bóng Đêm Thắng' : 'Phe Dân Làng Thắng'}
            </h2>
            <p className="text-xs text-stone-400 mb-6">
              Ván đấu tại bàn Hội Đồng đã khép lại. Toàn bộ thân phận đã được phơi bày dưới ánh đèn.
            </p>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/';
              }}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs uppercase tracking-wider transition cursor-pointer"
            >
              Quay Về Sảnh Chờ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WerewolfGameApp;
