'use client';

import { useMemo, useState, useEffect } from 'react';
import { PublicPlayerView, Role, WEREWOLF_ROLE_LIST } from '@werewolf/shared';
import { werewolfAudio } from '../components/scene3d.helpers';

export type MoodLightingType =
  | 'pitch_dark'
  | 'bodyguard_cyan'
  | 'wolf_crimson'
  | 'seer_gold'
  | 'execution_red'
  | 'day_pub';

export interface UseGameLoopDirectorProps {
  phase: string;
  localPlayerId: string | null | undefined;
  localRole: Role | string;
  isAlive: boolean;
  players: PublicPlayerView[];
  eliminatedTonightFromServer?: string[];
  wolfVotesFromServer?: Record<string, string>;
  seerResultFromServer?: { targetId: string; isWerewolf?: boolean; result?: string } | null;
  isMicActive?: boolean;
  onEmitAction?: (event: string, payload: unknown) => void;
}

export interface GameLoopDirectorState {
  isSleeping: boolean;
  moodLighting: MoodLightingType;
  activeRoleTurn: 'NONE' | 'BODYGUARD' | 'WEREWOLF' | 'SEER' | 'SPECIAL_NIGHT';
  isWolfAwake: boolean;
  isBodyguardAwake: boolean;
  isSeerAwake: boolean;
  wolfVotes: Record<string, string>;
  wolfTargetId: string | null;
  seerPeekResult: { targetId: string; isWerewolf: boolean } | null;
  eliminatedTonight: Set<string>;
  speakingPlayerIds: Set<string>;
  canInteractChair: boolean;
  interactionPrompt: string;
  handleChairClick: (targetPlayerId: string) => void;
}

const PHASE_TO_ROLE_MAP: Record<string, string[]> = {
  DOPPELGANGER_TURN: ['DOPPELGANGER'],
  CUPID_TURN: ['CUPID'],
  VIRGINIA_WOOLF_TURN: ['VIRGINIA_WOOLF'],
  HOODLUM_TURN: ['HOODLUM'],
  DIRE_WOLF_TURN: ['DIRE_WOLF'],
  MASON_TURN: ['MASON'],
  BODYGUARD_TURN: ['BODYGUARD'],
  NIGHT_BODYGUARD: ['BODYGUARD'],
  PRIEST_TURN: ['PRIEST'],
  SPELLCASTER_TURN: ['SPELLCASTER'],
  OLD_HAG_TURN: ['OLD_HAG'],
  WEREWOLF_TURN: [...WEREWOLF_ROLE_LIST],
  NIGHT_WEREWOLF: [...WEREWOLF_ROLE_LIST],
  NIGHT_WEREWOLVES: [...WEREWOLF_ROLE_LIST],
  WITCH_TURN: ['WITCH'],
  SEER_TURN: ['SEER', 'AURA_SEER', 'APPRENTICE_SEER'],
  NIGHT_SEER: ['SEER', 'AURA_SEER', 'APPRENTICE_SEER'],
  SORCERESS_TURN: ['SORCERESS'],
  PI_TURN: ['PI'],
  CULT_LEADER_TURN: ['CULT_LEADER'],
  VAMPIRE_TURN: ['VAMPIRE'],
  DRUNK_TURN: ['DRUNK'],
};

