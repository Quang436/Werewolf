/**
 * @werewolf/shared — Danh mục Type, Interface và Mapping chuẩn cho 40 vai trò
 * (Ultimate Werewolf Deluxe Edition + Wolfpack Expansion)
 */

export type FactionGroup = 'VILLAGE' | 'WEREWOLF' | 'THIRD_PARTY';

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
  MAYOR: '/assets/cards/card_1.png',
  MASON: '/assets/cards/card_2.png',
  LYCAN: '/assets/cards/card_3.png',
  IDIOT: '/assets/cards/card_4.png',
  HUNTER: '/assets/cards/card_5.png',
  GHOST: '/assets/cards/card_6.png',
  DISEASED: '/assets/cards/card_7.png',
  AURA_SEER: '/assets/cards/card_8.png',
  APPRENTICE_SEER: '/assets/cards/card_9.png',
  BODYGUARD: '/assets/cards/card_10.png',
  SEER: '/assets/cards/card_11.png',
  WITCH: '/assets/cards/card_12.png',
  DRUNK: '/assets/cards/card_13.png',
  VILLAGER: '/assets/cards/card_14.png',
  TROUBLE_MAKER: '/assets/cards/card_15.png',
  TOUGH_GUY: '/assets/cards/card_16.png',
  SPELLCASTER: '/assets/cards/card_17.png',
  PRINCE: '/assets/cards/card_18.png',
  PRIEST: '/assets/cards/card_19.png',
  PI: '/assets/cards/card_20.png',
  PACIFIST: '/assets/cards/card_21.png',
  OLD_HAG: '/assets/cards/card_22.png',
  BIG_BAD_WOLF: '/assets/cards/card_23.png',
  WOLVERINE: '/assets/cards/card_24.png',
  FANG_FACE: '/assets/cards/card_25.png',
  FRUIT_BRUTE: '/assets/cards/card_26.png',
  FRUIT_WOLF: '/assets/cards/card_26.png',
  DIRE_WOLF: '/assets/cards/card_27.png',
  WOLF_CUB: '/assets/cards/card_28.png',
  LONE_WOLF: '/assets/cards/card_29.png',
  WEREWOLF: '/assets/cards/card_30.png',
  SORCERESS: '/assets/cards/card_31.png',
  MINION: '/assets/cards/card_32.png',
  CURSED: '/assets/cards/card_33.png',
  VAMPIRE: '/assets/cards/card_34.png',
  TANNER: '/assets/cards/card_35.png',
  VIRGINIA_WOOLF: '/assets/cards/card_36.png',
  HOODLUM: '/assets/cards/card_37.png',
  CULT_LEADER: '/assets/cards/card_38.png',
  CUPID: '/assets/cards/card_39.png',
  DOPPELGANGER: '/assets/cards/card_40.png',
};

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
