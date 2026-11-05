/**
 * @werewolf/shared — Danh mục Type, Interface và Mapping chuẩn cho 40 vai trò
 * (Ultimate Werewolf Deluxe Edition + Wolfpack Expansion)
 */

export type FactionGroup = 'VILLAGE' | 'WEREWOLF' | 'THIRD_PARTY';

/**
 * Dữ liệu vai trò chuẩn lưu trữ và truy vấn từ Database / Backend API
 */
export interface DBRoleData {
  roleId: string;
  roleName: string; // "TIÊN TRI", "THẦN TÌNH YÊU", "MA SÓI",...
  faction: 'VILLAGER' | 'WEREWOLF' | 'SOLO' | 'THIRD_PARTY';
  description: string; // Mô tả kỹ năng chi tiết tiếng Việt
  actionTime: string; // "Đêm đầu", "Mỗi đêm", "Bị động",...
  avatarUrl?: string;
}

export interface RoleDefinition {
  id: string;
  nameVi: string;
  nameEn: string;
  factionGroup: FactionGroup;
  defaultTeam: string;
  cardImage: string;
  badge: string;
  points: string;
  pointsType: 'pos' | 'neg' | 'neu';
  wakeTime: string;
  description: string;
  abilityTitle: string;
  abilityInstruction: string;
}

export const VILLAGE_ROLE_LIST = [
  'VILLAGER',
  'SEER',
  'APPRENTICE_SEER',
  'AURA_SEER',
  'BODYGUARD',
  'CUPID',
  'DISEASED',
  'GHOST',
  'HUNTER',
  'IDIOT',
  'LYCAN',
  'MASON',
  'MAYOR',
  'OLD_HAG',
  'PACIFIST',
  'PI',
  'PRIEST',
  'PRINCE',
  'SPELLCASTER',
  'TOUGH_GUY',
  'TROUBLE_MAKER',
  'WITCH',
] as const;

export const WEREWOLF_ROLE_LIST = [
  'WEREWOLF',
  'MINION',
  'SORCERESS',
  'LONE_WOLF',
  'WOLF_CUB',
  'BIG_BAD_WOLF',
  'DIRE_WOLF',
  'FRUIT_BRUTE',
  'FRUIT_WOLF',
  'FANG_FACE',
  'WOLVERINE',
] as const;

export const THIRD_PARTY_ROLE_LIST = [
  'CURSED',
  'DOPPELGANGER',
  'DRUNK',
  'CULT_LEADER',
  'HOODLUM',
  'TANNER',
  'VAMPIRE',
  'VIRGINIA_WOOLF',
] as const;

export const ROLE_CARD_IMAGES: Record<string, string> = {
  MAYOR: '/images/roles/mayor.png',
  MASON: '/images/roles/mason.png',
  LYCAN: '/images/roles/lycan.png',
  IDIOT: '/images/roles/idiot.png',
  HUNTER: '/images/roles/hunter.png',
  GHOST: '/images/roles/ghost.png',
  DISEASED: '/images/roles/diseased.png',
  AURA_SEER: '/images/roles/aura_seer.png',
  APPRENTICE_SEER: '/images/roles/apprentice_seer.png',
  BODYGUARD: '/images/roles/bodyguard.png',
  SEER: '/images/roles/seer.png',
  WITCH: '/images/roles/witch.png',
  DRUNK: '/images/roles/drunk.png',
  VILLAGER: '/images/roles/villager.png',
  TROUBLE_MAKER: '/images/roles/trouble_maker.png',
  TOUGH_GUY: '/images/roles/tough_guy.png',
  SPELLCASTER: '/images/roles/spellcaster.png',
  PRINCE: '/images/roles/prince.png',
  PRIEST: '/images/roles/priest.png',
  PI: '/images/roles/pi.png',
  PACIFIST: '/images/roles/pacifist.png',
  OLD_HAG: '/images/roles/old_hag.png',
  BIG_BAD_WOLF: '/images/roles/big_bad_wolf.png',
  WOLVERINE: '/images/roles/wolverine.png',
  FANG_FACE: '/images/roles/fang_face.png',
  FRUIT_BRUTE: '/images/roles/fruit_brute.png',
  FRUIT_WOLF: '/images/roles/fruit_wolf.png',
  DIRE_WOLF: '/images/roles/dire_wolf.png',
  WOLF_CUB: '/images/roles/wolf_cub.png',
  LONE_WOLF: '/images/roles/lone_wolf.png',
  WEREWOLF: '/images/roles/werewolf.png',
  SORCERESS: '/images/roles/sorceress.png',
  MINION: '/images/roles/minion.png',
  CURSED: '/images/roles/cursed.png',
  VAMPIRE: '/images/roles/vampire.png',
  TANNER: '/images/roles/tanner.png',
  VIRGINIA_WOOLF: '/images/roles/virginia_woolf.png',
  HOODLUM: '/images/roles/hoodlum.png',
  CULT_LEADER: '/images/roles/cult_leader.png',
  CUPID: '/images/roles/cupid.png',
  DOPPELGANGER: '/images/roles/doppelganger.png',
};

