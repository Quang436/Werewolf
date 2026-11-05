import { Role, Team } from '@werewolf/shared';

// Full 40-Role Item Interface
export interface RoleCatalogItem {
  role: Role;
  nameVN: string;
  nameEN: string;
  category: 'werewolf' | 'villager' | 'third';
  categoryLabel: string;
  icon: string;
  points: string;
  pointsType: 'pos' | 'neg' | 'neu';
  time: string;
  badge: string;
  desc: string;
  image: string;
}

// 40 FULL ROLES FROM THE WEREWOLF ENCYCLOPEDIA (Ultimate Werewolf Deluxe + Wolfpack)
export const ALL_40_ROLES: RoleCatalogItem[] = [
  // ==========================================
  // 1. PHE DÂN LÀNG (22 Roles)
  // ==========================================
  {
    role: 'MAYOR',
    nameVN: 'Thị Trưởng',
    nameEN: 'Mayor',
    category: 'villager',
    categoryLabel: 'Phe Dân Làng',
    icon: '🎩',
    points: '+2 Điểm',
    pointsType: 'pos',
    time: 'Ban Ngày',
    badge: '2 Lá Phiếu',
    desc: 'Lá phiếu của Thị Trưởng có giá trị gấp đôi (2 phiếu) khi biểu quyết ban ngày. Có quyền chỉ định người kế nhiệm khi bị loại.',
    image: '/assets/cards/card_1.png',
  },
  {
    role: 'MASON',
    nameVN: 'Hội Tam Điểm',
    nameEN: 'Mason',
    category: 'villager',
    categoryLabel: 'Phe Dân Làng',
    icon: '🤝',
    points: '+2 Điểm',
    pointsType: 'pos',
    time: 'Đêm Đầu Tiên',
    badge: 'Liên Minh Làng',
    desc: 'Được gọi dậy vào đêm đầu tiên để nhận diện các thành viên Tam Điểm khác, tạo thành liên minh dân làng tin cậy 100%.',
    image: '/assets/cards/card_2.png',
  },
  {
    role: 'LYCAN',
    nameVN: 'Kẻ Hóa Thú',
    nameEN: 'Lycanthrope',
    category: 'villager',
    categoryLabel: 'Phe Dân Làng',
    icon: '🐺',
    points: '-1 Điểm',
    pointsType: 'neg',
    time: 'Bị Động',
    badge: 'Soi Ra Sói',
    desc: 'Thực chất thuộc phe Dân Làng, nhưng mang dòng máu sói nên nếu bị Tiên Tri soi sẽ hiện ra kết quả là Ma Sói.',
    image: '/assets/cards/card_3.png',
  },
  {
    role: 'IDIOT',
    nameVN: 'Kẻ Ngốc Trong Làng',
    nameEN: 'Village Idiot',
    category: 'villager',
    categoryLabel: 'Phe Dân Làng',
    icon: '🤪',
    points: '-2 Điểm',
    pointsType: 'neg',
    time: 'Bị Động',
    badge: 'Miễn Tử Treo Cổ',
    desc: 'Luôn tự động vote chết trong các phiên treo cổ. Nếu bị cả làng vote treo cổ sẽ lật bài thoát chết lần đầu.',
    image: '/assets/cards/card_4.png',
  },
  {
    role: 'HUNTER',
    nameVN: 'Thợ Săn',
    nameEN: 'Hunter',
    category: 'villager',
    categoryLabel: 'Phe Dân Làng',
    icon: '🏹',
    points: '+3 Điểm',
    pointsType: 'pos',
    time: 'Bị Động',
    badge: 'Kéo Theo 1 Mạng',
    desc: 'Khi Thợ Săn bị loại bỏ bởi Sói cắn hoặc bị treo cổ, lập tức nổ súng kéo theo 1 người bất kỳ cùng chết.',
    image: '/assets/cards/card_5.png',
  },
  {
    role: 'GHOST',
    nameVN: 'Oan Hồn',
    nameEN: 'Ghost',
    category: 'villager',
    categoryLabel: 'Phe Dân Làng',
    icon: '👻',
    points: '+2 Điểm',
    pointsType: 'pos',
    time: 'Mỗi Đêm',
    badge: 'Gửi Ký Tự',
    desc: 'Bị loại ngay trong đêm đầu tiên. Mỗi đêm/ngày được gửi 1 ký tự gợi ý cho cả làng trước khi đi ngủ.',
    image: '/assets/cards/card_6.png',
  },
  {
    role: 'DISEASED',
    nameVN: 'Người Nhiễm Bệnh',
    nameEN: 'Diseased',
    category: 'villager',
    categoryLabel: 'Phe Dân Làng',
    icon: '🤢',
    points: '+3 Điểm',
    pointsType: 'pos',
    time: 'Bị Động',
    badge: 'Khóa Sói 1 Đêm',
    desc: 'Nếu bị Ma Sói cắn, bầy Sói bị lây bệnh hiểm nghèo và mất lượt cắn ở đêm kế tiếp.',
    image: '/images/roles/diseased.png',
  },
  {
    role: 'AURA_SEER',
    nameVN: 'Tiên Tri Hào Quang',
    nameEN: 'Aura Seer',
    category: 'villager',
    categoryLabel: 'Phe Dân Làng',
    icon: '✨',
    points: '+3 Điểm',
    pointsType: 'pos',
    time: 'Mỗi Đêm',
    badge: 'Soi Chức Năng',
    desc: 'Mỗi đêm soi 1 người xem có chức năng đặc biệt hay không (không phải Dân thường và không phải Sói).',
    image: '/assets/cards/card_8.png',
  },
  {
    role: 'APPRENTICE_SEER',
    nameVN: 'Tập Sự Tiên Tri',
    nameEN: 'Apprentice Seer',
    category: 'villager',
    categoryLabel: 'Phe Dân Làng',
    icon: '🔮',
    points: '+4 Điểm',
    pointsType: 'pos',
    time: 'Kế Thừa',
    badge: 'Kế Nhiệm Seer',
    desc: 'Nhận toàn bộ quyền năng của Tiên Tri khi Tiên Tri chính thức trong làng bị loại bỏ.',
    image: '/assets/cards/card_9.png',
  },
  {
    role: 'BODYGUARD',
    nameVN: 'Bảo Vệ',
    nameEN: 'Bodyguard',
    category: 'villager',
    categoryLabel: 'Phe Dân Làng',
    icon: '🛡️',
    points: '+3 Điểm',
    pointsType: 'pos',
    time: 'Mỗi Đêm',
    badge: 'Khiên Hộ Vệ',
    desc: 'Mỗi đêm chọn 1 người bảo vệ khỏi cái chết (không chọn cùng 1 người 2 đêm liên tiếp).',
    image: '/assets/cards/card_10.png',
  },
  {
    role: 'SEER',
    nameVN: 'Tiên Tri',
    nameEN: 'Seer',
    category: 'villager',
    categoryLabel: 'Phe Dân Làng',
    icon: '👁️',
    points: '+7 Điểm',
    pointsType: 'pos',
    time: 'Mỗi Đêm',
    badge: 'Soi Thấu Sói',
    desc: 'Mỗi đêm thức dậy chỉ định 1 người để biết người đó có phải là Ma Sói hay không.',
    image: '/assets/cards/card_11.png',
  },
  {
    role: 'WITCH',
    nameVN: 'Phù Thủy',
    nameEN: 'Witch',
    category: 'villager',
    categoryLabel: 'Phe Dân Làng',
    icon: '🧪',
    points: '+4 Điểm',
    pointsType: 'pos',
    time: 'Mỗi Đêm',
    badge: 'Cứu & Độc',
    desc: 'Sở hữu 1 bình cứu (biết ai bị cắn để cứu) và 1 bình độc (chọn 1 người để giết). Có thể dùng cả 2 bình trong 1 đêm.',
    image: '/assets/cards/card_12.png',
  },
  {
    role: 'VILLAGER',
    nameVN: 'Dân Làng',
    nameEN: 'Villager',
    category: 'villager',
    categoryLabel: 'Phe Dân Làng',
    icon: '🌾',
    points: '+1 Điểm',
    pointsType: 'pos',
    time: 'Ban Ngày',
    badge: 'Biểu Quyết',
    desc: 'Ngủ suốt đêm, tham gia tranh luận suy luận logic và bỏ phiếu biểu quyết tìm Sói vào ban ngày.',
    image: '/assets/cards/card_14.png',
  },
  {
    role: 'TROUBLE_MAKER',
    nameVN: 'Kẻ Gây Rối',
    nameEN: 'Troublemaker',
    category: 'villager',
    categoryLabel: 'Phe Dân Làng',
    icon: '💣',
    points: '-3 Điểm',
    pointsType: 'neg',
    time: '1 Đêm Duy Nhất',
    badge: '2 Phiên Treo Cổ',
    desc: '1 lần trong game, kích hoạt để ngày hôm sau có 2 phiên treo cổ liên tiếp.',
    image: '/assets/cards/card_15.png',
  },
  {
    role: 'TOUGH_GUY',
    nameVN: 'Người Cứng Cỏi',
    nameEN: 'Tough Guy',
    category: 'villager',
    categoryLabel: 'Phe Dân Làng',
    icon: '💪',
    points: '+3 Điểm',
    pointsType: 'pos',
    time: 'Bị Động',
    badge: 'Trì Hoãn Chết',
    desc: 'Bị Sói cắn sẽ không chết ngay mà trì hoãn cái chết sang đêm tiếp theo mới gục ngã.',
    image: '/assets/cards/card_16.png',
  },
  {
    role: 'SPELLCASTER',
    nameVN: 'Người Phù Phép',
    nameEN: 'Spellcaster',
    category: 'villager',
    categoryLabel: 'Phe Dân Làng',
    icon: '🤐',
    points: '+1 Điểm',
    pointsType: 'pos',
    time: 'Mỗi Đêm',
    badge: 'Chỉ Định Câm',
    desc: 'Mỗi đêm chọn 1 người bị câm (không được nói/chat) vào ngày hôm sau.',
    image: '/assets/cards/card_17.png',
  },
  {
    role: 'PRINCE',
    nameVN: 'Hoàng Tử',
    nameEN: 'Prince',
    category: 'villager',
    categoryLabel: 'Phe Dân Làng',
    icon: '👑',
    points: '+3 Điểm',
    pointsType: 'pos',
    time: 'Ban Ngày',
    badge: 'Thoát Chết Treo Cổ',
    desc: 'Nếu bị vote treo cổ, tự động lật bài chứng minh thân phận thoát chết lần đầu, cả làng lập tức đi ngủ.',
    image: '/assets/cards/card_18.png',
  },
  {
    role: 'PRIEST',
    nameVN: 'Thầy Tu',
    nameEN: 'Priest',
    category: 'villager',
    categoryLabel: 'Phe Dân Làng',
    icon: '✝️',
    points: '+3 Điểm',
    pointsType: 'pos',
    time: '1 Đêm Duy Nhất',
    badge: 'Thánh Hóa Bất Tử',
    desc: '1 lần trong game, chọn bảo vệ 1 người bất tử suốt đêm khỏi mọi vết cắn và độc dược.',
    image: '/assets/cards/card_19.png',
  },
  {
    role: 'PI',
    nameVN: 'Thám Tử (P.I.)',
    nameEN: 'P.I.',
    category: 'villager',
    categoryLabel: 'Phe Dân Làng',
    icon: '🔍',
    points: '+3 Điểm',
    pointsType: 'pos',
    time: '1 Lần / 3 Đêm Đầu',
    badge: 'Quét 3 Người Kề Nhau',
    desc: '1 lần trong 3 đêm đầu, chọn 1 người để biết người đó hoặc 2 người bên cạnh có ai là Sói hay không.',
    image: '/assets/cards/card_20.png',
  },
  {
    role: 'PACIFIST',
    nameVN: 'Người Yêu Hòa Bình',
    nameEN: 'Pacifist',
    category: 'villager',
    categoryLabel: 'Phe Dân Làng',
    icon: '🕊️',
    points: '-1 Điểm',
    pointsType: 'neg',
    time: 'Ban Ngày',
    badge: 'Vote Cho Người Sống',
    desc: 'Tín đồ hòa bình tuyệt đối. Luôn tự động vote cho người chơi được sống trong mọi phiên biểu quyết.',
    image: '/assets/cards/card_21.png',
  },
  {
    role: 'OLD_HAG',
    nameVN: 'Phù Thủy Già',
    nameEN: 'Old Hag',
    category: 'villager',
    categoryLabel: 'Phe Dân Làng',
    icon: '🧙‍♀️',
    points: '+1 Điểm',
    pointsType: 'pos',
    time: 'Mỗi Đêm',
    badge: 'Đuổi Khỏi Làng',
    desc: 'Mỗi đêm chọn 1 người phải rời làng hôm sau (bị cấm nói và cấm vote trong ngày).',
    image: '/assets/cards/card_22.png',
  },
  {
    role: 'CUPID',
    nameVN: 'Thần Tình Yêu',
    nameEN: 'Cupid',
    category: 'villager',
    categoryLabel: 'Phe Dân Làng',
    icon: '🏹',
    points: '-3 Điểm',
    pointsType: 'neg',
    time: 'Đêm Đầu Tiên',
    badge: 'Ghép Đôi Định Mệnh',
    desc: 'Đêm đầu tiên chọn 2 người liên kết thành Cặp đôi. 1 người chết thì người kia chết theo. Khác phe thành Phe thứ 3.',
    image: '/assets/cards/card_39.png',
  },

  // ==========================================
  // 2. PHE MA SÓI (10 Roles)
  // ==========================================
  {
    role: 'BIG_BAD_WOLF',
    nameVN: 'Sói Đại Ca',
    nameEN: 'Big Bad Wolf',
    category: 'werewolf',
    categoryLabel: 'Phe Ma Sói',
    icon: '🐺',
    points: '-9 Điểm',
    pointsType: 'neg',
    time: 'Mỗi Đêm',
    badge: 'Cắn 2 Liền Kề',
    desc: 'Chừng nào còn sống, bầy Sói được quyền cắn 2 người ngồi cạnh nhau mỗi đêm.',
    image: '/assets/cards/card_23.png',
  },
  {
    role: 'WOLVERINE',
    nameVN: 'Vuốt Sói',
    nameEN: 'Wolverine',
    category: 'werewolf',
    categoryLabel: 'Phe Ma Sói',
    icon: '⚡',
    points: '-4 Điểm',
    pointsType: 'neg',
    time: 'Mỗi Đêm',
    badge: 'Âm Thanh Kim Loại',
    desc: 'Thức dậy cùng Sói, nếu là con Sói ngồi gần nạn nhân nhất thì phát ra âm thanh kim loại cảnh báo.',
    image: '/assets/cards/card_24.png',
  },
  {
    role: 'FANG_FACE',
    nameVN: 'Nanh Sói',
    nameEN: 'Fang Face',
    category: 'werewolf',
    categoryLabel: 'Phe Ma Sói',
    icon: '🦷',
    points: '-5 Điểm',
    pointsType: 'neg',
    time: 'Đêm Đầu',
    badge: 'Nanh Ngủ Đông',
    desc: 'Thức dậy cùng Sói đêm đầu, các đêm sau ngủ cho đến khi các Sói khác chết hết mới thức tỉnh.',
    image: '/assets/cards/card_25.png',
  },
  {
    role: 'FRUIT_WOLF',
    nameVN: 'Sói Ăn Chay',
    nameEN: 'Fruit Brute',
    category: 'werewolf',
    categoryLabel: 'Phe Ma Sói',
    icon: '🍎',
    points: '-3 Điểm',
    pointsType: 'neg',
    time: 'Mỗi Đêm',
    badge: 'Sói Cuối Không Cắn',
    desc: 'Thức dậy cùng Sói, nhưng nếu là Sói cuối cùng còn lại sẽ không thể cắn ai.',
    image: '/assets/cards/card_26.png',
  },
  {
    role: 'DIRE_WOLF',
    nameVN: 'Sói Tuyết',
    nameEN: 'Dire Wolf',
    category: 'werewolf',
    categoryLabel: 'Phe Ma Sói',
    icon: '❄️',
    points: '-4 Điểm',
    pointsType: 'neg',
    time: 'Đêm Đầu & Mỗi Đêm',
    badge: 'Bạn Đồng Hành',
    desc: 'Đêm đầu chọn 1 người làm bạn đồng hành. Người đó chết thì Sói tuyết chết theo.',
    image: '/assets/cards/card_27.png',
  },
  {
    role: 'WOLF_CUB',
    nameVN: 'Sói Con',
    nameEN: 'Wolf Cub',
    category: 'werewolf',
    categoryLabel: 'Phe Ma Sói',
    icon: '🐾',
    points: '-8 Điểm',
    pointsType: 'neg',
    time: 'Mỗi Đêm',
    badge: 'Phẫn Nộ Cắn 2',
    desc: 'Thức dậy cùng Sói. Nếu Sói con bị giết, đêm hôm sau bầy Sói được cắn 2 người.',
    image: '/assets/cards/card_28.png',
  },
  {
    role: 'LONE_WOLF',
    nameVN: 'Sói Cô Đơn',
    nameEN: 'Lone Wolf',
    category: 'werewolf',
    categoryLabel: 'Phe Ma Sói',
    icon: '🌙',
    points: '-5 Điểm',
    pointsType: 'neg',
    time: 'Mỗi Đêm',
    badge: 'Sống Sót Cuối Cùng',
    desc: 'Thức dậy cùng Sói, nhưng chỉ thắng khi là người duy nhất sống sót cuối cùng trên bàn.',
    image: '/assets/cards/card_29.png',
  },
  {
    role: 'WEREWOLF',
    nameVN: 'Ma Sói Thường',
    nameEN: 'Werewolf',
    category: 'werewolf',
    categoryLabel: 'Phe Ma Sói',
    icon: '🐺',
    points: '-6 Điểm',
    pointsType: 'neg',
    time: 'Mỗi Đêm',
    badge: 'Cắn Đêm',
    desc: 'Cùng đàn sói thức dậy mỗi đêm đồng thuận bỏ phiếu cắn 1 người dân làng.',
    image: '/images/roles/werewolf.png',
  },
  {
    role: 'SORCERESS',
    nameVN: 'Pháp Sư Sói',
    nameEN: 'Sorceress',
    category: 'werewolf',
    categoryLabel: 'Phe Ma Sói',
    icon: '🔮',
    points: '-3 Điểm',
    pointsType: 'neg',
    time: 'Mỗi Đêm',
    badge: 'Tìm Tiên Tri',
    desc: 'Mỗi đêm thức dậy tìm Tiên tri (không biết Sói là ai, Tiên tri soi ra Dân thường).',
    image: '/assets/cards/card_31.png',
  },
  {
    role: 'MINION',
    nameVN: 'Kẻ Phản Bội',
    nameEN: 'Minion',
    category: 'werewolf',
    categoryLabel: 'Phe Ma Sói',
    icon: '🗡️',
    points: '-6 Điểm',
    pointsType: 'neg',
    time: 'Đêm Đầu Tiên',
    badge: 'Bảo Vệ Đàn Sói',
    desc: 'Biết Sói là ai nhưng không thức dậy cùng Sói; Tiên tri soi ra Dân làng.',
    image: '/assets/cards/card_32.png',
  },

  // ==========================================
  // 3. PHE ĐỔI PHE & BIỆT LẬP (8 Roles)
  // ==========================================
  {
    role: 'CURSED',
    nameVN: 'Kẻ Bị Nguyền Rủa',
    nameEN: 'Cursed',
    category: 'third',
    categoryLabel: 'Phe Đổi Phe & Biệt Lập',
    icon: '⛓️',
    points: '-3 Điểm',
    pointsType: 'neg',
    time: 'Bị Động',
    badge: 'Biến Thành Sói',
    desc: 'Ban đầu là Dân, nếu bị Sói cắn sẽ không chết mà biến thành Ma Sói từ đêm tiếp theo.',
    image: '/assets/cards/card_33.png',
  },
  {
    role: 'VAMPIRE',
    nameVN: 'Ma Cà Rồng',
    nameEN: 'Vampire',
    category: 'third',
    categoryLabel: 'Phe Đổi Phe & Biệt Lập',
    icon: '🧛',
    points: '-7 Điểm',
    pointsType: 'neg',
    time: 'Mỗi Đêm',
    badge: 'Miễn Nhiễm Cắn Sói',
    desc: 'Không thể bị Sói cắn chết ban đêm. Mỗi đêm chọn 1 người, nạn nhân sẽ chết sau phiên treo cổ ngày hôm sau.',
    image: '/assets/cards/card_34.png',
  },
  {
    role: 'TANNER',
    nameVN: 'Chán Đời',
    nameEN: 'Tanner',
    category: 'third',
    categoryLabel: 'Phe Đổi Phe & Biệt Lập',
    icon: '🎭',
    points: '-2 Điểm',
    pointsType: 'neg',
    time: 'Ban Ngày',
    badge: 'Thắng Khi Bị Treo Cổ',
    desc: 'Thắng ngay lập tức nếu bị cả làng vote treo cổ ban ngày.',
    image: '/assets/cards/card_35.png',
  },
  {
    role: 'VIRGINIA_WOOLF',
    nameVN: 'Mẹ Trẻ (Virginia Woolf)',
    nameEN: 'Virginia Woolf',
    category: 'third',
    categoryLabel: 'Phe Đổi Phe & Biệt Lập',
    icon: '🥀',
    points: '-2 Điểm',
    pointsType: 'neg',
    time: 'Đêm Đầu Tiên',
    badge: 'Kéo Theo Kẻ Sợ',
    desc: 'Đêm 1 chọn 1 người sợ mình. Khi Mẹ trẻ chết, người đó cũng chết theo.',
    image: '/assets/cards/card_36.png',
  },
  {
    role: 'HOODLUM',
    nameVN: 'Du Côn',
    nameEN: 'Hoodlum',
    category: 'third',
    categoryLabel: 'Phe Đổi Phe & Biệt Lập',
    icon: '🥊',
    points: '0 Điểm',
    pointsType: 'neu',
    time: 'Đêm Đầu Tiên',
    badge: 'Mục Tiêu 2 Người',
    desc: 'Đêm 1 chỉ định 2 người. Thắng nếu 2 người đó chết còn Du côn vẫn sống sót ở cuối game.',
    image: '/assets/cards/card_37.png',
  },
  {
    role: 'CULT_LEADER',
    nameVN: 'Trưởng Giáo Phái',
    nameEN: 'Cult Leader',
    category: 'third',
    categoryLabel: 'Phe Đổi Phe & Biệt Lập',
    icon: '👁️',
    points: '+1 Điểm',
    pointsType: 'pos',
    time: 'Mỗi Đêm',
    badge: 'Thu Nạp Giáo Phái',
    desc: 'Mỗi đêm kết nạp 1 người vào giáo phái. Thắng khi tất cả người còn sống đều thuộc giáo phái.',
    image: '/assets/cards/card_38.png',
  },
  {
    role: 'DRUNK',
    nameVN: 'Say Rượu',
    nameEN: 'Drunk',
    category: 'third',
    categoryLabel: 'Phe Đổi Phe & Biệt Lập',
    icon: '🍺',
    points: '+4 Điểm',
    pointsType: 'pos',
    time: 'Đêm Thứ 3',
    badge: 'Tỉnh Rượu Đêm 3',
    desc: 'Thuộc phe Dân trong 2 đêm đầu. Đến đêm 3 mới thức dậy rút ngẫu nhiên vai trò thật sự của mình.',
    image: '/assets/cards/card_13.png',
  },
  {
    role: 'DOPPELGANGER',
    nameVN: 'Nhân Bản',
    nameEN: 'Doppelgänger',
    category: 'third',
    categoryLabel: 'Phe Đổi Phe & Biệt Lập',
    icon: '👥',
    points: '-2 Điểm',
    pointsType: 'neg',
    time: 'Đêm Đầu Tiên',
    badge: 'Kế Thừa Thân Phận',
    desc: 'Đêm 1 chọn 1 người. Khi người đó chết, Nhân bản nhận toàn bộ vai trò và phe phái của người đó.',
    image: '/assets/cards/card_40.png',
  },
];

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
  MAYOR: {
    winCondition: 'Dẫn dắt dân làng giành chiến thắng và quét sạch Ma Sói.',
    abilityTitle: 'Quyền Lực Trọng Tài',
    abilityInstruction: 'Phiếu bầu của bạn tính là 2 phiếu khi biểu quyết ban ngày. Có quyền trao quyền kế nhiệm khi chết.',
    lore: 'Người đứng đầu hội đồng làng với tiếng nói quyền lực gấp đôi mọi công dân khác.',
  },
  MASON: {
    winCondition: 'Đoàn kết cùng các thành viên Tam Điểm và Dân Làng tiêu diệt toàn bộ Ma Sói.',
    abilityTitle: 'Hội Huynh Đệ',
    abilityInstruction: 'Thức dậy trong đêm đầu tiên để nhận diện các đồng môn, tạo nên khối liên minh tuyệt đối tin cậy.',
    lore: 'Hội kín bí ẩn giữa lòng ngôi làng, nắm giữ những bí mật bảo vệ sự bình yên của vùng đất.',
  },
  LYCAN: {
    winCondition: 'Tiêu diệt toàn bộ bầy Ma Sói cùng Dân Làng.',
    abilityTitle: 'Dòng Máu Hóa Thú',
    abilityInstruction: 'Thuộc phe Dân Làng nhưng nếu bị Tiên Tri soi sẽ hiện ra kết quả là Ma Sói do mang dòng máu cổ xưa.',
    lore: 'Người đàn ông tội nghiệp mang lời nguyền hóa thú nhưng vẫn giữ trọn lòng trung thành với đồng loại.',
  },
  IDIOT: {
    winCondition: 'Cùng Dân Làng quét sạch Ma Sói.',
    abilityTitle: 'Thoát Chết Khờ Khạo',
    abilityInstruction: 'Luôn tự động vote chết trong các phiên treo cổ. Nếu bị cả làng vote treo cổ sẽ lật bài thoát chết lần đầu.',
    lore: 'Kẻ ngốc ngây ngô của ngôi làng, sự khờ dại lại trở thành lá bùa hộ mệnh giúp anh ta thoát chết thần kỳ.',
  },
  HUNTER: {
    winCondition: 'Tiêu diệt toàn bộ bầy Sói. Nếu chết, hãy kéo theo kẻ cầm đầu bầy Sói.',
    abilityTitle: 'Phát Bắn Báo Thù',
    abilityInstruction: 'Khi bạn hi sinh do Sói cắn hoặc bị treo cổ, lập tức nổ súng chỉ định 1 người bất kỳ cùng chết.',
    lore: 'Tay súng thiện xạ không bao giờ gục ngã trong im lặng; viên đạn cuối cùng luôn tìm đến kẻ thù.',
    keybindHint: '[1] Nổ súng kéo theo',
    actionEvent: 'trigger:hunterShot',
  },
  GHOST: {
    winCondition: 'Giúp Dân Làng suy luận chiến thắng thông qua các mật mã ký tự bí mật.',
    abilityTitle: 'Lời Thì Thầm Cõi Âm',
    abilityInstruction: 'Bị loại đêm 1. Mỗi đêm được viết 1 ký tự gợi ý manh mối duy nhất gửi cho cả làng trước bình minh.',
    lore: 'Linh hồn vất vưởng không siêu thoát, cố gắng gửi những ký tự định mệnh cứu vớt người sống sót.',
  },
  DISEASED: {
    winCondition: 'Tiêu diệt toàn bộ bầy Ma Sói.',
    abilityTitle: 'Dịch Bệnh Lây Nhiễm',
    abilityInstruction: 'Nếu bạn bị Ma Sói cắn trong đêm, bầy Sói sẽ bị lây bệnh và hoàn toàn bị khóa nanh vuốt vào đêm kế tiếp.',
    lore: 'Mang trong mình mầm bệnh hiểm nghèo, máu của anh ta là liều thuốc độc làm tê liệt nanh vuốt loài sói.',
  },
  AURA_SEER: {
    winCondition: 'Dẫn dắt Dân Làng phát hiện các thế lực bí ẩn và tiêu diệt Ma Sói.',
    abilityTitle: 'Nhãn Thần Hào Quang',
    abilityInstruction: 'Mỗi đêm soi 1 người xem có chức năng đặc biệt hay không (không phải Dân thường và không phải Sói).',
    lore: 'Đôi mắt có thể nhìn thấy vầng hào quang phép thuật tỏa ra từ những nhân vật mang sứ mệnh kỳ lạ.',
  },
  APPRENTICE_SEER: {
    winCondition: 'Kế thừa sứ mệnh Tiên Tri dẫn lối Dân Làng đến chiến thắng.',
    abilityTitle: 'Thừa Kế Thiên Mệnh',
    abilityInstruction: 'Chỉ là Dân Làng cho đến khi Tiên Tri chính thức bị loại, bạn sẽ lập tức thức tỉnh toàn bộ năng lực soi đêm.',
    lore: 'Người học việc thầm lặng bên quả cầu pha lê, sẵn sàng bước ra ánh sáng khi người thầy ngã xuống.',
  },
  BODYGUARD: {
    winCondition: 'Bảo vệ dân làng sống sót và tiêu diệt hết Ma Sói.',
    abilityTitle: 'Khiên Thần Hộ Vệ',
    abilityInstruction: 'Chọn 1 người bất kỳ mỗi đêm (có thể chọn bản thân) để che chắn. Lưu ý không chọn lại cùng 1 người 2 đêm liền kề.',
    lore: 'Hiệp sĩ trung kiên với tấm khiên thép không thể xuyên phá, sẵn sàng chắn mọi vết nanh vuốt sói.',
    keybindHint: '[1] Bảo vệ',
    actionEvent: 'night:bodyguardProtect',
  },
  SEER: {
    winCondition: 'Dẫn lối Dân Làng tiêu diệt toàn bộ bầy Ma Sói.',
    abilityTitle: 'Quả Cầu Soi Thấu',
    abilityInstruction: 'Chọn 1 người chơi vào ban đêm để xem người đó thuộc phe Sói hay Dân. Giữ bí mật thân phận kẻo bị Sói cắn trước!',
    lore: 'Nhà tiên tri nhìn thấu qua bóng tối màn đêm, thấy rõ bản chất thật đằng sau những lớp mặt nạ.',
    keybindHint: '[1] Soi bài đêm',
    actionEvent: 'night:seerCheck',
  },
  WITCH: {
    winCondition: 'Tiêu diệt Ma Sói bằng bình độc và bảo toàn tính mạng cho Dân Làng.',
    abilityTitle: 'Bình Cứu & Bình Độc',
    abilityInstruction: 'Quản trò cho bạn biết ai bị Sói cắn đêm nay. Dùng bình Cứu để hồi sinh hoặc bình Độc để tiêu diệt kẻ tình nghi.',
    lore: 'Bậc thầy độc dược và thần dược, nắm giữ ranh giới mong manh giữa sự sống và cái chết trong lòng bàn tay.',
    keybindHint: '[1] Cứu / [2] Đầu độc',
    actionEvent: 'night:witchAction',
  },
  VILLAGER: {
    winCondition: 'Tiêu diệt toàn bộ bầy Ma Sói và các thế lực tà ác đe dọa ngôi làng.',
    abilityTitle: 'Biểu Quyết Treo Cổ',
    abilityInstruction: 'Hãy chú ý lắng nghe lời khai, quan sát thái độ của người khác để tìm ra kẽ hở và bỏ phiếu loại bỏ Sói.',
    lore: 'Những người dân làng chất phác, dùng sự đoàn kết và lá phiếu sinh tử vào ban ngày để bảo vệ ngôi nhà của mình.',
    keybindHint: '[1] Bỏ phiếu / [E] Tranh luận',
  },
  TROUBLE_MAKER: {
    winCondition: 'Cùng Dân Làng tiêu diệt toàn bộ Ma Sói.',
    abilityTitle: 'Gây Rối Hội Đồng',
    abilityInstruction: 'Kích hoạt một lần trong trận để buộc hội đồng làng phải xử tử hai người chơi trong cùng một ngày.',
    lore: 'Kẻ nổi loạn thích đẩy kịch tính lên đỉnh điểm, tạo nên bước ngoặt sinh tử cho ngôi làng.',
  },
  TOUGH_GUY: {
    winCondition: 'Kiên cường sống sót và diệt sạch bầy Sói.',
    abilityTitle: 'Sức Chịu Đựng Thép',
    abilityInstruction: 'Nếu bị Ma Sói cắn trong đêm, bạn sẽ không chết vào sáng hôm sau mà cầm cự đến rạng sáng đêm tiếp theo.',
    lore: 'Gã thợ rèn với cơ bắp cuồn cuộn và ý chí bất khuất, vết cắn của dã thú không thể quật ngã gã ngay tức khắc.',
  },
  SPELLCASTER: {
    winCondition: 'Hỗ trợ Dân Làng khóa miệng kẻ tình nghi và diệt Sói.',
    abilityTitle: 'Bùa Chú Câm Lặng',
    abilityInstruction: 'Mỗi đêm chỉ định 1 người bị câm hoàn toàn vào ngày hôm sau, không được quyền nói chuyện hay tranh luận.',
    lore: 'Thuật sĩ với những lời nguyền cổ ngữ khiến đối phương phải ngậm chặt miệng trong sự bất lực.',
  },
  PRINCE: {
    winCondition: 'Cùng Dân Làng giành thắng lợi và tiêu diệt Ma Sói.',
    abilityTitle: 'Hoàng Tộc Miễn Tử',
    abilityInstruction: 'Nếu bị hội đồng làng bỏ phiếu treo cổ ban ngày, bạn lật bài thoát chết lần đầu và cả làng đi ngủ ngay.',
    lore: 'Dòng máu quý tộc tôn nghiêm không thể bị phán quyết bởi dây thòng lọng vô căn cứ của đám đông.',
  },
  PRIEST: {
    winCondition: 'Bảo vệ người vô tội và tiêu diệt Ma Sói.',
    abilityTitle: 'Ban Phước Bất Tử',
    abilityInstruction: 'Một lần trong trận, chọn ban phước cho 1 người chơi bất tử suốt đêm khỏi nanh vuốt và độc dược.',
    lore: 'Người cha xứ tận tụy, mang thánh giá xua tan mọi bóng tối ma quỷ quanh ngôi thánh đường cổ kính.',
  },
  PI: {
    winCondition: 'Phá án và chỉ điểm Ma Sói cho Dân Làng.',
    abilityTitle: 'Điều Tra Hiện Trường',
    abilityInstruction: 'Một lần trong 3 đêm đầu, chọn 1 người để biết người đó hoặc 2 người bên cạnh có ai là Ma Sói hay không.',
    lore: 'Vị thám tử tư sắc sảo với chiếc kính lúp và tẩu thuốc, không một dấu vết nào có thể lọt qua mắt ông.',
  },
  PACIFIST: {
    winCondition: 'Chiến thắng cùng Dân Làng bằng con đường hòa bình.',
    abilityTitle: 'Lời Thề Không Đổ Máu',
    abilityInstruction: 'Bạn luôn luôn tự động bỏ phiếu trắng/bỏ phiếu cho người chơi được sống trong mọi phiên treo cổ.',
    lore: 'Nhà tu hành ôn hòa tin rằng bạo lực và giàn treo cổ không phải là câu trả lời cho nỗi sợ hãi.',
  },
  OLD_HAG: {
    winCondition: 'Cùng Dân Làng thanh trừng Ma Sói.',
    abilityTitle: 'Trục Xuất Khỏi Làng',
    abilityInstruction: 'Mỗi đêm chọn 1 người phải rời làng trong ngày hôm sau, mất quyền tranh luận và quyền biểu quyết.',
    lore: 'Bà lão phù thủy lẩm cẩm ở bìa rừng, những lời nguyền đuổi khách của bà khiến không ai dám bén mảng.',
  },
  CUPID: {
    winCondition: 'Ghép đôi và cùng người yêu sống sót đến cuối cùng (nếu ghép khác phe).',
    abilityTitle: 'Mũi Tên Tình Ái',
    abilityInstruction: 'Ghép 2 người chơi bất kỳ vào đêm đầu tiên. 2 người sẽ trở thành Cặp Đôi cùng sống cùng chết.',
    lore: 'Vị thần mang lại mối duyên định mệnh vượt qua ranh giới chủng tộc giữa người và sói.',
    keybindHint: '[1] Ghép đôi',
  },
  BIG_BAD_WOLF: {
    winCondition: 'Tàn sát thần tốc dân làng bằng sức mạnh 2 mạng mỗi đêm.',
    abilityTitle: 'Cuồng Nộ Chúa Tể',
    abilityInstruction: 'Chừng nào còn sống, bầy Sói được quyền cắn 2 người ngồi cạnh nhau mỗi đêm. Hãy quét sạch chức năng làng!',
    lore: 'Sói chúa khổng lồ hung tợn, mang đến cơn ác mộng kinh hoàng gấp đôi cho bất kỳ ngôi làng nào.',
  },
  WOLVERINE: {
    winCondition: 'Cùng bầy Sói áp đảo số dân làng.',
    abilityTitle: 'Vuốt Thép Cảnh Báo',
    abilityInstruction: 'Thức dậy cùng đàn. Nếu bạn là con Sói ngồi gần nạn nhân nhất, tiếng kim loại va chạm sẽ vang lên.',
    lore: 'Dã thú với những móng vuốt kim loại sắc lẹm, mỗi bước đi rình rập đều toát ra âm thanh chết chóc.',
  },
  FANG_FACE: {
    winCondition: 'Sinh tồn và chiến thắng cùng bầy Ma Sói.',
    abilityTitle: 'Nanh Sói Ngủ Đông',
    abilityInstruction: 'Thức dậy cùng bầy đêm 1, sau đó ngủ yên cho đến khi toàn bộ các con Sói khác bị tiêu diệt mới thức tỉnh.',
    lore: 'Kẻ ẩn mình thâm sâu nhất trong bóng tối, chỉ lộ diện nanh vuốt khi đồng loại đã ngã xuống.',
  },
  FRUIT_WOLF: {
    winCondition: 'Chiến thắng cùng đàn Ma Sói.',
    abilityTitle: 'Sói Ăn Chay',
    abilityInstruction: 'Thức dậy cùng Sói. Tuy nhiên nếu là con Sói duy nhất còn sống sót, bạn sẽ không thể cắn ai vào ban đêm.',
    lore: 'Con sói kỳ lạ với lời thề không đổ máu khi đơn độc, nhưng mưu mô của nó vẫn đe dọa cả ngôi làng.',
  },
  DIRE_WOLF: {
    winCondition: 'Cùng bầy Sói và bạn đồng hành sống sót đến cuối cùng.',
    abilityTitle: 'Đồng Hành Sinh Tử',
    abilityInstruction: 'Đêm đầu chọn 1 bạn đồng hành. Nếu người đó chết thì Sói tuyết cũng sẽ chết theo vì đau buồn.',
    lore: 'Bạch dã thú dũng mãnh phương bắc, trung thành tuyệt đối với sinh mệnh của người mà nó đã chọn.',
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
  WEREWOLF: {
    winCondition: 'Tiêu diệt dân làng cho tới khi số Ma Sói bằng hoặc áp đảo số người còn sống.',
    abilityTitle: 'Huyết Sát Bầy Đàn',
    abilityInstruction: 'Hội ý bí mật cùng bầy sói qua kênh chat riêng và thống nhất mục tiêu cắn mỗi đêm.',
    lore: 'Quái thú khát máu khoác lốt người, ẩn mình trong bóng tối chờ đợi cơ hội xé xác con mồi.',
    keybindHint: '[1] Cắn người',
    actionEvent: 'night:wolfVote',
  },
  SORCERESS: {
    winCondition: 'Tìm ra Tiên Tri giúp đàn Sói tiêu diệt chức năng nguy hiểm nhất của làng.',
    abilityTitle: 'Gương Thần Chiêm Tinh',
    abilityInstruction: 'Mỗi đêm soi 1 người xem có phải là Tiên Tri hay không. Bạn không biết ai là Ma Sói trong đàn.',
    lore: 'Mụ phù thủy hắc ám phục tùng loài sói, dùng tà thuật để săn lùng những kẻ nhìn thấu tương lai.',
  },
  MINION: {
    winCondition: 'Hi sinh thân mình để bảo vệ đàn Ma Sói chiến thắng.',
    abilityTitle: 'Lòng Trung Thành Tối Thượng',
    abilityInstruction: 'Biết rõ danh tính tất cả Ma Sói ngay từ đêm đầu. Hãy đánh lạc hướng Dân Làng và nhận tội thay Sói.',
    lore: 'Kẻ phản bội đê tiện cam tâm làm tay sai cho dã thú, sẵn sàng bước lên giàn thiêu để bảo vệ chủ nhân.',
  },
  CURSED: {
    winCondition: 'Chiến thắng cùng Dân Làng ban đầu; nếu bị Sói cắn sẽ chuyển phe Ma Sói.',
    abilityTitle: 'Huyết Chú Ma Sói',
    abilityInstruction: 'Ban đầu thuộc phe Dân Làng. Nếu bị Ma Sói chọn cắn trong đêm, bạn sẽ không chết mà biến thành Ma Sói mới.',
    lore: 'Kẻ mang lời nguyền huyết chú rình rập trong huyết quản, chỉ chờ một giọt máu sói để đánh thức dã tính.',
  },
  VAMPIRE: {
    winCondition: 'Loại bỏ toàn bộ Dân Làng và Ma Sói để trở thành kẻ thống trị màn đêm.',
    abilityTitle: 'Nụ Hôn Huyết Tộc',
    abilityInstruction: 'Không thể bị Sói cắn chết ban đêm. Mỗi đêm chọn 1 người, nạn nhân sẽ chết sau phiên treo cổ ngày hôm sau.',
    lore: 'Chúa tể bóng đêm bất tử, coi cả con người lẫn loài sói chỉ là thức ăn và công cụ tiêu khiển.',
  },
  TANNER: {
    winCondition: 'Bị hội đồng dân làng biểu quyết treo cổ trên giá thiêu vào ban ngày.',
    abilityTitle: 'Kế Hoạch Tử Đạo',
    abilityInstruction: 'Hãy hành xử thật mờ ám vừa đủ để dân làng nghi ngờ bạn là Sói và bỏ phiếu treo cổ bạn!',
    lore: 'Người thợ thuộc da chán chường ghét bỏ thế gian, nụ cười mãn nguyện chỉ nở khi dây thòng lọng siết lại.',
  },
  VIRGINIA_WOOLF: {
    winCondition: 'Sinh tồn và loại bỏ kẻ thù cùng Dân Làng.',
    abilityTitle: 'Nỗi Sợ Định Mệnh',
    abilityInstruction: 'Đêm đầu chọn 1 người chơi phải sợ bạn. Nếu bạn chết, người đó cũng sẽ chết theo ngay lập tức.',
    lore: 'Nữ văn sĩ u sầu với cái nhìn xoáy sâu vào tâm can, kẻ bị bà chỉ định sẽ bị nỗi sợ hãi bóp nghẹt.',
  },
  HOODLUM: {
    winCondition: 'Loại bỏ 2 mục tiêu chỉ định trong đêm đầu và bản thân còn sống đến cuối trận.',
    abilityTitle: 'Bản Hợp Đồng Máu',
    abilityInstruction: 'Đêm 1 chọn 2 mục tiêu bất kỳ. Bằng mọi thủ đoạn khiến cả 2 người đó chết trong khi bạn vẫn sống sót.',
    lore: 'Tên sát thủ du côn đường phố, không quan tâm phe phái, chỉ tập trung hoàn thành bản hợp đồng trừ khử mục tiêu.',
  },
  CULT_LEADER: {
    winCondition: 'Thu nạp toàn bộ những người chơi còn sống sót vào giáo phái của mình.',
    abilityTitle: 'Tẩy Não Giáo Phái',
    abilityInstruction: 'Mỗi đêm chọn kết nạp 1 người vào giáo phái. Bạn thắng ngay lập tức khi toàn bộ người sống đều là tín đồ.',
    lore: 'Giáo chủ tà giáo với tài hùng biện ma mị, biến những kẻ sợ hãi nhất thành tín đồ sùng đạo cuồng nhiệt.',
  },
  DRUNK: {
    winCondition: 'Chiến thắng theo phe của vai trò thật sự sau khi tỉnh rượu.',
    abilityTitle: 'Cơn Say Mộng Mị',
    abilityInstruction: 'Bạn là Dân thường trong 2 đêm đầu. Đến đêm thứ 3 bạn mới tỉnh rượu và được Quản Trò tiết lộ vai trò thật.',
    lore: 'Gã say sưa quên cả danh tính thực của mình, cho đến khi men rượu tan biến vào đêm trăng thứ ba.',
  },
  DOPPELGANGER: {
    winCondition: 'Chiến thắng theo phe của vai trò mà bạn sao chép sau khi người đó chết.',
    abilityTitle: 'Gương Soi Hồn Phách',
    abilityInstruction: 'Đêm 1 chọn sao chép 1 người. Khi người đó bị loại, bạn sẽ kế thừa toàn bộ năng lực và phe phái của người đó.',
    lore: 'Thực thể vô diện có thể khoác lên bất kỳ nhân dạng nào một khi bản gốc đã chìm vào giấc ngủ ngàn thu.',
  },
};

