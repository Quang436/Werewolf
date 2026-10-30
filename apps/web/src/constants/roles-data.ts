import { Role, Team } from '@werewolf/shared';
import { ALL_40_ROLES, RoleCatalogItem } from '../components/CreateRoomModal';

export type { RoleCatalogItem };
export { ALL_40_ROLES };

// Chi tiết điều kiện thắng và hướng dẫn kỹ năng theo từng vai trò
export interface RoleCardDetail {
  winCondition: string;
  abilityTitle: string;
  abilityInstruction: string;
  lore: string;
  keybindHint?: string;
  actionEvent?: string;
}

export const ROLE_DETAILS_EXTRA: Record<string, RoleCardDetail> = {
  VILLAGER: {
    winCondition: 'Tiêu diệt toàn bộ bầy Ma Sói và các thế lực tà ác đe dọa ngôi làng.',
    abilityTitle: 'Biểu Quyết Treo Cổ',
    abilityInstruction: 'Hãy chú ý lắng nghe lời khai, quan sát thái độ của người khác để tìm ra kẽ hở và bỏ phiếu loại bỏ Sói.',
    lore: 'Những người dân làng chất phác, dùng sự đoàn kết và lá phiếu sinh tử vào ban ngày để bảo vệ ngôi nhà của mình.',
    keybindHint: '[1] Bỏ phiếu / [E] Tranh luận',
  },
  SEER: {
    winCondition: 'Dẫn lối Dân Làng tiêu diệt toàn bộ bầy Ma Sói.',
    abilityTitle: 'Quả Cầu Soi Thấu',
    abilityInstruction: 'Chọn 1 người chơi vào ban đêm để xem người đó thuộc phe Sói hay Dân. Giữ bí mật thân phận kẻo bị Sói cắn trước!',
    lore: 'Nhà tiên tri nhìn thấu qua bóng tối màn đêm, thấy rõ bản chất thật đằng sau những lớp mặt nạ.',
    keybindHint: '[1] Soi bài đêm',
    actionEvent: 'night:seerCheck',
  },
  BODYGUARD: {
    winCondition: 'Bảo vệ dân làng sống sót và tiêu diệt hết Ma Sói.',
    abilityTitle: 'Khiên Thần Hộ Vệ',
    abilityInstruction: 'Chọn 1 người bất kỳ mỗi đêm (có thể chọn bản thân) để che chắn. Lưu ý không chọn lại cùng 1 người 2 đêm liền kề.',
    lore: 'Hiệp sĩ trung kiên với tấm khiên thép không thể xuyên phá, sẵn sàng chắn mọi vết nanh vuốt sói.',
    keybindHint: '[1] Bảo vệ',
    actionEvent: 'night:bodyguardProtect',
  },
  WITCH: {
    winCondition: 'Tiêu diệt Ma Sói bằng bình độc và bảo toàn tính mạng cho Dân Làng.',
    abilityTitle: 'Bình Cứu & Bình Độc',
    abilityInstruction: 'Quản trò cho bạn biết ai bị Sói cắn đêm nay. Dùng bình Cứu để hồi sinh hoặc bình Độc để tiêu diệt kẻ tình nghi.',
    lore: 'Bậc thầy độc dược và thần dược, nắm giữ ranh giới mong manh giữa sự sống và cái chết trong lòng bàn tay.',
    keybindHint: '[1] Cứu / [2] Đầu độc',
    actionEvent: 'night:witchAction',
  },
  HUNTER: {
    winCondition: 'Tiêu diệt toàn bộ bầy Sói. Nếu chết, hãy kéo theo kẻ cầm đầu bầy Sói.',
    abilityTitle: 'Phát Bắn Báo Thù',
    abilityInstruction: 'Khi bạn hi sinh do Sói cắn hoặc bị treo cổ, lập tức nổ súng chỉ định 1 người bất kỳ cùng chết.',
    lore: 'Tay súng thiện xạ không bao giờ gục ngã trong im lặng; viên đạn cuối cùng luôn tìm đến kẻ thù.',
    keybindHint: '[1] Nổ súng kéo theo',
    actionEvent: 'trigger:hunterShot',
  },
  MAYOR: {
    winCondition: 'Dẫn dắt dân làng giành chiến thắng và quét sạch Ma Sói.',
    abilityTitle: 'Quyền Lực Trọng Tài',
    abilityInstruction: 'Phiếu bầu của bạn tính là 2 phiếu khi biểu quyết ban ngày. Có quyền trao quyền kế nhiệm khi chết.',
    lore: 'Người đứng đầu hội đồng làng với tiếng nói quyền lực gấp đôi mọi công dân khác.',
  },
  WEREWOLF: {
    winCondition: 'Tiêu diệt dân làng cho tới khi số Ma Sói bằng hoặc áp đảo số người còn sống.',
    abilityTitle: 'Huyết Sát Bầy Đàn',
    abilityInstruction: 'Hội ý bí mật cùng bầy sói qua kênh chat riêng và thống nhất mục tiêu cắn mỗi đêm.',
    lore: 'Quái thú khát máu khoác lốt người, ẩn mình trong bóng tối chờ đợi cơ hội xé xác con mồi.',
    keybindHint: '[1] Cắn người',
    actionEvent: 'night:wolfVote',
  },
  BIG_BAD_WOLF: {
    winCondition: 'Tàn sát thần tốc dân làng bằng sức mạnh 2 mạng mỗi đêm.',
    abilityTitle: 'Cuồng Nộ Chúa Tể',
    abilityInstruction: 'Khi đàn sói chưa mất con nào, bạn có phát cắn thứ 2 riêng biệt. Hãy xóa sổ các chức năng làng!',
    lore: 'Sói chúa khổng lồ hung tợn, mang đến cơn ác mộng kinh hoàng gấp đôi cho bất kỳ ngôi làng nào.',
    keybindHint: '[1] Phát cắn riêng',
  },
  WOLF_CUB: {
    winCondition: 'Cùng bầy sói thống trị màn đêm. Đem lại cuồng nộ cho đàn nếu chẳng may hi sinh.',
    abilityTitle: 'Tiếng Hú Sói Con',
    abilityInstruction: 'Đồng đội sẽ báo thù gấp đôi (được cắn 2 người đêm sau) nếu bạn bị dân làng treo cổ hoặc bị đầu độc.',
    lore: 'Đứa con cưng của bầy đàn; bất kỳ kẻ nào làm tổn thương nó sẽ phải trả giá bằng cả ngôi làng.',
  },
  LONE_WOLF: {
    winCondition: 'Tiêu diệt dân làng và phản bội cả bầy Sói để trở thành người duy nhất sống sót.',
    abilityTitle: 'Kẻ Săn Đơn Độc',
    abilityInstruction: 'Hợp tác với đàn Sói ban đầu, sau đó tính toán thời điểm để bầy Sói và Dân Làng tự diệt lẫn nhau.',
    lore: 'Con sói kiêu hãnh không chịu phục tùng bất kỳ ai, chỉ tin vào sự sinh tồn của chính bản thân.',
  },
  CUPID: {
    winCondition: 'Ghép đôi và cùng người yêu sống sót đến cuối cùng (nếu ghép khác phe).',
    abilityTitle: 'Mũi Tên Tình Ái',
    abilityInstruction: 'Ghép 2 người chơi bất kỳ vào đêm đầu tiên. 2 người sẽ trở thành Cặp Đôi cùng sống cùng chết.',
    lore: 'Vị thần mang lại mối duyên định mệnh vượt qua ranh giới chủng tộc giữa người và sói.',
    keybindHint: '[1] Ghép đôi',
  },
  TANNER: {
    winCondition: 'Bị hội đồng dân làng biểu quyết treo cổ trên giá thiêu vào ban ngày.',
    abilityTitle: 'Kế Hoạch Tử Đạo',
    abilityInstruction: 'Hãy hành xử thật mờ ám vừa đủ để dân làng nghi ngờ bạn là Sói và bỏ phiếu treo cổ bạn!',
    lore: 'Gã thợ thuộc da chán chường với thực tại, mong muốn duy nhất là một cái chết ồn ào trước đám đông.',
  },
  CULT_LEADER: {
    winCondition: 'Quyến rũ toàn bộ những người sống sót gia nhập tà giáo của mình.',
    abilityTitle: 'Nghi Lễ Tẩy Não',
    abilityInstruction: 'Chọn từng người mỗi đêm để biến họ thành tín đồ trung thành. Giữ mạng cho đến khi cả bàn đều theo bạn.',
    lore: 'Giáo chủ bí ẩn với thuật mê hoặc tâm trí, gieo rắc giáo lý tà đạo vào từng giấc ngủ của dân làng.',
  },
  VAMPIRE: {
    winCondition: 'Tiêu diệt cả Ma Sói lẫn Dân Làng để một mình thống trị màn đêm.',
    abilityTitle: 'Hút Máu Bóng Đêm',
    abilityInstruction: 'Ẩn mình giữa hai làn đạn, lựa chọn mục tiêu yếu ớt để hút cạn sinh lực.',
    lore: 'Bá tước bóng đêm bất tử, coi cả Ma Sói lẫn Dân Làng chỉ là thức ăn ngon miệng.',
  },
};

