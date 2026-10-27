/**
 * DisconnectHandler — Xử lý logic Timeout và Rớt mạng (Disconnect/Reconnect)
 *
 * Nguyên tắc:
 * 1. Khi người chơi ngắt kết nối (mất socket):
 *    - Đánh dấu `connection: 'DISCONNECTED'`, lưu `disconnectedAt: Date.now()`.
 *    - Giữ nguyên ghế (seat), vai trò bí mật và quyền lợi trong ván.
 *    - Bắt đầu Grace Period (mặc định 60 giây).
 * 2. Khi người chơi kết nối lại (Reconnect):
 *    - Đánh dấu `connection: 'ONLINE'`, xóa `disconnectedAt`.
 *    - Gửi snapshot trạng thái hiện tại (đã che qua Projector).
 * 3. Khi hết Grace Period mà không reconnect:
 *    - Chuyển thành `connection: 'LEFT'`.
 *    - Nếu ván đang chạy và người đó còn sống: coi như đã chết do bỏ cuộc (`cause: 'LEFT'`),
 *      xử lý lây lan nếu có người yêu chết theo, cập nhật win condition.
 * 4. Fallback khi hết thời gian pha (Timeout) mà người chơi chưa gửi hành động:
 *    - Ngày bỏ phiếu: Tự động bầu phiếu trắng (`SKIP`).
 *    - Ngày phán quyết: Tự động bỏ phiếu vô tội (`INNOCENT`) hoặc bỏ phiếu trắng.
 *    - Đêm Bảo vệ: Không bảo vệ ai.
 *    - Đêm Sói: Vote SKIP cho sói đó; nếu các sói khác có vote thì tính theo số đông; nếu tất cả offline/SKIP thì đêm bình yên.
 *    - Đêm Phù thủy: Không dùng bình cứu, không dùng bình độc (không làm hao phí bình thuốc của người chơi).
 *    - Đêm Tiên tri: Không soi ai.
 *    - Đêm Cupid: Ghép ngẫu nhiên 2 người nếu cài đặt `cupidTimeoutMode === 'RANDOM'` để không làm hỏng tính năng ván đấu.
 */

import {
  Phase,
  PlayerState,
  RoomState,
} from '../index';

export class DisconnectHandler {
  /**
   * Đánh dấu người chơi mất kết nối tạm thời
   */
  public static markDisconnected(room: RoomState, playerId: string): boolean {
    const player = room.players.find((p) => p.id === playerId);
    if (!player) return false;

    player.connection = 'DISCONNECTED';
    player.disconnectedAt = Date.now();
    return true;
  }

  /**
   * Khôi phục trạng thái khi người chơi reconnect thành công
   */
  public static markReconnected(room: RoomState, playerId: string): boolean {
    const player = room.players.find((p) => p.id === playerId);
    if (!player) return false;

    player.connection = 'ONLINE';
    player.disconnectedAt = null;
    return true;
  }

  /**
   * Xử lý khi hết Grace Period mà người chơi vẫn chưa vào lại
   */
  public static handleGracePeriodExpired(
    room: RoomState,
    playerId: string
  ): { player: PlayerState; cascadeDeaths: string[] } | null {
    const player = room.players.find((p) => p.id === playerId);
    if (!player || player.connection !== 'DISCONNECTED') return null;

    player.connection = 'LEFT';
    const cascadeDeaths: string[] = [];

    // Nếu ván đang diễn ra và người này còn sống, xử lý loại bỏ
    if (room.phase !== 'LOBBY' && room.phase !== 'GAME_OVER' && player.isAlive) {
      player.isAlive = false;
      player.deathInfo = {
        round: room.round,
        cause: 'LEFT',
      };
      cascadeDeaths.push(player.id);

      // Nếu có người yêu, người yêu chết theo
      if (room.lovers) {
        const [a, b] = room.lovers;
        const partnerId = a === player.id ? b : b === player.id ? a : null;
        if (partnerId) {
          const partner = room.players.find((p) => p.id === partnerId);
          if (partner && partner.isAlive) {
            partner.isAlive = false;
            partner.deathInfo = {
              round: room.round,
              cause: 'HEARTBREAK',
            };
            cascadeDeaths.push(partner.id);
          }
        }
      }
    }

    return { player, cascadeDeaths };
  }

  /**
   * Cung cấp hành động mặc định khi hết thời gian (Timeout fallback)
   */
  public static resolveTimeoutAction(
    room: RoomState,
    playerId: string,
    phase: Phase,
    rng: () => number = Math.random
  ): { actionType: string; payload: unknown } {
    const player = room.players.find((p) => p.id === playerId);
    if (!player || !player.isAlive) {
      return { actionType: 'NOOP', payload: null };
    }

    switch (phase) {
      case 'DAY_VOTING':
      case 'DAY_REVOTE':
        return { actionType: 'DAY_VOTE', payload: { targetId: 'SKIP' } };

      case 'DAY_JUDGMENT':
        return { actionType: 'DAY_JUDGE', payload: { verdict: 'INNOCENT' } };

      case 'BODYGUARD_TURN':
        return { actionType: 'BODYGUARD_PROTECT', payload: { targetId: null } };

      case 'WEREWOLF_TURN':
        return { actionType: 'WOLF_VOTE', payload: { targetId: 'SKIP' } };

      case 'WITCH_TURN':
        return { actionType: 'WITCH_ACT', payload: { save: false, poisonTargetId: null } };

      case 'SEER_TURN':
        return { actionType: 'SEER_INSPECT', payload: { targetId: null } };

      case 'CUPID_TURN': {
        if (room.settings.cupidTimeoutMode === 'RANDOM') {
          const aliveCandidates = room.players.filter((p) => p.isAlive).map((p) => p.id);
          if (aliveCandidates.length >= 2) {
            const shuffled = [...aliveCandidates].sort(() => rng() - 0.5);
            return {
              actionType: 'CUPID_PAIR',
              payload: { firstId: shuffled[0], secondId: shuffled[1] },
            };
          }
        }
        return { actionType: 'CUPID_PAIR', payload: null };
      }

      default:
        return { actionType: 'NOOP', payload: null };
    }
  }
}