/**
 * Lấy thông tin cơ bản của vai trò từ danh mục 40 thẻ
 */
export function getRoleInfo(role: Role | string): RoleCatalogItem {
  const roleCode = (typeof role === 'string' ? role : 'VILLAGER').toUpperCase();
  const found = ALL_40_ROLES.find((r) => r.role === roleCode || (roleCode === 'FRUIT_BRUTE' && r.role === 'FRUIT_WOLF'));
  if (found) return found;

  return {
    role: 'VILLAGER' as Role,
    nameVN: 'Dân Làng',
    nameEN: 'Villager',
    category: 'villager',
    categoryLabel: 'Phe Dân Làng',
    icon: '🌾',
    points: '+1 Điểm',
    pointsType: 'pos',
    time: 'Ban Ngày',
    badge: 'Biểu Quyết',
    desc: 'Không có năng lực ban đêm. Vũ khí mạnh nhất là suy luận sắc bén và lá phiếu sinh tử vào ban ngày.',
    image: '/assets/cards/card_14.png',
  };
}

/**
 * Lấy chi tiết hướng dẫn kỹ năng mở rộng của vai trò
 */
export function getRoleDetailExtra(role: Role | string): RoleCardDetail {
  const roleCode = (typeof role === 'string' ? role : 'VILLAGER').toUpperCase();
  if (ROLE_DETAILS_EXTRA[roleCode]) {
    return ROLE_DETAILS_EXTRA[roleCode];
  }
  return {
    winCondition: 'Tiêu diệt toàn bộ bầy Ma Sói và bảo vệ ngôi làng.',
    abilityTitle: 'Biểu Quyết Sinh Tử',
    abilityInstruction: 'Ngủ suốt đêm và dùng suy luận logic để tìm kiếm Ma Sói vào ban ngày.',
    lore: 'Một thành viên quan trọng trong ngôi làng u tối.',
  };
}