/**
 * Tra cứu hình ảnh vai trò chuẩn 1-1 (hỗ trợ cả chữ thường và chữ hoa)
 * - WEREWOLF / werewolf: /images/roles/werewolf.png (Đầu sói xám răng nanh)
 * - DISEASED / diseased: /images/roles/diseased.png (Cô gái tóc tím)
 */
export const roleAssetsMap: Record<string, string> = {
  ...ROLE_CARD_IMAGES,
  ...Object.fromEntries(
    Object.entries(ROLE_CARD_IMAGES).map(([k, v]) => [k.toLowerCase(), v])
  ),
  werewolf: '/images/roles/werewolf.png',
  WEREWOLF: '/images/roles/werewolf.png',
  diseased: '/images/roles/diseased.png',
  DISEASED: '/images/roles/diseased.png',
};

export function getRoleAssetImage(roleId: string | null | undefined): string {
  if (!roleId) return '/images/roles/villager.png';
  const clean = String(roleId).trim();
  return (
    roleAssetsMap[clean] ||
    roleAssetsMap[clean.toUpperCase()] ||
    roleAssetsMap[clean.toLowerCase()] ||
    ROLE_CARD_IMAGES[clean.toUpperCase()] ||
    '/images/roles/villager.png'
  );
}

export const ROLE_DISPLAY_NAMES_VI: Record<string, string> = {
  MAYOR: 'Thị Trưởng',
  MASON: 'Hội Tam Điểm',
  LYCAN: 'Kẻ Hóa Thú',
  IDIOT: 'Kẻ Ngốc Trong Làng',
  HUNTER: 'Thợ Săn',
  GHOST: 'Oan Hồn',
  DISEASED: 'Người Nhiễm Bệnh',
  AURA_SEER: 'Tiên Tri Hào Quang',
  APPRENTICE_SEER: 'Tập Sự Tiên Tri',
  BODYGUARD: 'Bảo Vệ',
  SEER: 'Tiên Tri',
  WITCH: 'Phù Thủy',
  DRUNK: 'Kẻ Say Rượu',
  VILLAGER: 'Dân Làng',
  TROUBLE_MAKER: 'Kẻ Gây Rối',
  TOUGH_GUY: 'Gã Ngoan Cường',
  SPELLCASTER: 'Pháp Sư Phong Ấn',
  PRINCE: 'Hoàng Tử',
  PRIEST: 'Mục Sư',
  PI: 'Thám Tử Tư',
  PACIFIST: 'Người Hòa Bình',
  OLD_HAG: 'Bà Lão Cổ Quái',
  BIG_BAD_WOLF: 'Sói Đầu Đàn',
  WOLVERINE: 'Sói Wolverine',
  FANG_FACE: 'Sói Mặt Nanh',
  FRUIT_BRUTE: 'Sói Ăn Chay',
  FRUIT_WOLF: 'Sói Ăn Chay',
  DIRE_WOLF: 'Sói Hắc Ám',
  WOLF_CUB: 'Sói Con',
  LONE_WOLF: 'Sói Đơn Độc',
  WEREWOLF: 'Ma Sói Thường',
  SORCERESS: 'Phù Thủy Hắc Ám',
  MINION: 'Tay Sai Ma Sói',
  CURSED: 'Kẻ Bị Nguyền Rủa',
  VAMPIRE: 'Ma Cà Rồng',
  TANNER: 'Kẻ Bán Da',
  VIRGINIA_WOOLF: 'Virginia Woolf',
  HOODLUM: 'Kẻ Du Côn',
  CULT_LEADER: 'Giáo Chủ Tà Giáo',
  CUPID: 'Thần Tình Yêu',
  DOPPELGANGER: 'Kẻ Đổi Hồn',
};