export function useGameLoopDirector({
  phase,
  localPlayerId,
  localRole,
  isAlive,
  players,
  eliminatedTonightFromServer = [],
  wolfVotesFromServer = {},
  seerResultFromServer = null,
  isMicActive = false,
  onEmitAction,
}: UseGameLoopDirectorProps): GameLoopDirectorState {
  const [localSeerPeek, setLocalSeerPeek] = useState<{ targetId: string; isWerewolf: boolean } | null>(null);
  const [localWolfVotes, setLocalWolfVotes] = useState<Record<string, string>>({});
  const [speakingPlayerIds, setSpeakingPlayerIds] = useState<Set<string>>(() => new Set());

  const normalizedRole = (typeof localRole === 'string' ? localRole : 'SEER').toUpperCase();

  useEffect(() => {
    if (seerResultFromServer) {
      setLocalSeerPeek({
        targetId: seerResultFromServer.targetId,
        isWerewolf:
          typeof seerResultFromServer.isWerewolf === 'boolean'
            ? seerResultFromServer.isWerewolf
            : seerResultFromServer.result === 'WEREWOLF',
      });
    }
  }, [seerResultFromServer]);

  useEffect(() => {
    if (wolfVotesFromServer && Object.keys(wolfVotesFromServer).length > 0) {
      setLocalWolfVotes(wolfVotesFromServer);
    }
  }, [wolfVotesFromServer]);

  // Clear per-night peek results when entering a new night fall
  useEffect(() => {
    if (phase === 'NIGHT_FALL' || phase === 'NIGHT_START') {
      setLocalSeerPeek(null);
      setLocalWolfVotes({});
    }
  }, [phase]);

  const activeRoleTurn = useMemo<'NONE' | 'BODYGUARD' | 'WEREWOLF' | 'SEER' | 'SPECIAL_NIGHT'>(() => {
    if (phase === 'NIGHT_BODYGUARD' || phase === 'BODYGUARD_TURN') return 'BODYGUARD';
    if (phase === 'NIGHT_WEREWOLF' || phase === 'WEREWOLF_TURN' || phase === 'NIGHT_WEREWOLVES') return 'WEREWOLF';
    if (phase === 'NIGHT_SEER' || phase === 'SEER_TURN') return 'SEER';
    if (PHASE_TO_ROLE_MAP[phase]) return 'SPECIAL_NIGHT';
    return 'NONE';
  }, [phase]);

  const isNight =
    phase === 'NIGHT_FALL' ||
    phase === 'NIGHT_START' ||
    phase === 'NIGHT_RESOLVE' ||
    Boolean(PHASE_TO_ROLE_MAP[phase]);

  const isMyNightTurn = useMemo(() => {
    if (!isAlive || !isNight) return false;
    const allowedRoles = PHASE_TO_ROLE_MAP[phase];
    if (!allowedRoles) return false;
    return allowedRoles.includes(normalizedRole);
  }, [isAlive, isNight, phase, normalizedRole]);

  const isBodyguardAwake = normalizedRole === 'BODYGUARD' && isAlive && activeRoleTurn === 'BODYGUARD';
  const isWolfRole = WEREWOLF_ROLE_LIST.includes(normalizedRole as any) && normalizedRole !== 'MINION' && normalizedRole !== 'SORCERESS';
  const isWolfAwake = isWolfRole && isAlive && activeRoleTurn === 'WEREWOLF';
  const isSeerAwake =
    (normalizedRole === 'SEER' || normalizedRole === 'AURA_SEER') &&
    isAlive &&
    activeRoleTurn === 'SEER';

  // Sleeping pose: In night phases, player sleeps UNLESS it is their active role turn in CALL_ROLES_QUEUE
  const isSleeping = useMemo(() => {
    if (!isNight) return false;
    if (phase === 'NIGHT_FALL' || phase === 'NIGHT_START' || phase === 'NIGHT_RESOLVE') return true;
    return !isMyNightTurn;
  }, [isNight, phase, isMyNightTurn]);

  const moodLighting = useMemo<MoodLightingType>(() => {
    if (phase === 'DAY_EXECUTION' || phase === 'EXECUTION_PHASE') return 'execution_red';
    if (!isNight) return 'day_pub';
    if (!isMyNightTurn) return 'pitch_dark';
    if (activeRoleTurn === 'BODYGUARD') return 'bodyguard_cyan';
    if (activeRoleTurn === 'WEREWOLF') return 'wolf_crimson';
    if (activeRoleTurn === 'SEER') return 'seer_gold';
    return 'seer_gold';
  }, [phase, isNight, isMyNightTurn, activeRoleTurn]);

  const wolfTargetId = useMemo(() => {
    const tally: Record<string, number> = {};
    for (const tid of Object.values(localWolfVotes)) {
      if (tid && tid !== 'SKIP') tally[tid] = (tally[tid] || 0) + 1;
    }
    let maxVotes = 0;
    let target: string | null = null;
    for (const [id, count] of Object.entries(tally)) {
      if (count > maxVotes) {
        maxVotes = count;
        target = id;
      }
    }
    return target;
  }, [localWolfVotes]);

  const eliminatedTonight = useMemo(() => {
    return new Set(eliminatedTonightFromServer);
  }, [eliminatedTonightFromServer]);

  useEffect(() => {
    if (phase !== 'DAY_DISCUSSION') {
      setSpeakingPlayerIds(new Set());
      return;
    }

    const set = new Set<string>();
    if (isMicActive && localPlayerId) {
      set.add(localPlayerId);
    }
    const aliveOpponents = players.filter((p) => p.isAlive && p.id !== localPlayerId);
    if (aliveOpponents.length > 0) {
      const speakerIdx = Math.floor(Date.now() / 3500) % aliveOpponents.length;
      set.add(aliveOpponents[speakerIdx].id);
    }
    setSpeakingPlayerIds(set);
  }, [phase, isMicActive, localPlayerId, players]);

  const canInteractChair = useMemo(() => {
    if (!isAlive) return false;
    if (phase === 'DAY_VOTING' || phase === 'DAY_REVOTE') return true;
    if (isMyNightTurn) return true;
    return false;
  }, [isAlive, phase, isMyNightTurn]);

  const interactionPrompt = useMemo(() => {
    if (!isAlive) return 'Bạn đã bị loại • Quan sát hội đồng';
    if (phase === 'READING_CARDS' || phase === 'ASSIGN_ROLES') {
      return 'Đọc kỹ vai trò từ Database • Bấm "Đã hiểu" hoặc chờ hết giờ để vào Đêm';
    }
    if (phase === 'NIGHT_FALL' || phase === 'NIGHT_START') {
      return 'Đêm xuống • Bài tự trượt về khay gỗ 20°, cả làng gục đầu ngủ';
    }
    if (activeRoleTurn === 'BODYGUARD') {
      return isBodyguardAwake
        ? 'Bảo Vệ thức dậy: Click ghế một người để bảo vệ đêm nay'
        : 'Cả làng đang ngủ • Quản trò đang gọi Bảo Vệ';
    }
    if (activeRoleTurn === 'WEREWOLF') {
      return isWolfAwake
        ? 'Bầy Sói thức dậy: Click ghế nạn nhân để chọn mục tiêu cắn'
        : 'Cả làng đang ngủ • Bầy Ma Sói đang săn mồi';
    }
    if (activeRoleTurn === 'SEER') {
      return isSeerAwake
        ? 'Tiên Tri thức dậy: Click ghế đối thủ để thấu thị danh tính'
        : 'Cả làng đang ngủ • Tiên Tri đang soi bài';
    }
    if (activeRoleTurn === 'SPECIAL_NIGHT') {
      return isMyNightTurn
        ? 'Đến lượt vai trò của bạn: Click ghế mục tiêu để thực hiện kỹ năng đêm'
        : 'Cả làng đang ngủ • Quản trò đang gọi các vai trò chức năng';
    }
    if (phase === 'DAY_ANNOUNCE' || phase === 'DAY_ANNOUNCEMENT') {
      return eliminatedTonight.size > 0
        ? `Trời đã sáng: Có ${eliminatedTonight.size} người bị sát hại đêm qua`
        : 'Một đêm bình yên - Không ai thiệt mạng';
    }
    if (phase === 'DAY_DISCUSSION') return 'Thảo luận ban ngày tự động • Phân tích tìm ra kẻ nói dối';
    if (phase === 'DAY_VOTING' || phase === 'DAY_REVOTE') return 'Bỏ phiếu treo cổ • Click ghế kẻ tình nghi để bỏ phiếu';
    if (phase === 'DAY_EXECUTION' || phase === 'EXECUTION_PHASE') return 'Phán quyết thi hành • Treo cổ kẻ có số phiếu cao nhất';
    return '';
  }, [isAlive, phase, activeRoleTurn, isBodyguardAwake, isWolfAwake, isSeerAwake, isMyNightTurn, eliminatedTonight.size]);

  const handleChairClick = (targetPlayerId: string) => {
    if (!canInteractChair) return;

    if (activeRoleTurn === 'BODYGUARD') {
      werewolfAudio.playVoteStamp();
      onEmitAction?.('night:bodyguardProtect', { targetId: targetPlayerId });
    } else if (activeRoleTurn === 'WEREWOLF') {
      werewolfAudio.playWolfHowl();
      setLocalWolfVotes((prev) => ({
        ...prev,
        [localPlayerId || 'me']: targetPlayerId,
      }));
      onEmitAction?.('night:wolfVote', { targetId: targetPlayerId });
    } else if (activeRoleTurn === 'SEER') {
      werewolfAudio.playCardDeal();
      const targetPlayer = players.find((p) => p.id === targetPlayerId);
      const isTargetWolf =
        targetPlayer?.revealedRole === 'WEREWOLF' ||
        (targetPlayer as any)?.team === 'WEREWOLF' ||
        (targetPlayer as any)?.role === 'WEREWOLF';
      setLocalSeerPeek({ targetId: targetPlayerId, isWerewolf: Boolean(isTargetWolf) });
      onEmitAction?.('night:seerInspect', { targetId: targetPlayerId });
    } else if (phase === 'WITCH_TURN') {
      werewolfAudio.playVoteStamp();
      onEmitAction?.('night:witchAct', { save: false, poisonTargetId: targetPlayerId });
    } else if (phase === 'DAY_VOTING' || phase === 'DAY_REVOTE') {
      werewolfAudio.playVoteStamp();
      onEmitAction?.('day:vote', { targetId: targetPlayerId });
    }
  };

  return {
    isSleeping,
    moodLighting,
    activeRoleTurn,
    isWolfAwake,
    isBodyguardAwake,
    isSeerAwake,
    wolfVotes: localWolfVotes,
    wolfTargetId,
    seerPeekResult: localSeerPeek,
    eliminatedTonight,
    speakingPlayerIds,
    canInteractChair,
    interactionPrompt,
    handleChairClick,
  };
}
