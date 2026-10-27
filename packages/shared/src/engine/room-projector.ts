/**
 * RoomProjector — Lớp bảo mật Data Masking cốt lõi.
 *
 * Nhiệm vụ:
 * Chuyển đổi RoomState (chứa toàn bộ bí mật nội bộ của server) thành ClientRoomView
 * ĐƯỢC MAY ĐO RIÊNG cho từng người chơi (viewerId).
 *
 * Nguyên tắc:
 * 1. Whitelist Projection: Chỉ copy từng trường được phép, không bao giờ dùng spread operator ({...state}).
 * 2. Zod Strict Validation: Kết quả luôn được parse qua ClientRoomViewSchema (.strict()).
 *    Bất kỳ trường lạ nào (như lộ role người khác) sẽ lập tức văng Exception tại runtime thay vì lọt ra client!
 * 3. Bảo mật tuyệt đối:
 *    - Dân thường không bao giờ nhìn thấy role hay roleState của người khác.
 *    - Sói chỉ nhìn thấy đồng đội Sói và phiếu bầu trong đêm của Sói.
 *    - Người chết không biết role người khác trừ khi cấu hình deadCanSeeRoles = true.
 *    - Chỉ khi GAME_OVER mới giải mã danh tính toàn bộ người chơi.
 */

import {
  ActionRequest,
  ClientRoomView,
  PlayerState,
  PublicPlayerView,
  Role,
  RoomSettings,
  RoomState,
} from '../index';

