/**
 * WinChecker — Kiểm tra điều kiện thắng sau mỗi lần có người chết.
 * Thứ tự ưu tiên:
 * 1. Cặp đôi khác phe (Lovers of different factions):
 *    - Thắng khi và chỉ khi đúng 2 người sống sót cuối cùng là cặp đôi đó.
 * 2. Phe Dân Làng (VILLAGE):
 *    - Thắng khi toàn bộ Ma Sói bị tiêu diệt (aliveWolves === 0).
 * 3. Phe Ma Sói (WEREWOLF):
 *    - Thắng khi số Ma Sói còn sống >= số người còn sống của các phe khác.
 */

import { PlayerState, Team } from '../index';

export interface WinCheckInput {
  players: PlayerState[];
  lovers: [string, string] | null;
}

export interface WinCheckResult {
  winner: Team | null;
  reason: string | null;
}

export class WinChecker {
  public static check(input: WinCheckInput): WinCheckResult {
    const { players, lovers } = input;
    const alivePlayers = players.filter((p) => p.isAlive);

    if (alivePlayers.length === 0) {
      return { winner: null, reason: 'ALL_DEAD' };
    }

    // 1. Kiểm tra cặp đôi khác phe (nếu có Cupid ghép)
    if (lovers && alivePlayers.length === 2) {
      const [loverAId, loverBId] = lovers;
      const loverA = players.find((p) => p.id === loverAId);
      const loverB = players.find((p) => p.id === loverBId);

      if (loverA && loverB && loverA.isAlive && loverB.isAlive) {
        // Nếu khác phe (1 Sói, 1 Dân) thì Cặp Đôi trở thành phe độc lập thứ 3 và thắng
        const isDifferentTeam =
          (loverA.team === 'WEREWOLF' && loverB.team === 'VILLAGE') ||
          (loverA.team === 'VILLAGE' && loverB.team === 'WEREWOLF');

        if (isDifferentTeam) {
          return {
            winner: 'LOVERS',
            reason: 'LOVERS_LAST_SURVIVORS',
          };
        }
      }
    }

    const aliveWolves = alivePlayers.filter((p) => p.team === 'WEREWOLF');
    const aliveOthers = alivePlayers.filter((p) => p.team !== 'WEREWOLF');

    // 2. Dân Làng thắng: Toàn bộ Sói đã chết
    if (aliveWolves.length === 0) {
      return {
        winner: 'VILLAGE',
        reason: 'ALL_WEREWOLVES_ELIMINATED',
      };
    }

    // 3. Ma Sói thắng: Số Sói >= số người sống còn lại
    if (aliveWolves.length >= aliveOthers.length) {
      return {
        winner: 'WEREWOLF',
        reason: 'WEREWOLVES_EQUAL_OR_OUTNUMBER_VILLAGERS',
      };
    }

    // Chưa kết thúc ván đấu
    return {
      winner: null,
      reason: null,
    };
  }
}