// Lookup Map for O(1) performance
const ROLES_MAP: Record<string, RoleCatalogItem> = {};
ALL_40_ROLES.forEach((r) => {
  ROLES_MAP[r.role] = r;
});

/**
 * Lấy đầy đủ thông tin chi tiết của 1 lá bài / vai trò theo mã Role.
 */
export function getRoleInfo(role: Role | string | null | undefined): RoleCatalogItem {
  if (!role || !ROLES_MAP[role]) {
    return ROLES_MAP['VILLAGER'] || ALL_40_ROLES[0];
  }
  return ROLES_MAP[role];
}

/**
 * Lấy thông tin mở rộng (Lore, WinCondition, Ability Instruction) của lá bài
 */
export function getRoleDetailExtra(role: Role | string | null | undefined): RoleCardDetail {
  const r = role || 'VILLAGER';
  if (ROLE_DETAILS_EXTRA[r]) {
    return ROLE_DETAILS_EXTRA[r];
  }
  const base = getRoleInfo(r);
  return {
    winCondition:
      base.category === 'werewolf'
        ? 'Tiêu diệt dân làng cho tới khi số Ma Sói bằng hoặc áp đảo số người còn sống.'
        : base.category === 'third'
        ? 'Hoàn thành sứ mệnh đặc biệt của phe biệt lập để giành chiến thắng đơn độc.'
        : 'Tiêu diệt toàn bộ bầy Ma Sói và bảo vệ an toàn cho ngôi làng.',
    abilityTitle: base.badge || 'Kỹ Năng Vai Trò',
    abilityInstruction: base.desc,
    lore: `Nhân vật ${base.nameVN} thuộc ${base.categoryLabel}, thời điểm hoạt động: ${base.time}.`,
    keybindHint: base.category === 'werewolf' ? '[1] Cắn người' : '[1] Tác động',
  };
}