export class RoomProjector {
  public static projectFor(viewerId: string, room: RoomState): ClientRoomView {
    const viewer = room.players.find((p) => p.id === viewerId);
    if (!viewer) {
      throw new Error(`Viewer ${viewerId} not found in room ${room.id}`);
    }

    const isGameOver = room.phase === 'GAME_OVER';
    const isAliveWolf = viewer.isAlive && viewer.team === 'WEREWOLF';

    // Xác định xem viewer có quyền nhìn thấy vai trò của target không
    const canSeeRole = (target: PlayerState): boolean => {
      // 1. Kết thúc game -> Mọi người thấy danh tính của nhau
      if (isGameOver) return true;
      // 2. Chính bản thân mình -> Luôn thấy vai của mình
      if (target.id === viewerId) return true;
      // 3. Sói còn sống nhìn thấy đồng đội Sói
      if (isAliveWolf && target.team === 'WEREWOLF') return true;
      // 4. Nếu người đó đã chết và phòng bật luật lộ vai khi chết
      if (!target.isAlive && room.settings.revealRoleOnDeath) return true;
      // 5. Nếu viewer đã chết và phòng cho phép người chết nhìn thấy vai
      if (!viewer.isAlive && room.settings.deadCanSeeRoles) return true;

      return false;
    };

    // 1. Mask danh sách người chơi (Public Player View)
    const publicPlayers: PublicPlayerView[] = room.players.map((p) => {
      const publicView: PublicPlayerView = {
        id: p.id,
        seat: p.seat,
        nickname: p.nickname,
        avatarUrl: p.avatarUrl,
        isHost: p.id === room.hostId,
        isAlive: p.isAlive,
        ready: p.ready,
        connection: p.connection,
        ...(canSeeRole(p) && p.role ? { revealedRole: p.role } : {}),
      };
      return publicView;
    });

    // 2. Thông tin riêng của Viewer (Self View)
    const selfRoleState: Record<string, unknown> = {};
    if (viewer.role === 'BODYGUARD') {
      selfRoleState.lastProtectedId = viewer.roleState.lastProtectedId;
    } else if (viewer.role === 'WITCH') {
      selfRoleState.hasHealPotion = viewer.roleState.hasHealPotion;
      selfRoleState.hasPoisonPotion = viewer.roleState.hasPoisonPotion;
    } else if (viewer.role === 'SEER') {
      selfRoleState.seerResults = viewer.roleState.seerResults;
    } else if (viewer.role === 'HUNTER') {
      selfRoleState.hasShot = viewer.roleState.hasShot;
    }

    // 3. Thông tin người yêu (nếu có Cupid ghép)
    let loverInfo: { partnerId: string; partnerNickname: string; partnerRole?: Role } | undefined;
    if (viewer.loverId) {
      const partner = room.players.find((p) => p.id === viewer.loverId);
      if (partner) {
        loverInfo = {
          partnerId: partner.id,
          partnerNickname: partner.nickname,
          ...(partner.role ? { partnerRole: partner.role } : {}),
        };
      }
    }

    // 4. Pending Action của Viewer ở phase hiện tại
    const pendingAction = this.buildPendingAction(viewer, room);

    // 5. Thông tin bầy Sói (Chỉ dành cho Sói)
    let wolfPack: { teammates: string[]; votes: Record<string, string> } | undefined;
    if (isAliveWolf) {
      wolfPack = {
        teammates: room.players.filter((p) => p.isAlive && p.team === 'WEREWOLF').map((p) => p.id),
        votes: room.phase === 'WEREWOLF_TURN' ? room.night.wolfVotes : {},
      };
    }

    // 6. Thông tin ban ngày (Day State)
    let dayView:
      | {
          tally: Record<string, number>;
          voted: string[];
          votes?: Record<string, string>;
          revoteCandidates: string[] | null;
          accusedId?: string | null;
          judgment?: { guilty: number; innocent: number };
        }
      | undefined;

    if (
      room.phase === 'DAY_VOTING' ||
      room.phase === 'DAY_REVOTE' ||
      room.phase === 'VOTE_RESOLVE' ||
      room.phase === 'DAY_DEFENSE' ||
      room.phase === 'DAY_JUDGMENT' ||
      room.phase === 'DAY_EXECUTION'
    ) {
      const tally: Record<string, number> = {};
      for (const targetId of Object.values(room.day.votes)) {
        if (targetId) {
          tally[targetId] = (tally[targetId] || 0) + 1;
        }
      }

      // Đếm phiếu phán quyết
      let judgmentSummary: { guilty: number; innocent: number } | undefined;
      if (room.day.judgment && Object.keys(room.day.judgment).length > 0) {
        let guilty = 0;
        let innocent = 0;
        for (const verdict of Object.values(room.day.judgment)) {
          if (verdict === 'GUILTY') guilty++;
          if (verdict === 'INNOCENT') innocent++;
        }
        judgmentSummary = { guilty, innocent };
      }

      dayView = {
        tally,
        voted: Object.keys(room.day.votes),
        ...(!room.settings.hideVoteTargetsUntilResolved || room.phase === 'VOTE_RESOLVE'
          ? { votes: room.day.votes }
          : {}),
        revoteCandidates: room.day.revoteCandidates,
        accusedId: room.day.accusedId,
        judgment: judgmentSummary,
      };
    }

    // 7. Tổng hợp gói tin View hoàn chỉnh
    const rawView = {
      id: room.id,
      code: room.code,
      hostId: room.hostId,
      phase: room.phase,
      round: room.round,
      stateVersion: room.stateVersion,
      phaseEndsAt: room.phaseEndsAt,
      serverNow: Date.now(),
      settings: room.settings,
      players: publicPlayers,
      me: {
        id: viewer.id,
        role: viewer.role,
        team: viewer.team,
        roleState: selfRoleState,
        ...(loverInfo ? { lover: loverInfo } : {}),
      },
      ...(pendingAction ? { pendingAction } : {}),
      ...(wolfPack ? { wolfPack } : {}),
      ...(dayView ? { day: dayView } : {}),
      ...(isGameOver ? { winner: room.winner } : {}),
    };

    // Parse kiểm tra an toàn bằng Zod strict
    return ClientRoomView.parse(rawView);
  }

