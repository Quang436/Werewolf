/**
 * NightQueueManager — Bộ điều phối hàng đợi ban đêm linh hoạt (Dynamic Night Queue).
 *
 * Sắp xếp thứ tự thức dậy theo chuẩn Ultimate Werewolf Deluxe & Wolfpack:
 * 1. NIGHT_FALL (3s): Cả làng nhắm mắt ngủ.
 * 2. FIRST_NIGHT_ONLY: Doppelganger -> Cupid -> Virginia Woolf -> Hoodlum -> Dire Wolf -> Mason -> Big Bad Wolf.
 * 3. RECURRING_NIGHT_QUEUE:
 *    - Bước 1 (Bảo vệ/Hóa giải): Bodyguard -> Priest -> Spellcaster -> Old Hag
 *    - Bước 2 (Phe Sói): Werewolves + Lone Wolf + Wolf Cub + Big Bad Wolf
 *    - Bước 3 (Cứu/Độc): Witch
 *    - Bước 4 (Thông tin): Seer / Aura Seer -> Sorceress -> P.I.
 *    - Bước 5 (Phe thứ 3): Cult Leader -> Vampire
 *    - Bước 6 (Đặc biệt): Drunk (chỉ thức đêm 3)
 * 4. NIGHT_RESOLVE: Tính toán sát thương tổng hợp, Cursed, Tough Guy, Diseased...
 *
 * Fake Delay 4-7s: Nếu vai trò không có hoặc đã chết, Server vẫn chạy timer 4-7s để chống dò vai.
 */

import { Phase, PlayerState, Role } from '@werewolf/shared';

export interface NightQueueStep {
  phase: Phase;
  role: Role | 'WEREWOLF_PACK';
  roleNameVi: string;
  actionType: string;
  glowColor: string;
  defaultDurationSec: number;
  /** Chỉ thức đêm 1, mỗi đêm, hoặc chỉ đêm 3 */
  scheduleType: 'FIRST_NIGHT_ONLY' | 'RECURRING' | 'SPECIAL_NIGHT_3';
}

export interface ActiveNightTurn {
  phase: Phase;
  role: Role | 'WEREWOLF_PACK';
  roleNameVi: string;
  actionType: string;
  glowColor: string;
  isRoleInGame: boolean;
  isAlive: boolean;
  assignedPlayerIds: string[];
  effectiveDurationSec: number;
}

export class NightQueueManager {
  /**
   * Định nghĩa trật tự đêm chuẩn theo Rulebook
   */
  public static readonly FIRST_NIGHT_STEPS: NightQueueStep[] = [
    {
      phase: 'DOPPELGANGER_TURN',
      role: 'DOPPELGANGER',
      roleNameVi: 'Kẻ Đổi Hồn (Doppelgänger)',
      actionType: 'DOPPELGANGER_SELECT',
      glowColor: '#a78bfa',
      defaultDurationSec: 10,
      scheduleType: 'FIRST_NIGHT_ONLY',
    },
    {
      phase: 'CUPID_TURN',
      role: 'CUPID',
      roleNameVi: 'Thần Tình Yêu (Cupid)',
      actionType: 'CUPID_LINK',
      glowColor: '#ec4899',
      defaultDurationSec: 12,
      scheduleType: 'FIRST_NIGHT_ONLY',
    },
    {
      phase: 'LOVERS_TURN',
      role: 'CUPID',
      roleNameVi: 'Cặp Đôi Nhìn Nhau',
      actionType: 'LOVERS_WAKE',
      glowColor: '#f43f5e',
      defaultDurationSec: 5,
      scheduleType: 'FIRST_NIGHT_ONLY',
    },
    {
      phase: 'VIRGINIA_WOOLF_TURN',
      role: 'VIRGINIA_WOOLF',
      roleNameVi: 'Virginia Woolf',
      actionType: 'VIRGINIA_WOOLF_SELECT',
      glowColor: '#c084fc',
      defaultDurationSec: 10,
      scheduleType: 'FIRST_NIGHT_ONLY',
    },
    {
      phase: 'HOODLUM_TURN',
      role: 'HOODLUM',
      roleNameVi: 'Kẻ Du Côn (Hoodlum)',
      actionType: 'HOODLUM_SELECT',
      glowColor: '#f97316',
      defaultDurationSec: 10,
      scheduleType: 'FIRST_NIGHT_ONLY',
    },
    {
      phase: 'DIRE_WOLF_TURN',
      role: 'DIRE_WOLF',
      roleNameVi: 'Sói Hắc Ám (Dire Wolf)',
      actionType: 'DIRE_WOLF_SELECT',
      glowColor: '#dc2626',
      defaultDurationSec: 10,
      scheduleType: 'FIRST_NIGHT_ONLY',
    },
    {
      phase: 'MASON_TURN',
      role: 'MASON',
      roleNameVi: 'Hội Tam Điểm (Mason)',
      actionType: 'MASON_RECOGNIZE',
      glowColor: '#38bdf8',
      defaultDurationSec: 6,
      scheduleType: 'FIRST_NIGHT_ONLY',
    },
  ];