/**
 * Thuật toán xáo bài Fisher-Yates an toàn
 */
export function shuffleArray<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Thuật toán tự động sinh bộ bài ngẫu nhiên cân bằng chuẩn luật Ma Sói theo số lượng người trong phòng (4 đến 18 người).
 */
export function generateBalancedDeck(playerCount: number): Role[] {
  const count = Math.max(4, Math.min(18, playerCount));

  if (count === 4) {
    return ['WEREWOLF', 'SEER', 'BODYGUARD', 'VILLAGER'];
  }
  if (count === 5) {
    return ['WEREWOLF', 'SEER', 'BODYGUARD', 'HUNTER', 'VILLAGER'];
  }
  if (count === 6) {
    return ['WEREWOLF', 'MINION', 'SEER', 'BODYGUARD', 'HUNTER', 'VILLAGER'];
  }
  if (count === 7) {
    return ['WEREWOLF', 'MINION', 'SEER', 'BODYGUARD', 'WITCH', 'HUNTER', 'VILLAGER'];
  }
  if (count === 8) {
    return ['WEREWOLF', 'WEREWOLF', 'SEER', 'BODYGUARD', 'WITCH', 'HUNTER', 'VILLAGER', 'VILLAGER'];
  }
  if (count === 9) {
    return ['WEREWOLF', 'WEREWOLF', 'SEER', 'BODYGUARD', 'WITCH', 'HUNTER', 'CUPID', 'VILLAGER', 'VILLAGER'];
  }
  if (count === 10) {
    return ['WEREWOLF', 'WEREWOLF', 'WOLF_CUB', 'SEER', 'BODYGUARD', 'WITCH', 'HUNTER', 'CUPID', 'VILLAGER', 'VILLAGER'];
  }
  if (count === 11) {
    return ['WEREWOLF', 'WEREWOLF', 'BIG_BAD_WOLF', 'SEER', 'BODYGUARD', 'WITCH', 'HUNTER', 'CUPID', 'MAYOR', 'VILLAGER', 'VILLAGER'];
  }
  if (count === 12) {
    return ['WEREWOLF', 'WEREWOLF', 'BIG_BAD_WOLF', 'SEER', 'BODYGUARD', 'WITCH', 'HUNTER', 'CUPID', 'MAYOR', 'TANNER', 'VILLAGER', 'VILLAGER'];
  }
  if (count === 14) {
    return ['WEREWOLF', 'WEREWOLF', 'BIG_BAD_WOLF', 'SORCERESS', 'SEER', 'BODYGUARD', 'WITCH', 'HUNTER', 'CUPID', 'MAYOR', 'TANNER', 'MASON', 'MASON', 'VILLAGER'];
  }
  if (count === 16) {
    return ['WEREWOLF', 'WEREWOLF', 'BIG_BAD_WOLF', 'LONE_WOLF', 'SEER', 'BODYGUARD', 'WITCH', 'HUNTER', 'CUPID', 'MAYOR', 'TANNER', 'CULT_LEADER', 'MASON', 'MASON', 'PRINCE', 'VILLAGER'];
  }

  // Thuật toán động cho các số khác
  const wolfCount = Math.max(1, Math.floor(count / 3.5));
  const deck: Role[] = [];

  deck.push('WEREWOLF');
  if (wolfCount >= 2) deck.push('WEREWOLF');
  if (wolfCount >= 3) deck.push('BIG_BAD_WOLF');
  if (wolfCount >= 4) deck.push('LONE_WOLF');

  deck.push('SEER');
  deck.push('BODYGUARD');
  if (deck.length < count) deck.push('WITCH');
  if (deck.length < count) deck.push('HUNTER');
  if (deck.length < count) deck.push('CUPID');
  if (deck.length < count) deck.push('MAYOR');
  if (deck.length < count && count >= 10) deck.push('TANNER');

  while (deck.length < count) {
    deck.push('VILLAGER');
  }

  return deck.slice(0, count);
}