export const ROLE_DISPLAY_NAMES_EN: Record<string, string> = {
  MAYOR: 'Mayor',
  MASON: 'Mason',
  LYCAN: 'Lycanthrope',
  IDIOT: 'Village Idiot',
  HUNTER: 'Hunter',
  GHOST: 'Ghost',
  DISEASED: 'Diseased',
  AURA_SEER: 'Aura Seer',
  APPRENTICE_SEER: 'Apprentice Seer',
  BODYGUARD: 'Bodyguard',
  SEER: 'Seer',
  WITCH: 'Witch',
  DRUNK: 'Drunk',
  VILLAGER: 'Villager',
  TROUBLE_MAKER: 'Troublemaker',
  TOUGH_GUY: 'Tough Guy',
  SPELLCASTER: 'Spellcaster',
  PRINCE: 'Prince',
  PRIEST: 'Priest',
  PI: 'P.I.',
  PACIFIST: 'Pacifist',
  OLD_HAG: 'Old Hag',
  BIG_BAD_WOLF: 'Big Bad Wolf',
  WOLVERINE: 'Wolverine',
  FANG_FACE: 'Fang Face',
  FRUIT_BRUTE: 'Fruit Brute',
  FRUIT_WOLF: 'Fruit Wolf',
  DIRE_WOLF: 'Dire Wolf',
  WOLF_CUB: 'Wolf Cub',
  LONE_WOLF: 'Lone Wolf',
  WEREWOLF: 'Werewolf',
  SORCERESS: 'Sorceress',
  MINION: 'Minion',
  CURSED: 'Cursed',
  VAMPIRE: 'Vampire',
  TANNER: 'Tanner',
  VIRGINIA_WOOLF: 'Virginia Woolf',
  HOODLUM: 'Hoodlum',
  CULT_LEADER: 'Cult Leader',
  CUPID: 'Cupid',
  DOPPELGANGER: 'Doppelgänger',
};

/**
 * Danh mục dữ liệu đầy đủ 40 Vai Trò trong Database (DBRoleData)
 */