  public static readonly RECURRING_STEPS: NightQueueStep[] = [
    // Bước 1: Bảo vệ / Hóa giải
    {
      phase: 'NIGHT_BODYGUARD',
      role: 'BODYGUARD',
      roleNameVi: 'Bảo Vệ (Bodyguard)',
      actionType: 'BODYGUARD_PROTECT',
      glowColor: '#10b981', // Xanh lá bảo vệ
      defaultDurationSec: 10,
      scheduleType: 'RECURRING',
    },
    {
      phase: 'PRIEST_TURN',
      role: 'PRIEST',
      roleNameVi: 'Mục Sư (Priest)',
      actionType: 'PRIEST_PROTECT',
      glowColor: '#facc15',
      defaultDurationSec: 10,
      scheduleType: 'RECURRING',
    },
    {
      phase: 'SPELLCASTER_TURN',
      role: 'SPELLCASTER',
      roleNameVi: 'Pháp Sư Phong Ấn (Spellcaster)',
      actionType: 'SPELLCASTER_SILENCE',
      glowColor: '#06b6d4',
      defaultDurationSec: 10,
      scheduleType: 'RECURRING',
    },
    {
      phase: 'OLD_HAG_TURN',
      role: 'OLD_HAG',
      roleNameVi: 'Bà Lão Cổ Quái (Old Hag)',
      actionType: 'OLD_HAG_BANISH',
      glowColor: '#84cc16',
      defaultDurationSec: 10,
      scheduleType: 'RECURRING',
    },

    // Bước 2: Bầy Ma Sói
    {
      phase: 'NIGHT_WEREWOLF',
      role: 'WEREWOLF_PACK',
      roleNameVi: 'Bầy Ma Sói (Werewolves)',
      actionType: 'WOLF_VOTE',
      glowColor: '#ef4444', // Đỏ sói
      defaultDurationSec: 18,
      scheduleType: 'RECURRING',
    },

    // Bước 3: Phù Thủy
    {
      phase: 'WITCH_TURN',
      role: 'WITCH',
      roleNameVi: 'Phù Thủy (Witch)',
      actionType: 'WITCH_ACTION',
      glowColor: '#a855f7', // Tím phù thủy
      defaultDurationSec: 12,
      scheduleType: 'RECURRING',
    },

    // Bước 4: Thông Tin / Soi Vai
    {
      phase: 'NIGHT_SEER',
      role: 'SEER',
      roleNameVi: 'Tiên Tri (Seer / Aura Seer)',
      actionType: 'SEER_INSPECT',
      glowColor: '#eab308', // Vàng tiên tri
      defaultDurationSec: 12,
      scheduleType: 'RECURRING',
    },
    {
      phase: 'SORCERESS_TURN',
      role: 'SORCERESS',
      roleNameVi: 'Phù Thủy Hắc Ám (Sorceress)',
      actionType: 'SORCERESS_INSPECT',
      glowColor: '#9333ea',
      defaultDurationSec: 10,
      scheduleType: 'RECURRING',
    },
    {
      phase: 'PI_TURN',
      role: 'PI',
      roleNameVi: 'Thám Tử Tư (P.I.)',
      actionType: 'PI_INSPECT',
      glowColor: '#14b8a6',
      defaultDurationSec: 10,
      scheduleType: 'RECURRING',
    },

    // Bước 5: Phe Thứ 3
    {
      phase: 'CULT_LEADER_TURN',
      role: 'CULT_LEADER',
      roleNameVi: 'Giáo Chủ Tà Giáo (Cult Leader)',
      actionType: 'CULT_RECRUIT',
      glowColor: '#6366f1',
      defaultDurationSec: 10,
      scheduleType: 'RECURRING',
    },
    {
      phase: 'VAMPIRE_TURN',
      role: 'VAMPIRE',
      roleNameVi: 'Ma Cà Rồng (Vampire)',
      actionType: 'VAMPIRE_BITE',
      glowColor: '#be123c',
      defaultDurationSec: 10,
      scheduleType: 'RECURRING',
    },

    // Bước 6: Kẻ Say Rượu (Chỉ đêm 3)
    {
      phase: 'DRUNK_TURN',
      role: 'DRUNK',
      roleNameVi: 'Kẻ Say Rượu (Drunk Tỉnh Rượu)',
      actionType: 'DRUNK_REVEAL',
      glowColor: '#d97706',
      defaultDurationSec: 8,
      scheduleType: 'SPECIAL_NIGHT_3',
    },
  ];