/**
 * Lấy giao diện màu sắc, huy hiệu và nhãn phe cho modal lật bài
 */
export function getFactionVisuals(category: 'werewolf' | 'villager' | 'third') {
  if (category === 'werewolf') {
    return {
      cardBorder: 'border-rose-600/70',
      badgeBg: 'bg-rose-950/80',
      badgeBorder: 'border-rose-500/50',
      badgeText: 'text-rose-300',
      sealEmoji: '🩸',
      teamLabel: 'Phe Ma Sói',
      auraColor: 'radial-gradient(circle, rgba(185, 28, 28, 0.45) 0%, rgba(0, 0, 0, 0) 70%)',
      titleColor: 'text-rose-400',
      glowColor: 'bg-rose-600/30',
    };
  }
  if (category === 'third') {
    return {
      cardBorder: 'border-purple-600/70',
      badgeBg: 'bg-purple-950/80',
      badgeBorder: 'border-purple-500/50',
      badgeText: 'text-purple-300',
      sealEmoji: '👁️',
      teamLabel: 'Phe Biệt Lập',
      auraColor: 'radial-gradient(circle, rgba(126, 34, 206, 0.45) 0%, rgba(0, 0, 0, 0) 70%)',
      titleColor: 'text-purple-400',
      glowColor: 'bg-purple-600/30',
    };
  }
  return {
    cardBorder: 'border-sky-600/70',
    badgeBg: 'bg-sky-950/80',
    badgeBorder: 'border-sky-500/50',
    badgeText: 'text-sky-300',
    sealEmoji: '🌾',
    teamLabel: 'Phe Dân Làng',
    auraColor: 'radial-gradient(circle, rgba(2, 132, 199, 0.45) 0%, rgba(0, 0, 0, 0) 70%)',
    titleColor: 'text-amber-400',
    glowColor: 'bg-sky-600/30',
  };
}

