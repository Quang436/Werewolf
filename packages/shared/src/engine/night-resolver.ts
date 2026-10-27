/**
 * NightResolver — Bộ giải quyết kết quả Ban Đêm (Core Engine).
 *
 * Xử lý xung đột theo thứ tự ưu tiên:
 * 1. Thu thập vote của Sói -> xác định wolfTarget (giải quyết hòa theo wolfTieBreak: RANDOM / NO_KILL).
 * 2. Bảo vệ chắn (Bodyguard):
 *    - Không được bảo vệ cùng 1 người 2 đêm liên tiếp.
 *    - Nếu bodyguardTarget === wolfTarget -> Đòn cắn bị chặn hoàn toàn.
 * 3. Phù Thủy (Witch):
 *    - Cứu (Heal potion): giải cứu nạn nhân của Sói nếu còn bình. Kiểm tra ràng buộc witchCanSelfSave.
 *    - Độc (Poison potion): đầu độc 1 người bất kỳ còn sống (xuyên qua Bảo Vệ!).
 * 4. Xác định danh sách chết ban đêm (Deaths).
 * 5. Chuỗi tử vong liên hoàn (Cascading Deaths):
 *    - Nếu nạn nhân có người yêu (Lovers) -> Người yêu chết chùm vì thất tình (HEARTBREAK).
 *    - Lặp đệ quy cho đến khi không còn ai chết thêm.
 * 6. Kiểm tra kích hoạt đặc biệt (Triggers):
 *    - Nếu Thợ Săn (Hunter) chết vì Sói cắn (hoặc nguyên nhân trong hunterTriggers) -> tạo pending trigger HUNTER_SHOT.
 * 7. Shuffle danh sách chết trước khi trả về để đảm bảo tính bảo mật (không đoán được ai chết vì thuốc hay sói cắn).
 */

import {
  DeathCause,
  NightState,
  PendingTrigger,
  PlayerState,
  RoomSettings,
} from '../index';

export interface NightResolveInput {
  round: number;
  players: PlayerState[];
  night: NightState;
  settings: RoomSettings;
  lovers: [string, string] | null;
  /** Seed hoặc hàm ngẫu nhiên tuỳ biến để phục vụ Deterministic Unit Testing */
  rng?: () => number;
}

export interface DeathRecord {
  playerId: string;
  cause: DeathCause;
  killedByWolf: boolean;
  killedByPoison: boolean;
  heartbrokenPartnerId?: string;
}

export interface NightResolveResult {
  /** Danh sách nạn nhân chết trong đêm (đã xử lý chuỗi chết) */
  deaths: DeathRecord[];
  /** Danh sách trigger cần giải quyết đầu buổi sáng (ví dụ: Thợ săn bắn) */
  pendingTriggers: PendingTrigger[];
  /** Thông tin ghi log server (bảo mật, không emit cho client) */
  resolutionLog: {
    wolfTargetSelected: string | null;
    guarded: boolean;
    witchSaved: boolean;
    witchPoisoned: string | null;
  };
}

export class NightResolver {
  /**
   * Xác định mục tiêu cắn của bầy Sói dựa trên vote và cấu hình tie-break.
   */
  public static resolveWolfTarget(
    wolfVotes: Record<string, string>,
    aliveWolves: PlayerState[],
    tieBreakMode: 'RANDOM' | 'NO_KILL',
    rng: () => number = Math.random
  ): string | null {
    const validWolfIds = new Set(aliveWolves.map((w) => w.id));
    const tally: Record<string, number> = {};

    for (const [voterId, targetId] of Object.entries(wolfVotes)) {
      // Chỉ tính vote của sói còn sống và target không phải là SKIP
      if (validWolfIds.has(voterId) && targetId && targetId !== 'SKIP') {
        tally[targetId] = (tally[targetId] || 0) + 1;
      }
    }

    const entries = Object.entries(tally);
    if (entries.length === 0) {
      return null;
    }

    // Tìm số phiếu cao nhất
    let maxVotes = 0;
    for (const [, count] of entries) {
      if (count > maxVotes) {
        maxVotes = count;
      }
    }

    const topCandidates = entries
      .filter(([, count]) => count === maxVotes)
      .map(([targetId]) => targetId);

    if (topCandidates.length === 1) {
      return topCandidates[0];
    }

    // Xử lý hòa phiếu
    if (tieBreakMode === 'NO_KILL') {
      return null;
    }

    // RANDOM
    const randomIndex = Math.floor(rng() * topCandidates.length);
    return topCandidates[randomIndex];
  }

