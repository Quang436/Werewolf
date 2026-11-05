'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChatChannel,
  DBRoleData,
  getDBRoleData,
  PublicPlayerView,
  Role,
  Team,
} from '@werewolf/shared';
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

type AutoFSMPhase =
  | 'READING_CARDS'
  | 'ASSIGN_ROLES'
  | 'NIGHT_FALL'
  | 'NIGHT_BODYGUARD'
  | 'NIGHT_WEREWOLF'
  | 'NIGHT_SEER'
  | 'DAY_ANNOUNCE'
  | 'DAY_DISCUSSION'
  | 'DAY_VOTING'
  | 'DAY_EXECUTION'
  | 'EXECUTION_PHASE';

const PHASE_DURATION_SEC: Record<string, number> = {
  READING_CARDS: 20,
  ASSIGN_ROLES: 20,
  NIGHT_FALL: 3,
  NIGHT_START: 3,
  NIGHT_BODYGUARD: 12,
  BODYGUARD_TURN: 12,
  NIGHT_WEREWOLF: 15,
  WEREWOLF_TURN: 15,
  NIGHT_SEER: 12,
  SEER_TURN: 12,
  DAY_ANNOUNCE: 5,
  DAY_ANNOUNCEMENT: 5,
  DAY_DISCUSSION: 45,
  DAY_VOTING: 20,
  DAY_EXECUTION: 8,
  EXECUTION_PHASE: 8,
};