/**
 * Lấy theme hiển thị giao diện theo Phe (Màu sắc, border, glow, gradient)
 */
export function getFactionVisuals(category: 'werewolf' | 'villager' | 'third') {
  switch (category) {
    case 'werewolf':
      return {
        badgeBg: 'bg-red-950/80',
        badgeBorder: 'border-red-500/60',
        badgeText: 'text-red-400',
        glowColor: 'shadow-[0_0_25px_rgba(220,38,38,0.45)]',
        cardBorder: 'border-red-600/70',
        accentGradient: 'from-red-900/90 via-red-950/90 to-black',
        titleColor: 'text-red-400',
        teamLabel: 'PHE MA SÓI',
        sealEmoji: '🐺',
        auraColor: 'rgba(220, 38, 38, 0.4)',
      };
    case 'third':
      return {
        badgeBg: 'bg-purple-950/80',
        badgeBorder: 'border-purple-500/60',
        badgeText: 'text-purple-300',
        glowColor: 'shadow-[0_0_25px_rgba(168,85,247,0.45)]',
        cardBorder: 'border-purple-600/70',
        accentGradient: 'from-purple-900/90 via-purple-950/90 to-black',
        titleColor: 'text-purple-300',
        teamLabel: 'PHE THỨ BA / ĐỘC LẬP',
        sealEmoji: '🃏',
        auraColor: 'rgba(168, 85, 247, 0.4)',
      };
    case 'villager':
    default:
      return {
        badgeBg: 'bg-blue-950/80',
        badgeBorder: 'border-blue-500/60',
        badgeText: 'text-blue-300',
        glowColor: 'shadow-[0_0_25px_rgba(59,130,246,0.35)]',
        cardBorder: 'border-amber-500/50',
        accentGradient: 'from-blue-950/90 via-slate-950/90 to-black',
        titleColor: 'text-amber-300',
        teamLabel: 'PHE DÂN LÀNG',
        sealEmoji: '🌾',
        auraColor: 'rgba(217, 119, 6, 0.35)',
      };
  }
}