export const DB_ROLES_CATALOG: Record<string, DBRoleData> = {
  // === 1. PHE DÂN LÀNG (VILLAGER) ===
  SEER: {
    roleId: 'SEER',
    roleName: 'TIÊN TRI',
    faction: 'VILLAGER',
    actionTime: 'Mỗi đêm',
    description: 'Mỗi đêm thức dậy chọn 1 người chơi trên bàn để thấu thị người đó có thuộc Phe Ma Sói hay không.',
    avatarUrl: '/assets/cards/card_11.png',
  },
  APPRENTICE_SEER: {
    roleId: 'APPRENTICE_SEER',
    roleName: 'TẬP SỰ TIÊN TRI',
    faction: 'VILLAGER',
    actionTime: 'Kế thừa',
    description: 'Ngủ suốt đêm khi Tiên Tri chính còn sống. Ngay khi Tiên Tri bị loại, bạn thức dậy mỗi đêm và kế thừa nhãn thuật soi Sói.',
    avatarUrl: '/assets/cards/card_9.png',
  },
  AURA_SEER: {
    roleId: 'AURA_SEER',
    roleName: 'TIÊN TRI HÀO QUANG',
    faction: 'VILLAGER',
    actionTime: 'Mỗi đêm',
    description: 'Mỗi đêm chọn 1 người để cảm nhận hào quang: biết người đó có chức năng đặc biệt hay chỉ là Dân Thường / Ma Sói Thường.',
    avatarUrl: '/assets/cards/card_8.png',
  },
  BODYGUARD: {
    roleId: 'BODYGUARD',
    roleName: 'BẢO VỆ',
    faction: 'VILLAGER',
    actionTime: 'Mỗi đêm',
    description: 'Mỗi đêm thức dậy chọn 1 người chơi (kể cả bản thân) để che chắn khỏi đòn cắn của Ma Sói. Không được bảo vệ cùng 1 người 2 đêm liên tiếp.',
    avatarUrl: '/assets/cards/card_10.png',
  },
  CUPID: {
    roleId: 'CUPID',
    roleName: 'THẦN TÌNH YÊU',
    faction: 'VILLAGER',
    actionTime: 'Đêm đầu',
    description: 'Đêm đầu tiên bắn mũi tên gắn kết 2 người chơi thành Cặp Đôi sinh tử. Một người chết thì người kia tuẫn tình theo. Nếu khác phe sẽ lập thành Phe Cặp Đôi.',
    avatarUrl: '/assets/cards/card_39.png',
  },
  DISEASED: {
    roleId: 'DISEASED',
    roleName: 'NGƯỜI NHIỄM BỆNH',
    faction: 'VILLAGER',
    actionTime: 'Bị động',
    description: 'Mang mầm bệnh dịch hạch trong máu. Nếu bị Ma Sói cắn chết, toàn bộ bầy Sói bị nhiễm độc và mất hoàn toàn lượt cắn vào đêm kế tiếp.',
    avatarUrl: '/images/roles/diseased.png',
  },
  GHOST: {
    roleId: 'GHOST',
    roleName: 'OAN HỒN',
    faction: 'VILLAGER',
    actionTime: 'Mỗi đêm',
    description: 'Chết ngay từ đêm đầu tiên. Từ cõi âm, mỗi đêm được gửi 1 ký tự bí ẩn lên bàn gỗ để dẫn lối cho Dân Làng tìm ra kẻ sát nhân.',
    avatarUrl: '/assets/cards/card_6.png',
  },
  HUNTER: {
    roleId: 'HUNTER',
    roleName: 'THỢ SĂN',
    faction: 'VILLAGER',
    actionTime: 'Khi chết',
    description: 'Khi bị Ma Sói sát hại hoặc bị dân làng treo cổ, ngay lập tức giương súng bắn hạ thêm 1 người chơi bất kỳ kéo theo xuống mồ.',
    avatarUrl: '/assets/cards/card_5.png',
  },
  IDIOT: {
    roleId: 'IDIOT',
    roleName: 'KẺ NGỐC TRONG LÀNG',
    faction: 'VILLAGER',
    actionTime: 'Ban ngày',
    description: 'Bản tính ngông cuồng, trong mọi phiên biểu quyết ban ngày luôn bắt buộc bỏ phiếu thuận đòi treo cổ người đang bị cáo buộc.',
    avatarUrl: '/assets/cards/card_4.png',
  },
  LYCAN: {
    roleId: 'LYCAN',
    roleName: 'KẺ HÓA THÚ',
    faction: 'VILLAGER',
    actionTime: 'Bị động',
    description: 'Chiến đấu hết mình vì Dân Làng, nhưng mang dòng máu lai sói khiến Tiên Tri khi soi vào bạn sẽ bị báo nhầm là Ma Sói.',
    avatarUrl: '/assets/cards/card_3.png',
  },
  MASON: {
    roleId: 'MASON',
    roleName: 'HỘI TAM ĐIỂM',
    faction: 'VILLAGER',
    actionTime: 'Đêm đầu',
    description: 'Đêm đầu tiên cùng mở mắt nhận diện các thành viên Hội Tam Điểm để xác lập đồng minh Dân Làng đáng tin cậy tuyệt đối.',
    avatarUrl: '/assets/cards/card_2.png',
  },
  MAYOR: {
    roleId: 'MAYOR',
    roleName: 'THỊ TRƯỞNG',
    faction: 'VILLAGER',
    actionTime: 'Ban ngày',
    description: 'Người đứng đầu hội đồng. Lá phiếu biểu quyết treo cổ của Thị Trưởng vào ban ngày luôn có sức nặng gấp đôi (tính bằng 2 phiếu).',
    avatarUrl: '/assets/cards/card_1.png',
  },
  OLD_HAG: {
    roleId: 'OLD_HAG',
    roleName: 'BÀ LÃO CỔ QUÁI',
    faction: 'VILLAGER',
    actionTime: 'Mỗi đêm',
    description: 'Mỗi đêm chỉ định 1 người chơi phải trục xuất khỏi bàn hội đồng vào ngày hôm sau (không được thảo luận, không được bỏ phiếu và không bị vote).',
    avatarUrl: '/assets/cards/card_22.png',
  },
  PACIFIST: {
    roleId: 'PACIFIST',
    roleName: 'NGƯỜI YÊU HÒA BÌNH',
    faction: 'VILLAGER',
    actionTime: 'Ban ngày',
    description: ' ghét cảnh máu đổ đầu rơi, trong mọi cuộc bỏ phiếu phán quyết luôn luôn bỏ phiếu cứu sống người bị đưa lên giàn treo cổ.',
    avatarUrl: '/assets/cards/card_21.png',
  },
  PI: {
    roleId: 'PI',
    roleName: 'THÁM TỬ TƯ',
    faction: 'VILLAGER',
    actionTime: '1 lần / Ván',
    description: 'Duy nhất 1 lần trong ván đấu, thức dậy chọn 1 người để điều tra xem trong nhóm 3 ghế liền kề (người đó và 2 người ngồi cạnh) có Ma Sói ẩn náu hay không.',
    avatarUrl: '/assets/cards/card_20.png',
  },
  PRIEST: {
    roleId: 'PRIEST',
    roleName: 'MỤC SƯ',
    faction: 'VILLAGER',
    actionTime: '1 lần / Ván',
    description: 'Duy nhất 1 lần trong ván đấu, ban phước lành thánh giá cho 1 người chơi giúp họ bất tử trước mọi đòn tấn công trong đêm đó.',
    avatarUrl: '/assets/cards/card_19.png',
  },
  PRINCE: {
    roleId: 'PRINCE',
    roleName: 'HOÀNG TỬ',
    faction: 'VILLAGER',
    actionTime: 'Khi bị treo cổ',
    description: 'Dòng dõi hoàng tộc cao quý. Nếu bị hội đồng bỏ phiếu treo cổ, lá bài Hoàng Tử lập tức lật ngửa giúp bạn miễn tử và cả làng đi ngủ ngay.',
    avatarUrl: '/assets/cards/card_18.png',
  },
  SPELLCASTER: {
    roleId: 'SPELLCASTER',
    roleName: 'PHÁP SƯ PHONG ẤN',
    faction: 'VILLAGER',
    actionTime: 'Mỗi đêm',
    description: 'Mỗi đêm thức dậy niệm chú khóa giọng 1 người chơi, khiến kẻ đó bị câm hoàn toàn không thể lên tiếng biện hộ vào ngày hôm sau.',
    avatarUrl: '/assets/cards/card_17.png',
  },
  TOUGH_GUY: {
    roleId: 'TOUGH_GUY',
    roleName: 'GÃ NGOAN CƯỜNG',
    faction: 'VILLAGER',
    actionTime: 'Bị động',
    description: 'Sức chịu đựng phi thường. Khi bị Ma Sói cắn trong đêm, bạn không gục ngay mà cầm cự sống sót hết ngày hôm sau để vạch mặt hung thủ.',
    avatarUrl: '/assets/cards/card_16.png',
  },
  TROUBLE_MAKER: {
    roleId: 'TROUBLE_MAKER',
    roleName: 'KẺ GÂY RỐI',
    faction: 'VILLAGER',
    actionTime: '1 lần / Ván',
    description: 'Duy nhất 1 đêm trong ván, kích động bạo loạn khiến ngày hôm sau hội đồng phải tiến hành tới 2 phiên treo cổ liên tiếp.',
    avatarUrl: '/assets/cards/card_15.png',
  },
  WITCH: {
    roleId: 'WITCH',
    roleName: 'PHÙ THỦY',
    faction: 'VILLAGER',
    actionTime: 'Mỗi đêm',
    description: 'Nắm giữ 1 Bình Cứu (hồi sinh nạn nhân vừa bị Sói cắn) và 1 Bình Độc (đầu độc chết 1 người bất kỳ). Mỗi bình chỉ dùng được 1 lần trong ván.',
    avatarUrl: '/assets/cards/card_12.png',
  },
  VILLAGER: {
    roleId: 'VILLAGER',
    roleName: 'DÂN LÀNG',
    faction: 'VILLAGER',
    actionTime: 'Ban ngày',
    description: 'Không có phép thuật ban đêm. Vũ khí mạnh nhất của bạn là trí tuệ sắc bén và lá phiếu biểu quyết ban ngày để đưa Ma Sói lên giá treo cổ.',
    avatarUrl: '/assets/cards/card_14.png',
  },

  // === 2. PHE MA SÓI (WEREWOLF) ===
  WEREWOLF: {
    roleId: 'WEREWOLF',
    roleName: 'MA SÓI',
    faction: 'WEREWOLF',
    actionTime: 'Mỗi đêm',
    description: 'Mỗi đêm thức dậy cùng đàn Sói thống nhất chọn cắn xé 1 người dân. Ban ngày trà trộn vào hội đồng, nói dối để che giấu thân phận.',
    avatarUrl: '/images/roles/werewolf.png',
  },
  BIG_BAD_WOLF: {
    roleId: 'BIG_BAD_WOLF',
    roleName: 'SÓI ĐẦU ĐÀN',
    faction: 'WEREWOLF',
    actionTime: 'Mỗi đêm',
    description: 'Thủ lĩnh tối cao của đàn Sói. Chừng nào chưa có Ma Sói nào bị tiêu diệt, mỗi đêm Sói Đầu Đàn có thể cắn thêm nạn nhân thứ 2.',
    avatarUrl: '/assets/cards/card_23.png',
  },
  WOLF_CUB: {
    roleId: 'WOLF_CUB',
    roleName: 'SÓI CON',
    faction: 'WEREWOLF',
    actionTime: 'Mỗi đêm',
    description: 'Thức dậy săn mồi cùng bầy Sói. Nếu Sói Con bị giết, đêm kế tiếp đàn Sói nổi điên báo thù và được cắn 2 người liên tiếp.',
    avatarUrl: '/assets/cards/card_28.png',
  },
  DIRE_WOLF: {
    roleId: 'DIRE_WOLF',
    roleName: 'SÓI HẮC ÁM',
    faction: 'WEREWOLF',
    actionTime: 'Đêm đầu & Mỗi đêm',
    description: 'Săn mồi cùng đàn Sói mỗi đêm. Đêm đầu tiên chọn gắn kết với 1 người đồng hành; nếu người đó chết, Sói Hắc Ám cũng chết theo.',
    avatarUrl: '/assets/cards/card_27.png',
  },
  LONE_WOLF: {
    roleId: 'LONE_WOLF',
    roleName: 'SÓI ĐƠN ĐỘC',
    faction: 'SOLO',
    actionTime: 'Mỗi đêm',
    description: 'Thức dậy cắn người cùng bầy Sói mỗi đêm, nhưng chỉ giành chiến thắng tuyệt đối nếu là con Sói cuối cùng sống sót trên bàn.',
    avatarUrl: '/assets/cards/card_29.png',
  },
  MINION: {
    roleId: 'MINION',
    roleName: 'KẺ PHẢN BỘI',
    faction: 'WEREWOLF',
    actionTime: 'Đêm đầu',
    description: 'Biết rõ mặt từng con Ma Sói từ đêm đầu tiên nhưng Sói không biết bạn. Tiên Tri soi vào bạn vẫn hiển thị là Dân Làng vô tội.',
    avatarUrl: '/assets/cards/card_32.png',
  },
  SORCERESS: {
    roleId: 'SORCERESS',
    roleName: 'PHÙ THỦY HẮC ÁM',
    faction: 'WEREWOLF',
    actionTime: 'Mỗi đêm',
    description: 'Thuộc phe Ma Sói. Mỗi đêm thức dậy riêng biệt để dò tìm chính xác ai đang nắm giữ lá bài Tiên Tri và báo hiệu ngầm cho đàn Sói.',
    avatarUrl: '/assets/cards/card_31.png',
  },
  FRUIT_BRUTE: {
    roleId: 'FRUIT_BRUTE',
    roleName: 'SÓI ĂN CHAY',
    faction: 'WEREWOLF',
    actionTime: 'Mỗi đêm',
    description: 'Thức dậy cùng đàn Sói nhưng nếu tất cả các Ma Sói khác đã chết hết, Sói Ăn Chay không thể tự mình cắn hại Dân Làng được nữa.',
    avatarUrl: '/assets/cards/card_26.png',
  },
  FRUIT_WOLF: {
    roleId: 'FRUIT_WOLF',
    roleName: 'SÓI ĂN CHAY',
    faction: 'WEREWOLF',
    actionTime: 'Mỗi đêm',
    description: 'Thức dậy cùng đàn Sói nhưng nếu tất cả các Ma Sói khác đã chết hết, Sói Ăn Chay không thể tự mình cắn hại Dân Làng được nữa.',
    avatarUrl: '/assets/cards/card_26.png',
  },
  FANG_FACE: {
    roleId: 'FANG_FACE',
    roleName: 'SÓI MẶT NANH',
    faction: 'WEREWOLF',
    actionTime: 'Mỗi đêm',
    description: 'Đêm đầu thức dậy cùng đàn Sói, sau đó ẩn mình ngủ say. Chỉ khi mọi con Sói khác bị diệt, Sói Mặt Nanh mới lộ diện đi săn.',
    avatarUrl: '/assets/cards/card_25.png',
  },
  WOLVERINE: {
    roleId: 'WOLVERINE',
    roleName: 'SÓI WOLVERINE',
    faction: 'WEREWOLF',
    actionTime: 'Mỗi đêm',
    description: 'Săn mồi hung hãn cùng bầy Sói. Nếu mục tiêu bị cắn có người ngồi cạnh bảo vệ, tiếng móng vuốt kim loại sẽ vang lên cảnh báo.',
    avatarUrl: '/assets/cards/card_24.png',
  },

  // === 3. PHE THỨ 3 & ĐỔI PHE (THIRD_PARTY / SOLO) ===
  CURSED: {
    roleId: 'CURSED',
    roleName: 'KẺ BỊ NGUYỀN RỦA',
    faction: 'THIRD_PARTY',
    actionTime: 'Bị động',
    description: 'Khởi đầu thuộc Phe Dân Làng. Tuy nhiên nếu bị Ma Sói cắn trong đêm, bạn không chết mà lập tức hóa thành Ma Sói từ đêm kế tiếp.',
    avatarUrl: '/assets/cards/card_33.png',
  },
  DOPPELGANGER: {
    roleId: 'DOPPELGANGER',
    roleName: 'KẺ ĐỔI HỒN',
    faction: 'THIRD_PARTY',
    actionTime: 'Đêm đầu',
    description: 'Đêm đầu tiên chọn 1 người chơi làm hình mẫu. Ngay khi người đó bỏ mạng, bạn bí mật chiếm lấy toàn bộ vai trò và kỹ năng của họ.',
    avatarUrl: '/assets/cards/card_40.png',
  },
  DRUNK: {
    roleId: 'DRUNK',
    roleName: 'KẺ SAY RƯỢU',
    faction: 'THIRD_PARTY',
    actionTime: 'Đêm thứ 3',
    description: 'Say khướt suốt 2 ngày đầu tiên không nhớ mình là ai. Đến đêm thứ 3 mới tỉnh rượu và nhận thông báo thân phận thật từ Quản Trò.',
    avatarUrl: '/assets/cards/card_13.png',
  },
  CULT_LEADER: {
    roleId: 'CULT_LEADER',
    roleName: 'GIÁO CHỦ TÀ GIÁO',
    faction: 'SOLO',
    actionTime: 'Mỗi đêm',
    description: 'Mỗi đêm thức dậy truyền đạo thu nạp thêm 1 tín đồ. Giành chiến thắng độc lập ngay khi toàn bộ người còn sống đều gia nhập giáo phái.',
    avatarUrl: '/assets/cards/card_38.png',
  },
  HOODLUM: {
    roleId: 'HOODLUM',
    roleName: 'KẺ DU CÔN',
    faction: 'SOLO',
    actionTime: 'Đêm đầu',
    description: 'Đêm đầu tiên chỉ định 2 mục tiêu thù địch. Bạn giành chiến thắng riêng nếu cả 2 kẻ đó đều chết và bạn vẫn sống sót tới cuối ván.',
    avatarUrl: '/assets/cards/card_37.png',
  },
  TANNER: {
    roleId: 'TANNER',
    roleName: 'KẺ CHÁN ĐỜI',
    faction: 'SOLO',
    actionTime: 'Bị động',
    description: 'Căm ghét cuộc sống tăm tối, không thuộc phe Dân hay Sói. Bạn lập tức giành chiến thắng một mình nếu lừa được cả làng vote treo cổ chính mình.',
    avatarUrl: '/assets/cards/card_35.png',
  },
  VAMPIRE: {
    roleId: 'VAMPIRE',
    roleName: 'MA CÀ RỒNG',
    faction: 'SOLO',
    actionTime: 'Mỗi đêm',
    description: 'Phe độc lập khát máu. Mỗi đêm chọn hút máu 1 nạn nhân; nạn nhân đó sẽ gục chết ngay khi kết thúc phiên bỏ phiếu ngày hôm sau.',
    avatarUrl: '/assets/cards/card_34.png',
  },
  VIRGINIA_WOOLF: {
    roleId: 'VIRGINIA_WOOLF',
    roleName: 'VIRGINIA WOOLF',
    faction: 'THIRD_PARTY',
    actionTime: 'Đêm đầu',
    description: 'Đêm đầu tiên chọn gắn định mệnh tâm lý với 1 người chơi. Nếu bạn chết đi, nỗi ám ảnh khiến người bị chọn phải chết theo ngay lập tức.',
    avatarUrl: '/assets/cards/card_36.png',
  },
};

