'use client';

import { useMemo, useState, useEffect } from 'react';
import { PublicPlayerView, Role } from '@werewolf/shared';
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
  activeRoleTurn: 'NONE' | 'BODYGUARD' | 'WEREWOLF' | 'SEER';
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
  // Local seer peek result (e.g. from server response or local click)
  const [localSeerPeek, setLocalSeerPeek] = useState<{ targetId: string; isWerewolf: boolean } | null>(null);

  // Local wolf votes map
  const [localWolfVotes, setLocalWolfVotes] = useState<Record<string, string>>({});

  // Speaking state simulation / sync
  const [speakingPlayerIds, setSpeakingPlayerIds] = useState<Set<string>>(() => new Set());

  // Listen for seerResultFromServer
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

  // Sync wolf votes from server
  useEffect(() => {
    if (wolfVotesFromServer && Object.keys(wolfVotesFromServer).length > 0) {
      setLocalWolfVotes(wolfVotesFromServer);
    }
  }, [wolfVotesFromServer]);

  // Determine active role turn based on phase
  const activeRoleTurn = useMemo<'NONE' | 'BODYGUARD' | 'WEREWOLF' | 'SEER'>(() => {
    if (phase === 'NIGHT_BODYGUARD' || phase === 'BODYGUARD_TURN') return 'BODYGUARD';
    if (phase === 'NIGHT_WEREWOLF' || phase === 'WEREWOLF_TURN' || phase === 'NIGHT_WEREWOLVES') return 'WEREWOLF';
    if (phase === 'NIGHT_SEER' || phase === 'SEER_TURN') return 'SEER';
    return 'NONE';
  }, [phase]);

  const isNight =
    phase === 'NIGHT_FALL' ||
    phase === 'NIGHT_START' ||
    phase === 'NIGHT_BODYGUARD' ||
    phase === 'BODYGUARD_TURN' ||
    phase === 'NIGHT_WEREWOLF' ||
    phase === 'WEREWOLF_TURN' ||
    phase === 'NIGHT_WEREWOLVES' ||
    phase === 'NIGHT_SEER' ||
    phase === 'SEER_TURN' ||
    phase === 'WITCH_TURN' ||
    phase === 'NIGHT_RESOLVE';

  // Bodyguard awake check
  const isBodyguardAwake = (localRole === 'BODYGUARD') && isAlive && activeRoleTurn === 'BODYGUARD';

  // Wolf awake check
  const isWolfRole = localRole === 'WEREWOLF' || localRole === 'BIG_BAD_WOLF' || localRole === 'WOLF_CUB' || localRole === 'LONE_WOLF';
  const isWolfAwake = isWolfRole && isAlive && activeRoleTurn === 'WEREWOLF';

  // Seer awake check
  const isSeerAwake = (localRole === 'SEER') && isAlive && activeRoleTurn === 'SEER';

  // Sleeping pose:
  // If night: player is sleeping UNLESS it is their active role turn!
  const isSleeping = useMemo(() => {
    if (!isNight) return false;
    if (phase === 'NIGHT_FALL' || phase === 'NIGHT_START' || phase === 'NIGHT_RESOLVE') return true;
    if (activeRoleTurn === 'BODYGUARD') return !isBodyguardAwake;
    if (activeRoleTurn === 'WEREWOLF') return !isWolfAwake;
    if (activeRoleTurn === 'SEER') return !isSeerAwake;
    return true;
  }, [isNight, phase, activeRoleTurn, isBodyguardAwake, isWolfAwake, isSeerAwake]);

  // Mood Lighting
  const moodLighting = useMemo<MoodLightingType>(() => {
    if (phase === 'DAY_EXECUTION' || phase === 'EXECUTION_PHASE') return 'execution_red';
    if (!isNight) return 'day_pub';
    if (phase === 'NIGHT_FALL' || phase === 'NIGHT_START' || phase === 'NIGHT_RESOLVE') return 'pitch_dark';
    if (activeRoleTurn === 'BODYGUARD' && isBodyguardAwake) return 'bodyguard_cyan';
    if (activeRoleTurn === 'WEREWOLF' && isWolfAwake) return 'wolf_crimson';
    if (activeRoleTurn === 'SEER' && isSeerAwake) return 'seer_gold';
    return 'pitch_dark';
  }, [phase, isNight, activeRoleTurn, isBodyguardAwake, isWolfAwake, isSeerAwake]);

  // Tally wolf target from wolf votes
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

  // Eliminated tonight list
  const eliminatedTonight = useMemo(() => {
    return new Set(eliminatedTonightFromServer);
  }, [eliminatedTonightFromServer]);

  // Speaking indicator in DAY_DISCUSSION: simulate speakers or sync with mic
  useEffect(() => {
    if (phase !== 'DAY_DISCUSSION') {
      setSpeakingPlayerIds(new Set());
      return;
    }

    const set = new Set<string>();
    if (isMicActive && localPlayerId) {
      set.add(localPlayerId);
    }
    // Ambient conversational cadence: pick 1 random alive player speaking periodically
    const aliveOpponents = players.filter((p) => p.isAlive && p.id !== localPlayerId);
    if (aliveOpponents.length > 0) {
      const speakerIdx = Math.floor(Date.now() / 3500) % aliveOpponents.length;
      set.add(aliveOpponents[speakerIdx].id);
    }
    setSpeakingPlayerIds(set);
  }, [phase, isMicActive, localPlayerId, players]);

  // Can interact with chairs
  const canInteractChair = useMemo(() => {
    if (!isAlive) return false;
    if (phase === 'DAY_VOTING' || phase === 'DAY_REVOTE') return true;
    if (activeRoleTurn === 'BODYGUARD' && isBodyguardAwake) return true;
    if (activeRoleTurn === 'WEREWOLF' && isWolfAwake) return true;
    if (activeRoleTurn === 'SEER' && isSeerAwake) return true;
    return false;
  }, [isAlive, phase, activeRoleTurn, isBodyguardAwake, isWolfAwake, isSeerAwake]);

  // Diegetic interaction guidance prompt
  const interactionPrompt = useMemo(() => {
    if (!isAlive) return 'Bạn đã bị loại • Quan sát hội đồng';
    if (phase === 'NIGHT_FALL') return 'Cả làng đi ngủ • Nhắm mắt gục đầu';
    if (activeRoleTurn === 'BODYGUARD') {
      return isBodyguardAwake
        ? 'Bảo Vệ thức dậy: Click ghế một người để bảo vệ đêm nay'
        : 'Cả làng đang ngủ • Chờ Bảo Vệ thức dậy';
    }
    if (activeRoleTurn === 'WEREWOLF') {
      return isWolfAwake
        ? 'Bầy Sói thức dậy: Click ghế nạn nhân để chọn mục tiêu cắn'
        : 'Cả làng đang ngủ • Đêm kinh hoàng của Ma Sói';
    }
    if (activeRoleTurn === 'SEER') {
      return isSeerAwake
        ? 'Tiên Tri thức dậy: Click ghế đối thủ để lật hé vai trò'
        : 'Cả làng đang ngủ • Tiên Tri đang soi bài';
    }
    if (phase === 'DAY_ANNOUNCE' || phase === 'DAY_ANNOUNCEMENT') {
      return eliminatedTonight.size > 0
        ? `Trời đã sáng: Có ${eliminatedTonight.size} người bị sát hại đêm qua`
        : 'Một đêm bình yên - Không ai thiệt mạng';
    }
    if (phase === 'DAY_DISCUSSION') return 'Hội đồng thảo luận ban ngày • Bật mic hoặc chia sẻ nghi vấn';
    if (phase === 'DAY_VOTING') return 'Bỏ phiếu treo cổ • Click ghế kẻ tình nghi để bỏ phiếu';
    if (phase === 'DAY_EXECUTION' || phase === 'EXECUTION_PHASE') return 'Phán quyết thi hành • Treo cổ kẻ có số phiếu cao nhất';
    return '';
  }, [isAlive, phase, activeRoleTurn, isBodyguardAwake, isWolfAwake, isSeerAwake, eliminatedTonight.size]);

  // Handle chair interaction click
  const handleChairClick = (targetPlayerId: string) => {
    if (!canInteractChair) return;

    if (activeRoleTurn === 'BODYGUARD') {
      werewolfAudio.playVoteStamp();
      if (onEmitAction) {
        onEmitAction('night:bodyguardProtect', { targetId: targetPlayerId });
      }
    } else if (activeRoleTurn === 'WEREWOLF') {
      werewolfAudio.playWolfHowl();
      setLocalWolfVotes((prev) => ({
        ...prev,
        [localPlayerId || 'me']: targetPlayerId,
      }));
      if (onEmitAction) {
        onEmitAction('night:wolfVote', { targetId: targetPlayerId });
      }
    } else if (activeRoleTurn === 'SEER') {
      werewolfAudio.playCardDeal();
      // Inspect target
      const targetPlayer = players.find((p) => p.id === targetPlayerId);
      const isTargetWolf =
        targetPlayer?.revealedRole === 'WEREWOLF' ||
        (targetPlayer as any)?.team === 'WEREWOLF' ||
        (targetPlayer as any)?.role === 'WEREWOLF';
      setLocalSeerPeek({ targetId: targetPlayerId, isWerewolf: Boolean(isTargetWolf) });
      if (onEmitAction) {
        onEmitAction('night:seerInspect', { targetId: targetPlayerId });
      }
    } else if (phase === 'DAY_VOTING' || phase === 'DAY_REVOTE') {
      werewolfAudio.playVoteStamp();
      if (onEmitAction) {
        onEmitAction('day:vote', { targetId: targetPlayerId });
      }
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