  /**
   * Tính toán kết quả toàn bộ ban đêm
   */
  public static resolve(input: NightResolveInput): NightResolveResult {
    const { round, players, night, settings, lovers, rng = Math.random } = input;
    const playerMap = new Map<string, PlayerState>(players.map((p) => [p.id, p]));

    const aliveWolves = players.filter((p) => p.isAlive && p.team === 'WEREWOLF');
    const wolfTarget = this.resolveWolfTarget(night.wolfVotes, aliveWolves, settings.wolfTieBreak, rng);

    // 1. Kiểm tra Bảo Vệ
    let isGuarded = false;
    if (night.bodyguardTarget && wolfTarget === night.bodyguardTarget) {
      const bodyguard = players.find((p) => p.isAlive && p.role === 'BODYGUARD');
      if (bodyguard) {
        // Kiểm tra điều kiện: không được bảo vệ cùng 1 người 2 đêm liên tiếp
        const isConsecutive = bodyguard.roleState.lastProtectedId === night.bodyguardTarget;
        const isSelfProtected = night.bodyguardTarget === bodyguard.id;
        const allowSelf = settings.bodyguardCanSelfProtect;

        if (!isConsecutive && (!isSelfProtected || allowSelf)) {
          isGuarded = true;
        }
      }
    }

    // 2. Kiểm tra Phù Thủy Cứu
    let isWitchSaved = false;
    const witch = players.find((p) => p.isAlive && p.role === 'WITCH');

    if (night.witchSave && wolfTarget && witch && witch.roleState.hasHealPotion) {
      // Kiểm tra luật tự cứu của Phù Thủy
      const isSelfSave = wolfTarget === witch.id;
      let canSave = true;

      if (isSelfSave) {
        if (settings.witchCanSelfSave === 'NEVER') {
          canSave = false;
        } else if (settings.witchCanSelfSave === 'FIRST_NIGHT_ONLY' && round > 1) {
          canSave = false;
        }
      }

      if (canSave) {
        isWitchSaved = true;
      }
    }

    // 3. Tập hợp danh sách tử vong ban đầu
    const directDeaths: DeathRecord[] = [];

    // Nạn nhân của Sói
    if (wolfTarget && !isGuarded && !isWitchSaved) {
      const victim = playerMap.get(wolfTarget);
      if (victim && victim.isAlive) {
        directDeaths.push({
          playerId: wolfTarget,
          cause: 'WOLF',
          killedByWolf: true,
          killedByPoison: false,
        });
      }
    }

    // Nạn nhân bị trúng độc Phù Thủy (Bảo Vệ không cản được độc!)
    if (night.witchPoisonTarget && witch && witch.roleState.hasPoisonPotion) {
      const poisonVictim = playerMap.get(night.witchPoisonTarget);
      if (poisonVictim && poisonVictim.isAlive) {
        // Tránh trùng nếu bị sói cắn và trúng độc cùng đêm
        const alreadyDead = directDeaths.find((d) => d.playerId === night.witchPoisonTarget);
        if (alreadyDead) {
          alreadyDead.killedByPoison = true;
        } else {
          directDeaths.push({
            playerId: night.witchPoisonTarget,
            cause: 'POISON',
            killedByWolf: false,
            killedByPoison: true,
          });
        }
      }
    }

    // 4. Giải quyết chuỗi tử vong lây lan (Cascading Deaths - Cặp đôi chết chùm)
    const allDeaths: DeathRecord[] = [...directDeaths];
    const deadIdSet = new Set<string>(directDeaths.map((d) => d.playerId));

    // Kiểm tra liên hoàn tình nhân
    if (lovers) {
      const [loverA, loverB] = lovers;
      let addedCascade = true;

      while (addedCascade) {
        addedCascade = false;
        if (deadIdSet.has(loverA) && !deadIdSet.has(loverB)) {
          const partner = playerMap.get(loverB);
          if (partner && partner.isAlive) {
            deadIdSet.add(loverB);
            allDeaths.push({
              playerId: loverB,
              cause: 'HEARTBREAK',
              killedByWolf: false,
              killedByPoison: false,
              heartbrokenPartnerId: loverA,
            });
            addedCascade = true;
          }
        } else if (deadIdSet.has(loverB) && !deadIdSet.has(loverA)) {
          const partner = playerMap.get(loverA);
          if (partner && partner.isAlive) {
            deadIdSet.add(loverA);
            allDeaths.push({
              playerId: loverA,
              cause: 'HEARTBREAK',
              killedByWolf: false,
              killedByPoison: false,
              heartbrokenPartnerId: loverB,
            });
            addedCascade = true;
          }
        }
      }
    }

    // 5. Kiểm tra Triggers khi chết (Thợ Săn)
    const pendingTriggers: PendingTrigger[] = [];
    for (const death of allDeaths) {
      const deadPlayer = playerMap.get(death.playerId);
      if (deadPlayer && deadPlayer.role === 'HUNTER' && !deadPlayer.roleState.hasShot) {
        // Chỉ kích hoạt nếu nguyên nhân nằm trong settings.hunterTriggers (mặc định WOLF, EXECUTION)
        if (settings.hunterTriggers.includes(death.cause)) {
          pendingTriggers.push({
            kind: 'HUNTER_SHOT',
            playerId: deadPlayer.id,
          });
        }
      }
    }

    // 6. Xáo trộn thứ tự danh sách deaths để client không suy luận được thứ tự/nguyên nhân
    const shuffledDeaths = [...allDeaths].sort(() => rng() - 0.5);

    return {
      deaths: shuffledDeaths,
      pendingTriggers,
      resolutionLog: {
        wolfTargetSelected: wolfTarget,
        guarded: isGuarded,
        witchSaved: isWitchSaved,
        witchPoisoned: night.witchPoisonTarget,
      },
    };
  }
}