/**
 * Xáo trộn ngẫu nhiên mảng phần tử (Fisher-Yates)
 */
export function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Tự động tạo bộ bài cân bằng chuẩn cho số lượng người chơi
 */
export function generateBalancedDeck(playerCount: number): Role[] {
  const count = Math.max(4, Math.min(18, playerCount));
  if (count <= 4) return ['WEREWOLF', 'SEER', 'BODYGUARD', 'VILLAGER'];
  if (count === 5) return ['WEREWOLF', 'SEER', 'BODYGUARD', 'VILLAGER', 'VILLAGER'];
  if (count === 6) return ['WEREWOLF', 'WEREWOLF', 'SEER', 'BODYGUARD', 'VILLAGER', 'VILLAGER'];
  if (count === 7) return ['WEREWOLF', 'WEREWOLF', 'SEER', 'BODYGUARD', 'WITCH', 'VILLAGER', 'VILLAGER'];
  if (count === 8) return ['WEREWOLF', 'WEREWOLF', 'SEER', 'BODYGUARD', 'WITCH', 'HUNTER', 'VILLAGER', 'VILLAGER'];
  if (count === 9) return ['WEREWOLF', 'WEREWOLF', 'BIG_BAD_WOLF', 'SEER', 'BODYGUARD', 'WITCH', 'HUNTER', 'VILLAGER', 'VILLAGER'];
  if (count === 10) return ['WEREWOLF', 'WEREWOLF', 'BIG_BAD_WOLF', 'SEER', 'BODYGUARD', 'WITCH', 'HUNTER', 'MAYOR', 'VILLAGER', 'VILLAGER'];

  // 11 - 18 người chơi
  const wolvesCount = Math.floor(count / 3.4);
  const deck: Role[] = [];
  deck.push('BIG_BAD_WOLF');
  for (let i = 1; i < wolvesCount; i++) deck.push('WEREWOLF');
  deck.push('SEER', 'BODYGUARD', 'WITCH', 'HUNTER', 'MAYOR');
  while (deck.length < count) deck.push('VILLAGER');
  return shuffleArray(deck);
}