export const WerewolfGameApp: React.FC<WerewolfGameAppProps> = ({
  store,
  onEmitAction,
  onSendChat,
}) => {
  const [state, setState] = useState(store.getState());
  const [perspective, setPerspective] = useState<CameraPerspective>('1ST');
  const [localPhase, setLocalPhase] = useState<AutoFSMPhase>('READING_CARDS');
  const [localPhaseEndsAt, setLocalPhaseEndsAt] = useState<number>(() => Date.now() + 30000);
  const [nowTick, setNowTick] = useState<number>(() => Date.now());

  // Local player mortality & role assignment map (synced with server when in live room)
  const [executedIds, setExecutedIds] = useState<Set<string>>(() => new Set());
  const [seatRoles, setSeatRoles] = useState<Record<string, Role>>({});

  // Cinematic card dealing & manual inspect state
  const [dealTrigger, setDealTrigger] = useState<number>(1);
  const [hasDealtCards, setHasDealtCards] = useState<boolean>(true);
  const [isCardInspecting, setIsCardInspecting] = useState<boolean>(true);

  // Voting tokens & verdict state
  const [localVoteTally, setLocalVoteTally] = useState<Record<string, number>>({});
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
      setNowTick(Date.now());
      setState({ ...store.getState() });
    }, 250);
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

  // Dữ liệu vai trò chuẩn lấy trực tiếp từ Database (qua sự kiện ASSIGN_ROLE)
  const myRole: DBRoleData = useMemo(() => {
    if (state.myRole && state.myRole.roleName && state.myRole.description) {
      return state.myRole;
    }
    if (state.room?.me?.roleData) {
      return state.room.me.roleData;
    }
    return getDBRoleData(myCurrentRole);
  }, [state.myRole, state.room?.me?.roleData, myCurrentRole]);

  // Initialize balanced deck & start READING_CARDS (30s)
  const triggerDealCards = useCallback(
    (emitToServer: boolean) => {
      if (emitToServer && state.room) {
        onEmitAction('room:deal', {});
      }

      const count = activePlayers.length;
      const deck = shuffleArray(generateBalancedDeck(count));
      const nextSeatRoles: Record<string, Role> = {};
      activePlayers.forEach((p, idx) => {
        nextSeatRoles[p.id] = deck[idx % deck.length];
      });
      setSeatRoles(nextSeatRoles);

      if (localPlayer && !state.room?.me?.role && !state.assignedRole) {
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
          role: getDBRoleData(myNewRole),
          team: myTeam,
        });
      }

      setExecutedIds(new Set());
      setCondemnedPlayerId(null);
      setIsPeacefulTie(false);
      setVerdictBanner(null);
      setMyVotedTargetId(null);
      setSelectedTargetId(null);
      setLocalVoteTally({});
      setLocalPhase('READING_CARDS');
      setLocalPhaseEndsAt(Date.now() + 30000);
      setIsCardInspecting(true);
      setHasDealtCards(true);
      setDealTrigger((n) => n + 1);
    },
    [activePlayers, localPlayer, onEmitAction, state.assignedRole, state.room, store]
  );

  // Automatic initial card deal on table entry -> READING_CARDS (30s)
  const didAutoDealRef = useRef(false);
  useEffect(() => {
    if (didAutoDealRef.current || activePlayers.length === 0) return;
    didAutoDealRef.current = true;
    triggerDealCards(false);
  }, [activePlayers.length, triggerDealCards]);

  // As soon as the server room connects in LOBBY phase, automatically request Server-Authoritative deal
  const requestedServerAutoStartRef = useRef<string | null>(null);
  useEffect(() => {
    const roomId = state.room?.id;
    const roomPhase = state.room?.phase;
    if (!roomId || requestedServerAutoStartRef.current === roomId) return;
    requestedServerAutoStartRef.current = roomId;

    if (roomPhase === 'LOBBY') {
      onEmitAction('room:deal', {});
    }
  }, [state.room?.id, state.room?.phase, onEmitAction]);

  // Listen to server dealNonce
  const lastDealNonceRef = useRef(0);
  useEffect(() => {
    if (state.dealNonce && state.dealNonce > lastDealNonceRef.current) {
      lastDealNonceRef.current = state.dealNonce;
      setDealTrigger((n) => n + 1);
      setHasDealtCards(true);
      setIsCardInspecting(true);
    }
  }, [state.dealNonce]);

  // Effective phase from Server-Authoritative FSM (with automatic local fallback when server is in LOBBY/disconnected)
  const isServerDriving = Boolean(state.room && state.room.phase !== 'LOBBY');
  const effectivePhase: string = useMemo(() => {
    if (isServerDriving && state.room) {
      return state.room.phase;
    }
    return localPhase;
  }, [isServerDriving, localPhase, state.room]);

  // Sync card position & audio whenever phase transitions on Server or Local FSM
  const lastEffectivePhaseRef = useRef<string | null>(null);
  useEffect(() => {
    if (!effectivePhase || effectivePhase === lastEffectivePhaseRef.current) return;
    lastEffectivePhaseRef.current = effectivePhase;

    if (effectivePhase === 'READING_CARDS' || effectivePhase === 'ASSIGN_ROLES') {
      // 1. READING_CARDS (30s): Lá bài tự bay nâng lên trước mặt người xem để đọc dữ liệu từ DB
      setIsCardInspecting(true);
      werewolfAudio.playCardDeal();
    } else if (effectivePhase === 'NIGHT_FALL' || effectivePhase === 'NIGHT_START') {
      // 2. NIGHT_FALL (3s): Đèn tắt, bài tự trượt về nằm úp nghiêng 20 độ vào khay gỗ, cả làng gục đầu ngủ
      setIsCardInspecting(false);
      setSelectedTargetId(null);
      setMyVotedTargetId(null);
      setVerdictBanner(null);
      setIsPeacefulTie(false);
      werewolfAudio.playBell();
    } else if (
      effectivePhase === 'NIGHT_WEREWOLF' ||
      effectivePhase === 'WEREWOLF_TURN' ||
      effectivePhase === 'NIGHT_WEREWOLVES'
    ) {
      werewolfAudio.playWolfHowl();
    } else if (effectivePhase === 'DAY_ANNOUNCE' || effectivePhase === 'DAY_ANNOUNCEMENT') {
      werewolfAudio.playBell();
      setIsCardInspecting(false);

      // Xác định nạn nhân bị sát hại trong đêm
      const serverEliminated = state.room?.eliminatedTonight || [];
      let victim = activePlayers.find((p) => serverEliminated.includes(p.id));

      if (!victim && !isServerDriving) {
        // Mô phỏng fallback khi chạy offline
        const candidates = activePlayers.filter(
          (p) => p.isAlive && !executedIds.has(p.id) && seatRoles[p.id] !== 'WEREWOLF'
        );
        if (candidates.length > 0) {
          victim = candidates[Math.floor(Math.random() * candidates.length)];
        }
      }

      if (victim) {
        setExecutedIds((prev) => new Set([...prev, victim!.id]));
        const seatStr = String(victim.seat).padStart(2, '0');
        setVerdictBanner(`Đêm qua người chơi #${seatStr} ${victim.nickname} đã bị sát hại`);
      } else {
        setVerdictBanner('Một đêm bình yên không ai chết');
      }
    } else if (effectivePhase === 'DAY_DISCUSSION') {
      setIsCardInspecting(false);
      setSelectedTargetId(null);
    } else if (effectivePhase === 'DAY_EXECUTION' || effectivePhase === 'EXECUTION_PHASE') {
      setIsCardInspecting(false);
      const accused = state.room?.day?.accusedId;
      if (accused) {
        setCondemnedPlayerId(accused);
      }
    }
  }, [
    effectivePhase,
    state.room?.day?.accusedId,
    state.room?.eliminatedTonight,
    activePlayers,
    isServerDriving,
    executedIds,
    seatRoles,
  ]);

  const effectiveVoteTally: Record<string, number> = useMemo(() => {
    const serverTally = state.room?.day?.tally as Record<string, number> | undefined;
    if (serverTally && Object.keys(serverTally).length > 0) {
      return serverTally;
    }
    return localVoteTally;
  }, [state.room?.day?.tally, localVoteTally]);

  // Advance local fallback FSM if server is not actively driving
  const advanceLocalFallbackPhase = useCallback(
    (current: AutoFSMPhase) => {
      let next: AutoFSMPhase = 'NIGHT_FALL';

      switch (current) {
        case 'READING_CARDS':
        case 'ASSIGN_ROLES':
          next = 'NIGHT_FALL';
          break;
        case 'NIGHT_FALL':
          next = 'NIGHT_BODYGUARD';
          break;
        case 'NIGHT_BODYGUARD':
          next = 'NIGHT_WEREWOLF';
          break;
        case 'NIGHT_WEREWOLF':
          next = 'NIGHT_SEER';
          break;
        case 'NIGHT_SEER':
          next = 'DAY_ANNOUNCE';
          break;
        case 'DAY_ANNOUNCE':
          next = 'DAY_DISCUSSION';
          break;
        case 'DAY_DISCUSSION':
          next = 'DAY_VOTING';
          break;
        case 'DAY_VOTING': {
          const resolution = resolveVoteTally(effectiveVoteTally, activePlayers);
          if (resolution.outcome === 'EXECUTION' && resolution.condemnedId) {
            setIsPeacefulTie(false);
            setVerdictBanner(resolution.message);
            setCondemnedPlayerId(resolution.condemnedId);
            next = 'EXECUTION_PHASE';
          } else {
            werewolfAudio.playBell();
            setIsPeacefulTie(true);
            setVerdictBanner('Hòa phiếu / Chưa đủ phiếu - Ngày bình yên');
            setCondemnedPlayerId(null);
            next = 'NIGHT_FALL';
          }
          break;
        }
        case 'DAY_EXECUTION':
        case 'EXECUTION_PHASE':
          if (condemnedPlayerId) {
            setExecutedIds((prev) => new Set([...prev, condemnedPlayerId]));
          }
          setCondemnedPlayerId(null);
          next = 'NIGHT_FALL';
          break;
        default:
          next = 'NIGHT_FALL';
      }

      const durSec = PHASE_DURATION_SEC[next] || 15;
      setLocalPhase(next);
      setLocalPhaseEndsAt(Date.now() + durSec * 1000);
    },
    [activePlayers, effectiveVoteTally]
  );

  // Automatic countdown trigger when in local fallback mode
  useEffect(() => {
    if (isServerDriving) return;
    if (nowTick >= localPhaseEndsAt) {
      advanceLocalFallbackPhase(localPhase);
    }
  }, [isServerDriving, nowTick, localPhaseEndsAt, localPhase, advanceLocalFallbackPhase]);

  // Handler when player clicks "Đã hiểu" during READING_CARDS (30s) -> immediately transitions to NIGHT_FALL
  const handleConfirmCardRead = useCallback(() => {
    werewolfAudio.playCardDeal();
    setIsCardInspecting(false);

    if (isServerDriving) {
      onEmitAction('card:confirmRead', {});
    } else {
      setLocalPhase('NIGHT_FALL');
      setLocalPhaseEndsAt(Date.now() + 3000);
    }
  }, [isServerDriving, onEmitAction]);

  const isReadingPhase = effectivePhase === 'READING_CARDS' || effectivePhase === 'ASSIGN_ROLES';
  const isNight = isNightPhase(effectivePhase);
  const isExecutionPhase = effectivePhase === 'EXECUTION_PHASE' || effectivePhase === 'DAY_EXECUTION';

  const director = useGameLoopDirector({
    phase: effectivePhase,
    localPlayerId: localPlayer?.id,
    localRole: myRole.roleId || myCurrentRole,
    isAlive: localPlayer ? localPlayer.isAlive : true,
    players: activePlayers,
    eliminatedTonightFromServer: state.room?.eliminatedTonight,
    wolfVotesFromServer: state.room?.wolfPack?.votes,
    seerResultFromServer: state.seerResultModal,
    isMicActive: isMicOn,
    onEmitAction,
  });

  const canVote =
    ((effectivePhase === 'DAY_VOTING' || effectivePhase === 'DAY_REVOTE') && !isExecutionPhase) ||
    director.canInteractChair;

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

  // Player clicks an opponent seat during their night turn or day voting
  const handleCastVote = useCallback(
    (targetId: string) => {
      if (isExecutionPhase) return;

      if (isNight) {
        if (!director.canInteractChair) return;
        setSelectedTargetId(targetId);
        director.handleChairClick(targetId);

        // If running local fallback, advance to next night role after 1.3s
        if (!isServerDriving) {
          setTimeout(() => {
            advanceLocalFallbackPhase(localPhase);
          }, 1300);
        }
        return;
      }

      if (effectivePhase !== 'DAY_VOTING' && effectivePhase !== 'DAY_REVOTE') return;

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
          next[effectiveTarget] = (next[effectiveTarget] || 0) + 2;
        }
        return next;
      });

      setMyVotedTargetId(effectiveTarget);
      werewolfAudio.playVoteStamp();
      onEmitAction('day:vote', { targetId: effectiveTarget });
    },
    [
      isExecutionPhase,
      isNight,
      director,
      isServerDriving,
      effectivePhase,
      myVotedTargetId,
      onEmitAction,
      advanceLocalFallbackPhase,
      localPhase,
    ]
  );

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
    setCondemnedPlayerId(null);
    if (!isServerDriving) {
      setLocalPhase('NIGHT_FALL');
      setLocalPhaseEndsAt(Date.now() + 3000);
    }
  }, [isServerDriving]);

  // Keyboard shortcuts: [V] Dual Perspective, [C] Role Card Inspect Any Time, [Space] Skip Vote, [M]/[U] Audio
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

  // Countdown calculation from Server NTP remainingMs or Local fallback timer
  const remainingSeconds = useMemo(() => {
    if (isServerDriving && state.room?.phaseEndsAt) {
      return Math.max(0, Math.ceil((state.remainingMs || 0) / 1000));
    }
    return Math.max(0, Math.ceil((localPhaseEndsAt - nowTick) / 1000));
  }, [isServerDriving, state.room?.phaseEndsAt, state.remainingMs, localPhaseEndsAt, nowTick]);

  const timerStr = `${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(
    remainingSeconds % 60
  ).padStart(2, '0')}`;

  const diegeticPhaseTitle = useMemo(() => {
    if (isExecutionPhase) return 'XỬ TỬ TREO CỔ';
    if (isPeacefulTie) return 'NGÀY BÌNH YÊN';
    if (effectivePhase === 'READING_CARDS' || effectivePhase === 'ASSIGN_ROLES') return 'ĐỌC BÀI VAI TRÒ';
    if (effectivePhase === 'NIGHT_FALL' || effectivePhase === 'NIGHT_START') return 'ĐÊM XUỐNG';
    if (effectivePhase === 'NIGHT_BODYGUARD' || effectivePhase === 'BODYGUARD_TURN') return 'BẢO VỆ THỨC DẬY';
    if (
      effectivePhase === 'NIGHT_WEREWOLF' ||
      effectivePhase === 'WEREWOLF_TURN' ||
      effectivePhase === 'NIGHT_WEREWOLVES'
    )
      return 'MA SÓI THỨC DẬY';
    if (effectivePhase === 'NIGHT_SEER' || effectivePhase === 'SEER_TURN') return 'TIÊN TRI THỨC DẬY';
    if (effectivePhase === 'CUPID_TURN') return 'THẦN TÌNH YÊU THỨC DẬY';
    if (effectivePhase === 'WITCH_TURN') return 'PHÙ THỦY THỨC DẬY';
    if (effectivePhase === 'DAY_ANNOUNCE' || effectivePhase === 'DAY_ANNOUNCEMENT') return 'TRỜI SÁNG & CÔNG BỐ';
    if (effectivePhase === 'DAY_DISCUSSION') return 'THẢO LUẬN BAN NGÀY';
    if (effectivePhase === 'DAY_VOTING' || effectivePhase === 'DAY_REVOTE') return 'BỎ PHIẾU TREO CỔ';
    if (isNight) return 'ĐÊM XUỐNG';
    return 'HỘI ĐỒNG PHÁN QUYẾT';
  }, [effectivePhase, isExecutionPhase, isNight, isPeacefulTie]);

  const diegeticSubtitle = useMemo(() => {
    if (verdictBanner) return verdictBanner;
    if (director.interactionPrompt) return director.interactionPrompt;
    if (isReadingPhase) return 'Xem kỹ vai trò từ Database • Bấm "Đã hiểu" hoặc chờ hết giờ';
    if (isNight) return 'Cả làng gục đầu say ngủ • Quản trò gọi từng vai thức dậy';
    if (myVotedTargetId && myVotedTargetId !== 'SKIP') {
      const target = activePlayers.find((p) => p.id === myVotedTargetId);
      if (target) {
        return `Đã chỉ định phiếu cho #${String(target.seat).padStart(2, '0')} ${target.nickname}`;
      }
    }
    return 'Click ghế đối thủ để bỏ phiếu • Click thẻ bài trong khay gỗ để xem lại vai trò';
  }, [activePlayers, director.interactionPrompt, isReadingPhase, isNight, myVotedTargetId, verdictBanner]);

  const condemnedRole: Role = useMemo(() => {
    if (!condemnedPlayerId) return 'WEREWOLF';
    const p = activePlayers.find((pl) => pl.id === condemnedPlayerId);
    if (p?.revealedRole) return p.revealedRole;
    return seatRoles[condemnedPlayerId] || 'WEREWOLF';
  }, [activePlayers, condemnedPlayerId, seatRoles]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendChat(state.activeChatChannel, chatInput.trim());
    setChatInput('');
  };

  return (
    <div className="relative w-screen h-screen bg-[#040407] text-stone-200 overflow-hidden select-none">
      {/* ====================================================================
          FULL-VIEWPORT 3D DARK NOIR PUB SCENE (SERVER-AUTHORITATIVE FSM)
         ==================================================================== */}
      <GameScene3D
        players={activePlayers}
        localPlayerId={localPlayer?.id}
        myRole={myRole}
        localRole={myRole.roleId || myCurrentRole}
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
        isReadingPhase={isReadingPhase}
        onToggleCardInspect={(next) =>
          setIsCardInspecting((prev) => (typeof next === 'boolean' ? next : !prev))
        }
        onConfirmRead={handleConfirmCardRead}
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
        onCastVote={handleCastVote}
      />

      {/* ====================================================================
          TOP-LEFT: PERIPHERAL CORNER MICRO-CONTROLS
         ==================================================================== */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 pointer-events-auto">
        <button
          type="button"
          onClick={() => {
            window.location.href = '/';
          }}
          className="h-8 px-2.5 rounded-full bg-black/55 hover:bg-black/80 backdrop-blur-sm border border-white/10 text-stone-400 hover:text-amber-200 text-[11px] font-mono transition cursor-pointer flex items-center gap-1"
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
              ? 'bg-black/55 border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/60'
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
              ? 'bg-black/55 border-amber-500/35 text-amber-300 hover:bg-amber-950/50'
              : 'bg-black/55 border-white/10 text-stone-500'
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
              : 'bg-black/55 border-white/10 text-stone-400 hover:text-stone-200'
          }`}
          title="Mở / Ẩn kênh thì thầm"
        >
          <span>💬</span>
          <span className="hidden md:inline">Thì thầm</span>
        </button>
      </div>

      {/* ====================================================================
          TOP-CENTER: SERVER-AUTHORITATIVE PHASE & COUNTDOWN BADGE
          (Không còn bất kỳ dropdown menu thủ công nào)
         ==================================================================== */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 pointer-events-auto">
        <div
          className={`flex items-center gap-2.5 px-4 py-1.5 rounded-full backdrop-blur-md border shadow-2xl transition-colors ${
            isExecutionPhase
              ? 'bg-red-950/85 border-red-500/50 text-red-200'
              : isNight
              ? 'bg-slate-950/85 border-indigo-400/40 text-indigo-200'
              : 'bg-black/75 border-amber-500/45 text-amber-200'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full animate-pulse ${
              isExecutionPhase ? 'bg-red-400' : isNight ? 'bg-indigo-400' : 'bg-amber-400'
            }`}
          />
          <span className="text-xs font-extrabold tracking-widest uppercase">
            {diegeticPhaseTitle}:
          </span>
          <span className="font-mono text-xs font-black text-yellow-300">
            {timerStr}s
          </span>
        </div>

        {isReadingPhase && isCardInspecting && (
          <button
            type="button"
            onClick={handleConfirmCardRead}
            className="px-3 py-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-[11px] uppercase tracking-wider shadow-lg transition cursor-pointer"
          >
            ✓ Đã hiểu
          </button>
        )}
      </div>

      {/* ====================================================================
          TOP-RIGHT: 1ST / 2ND DUAL PERSPECTIVE SWITCHER ([V])
         ==================================================================== */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 pointer-events-auto">
        <button
          type="button"
          onClick={() => {
            setIsCardInspecting((prev) => !prev);
            werewolfAudio.playCardDeal();
          }}
          className={`h-8 px-3 rounded-full backdrop-blur-sm border text-[11px] font-mono font-bold transition cursor-pointer flex items-center gap-1 ${
            isCardInspecting
              ? 'bg-amber-500/25 border-amber-400/60 text-amber-200'
              : 'bg-black/55 border-white/15 text-stone-300 hover:text-amber-200'
          }`}
          title="Xem / Cất thẻ bài vai trò [Phím C]"
        >
          <span>🃏</span>
          <span className="hidden sm:inline">{isCardInspecting ? 'Cất Bài' : 'Xem Bài'}</span>
        </button>

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

      {/* Subtle Diegetic Center Verdict Toast */}
      {verdictBanner && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 pointer-events-none px-4 py-1.5 rounded-full bg-black/75 backdrop-blur-sm border border-amber-400/35 text-xs font-serif tracking-wide text-amber-100 shadow-xl">
          {verdictBanner}
        </div>
      )}

      {/* Optional Slide-out Whisper Popover */}
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

      {/* Game Over Victory / Defeat Overlay */}
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