  /**
   * Sinh thời gian Fake Delay ngẫu nhiên từ 4-7 giây (chống người chơi đoán vai)
   */
  public static getRandomFakeDelaySec(): number {
    return Math.floor(Math.random() * 4) + 4; // 4, 5, 6, hoặc 7
  }

  /**
   * Xây dựng hàng đợi các pha đêm cụ thể cho một vòng chơi (Round)
   */
  public static buildNightQueue(
    round: number,
    roleConfig: Record<string, number>,
    players: PlayerState[]
  ): ActiveNightTurn[] {
    const queue: ActiveNightTurn[] = [];

    // 1. Nếu là Đêm 1: duyệt FIRST_NIGHT_STEPS
    if (round === 1) {
      for (const step of this.FIRST_NIGHT_STEPS) {
        const assigned = players.filter((p) => p.role === step.role && p.isAlive);
        const hasConfig = (roleConfig[step.role] || 0) > 0;
        const isAlive = assigned.length > 0;

        // Nếu vai trò có trong cấu hình phòng hoặc là LOVERS_TURN khi có Cupid
        if (hasConfig || (step.phase === 'LOVERS_TURN' && (roleConfig['CUPID'] || 0) > 0)) {
          queue.push({
            phase: step.phase,
            role: step.role,
            roleNameVi: step.roleNameVi,
            actionType: step.actionType,
            glowColor: step.glowColor,
            isRoleInGame: hasConfig,
            isAlive,
            assignedPlayerIds: assigned.map((p) => p.id),
            effectiveDurationSec: isAlive ? step.defaultDurationSec : this.getRandomFakeDelaySec(),
          });
        }
      }
    }

    // 2. Các bước lặp định kỳ (RECURRING_STEPS)
    for (const step of this.RECURRING_STEPS) {
      // Trường hợp DRUNK chỉ thức ở đêm 3
      if (step.scheduleType === 'SPECIAL_NIGHT_3' && round !== 3) {
        continue;
      }

      if (step.role === 'WEREWOLF_PACK') {
        const wolvesAlive = players.filter((p) => p.team === 'WEREWOLF' && p.isAlive);
        const hasWolvesConfig = Object.entries(roleConfig).some(
          ([r, count]) =>
            count > 0 &&
            [
              'WEREWOLF',
              'LONE_WOLF',
              'WOLF_CUB',
              'BIG_BAD_WOLF',
              'DIRE_WOLF',
              'FRUIT_BRUTE',
              'FRUIT_WOLF',
              'FANG_FACE',
              'WOLVERINE',
            ].includes(r)
        );

        queue.push({
          phase: step.phase,
          role: step.role,
          roleNameVi: step.roleNameVi,
          actionType: step.actionType,
          glowColor: step.glowColor,
          isRoleInGame: hasWolvesConfig,
          isAlive: wolvesAlive.length > 0,
          assignedPlayerIds: wolvesAlive.map((p) => p.id),
          effectiveDurationSec: wolvesAlive.length > 0 ? step.defaultDurationSec : this.getRandomFakeDelaySec(),
        });
        continue;
      }

      // Xử lý các vai trò cá nhân
      const assigned = players.filter((p) => p.role === step.role && p.isAlive);
      const hasConfig = (roleConfig[step.role] || 0) > 0;
      const isAlive = assigned.length > 0;

      // Hỗ trợ cả AURA_SEER / APPRENTICE_SEER cho SEER_TURN
      let isSeerAlive = isAlive;
      if (step.role === 'SEER') {
        const auraSeer = players.find((p) => p.role === 'AURA_SEER' && p.isAlive);
        const apprenticeSeer = players.find((p) => p.role === 'APPRENTICE_SEER' && p.isAlive);
        if (auraSeer || apprenticeSeer) {
          isSeerAlive = true;
        }
      }

      // Nếu phòng có vai này, đưa vào hàng đợi
      if (hasConfig) {
        queue.push({
          phase: step.phase,
          role: step.role,
          roleNameVi: step.roleNameVi,
          actionType: step.actionType,
          glowColor: step.glowColor,
          isRoleInGame: hasConfig,
          isAlive: isSeerAlive,
          assignedPlayerIds: assigned.map((p) => p.id),
          effectiveDurationSec: isSeerAlive ? step.defaultDurationSec : this.getRandomFakeDelaySec(),
        });
      }
    }

    return queue;
  }

  /**
   * Lấy pha kế tiếp trong hàng đợi đêm
   */
  public static getNextNightPhase(currentPhase: Phase, queue: ActiveNightTurn[]): Phase {
    const currentIndex = queue.findIndex((q) => q.phase === currentPhase);
    if (currentIndex >= 0 && currentIndex + 1 < queue.length) {
      return queue[currentIndex + 1].phase;
    }
    // Hết hàng đợi đêm -> chuyển sang NIGHT_RESOLVE
    return 'NIGHT_RESOLVE';
  }
}