/**
 * Helper truy vấn chi tiết DBRoleData từ mã vai trò (luôn trả về dữ liệu hợp lệ)
 */
export function getDBRoleData(roleId?: string | null): DBRoleData {
  const key = (roleId || 'SEER').toUpperCase();
  if (DB_ROLES_CATALOG[key]) {
    return DB_ROLES_CATALOG[key];
  }
  return {
    roleId: key,
    roleName: ROLE_DISPLAY_NAMES_VI[key]?.toUpperCase() || key,
    faction: WEREWOLF_ROLE_LIST.includes(key as any)
      ? 'WEREWOLF'
      : THIRD_PARTY_ROLE_LIST.includes(key as any)
      ? 'THIRD_PARTY'
      : 'VILLAGER',
    actionTime: 'Mỗi đêm',
    description: 'Quan sát sắc mặt các thành viên trên bàn Hội Đồng và dùng lá phiếu để phán quyết kẻ khả nghi.',
    avatarUrl: roleAssetsMap[key] || ROLE_CARD_IMAGES[key] || '/images/roles/villager.png',
  };
}

export interface NightTurnActionDefinition {
  step: string;
  role: string;
  titleVi: string;
  descriptionVi: string;
  colorHex: string;
  canTargetSelf: boolean;
  canTargetDead: boolean;
  maxTargets: number;
  wakeNight: 'FIRST_NIGHT_ONLY' | 'RECURRING' | 'SPECIAL_NIGHT_3';
}