  /**
   * Tính toán Pending Action request gửi kèm theo snapshot
   */
  private static buildPendingAction(viewer: PlayerState, room: RoomState): ActionRequest | undefined {
    if (!viewer.isAlive) return undefined;

    const aliveCandidates = room.players.filter((p) => p.isAlive).map((p) => p.id);

    switch (room.phase) {
      case 'CUPID_TURN': {
        if (viewer.role === 'CUPID' && room.round === 1) {
          return {
            kind: 'CUPID_PAIR',
            candidates: aliveCandidates,
            submitted: !!room.lovers,
          };
        }
        break;
      }

      case 'BODYGUARD_TURN': {
        if (viewer.role === 'BODYGUARD') {
          // Lọc những ai không được chọn (ví dụ người vừa bảo vệ đêm trước)
          const validCandidates = aliveCandidates.filter((id) => {
            if (id === viewer.roleState.lastProtectedId) return false;
            if (id === viewer.id && !room.settings.bodyguardCanSelfProtect) return false;
            return true;
          });
          return {
            kind: 'BODYGUARD_PROTECT',
            candidates: validCandidates,
            submitted: !!room.night.bodyguardTarget,
          };
        }
        break;
      }

      case 'WEREWOLF_TURN': {
        if (viewer.team === 'WEREWOLF') {
          // Sói không được cắn đồng loại
          const nonWolfCandidates = aliveCandidates.filter((id) => {
            const p = room.players.find((pl) => pl.id === id);
            return p && p.team !== 'WEREWOLF';
          });
          return {
            kind: 'WOLF_VOTE',
            candidates: [...nonWolfCandidates, 'SKIP'],
            submitted: !!room.night.wolfVotes[viewer.id],
          };
        }
        break;
      }

      case 'WITCH_TURN': {
        if (viewer.role === 'WITCH') {
          // Mục tiêu bị sói cắn (tùy witchInfoMode)
          let wolfVictim: string | null = room.night.wolfTarget;
          if (room.settings.witchInfoMode === 'AFTER_PROTECTION') {
            if (room.night.bodyguardTarget === room.night.wolfTarget) {
              wolfVictim = null; // Đã được bảo vệ chắn
            }
          }

          // Kiểm tra quyền tự cứu của phù thủy
          let canSelfSave = true;
          if (wolfVictim === viewer.id) {
            if (room.settings.witchCanSelfSave === 'NEVER') canSelfSave = false;
            if (room.settings.witchCanSelfSave === 'FIRST_NIGHT_ONLY' && room.round > 1) canSelfSave = false;
          }

          return {
            kind: 'WITCH_ACT',
            candidates: aliveCandidates.filter((id) => id !== viewer.id), // mục tiêu bình độc
            witch: {
              wolfTargetId: wolfVictim,
              hasHeal: viewer.roleState.hasHealPotion,
              hasPoison: viewer.roleState.hasPoisonPotion,
              canSelfSave,
            },
            submitted: room.night.witchSave || !!room.night.witchPoisonTarget,
          };
        }
        break;
      }

      case 'SEER_TURN': {
        if (viewer.role === 'SEER') {
          return {
            kind: 'SEER_INSPECT',
            candidates: aliveCandidates.filter((id) => id !== viewer.id),
            submitted: !!room.night.seerTarget,
          };
        }
        break;
      }

      case 'DAY_VOTING':
      case 'DAY_REVOTE': {
        const candidates =
          room.phase === 'DAY_REVOTE' && room.day.revoteCandidates
            ? room.day.revoteCandidates
            : aliveCandidates;

        return {
          kind: 'DAY_VOTE',
          candidates: [...candidates, 'SKIP'],
          submitted: !!room.day.votes[viewer.id],
        };
      }

      case 'DAY_JUDGMENT': {
        // Bị cáo không được bỏ phiếu phán quyết chính mình
        if (viewer.id !== room.day.accusedId) {
          return {
            kind: 'DAY_JUDGE',
            candidates: ['GUILTY', 'INNOCENT'],
            submitted: !!room.day.judgment[viewer.id],
          };
        }
        break;
      }

      case 'DEATH_TRIGGERS': {
        const hasHunterTrigger = room.pendingTriggers.some(
          (t) => t.kind === 'HUNTER_SHOT' && t.playerId === viewer.id
        );
        if (hasHunterTrigger && !viewer.roleState.hasShot) {
          return {
            kind: 'HUNTER_SHOOT',
            candidates: aliveCandidates,
            submitted: false,
          };
        }
        break;
      }
    }

    return undefined;
  }
}
