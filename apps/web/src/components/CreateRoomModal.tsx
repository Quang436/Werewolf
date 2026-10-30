'use client';

import React, { useState, useMemo } from 'react';
import { Role, RoomSettings } from '@werewolf/shared';
import { werewolfAudio } from './LiarsBar3DExperience';

export interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (settings: Partial<RoomSettings>, hostNickname: string) => void;
  initialNickname?: string;
}

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

// 40 FULL ROLES FROM THE WEREWOLF ENCYCLOPEDIA & SHARED ENGINE
export const ALL_40_ROLES: RoleCatalogItem[] = [
  // ==========================================
  // 1. PHE DÂN LÀNG (21 Roles)
  // ==========================================
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
    desc: 'Không có năng lực ban đêm. Vũ khí mạnh nhất là suy luận sắc bén và lá phiếu sinh tử vào ban ngày.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAr4HqnffL7kCHYAXoCyAVoeHfdCWaQJd9RSd-swHXTxvOqHPv1TuS5JuEJNFumv2wbaVFVOt6FXAwXxNpTHorzvWORHwTWzsPnK9EjAgrRg5hc_RhzHC4OP91kB2d43H7u2uIGJRuhFmzvNxVI0AQavHPY-viteei8MxAuZkRubzDel3pJXHKMIjQyvFm8EvGA6n4eBUdRnOV6Yhao6PDnAzA0snWWE19rcqCkajfOD--W2tEGZl5a6Q',
  },
  {
    role: 'SEER',
    nameVN: 'Tiên Tri',
    nameEN: 'Seer',
    category: 'villager',
    categoryLabel: 'Phe Dân Làng',
    icon: '🔮',
    points: '+7 Điểm',
    pointsType: 'pos',
    time: 'Mỗi Đêm',
    badge: 'Phát Hiện Sói',
    desc: 'Mỗi đêm thức dậy chỉ định 1 người chơi để Quản Trò tiết lộ người đó có phải là Ma Sói hay không.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXGNVBSwaYybHs49ILN6EbPRE0-nnnzMStimewfSXQVuWbprhjv59aoDwYA4RuiKGB9jF7loPr4GCQdFGI8SFcnSVDSLEZNp76eHXQGIL0OvGYW-MDXAFbg88bZNFjtyYZodciLyZbGIuKvE2tDgUZ2u0sTKNd_rG6ztNU6aSYlLMx7GHDoxtVUcyB_hqw9Xlj3ahDpZTBwHciZuPmWPbcyFHqcZZpH_9ibff10TmGVL4zUhxzTZZa-g',
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
    badge: 'Hộ Vệ Sống Sót',
    desc: 'Mỗi đêm chọn bảo hộ 1 người chơi khỏi đòn cắn của Ma Sói. Không bảo vệ cùng 1 người 2 đêm liên tiếp.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAAT71TU4ca8Ud2_yLdoOeuAL6GWN06wyG_b9CC52pjzLZD9ASqXzuxpxCXnmDZpIMcTIAiyOBQNAxvigf2jy_u_g_gqWNtVUnP5j0BPUvnsG2lGbwBrYdN5CWP5V7M13saKWW-xRu4GfaKJd5eAxoTBvdhuWsODWXn7B6B5CnHMozQNaSxRXVrMf7lMj3yr3sNFlywQdhxoRDTz0eJFpi-8iPydFdZL4lC7XkICsASHRSnFOYkxxwd_A',
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
    badge: '2 Bình Thuốc',
    desc: 'Sở hữu 1 bình cứu sống người vừa bị Sói cắn và 1 bình độc dược để trừ khử 1 kẻ tình nghi.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYgEmS9IqQVBCYlStLfGx1UB45kvMGD4o-EqvaPBsioWeseOPkdWgz-HLA25ywA-bes1wP6IZG0Hh_hMDPn-1EmYsn2MzxH10E5DRjuDs3eAjhyFnZiWcyshjErnR7xdl88n7izd2ZAZtm5PbRFjT0psnv6SAw9nRdk7fleEGemaCHq0PRHEokPFzo9Pm03rXopCsrA_ACvpai_8qwzybgxP3Ro6HFbDNN0zzv-8kcwqgTJVBppN_igg',
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
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD_t029UrD0YEcCA9Rbd1ZJAyYx8spLCAIAyfWtCYIor6kRdiOtiEb3Ne3mcBzt9j7C3w8DLKDp2Qo8_VA6K15OKSnYueX4-SGnp75qW-sc1tpMnrUcojU_o1ZJUo4vF8R7GIczopLcc6DSQAO6i8VxPljSF_4gTE_aMfJoP1hJdE1-GO3zLl19AFHLe1l-zH4ZO60G731zDXVPsp17hY5MWpm2kGv-OKnHkN5CZZ8izhGSlwfSfnP1dw',
  },
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
    desc: 'Lá phiếu của Thị Trưởng có giá trị gấp đôi (2 phiếu) khi biểu quyết ban ngày. Có quyền chỉ định người kế nhiệm.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDkL6Z4G4sczkTkKPhZc9uAOqSB9a1qZCdA9NlG_AOjJhDghQ0fAIc9jA2pUDVXNgXpd4SxSo7vnAavmna40EVmlM0soAJexwNzq5Cjc0niA0zjwO3ZA-tab8_6LKgA_kaRpoqsd-jC_3Aemw9gIoF7u33L4_vIJp2zppKu-nSqG2o5kUGwiFRcjI0DwTEoyKZYsDWMn4XU5CFnBDas9e6VH9qzaMCbw0vVvFtEsugsOf4m5R46Os_pYA',
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
    desc: 'Được gọi dậy vào đêm đầu tiên để nhận diện các thành viên Tam Điểm khác, tạo thành một liên minh dân tin cậy 100%.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB3_x5DnZ6IID6r_A0v2qRx4JfOYXzfCA57Tee7pAJqURgDPRCNQwizzKK8NJxIWyhjAhXyrwSD0COxEt-kaBd-XRQf-MAJtAlo7Do14PTyJjXblqZ50z_nNzuM2VYRCw61Qsk8H0jWUau2g3EHoh0PDwJL7_N7ZKLyeYrwvlcKTBs_Sk44RmAF_lvn8BdAZIv1IW862P196BRuC90snkl7EtVwdEXhLSyKzRBIhha5AX6cLKmnjUeSIw',
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
    badge: 'Soi Năng Lực',
    desc: 'Mỗi đêm soi 1 người chơi để biết người đó có sở hữu năng lực đặc biệt nào hay không.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBl-7G4z5LbwbppNWsGzMb9xeQu1zHbdlB6jleXIS0UG1FkCHMPtJJ_u26igYg0JfCwRmfQ9wO4W1-Ka53snFaKCazE4sm36Jb767hJNB2VqekGNXpeAAan-D4bXJmP9qN5IAK6UXFUk9xU1MjgeeTdPnwKtIr85Y0JEnV145kcaYlUn63qRa2yI6CPOkDH9C9zsOmt7Wqp6-D6y39WfWDLw5FhbIWMCtmL7EitelS83L6bK4x_X9XwTA',
  },
  {
    role: 'APPRENTICE_SEER',
    nameVN: 'Tập Sự Tiên Tri',
    nameEN: 'Apprentice Seer',
    category: 'villager',
    categoryLabel: 'Phe Dân Làng',
    icon: '🕯️',
    points: '+4 Điểm',
    pointsType: 'pos',
    time: 'Kế Thừa',
    badge: 'Kế Nhiệm Seer',
    desc: 'Chỉ là Dân bình thường cho đến khi Tiên Tri chính thức bị loại, Tập Sự sẽ lập tức thức tỉnh thành Tiên Tri mới.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAbHMxtL1GcdPfH8fgTT4uZmW2SiH6WA9rA0H8JrYm4JDJRRiZnWvR_Pe1BCa3-Jd-vUMGfElWjidllg5dJihJ7KZvZCF3-A5NTDUBd9mwRzd8tZi8Jh_knEZYV4aMO-STD6TW5tXQvKdeP363d1lVfk57f8uXNZADzsDtw3Rm8DYB3ZXmbvTue3lh9UlcmWbeQ0I1O0gKA2Nj0SotcKOjMd1Qjja6fx_-Iq_wWChDJHT-78EGsP97qGg',
  },
  {
    role: 'SPELLCASTER',
    nameVN: 'Pháp Sư Phong Ấn',
    nameEN: 'Spellcaster',
    category: 'villager',
    categoryLabel: 'Phe Dân Làng',
    icon: '📜',
    points: '+1 Điểm',
    pointsType: 'pos',
    time: 'Mỗi Đêm',
    badge: 'Cấm Nói',
    desc: 'Mỗi đêm chỉ định 1 người chơi. Người bị phong ấn sẽ hoàn toàn bị câm, không được nói hay dùng cử chỉ ngày hôm sau.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAs3mdi0WnPBaBEgR4MI7rAtiMbL1oQEm2ZqGreD84bV_uCAlGeW5lh_DfP5NB6UYLI70tLaYx2-wt3AGAJAvoJp9QO4YQpIhgvItzR9AR-OGUNpAbwOh9407jiQfLqlmmhibJ7T0dyxc187_sE154i5uemzSl5izXqWbuOv3o6kc5kiXXeUmImZpQzQMBsBRtqiny41mO9pci239grauCCR5hgZbkXQpTjXqxR9OkrZ009L7NA5d2U8A',
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
    badge: 'Miễn Treo Cổ',
    desc: 'Nếu bị dân làng bỏ phiếu treo cổ ban ngày, Hoàng Tử lật bài chứng minh thân thế quý tộc và thoát chết ngay tức khắc.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAOh-5HMpubGA6i5WgigLKNXV61n3wym4A8YBnrkheFE2CPc1AHdBFZhNKSZTwYFzP5AlnQbCg4qPGZSZ3sNwvMy7Typ1us-cO9iOofBNBzy5nVEOe6sJsr8_yMY-TZ8KqeYEH2V8OWoa9ZMR2SocGQsLhw74y0tb4lLfEvonhch_WUgX0Oo77M2gQVrYoOEppb6YGjldKR6pgk82RcG1FreDNa8DLMSQQIWA9cnPrmvpGXx6W6wO_8rA',
  },
  {
    role: 'PRIEST',
    nameVN: 'Mục Sư',
    nameEN: 'Priest',
    category: 'villager',
    categoryLabel: 'Phe Dân Làng',
    icon: '⛪',
    points: '+3 Điểm',
    pointsType: 'pos',
    time: '1 Đêm Duy Nhất',
    badge: 'Thánh Hóa Bất Tử',
    desc: '1 lần duy nhất trong trò chơi, ban phước thánh cho 1 người chơi khiến người đó hoàn toàn bất tử trong đêm đó.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCYBV_5J0BsIRksV_PauzXTBGuqKFl2TY6sGg1pUV1B7AeB7KlL-Oxnxn5FgYz60DGASP-_im_tdDMj2ij8fkArgLR_T4JsPOwqjPB1ovKU1GbHqY8SRVdGtlyJPsiE-E2BCpYjQPmAsx8n-XwaXD60GCoODILs-k8FVCXRujMIaI4MtgSEySJ3f1btWry_fm8gbcZOYZAntLCRoy2b2OImD_RO_4fznZqX6h-EM7sqdmJT-MNKf8Pbdw',
  },
  {
    role: 'PI',
    nameVN: 'Thám Tử Tư',
    nameEN: 'P.I. (Investigator)',
    category: 'villager',
    categoryLabel: 'Phe Dân Làng',
    icon: '🔍',
    points: '+3 Điểm',
    pointsType: 'pos',
    time: '1 Đêm Duy Nhất',
    badge: 'Quét 3 Người',
    desc: '1 đêm trong ván, chọn soi 1 người chơi để biết bộ ba gồm người đó và 2 người ngồi sát hai bên có ít nhất 1 Sói hay không.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD4nMKZcEdBdofi94KrOI0tkDOfYA_pnWSfqiHJUIKPIYCnvQRtXytp5pyLklAe39NLO9MCpgHG5-WHGLjo5_oHZ4xbO-2aEqQIIDwFZNahDG-lMrDZknl6S-zOz7ZRnHl3cx3h2Wc63KKU_wF6iMA2pEVQQ1XaqPLxqsHkRfT5Th1h9CxOblG4RVtvH1kJ2YJ3aFZzETKC4XtTcQpkqld2xZKeYGlzLAs-G-GbE4Ou-MWjTuJd1s4ZSA',
  },
  {
    role: 'TOUGH_GUY',
    nameVN: 'Gã Ngoan Cường',
    nameEN: 'Tough Guy',
    category: 'villager',
    categoryLabel: 'Phe Dân Làng',
    icon: '🥊',
    points: '+3 Điểm',
    pointsType: 'pos',
    time: 'Bị Động',
    badge: 'Trì Hoãn Chết',
    desc: 'Nếu bị Ma Sói cắn trong đêm, Gã Ngoan Cường không chết vào sáng hôm sau mà vẫn sống sót đến tận sáng đêm kế tiếp.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAOMwRb486tCu25xkthTPTv5tRTmZTzyEtltdlBZcVQJQ4p5O8GQrSYCTXSqQeegZs9bFeoOMCI8a3q7aAA5nVzGx6EW0r4T1fiQOOX6PMfOirWY4gWqUE5UWYb8_1ZeBVwOhko0l-xJTWylhsbAQ-7Nb-0Ih_-CS4lY-fEUoiXs1JvOAuXGmSkSVQaFc-9dN5TWdgV7zjkusntojKNighQp7gBxNRDa-W2GuFhJfPYVVTBglNbFqYdzA',
  },
  {
    role: 'DISEASED',
    nameVN: 'Người Nhiễm Bệnh',
    nameEN: 'Diseased',
    category: 'villager',
    categoryLabel: 'Phe Dân Làng',
    icon: '☣️',
    points: '+3 Điểm',
    pointsType: 'pos',
    time: 'Bị Động',
    badge: 'Khóa Sói 1 Đêm',
    desc: 'Nếu bị Ma Sói cắn, bầy sói sẽ bị lây bệnh và không thể thức dậy đi săn người trong cả đêm tiếp theo.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBPQ1oo5BCJ7EukNznfO55qnyqgHm1wMuaY-j_C_-a4U7n7tByj5kKVk4jqTLHTa4SkRgcdO9JXFIXzwtdrvTTEbwhxltjTa7xBAI0A5dtX1XEPU4bH7kULw42jbIK6Q52VWb79_mYKfOkjTJnqrX2IIwtRHB1f4is9_EowICZ9Zvoj3bpQkzWvKv2xBgbMFSkcmNnXWD-ZoWqkku0EigC4GQuy11-L-rUOmlKJ2Q_tOL3yJFRHGmx7oQ',
  },
  {
    role: 'LYCAN',
    nameVN: 'Kẻ Hóa Thú',
    nameEN: 'Lycanthrope',
    category: 'villager',
    categoryLabel: 'Phe Dân Làng',
    icon: '🐾',
    points: '-1 Điểm',
    pointsType: 'neg',
    time: 'Bị Động',
    badge: 'Soi Ra Sói',
    desc: 'Thực chất thuộc phe Dân Làng, nhưng mang dòng máu sói nên nếu bị Tiên Tri soi sẽ hiện ra kết quả là Ma Sói.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC4YwxUzuVWEuW7yn2Wathp5yPwhfu9RKFiKQKKHZwreG0X2si6zyVA53h9FHSiXd3NIFIm412oWUGZKysq5P79SefKRNpCJlaS2aV4nNgF8KcXyXOPPiuSBo12d79YUycbMX-VlJ_cP9ckygcaJ5Ej-J0iQfMhs9hTVN0JlBOx8Q3vGyIFBrilK7TzoXERVfrZn-HOSB-432nRF9ozc1wq1K1iflVzS8g2vN-qvlDqJMgOP4NFZTd-hA',
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
    time: 'Mỗi Đêm',
    badge: 'Kết Quả Sai',
    desc: 'Tự tưởng mình là Tiên Tri và thức dậy mỗi đêm, nhưng Quản Trò sẽ đưa ra kết quả hoàn toàn ngẫu nhiên sai lệch.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxL71sCiVpJxVRbAxSqVAGd8YF5anHBLF5b1yAuNh60fosoqvTXu7kZ-zkAZh1cWw3FY0q8P02I0PmoVyq8zyF44S6lBJaghgtiP8igfsZc71_VmIzc0yXfqAjnrzrHY1r6qbCpzt9Hx453qKdxiIq2Yyo_yXePn5UiPSMZeoRNKHcYV-I_JohwVeeJvmYScnrkpFLaSHHO3XsXqGVMi6oOcaa3oNoq0o0wIm2mg9iGaToIM3ZaTUTOA',
  },
  {
    role: 'TROUBLE_MAKER',
    nameVN: 'Kẻ Gây Rối',
    nameEN: 'Troublemaker',
    category: 'villager',
    categoryLabel: 'Phe Dân Làng',
    icon: '💥',
    points: '-3 Điểm',
    pointsType: 'neg',
    time: '1 Đêm Duy Nhất',
    badge: '2 Phiếu Treo',
    desc: '1 lần duy nhất trong ván kích hoạt năng lực khiến ngày hôm sau ngôi làng bắt buộc phải treo cổ 2 người có phiếu cao nhất.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0nM49RPFX05NpDazFCu62c0--FluEV1y_RQ2coiMDpmSKbwV2yrFIGH3Sgln0mLAUhVH-LS6JhT43RUMJpBiDktNztD1DbEpU5F57Ts5ClCFuERMC1nUWZT26-cZaLtvN3YpU1M1aZzs36abN91Xv3A80_XRR5TUPwhgxh1J26rjeYmXJpB8Qx7kJl7VkqA-nirlW55Geco0jshfEQIvBkhkw_SSJk_24bDwDhWQf8aF3tN5n1A_m6g',
  },
  {
    role: 'PACIFIST',
    nameVN: 'Người Hòa Bình',
    nameEN: 'Pacifist',
    category: 'villager',
    categoryLabel: 'Phe Dân Làng',
    icon: '🕊️',
    points: '-1 Điểm',
    pointsType: 'neg',
    time: 'Ban Ngày',
    badge: 'Phi Bạo Lực',
    desc: 'Tín đồ ôn hòa tuyệt đối. Luôn luôn bắt buộc phải bỏ phiếu cho người chơi không bị treo cổ trong các cuộc bỏ phiếu ban ngày.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDtxZxxC0oQXnZkoeo6_uEcEqIi7ho_N7blF0FLQRDmrgAOjpemp95Ns0sIvHgOFcX_ZvV5jo3A0MtQpcgBWYROofQdpvHaG_FLFm4DGdq-J_4ffMixcHp7xT-4RAD6Z1xJKr0eLa_0rhiF6MeT_5lzuPxbNSjw0pfKk0LvY9mfq9oCZotIKjFZ3aWB9iQtmjVyM6ny2-59Y--cHSxSV3HUoTtw9FN2z7kyVUPK9G9kPSBRIopY1SBpqw',
  },
  {
    role: 'OLD_HAG',
    nameVN: 'Bà Lão Cổ Quái',
    nameEN: 'Old Hag',
    category: 'villager',
    categoryLabel: 'Phe Dân Làng',
    icon: '👵',
    points: '+1 Điểm',
    pointsType: 'pos',
    time: 'Mỗi Đêm',
    badge: 'Đuổi Khỏi Làng',
    desc: 'Mỗi đêm chỉ định 1 người chơi phải rời khỏi làng trong cả ngày hôm sau (không được thảo luận và biểu quyết).',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmd2Wa4dbaORBkIl2cRfuF_BknEWsKQTgcq4Km8GnbZVADfPvbXUvCM2VfweD_sB6HOPdyjnKp8M-IPrKdeUL7uzudM_u__yKWeBGjcE9l12HNFaPoFAKyy78q5Po_6VkFzP_prRCEMPJTfjVXCqGARs0x6RUkWYH5RtjxEgEnwocg2FqAenUbms4EJw9lKb9YRp3eG6zHSohfY7bL0ESTi9zrLehjFjfiKgL-tAAUdLRPUEaL1vSI4A',
  },
  {
    role: 'DRUNK',
    nameVN: 'Kẻ Say Rượu',
    nameEN: 'Drunk',
    category: 'villager',
    categoryLabel: 'Phe Dân Làng',
    icon: '🍺',
    points: '+4 Điểm',
    pointsType: 'pos',
    time: 'Đêm Thứ 3',
    badge: 'Tỉnh Rượu Đêm 3',
    desc: 'Bạn là Dân thường cho tới đêm thứ 3, khi bạn tỉnh rượu và biết vai trò thật được chỉ định bí mật từ đầu trận.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBvlCFTPEujEhpjG2z49jmhhFfNUtTHtnSbZ6NRCUDrYiOrpu6fkLu7OOeizJfPjVjoh1ypojMWqr6GuhILEBy2OkZnfka8DOqEGHetHoziSZEHlDdz-u6Z2xPYePff5s-eSfRfSS-J1CAN7sOKzKjp8uAxEJx9fE_wsIyteLrRFZVb_5O4LiObx8IIYHE9XzEtFyBT9BvS0iS__j1M6pTMVDHJIzV3fetb0WlJ50dAqgi_TiWn8UTdGw',
  },

  // ==========================================
  // 2. PHE MA SÓI (11 Roles)
  // ==========================================
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
    badge: 'Sát Thương Cốt Lõi',
    desc: 'Thức dậy mỗi đêm cùng đàn để biểu quyết chọn 1 người dân cắn xé. Ban ngày ngụy trang hòa nhập.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDncHcxSodB00mVx2ibOGvR7pd94J2JDAqYzQcixt9Wdzpd-PD9Ep0ECywL0ypSJuQkcrPRNAQpvL1ZXpNEE1fC0ONfaW3K74eY0Bk0mMNJR8xlOqKMddofD7EHs7QqDs_TvjWn3DA99IMMwdk0YxcK3xCS4939cnIZOFKvQwmBcRcESjRrTCSLjO-ChBcOpZxwIrwG8kICTtq4CwXbZVO252D5Lk7pbJ7Q7FYLgQc8HOWHkJkv7BiA0Q',
  },
  {
    role: 'BIG_BAD_WOLF',
    nameVN: 'Sói Đầu Đàn',
    nameEN: 'Big Bad Wolf',
    category: 'werewolf',
    categoryLabel: 'Phe Ma Sói',
    icon: '🩸',
    points: '-9 Điểm',
    pointsType: 'neg',
    time: 'Mỗi Đêm',
    badge: 'Cắn 2 Liền Kề',
    desc: 'Thức dậy cùng đàn sói. Khi còn trong trận, bầy Sói được quyền cắn 2 người chơi ngồi cạnh nhau.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDZvgrOjbYFsvmu-KdGTSSveI3tjDqFSuZEsWCFzjOLG1TJapT16WOXSBQyU19m2hhyw091HaAn2vQXWOqLC5jue6aUqgHKnVvMyyobKX78pEKPMaMocuCzrzY0-0Ii8Ipd7hlp4xKhUyHWuC8rig1uycdzvuV3VEFb2cjYtxX0_Wuryx0_IbcLiqygeYb6uqEZeSg4r94tzlha-9oGlhnfDoAZZSkE_PqYw3ONQ-VRwWFn5a3F_95TOg',
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
    badge: 'Cắn 2 Mạng Phẫn Nộ',
    desc: 'Thức dậy cùng đàn sói. Nếu Sói Con bị loại bỏ, đêm ngay sau đó đàn sói sẽ phẫn nộ và được cắn 2 nạn nhân.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCodTFVOX9tfVm48j4Dh7o2kYo-SNQm3wHbR5lLRzqeRjasQhemwSVZCnXLv0g5xQbOX2ZJ8zI4PyzF_RbUweNTXVbOW88Ubc81L7Sx2BUuftZcLFTMISI_d8s9q0oGRMrjjKznYXYTDUKdwOQ9KmyRu4LCKocQ-uF2-OonsEOgXQkNntK4eUJ_iDLzVrGbfSkwwPTP9QEo70uj1tH8kJDWZGmn_LlhtoKltYEOtzd96Zs6fvBrDabP0w',
  },
  {
    role: 'LONE_WOLF',
    nameVN: 'Sói Đơn Độc',
    nameEN: 'Lone Wolf',
    category: 'werewolf',
    categoryLabel: 'Sói Độc Lập',
    icon: '🐺',
    points: '-5 Điểm',
    pointsType: 'neg',
    time: 'Mỗi Đêm',
    badge: 'Sống Sót Cuối Cùng',
    desc: 'Thức dậy đi săn cùng bầy sói ban đêm. Tuy nhiên, chỉ chiến thắng khi là người sống sót duy nhất còn lại trên bàn.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAOP9OSdJYzxf3LWWEltgLUMBSHOhtptcuZkSqVgHNmstndM9RWlMMVEjhfZOQpsCZoxXFzjuCscUYuu8Bxym86Bv3rEveNRlxuMiGG2TYjtuCFDX_r5-4xSg07sDY7Zgk5zKRcf0RzmMo6o3b12od75EAmb9PoMMD45e60IWRead0GMWMmVRTpPs_19Y7JjVng8EEeR4p0Ea26WL45xbhoKiZ2yj_P6-JgvD77vx3lfJ--KYG-owkKcg',
  },
  {
    role: 'SORCERESS',
    nameVN: 'Phù Thủy Hắc Ám',
    nameEN: 'Sorceress',
    category: 'werewolf',
    categoryLabel: 'Phe Ma Sói',
    icon: '🔮',
    points: '-3 Điểm',
    pointsType: 'neg',
    time: 'Mỗi Đêm',
    badge: 'Tìm Tiên Tri',
    desc: 'Thuộc phe Ma Sói. Mỗi đêm thức dậy chỉ định 1 người chơi để kiểm tra xem người đó có phải là Tiên Tri hay không.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJr8cEirur4HECxO5kJpCQLZf1CggJzboJlbaHWdxVUaiR-l4Gk6nvJ45vormgREL6kQ02WPFDaTq7wqUSI5tof2ZGIqPNhTL3EXPXtRIDJ0yvcT9uPSBYr0lCrhV3QRrdAub8279DbuFEXaBfCxHOkeF6xf7hcAwziJmeaoXDWQb9XeJp8sAamG0diAHfG6a5SO500HUWNGdAgRNo_FGP1oyv3tQAgDkfbFv4hCOMwyXEvxvQweaMsw',
  },
  {
    role: 'MINION',
    nameVN: 'Tay Sai Ma Sói',
    nameEN: 'Minion',
    category: 'werewolf',
    categoryLabel: 'Phe Ma Sói',
    icon: '🗡️',
    points: '-6 Điểm',
    pointsType: 'neg',
    time: 'Đêm Đầu Tiên',
    badge: 'Hộ Tống Sói',
    desc: 'Được biết danh tính toàn bộ bầy Ma Sói nhưng không thức dậy cùng bầy. Tìm mọi cách bảo vệ đàn sói.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBO9mnDbwGXyxRhI3GXH4kozHLrFaqiFGycYwN_CyDYmdKNZ3XxYxMM1m3_8fVcT_ls_Q7NecTfyMPSuVAryzwfOVTVDstG6F1dKta7xifHTkh-W0jPz3RS1lTxuFsgTBNJc3qrVt7MQxo_2hjcmqcigmG3zPjAkag2K86mOU7SBAhCpVJLDV8VykQn52sTkYOAGchdVE3A7VOBIK9z2nSc33QReIyS_K-6bvgS8oVOIF9c6D7z4R3htg',
  },
  {
    role: 'CURSED',
    nameVN: 'Kẻ Bị Nguyền Rủa',
    nameEN: 'Cursed',
    category: 'werewolf',
    categoryLabel: 'Sói Tiềm Ẩn',
    icon: '⛓️',
    points: '-3 Điểm',
    pointsType: 'neg',
    time: 'Bị Động',
    badge: 'Chuyển Hóa Thành Sói',
    desc: 'Bắt đầu với tư cách Dân Làng. Tuy nhiên nếu bị Ma Sói cắn trong đêm, không chết mà biến thành Ma Sói mới.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKZFKY3fqp9k_NBeE4RXfsZeMPv44LS_Q5arVsx68dPI5emsT16BX0Gg-q2biA9Y2mIuUzL5K-Qn4Xan9Vk1nWiNvmK6eI_zb9pEHm9B6caHlzVfocS__GbMbGMq-RiaAnZkiKbUCPTvQqiav8lSAwtEFuGh1Do1yFFmGwgYZXpysup_Fv3P8dqSNbitTDhcVBVl2eWe9PiV_cE0TKB45iYQ3gw85iOGFxiZ0xn9RUp6MVqfY5fM_X1Q',
  },
  {
    role: 'WOLVERINE',
    nameVN: 'Sói Wolverine',
    nameEN: 'Wolverine',
    category: 'werewolf',
    categoryLabel: 'Phe Ma Sói',
    icon: '⚡',
    points: '-4 Điểm',
    pointsType: 'neg',
    time: 'Mỗi Đêm',
    badge: 'Vuốt Kim Loại',
    desc: 'Thức dậy cùng Ma Sói. Nếu là Ma Sói gần mục tiêu nhất, người chơi sẽ nghe thấy âm thanh kim loại báo hiệu.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD7MtC8Nt4ZSbUcWipXfw3-cwOwXh_kfz4G0_DTgbUoBAqQq5uKwVI34gYU9va5Z4DUKkwpWCp0A6UhZ8U1f9VIwi89o4Xn5pJx0zF35OOgm8sXPbA_q3Xc4REZrr17JWQUmADkk_HzRqJ5Xi_gqg7gdMiNVTxGKNHX8me8eksPB1q9vTih-8a0QMgAwrLCspK9JS-Kj2yaPVivvQpHb21wD-pzwW5n6JIx-6qNiBIIBA65T3qUuvatng',
  },
  {
    role: 'FANG_FACE',
    nameVN: 'Sói Mặt Nanh',
    nameEN: 'Fang Face',
    category: 'werewolf',
    categoryLabel: 'Phe Ma Sói',
    icon: '🦷',
    points: '-5 Điểm',
    pointsType: 'neg',
    time: 'Đêm Đầu',
    badge: 'Ẩn Dật Đêm Sau',
    desc: 'Đêm đầu thức dậy cùng Ma Sói. Khi còn các Ma Sói khác trong trận, bạn không thức dậy cùng họ trong những đêm tiếp theo.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKi9NsgvGCm0HNWo_4pCgz9nKMvkcBdkPHZ2UWgqzHaVOahnWGnRZMdmA58z0wCHLga8ts3m5JelwtvowQo-iftfl0xT_LONnAu7h-vv7UXl_TaGwC_k97AxB9NDwdTvcvzBPOOPFY1fnfe70KddAE39rB0aWePzY9dyMeD1dM4lywEviO0tK4M8nUn85wp_u0OdR4pbBOlYKv_cxClCpH82Myh4FlaHvd_jKqpjukNDeptmgxvu78Wg',
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
    desc: 'Thức dậy cùng Ma Sói. Nếu là Ma Sói sống sót cuối cùng, bạn không được cắn người vào ban đêm.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCX8ff1VcwcYAfcBHhL3zx7i0bOvoXjqx9WfMfMm7weIYBcN8mdK0WSUDI_j1qsYk1aizqWgFY_2nbJvJZpkhvWBWpgPFuXx5qB_bUxBz0-NswzniUbQOP5R09KPXVaMyBS-wb87nuVY_1ccf1x3xBwPLx2Vgfy-X7OQ5P9mDbA_wqJenesnD4cZIVdxpVXvezNZTvvQ3R_HLJhQZBx7mV21P2ZL7qHT5KcG09MkW2wJtov0qwVhgJmxA',
  },
  {
    role: 'DIRE_WOLF',
    nameVN: 'Sói Hắc Ám',
    nameEN: 'Dire Wolf',
    category: 'werewolf',
    categoryLabel: 'Phe Ma Sói',
    icon: '🌑',
    points: '-4 Điểm',
    pointsType: 'neg',
    time: 'Đêm Đầu & Mỗi Đêm',
    badge: 'Bạn Đồng Hành',
    desc: 'Đêm đầu chọn 1 bạn đồng hành. Nếu người đó bị loại, bạn cũng bị loại theo ngay lập tức.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAP-Zbzn2kY-ZXaAZG3nKTMcwEMs0ZhkmLtXs8gpVqruafQgM2H8YmA8urXVq-itH9SP6y_Cvgu6y60yqgbzlKM1lp_XqgooE9R8ELJUpdtrGzuqeWj0MRSTgQAZbowmKafXRlklkayw6HjdknRjI0TsCtZJZMwPik4UCQDqnQU9iD7GjIIKg9NfbVzxFFgNZPh1IZ9xZbMHpze0hRo19JyWaDwJXQ_mLe-6HyEqG6GaMq0fN_935tyAw',
  },

  // ==========================================
  // 3. PHE THỨ BA & BIỆT LẬP (7 Roles)
  // ==========================================
  {
    role: 'CUPID',
    nameVN: 'Thần Tình Yêu',
    nameEN: 'Cupid',
    category: 'third',
    categoryLabel: 'Dân Làng / Phe Đôi',
    icon: '💘',
    points: '-3 Điểm',
    pointsType: 'neg',
    time: 'Đêm Đầu Tiên',
    badge: 'Kết Đôi Sinh Tử',
    desc: 'Đêm đầu ghép đôi 2 người chơi. Nếu 1 trong 2 người chết, người kia chết theo. Ghép Dân-Sói tạo thành phe Đôi độc lập.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAwTnz5Jh8kE1FWy_4mMVefODqGXHY79TBRLmX4MZYFemQyUXU2C-VKS2KmZ6_rQMQQ20uv67YTjfj1f4x5m5uTboKs4Kqlgt3rWYO96nxLw3z_1WaDK3DXZ38CTuTuRV0QRBmcS998Vbpxqxuv2jJy1Y0TQXFvGX_tC5iZYa-eAel3-x6DrlVB-5NlmASOL776VU3T1BUeKYo2H9RYB-5IwRZvR47ShUqjgkLJ0YayrKLkTTNcyvvmAg',
  },
  {
    role: 'TANNER',
    nameVN: 'Kẻ Bán Da',
    nameEN: 'Tanner',
    category: 'third',
    categoryLabel: 'Phe Thứ Ba',
    icon: '🎭',
    points: '-2 Điểm',
    pointsType: 'neg',
    time: 'Ban Ngày',
    badge: 'Thắng Khi Bị Treo',
    desc: 'Bạn căm ghét cuộc đời. Bạn thắng ván đấu ngay lập tức nếu bị dân làng biểu quyết treo cổ trên giàn thiêu.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDczwuCtC2ai61VBMLIMY9vz45tTO77Wia2SVb_rZKq22FwmzC1IMdUy2eQ9jEFg3gjFSa0djcAEO8X2PaYWkkPp5697A2x2dbIvd7P88eBdQnrKMiBw7enIQwrNFLaRCfqz6KwWUv429KEfCdHHIM9oCI99gtcK2u2HSR0eVIrjUn52nO0kHhan5-hYxNG_PDPlDvqfuZzi888NzguNrRf-s7fTqHg6CNB9Wp56no2Z3GZ3Y501a351A',
  },
  {
    role: 'CULT_LEADER',
    nameVN: 'Giáo Chủ Tà Giáo',
    nameEN: 'Cult Leader',
    category: 'third',
    categoryLabel: 'Phe Thứ Ba',
    icon: '👁️',
    points: '+1 Điểm',
    pointsType: 'pos',
    time: 'Mỗi Đêm',
    badge: 'Thu Phục Tín Đồ',
    desc: 'Mỗi đêm chọn 1 người gia nhập giáo phái. Nếu toàn bộ người sống đều vào giáo phái, bạn thắng ngay lập tức.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8eP43vlWiUJ3usMG0wGzOMjYHmaLUdcZKZSEltUo7yjts1cJKGfNQYBkd-NTvrdbD8s-MtDT9rr6DUwb0MRd7a2SF_qd6wSaMV95hiEfpbRA7IBaQQQTYWl6sUe4vSCDRmkSJxlkaOrIm4s4kntJtVZC8aEhXqnZXpEwnbuQ2UiITLIEfvLYPQXqxyzCXOClM4YkhghiaHWouEWu0GSFqcCBv7j326AdQg8tcZsnbs4bs-xER57wHEQ',
  },
  {
    role: 'VAMPIRE',
    nameVN: 'Ma Cà Rồng',
    nameEN: 'Vampire',
    category: 'third',
    categoryLabel: 'Phe Thứ Ba',
    icon: '🧛',
    points: '-7 Điểm',
    pointsType: 'neg',
    time: 'Mỗi Đêm',
    badge: 'Tố Cáo Thứ 2 Bị Loại',
    desc: 'Mỗi đêm chọn 1 người chơi. Người đó sẽ bị loại ngay khi nhận lời tố cáo thứ 2 vào ngày hôm sau.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLBvTGmcw_0rTa42v4bljp7yYR1PFgzVP3dnE5DCREE6qV05Nc7yn-5SGFrTALzG62IdGXOUJJtqUZbhhFJTgKikSCua-m9KawvWRgORwi5IUKlTjuA1JzBSlDHq9_1FNhaDPNCaRKBsM_0-V791bbwgCCIqFbervKgzrAFw3y5ucxQLK6cpmktWzxyIx9QDlrksAZx8rzCrxI0NWHrlwPpeNaJV4LVtxzZYmU06Wzt_N81pDSlvMCcA',
  },
  {
    role: 'HOODLUM',
    nameVN: 'Kẻ Du Côn',
    nameEN: 'Hoodlum',
    category: 'third',
    categoryLabel: 'Phe Thứ Ba',
    icon: '🥊',
    points: '0 Điểm',
    pointsType: 'neu',
    time: 'Đêm Đầu Tiên',
    badge: 'Mục Tiêu 2 Người',
    desc: 'Chọn 2 người đêm đầu. Để thắng, cả 2 người phải bị loại và bạn vẫn còn sống sót vào cuối ván đấu.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCc2ax64B33AkzYzFuil3iv2Am7pQxt0dAALeYhBf5NseQB3EG5YsFFTHi5m8m9WEt4hCTSPFYsMGXKU6qhsxl12aUBi5hAO2xzE5Ad0WXEycMAPJ2fpbPvm-Z8HGmYuAe2Af_EYfO3sFDdIir0EY6mFgmri8BOHVK1hGzuqmnfg46tT1LEJhRu3PwnocF5ugTt2b6OBK0HGD6txVHt9VDhpXMiBahvrcQzeA8tHxWJ366w4qbLE4x2Rw',
  },
  {
    role: 'DOPPELGANGER',
    nameVN: 'Kẻ Đổi Hồn',
    nameEN: 'Doppelgänger',
    category: 'third',
    categoryLabel: 'Dân / Thứ Ba',
    icon: '👥',
    points: '-2 Điểm',
    pointsType: 'neg',
    time: 'Đêm Đầu Tiên',
    badge: 'Sao Chép Kế Thừa',
    desc: 'Đêm đầu chọn sao chép 1 người. Khi người đó chết, Kẻ Đổi Hồn bí mật kế thừa năng lực và phe phái của người đó.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlq-DrsK3AtcDkpC-JA-7fkVQs6fVpuZx0wGjiOizmNbezMOsVD6PUfdR9DIj7pHRHWpbnwC67ZKtlYV1dA0ukr0KGonnauNRA6ZxJTRgFkT9dXQtckusmOvXFk1HJFFxwJeCiiEieRzXE4lv1VYLfiYhIDubpFovRlnPplNZIW0hSVBtLWZroQPXoNo1mb9ssmZ7aJbENarEVTPbyCyWzMzNUsOyalNOJcCBqPFxPP_W4qTG5QMrs0g',
  },
  {
    role: 'VIRGINIA_WOOLF',
    nameVN: 'Virginia Woolf',
    nameEN: 'Virginia Woolf',
    category: 'third',
    categoryLabel: 'Phe Thứ Ba / Dân',
    icon: '🥀',
    points: '-2 Điểm',
    pointsType: 'neg',
    time: 'Đêm Đầu Tiên',
    badge: 'Kéo Kẻ Sợ Cùng Chết',
    desc: 'Đêm đầu tiên, chọn 1 người chơi phải sợ bạn. Nếu bạn bị loại, người đó cũng bị loại theo ngay lập tức.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbjvrH4gNNNEJWrlQN8vydJs615_pOqMBeIrizd5QwvDd2BFODAsfBP5Wx9xV_2DNd_appC_vFWkGHx3ibFh3fByoTgLonfNV7szFX6E6EBSzYBvF11cgpFtvjwLA2Ht7HAWc7dcArSG5iEzzD4AcEU0sZSHOkmG_zHI-3SeyyXWwhbE6Um0a9GGt637u6RDnEZjK3YCd0ExB-EVRNO0wl1aDv2kXXMgzjCQVRiscWFS9jwEGEe-jEZA',
  },
];

// Curated Preset Templates for any game size & style
const PRESETS: { [key: string]: { name: string; players: number; roles: Partial<Record<Role, number>> } } = {
  p4: {
    name: 'Tốc Chiến (4 Người)',
    players: 4,
    roles: { WEREWOLF: 1, SEER: 1, BODYGUARD: 1, VILLAGER: 1 },
  },
  p6: {
    name: 'Kinh Điển (6 Người)',
    players: 6,
    roles: { WEREWOLF: 2, SEER: 1, BODYGUARD: 1, VILLAGER: 2 },
  },
  p8: {
    name: 'Tiêu Chuẩn (8 Người)',
    players: 8,
    roles: { WEREWOLF: 2, SEER: 1, BODYGUARD: 1, HUNTER: 1, WITCH: 1, VILLAGER: 2 },
  },
  p10: {
    name: 'Huyết Sát (10 Người)',
    players: 10,
    roles: { WEREWOLF: 2, WOLF_CUB: 1, SEER: 1, BODYGUARD: 1, HUNTER: 1, WITCH: 1, CUPID: 1, VILLAGER: 2 },
  },
  p12: {
    name: 'Đại Hội Đồng (12 Người)',
    players: 12,
    roles: { WEREWOLF: 3, BIG_BAD_WOLF: 1, SEER: 1, BODYGUARD: 1, HUNTER: 1, WITCH: 1, CUPID: 1, TANNER: 1, MAYOR: 1, VILLAGER: 1 },
  },
  p16: {
    name: 'Tử Chiến Rừng Đêm (16 Người)',
    players: 16,
    roles: {
      WEREWOLF: 4,
      BIG_BAD_WOLF: 1,
      WOLF_CUB: 1,
      SEER: 1,
      AURA_SEER: 1,
      BODYGUARD: 1,
      HUNTER: 1,
      WITCH: 1,
      CUPID: 1,
      TANNER: 1,
      MAYOR: 1,
      SPELLCASTER: 1,
      VILLAGER: 2,
    },
  },
  p12_chaos: {
    name: 'Hỗn Loạn Tà Giáo (12 Người)',
    players: 12,
    roles: {
      WEREWOLF: 2,
      DIRE_WOLF: 1,
      CULT_LEADER: 1,
      VAMPIRE: 1,
      TANNER: 1,
      SEER: 1,
      BODYGUARD: 1,
      WITCH: 1,
      CURSED: 1,
      VILLAGER: 2,
    },
  },
  p10_magic: {
    name: 'Học Viện Thần Bí (10 Người)',
    players: 10,
    roles: {
      WEREWOLF: 2,
      SORCERESS: 1,
      SEER: 1,
      AURA_SEER: 1,
      APPRENTICE_SEER: 1,
      SPELLCASTER: 1,
      BODYGUARD: 1,
      WITCH: 1,
      VILLAGER: 1,
    },
  },
};

export function CreateRoomModal({
  isOpen,
  onClose,
  onCreateRoom,
  initialNickname = '',
}: CreateRoomModalProps) {
  const [activeTab, setActiveTab] = useState<'basics' | 'roles' | 'rules'>('basics');
  const [nickname, setNickname] = useState(initialNickname || 'Thợ Săn Bạn');
  const [playerCount, setPlayerCount] = useState<number>(8);
  const [discussionDuration, setDiscussionDuration] = useState<number>(90);
  const [votingDuration, setVotingDuration] = useState<number>(30);
  const [seerRevealMode, setSeerRevealMode] = useState<'WOLF_OR_NOT' | 'EXACT_ROLE'>('WOLF_OR_NOT');
  const [revealRoleOnDeath, setRevealRoleOnDeath] = useState<boolean>(true);
  const [isPrivateRoom, setIsPrivateRoom] = useState<boolean>(false);
  const [roomPassword, setRoomPassword] = useState<string>('');

  // Role Filtering & Search
  const [factionFilter, setFactionFilter] = useState<'all' | 'werewolf' | 'villager' | 'third'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Initialized with standard 8-player preset
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({
    WEREWOLF: 2,
    SEER: 1,
    BODYGUARD: 1,
    HUNTER: 1,
    WITCH: 1,
    VILLAGER: 2,
  });

  // Calculate total configured roles
  const totalRoles = useMemo(() => {
    return Object.values(roleCounts).reduce((sum, count) => sum + (count || 0), 0);
  }, [roleCounts]);

  // Breakdown by faction
  const factionBreakdown = useMemo(() => {
    let wolf = 0;
    let village = 0;
    let third = 0;

    ALL_40_ROLES.forEach((r) => {
      const count = roleCounts[r.role] || 0;
      if (r.category === 'werewolf') wolf += count;
      else if (r.category === 'villager') village += count;
      else third += count;
    });

    return { wolf, village, third };
  }, [roleCounts]);

  // Filtered roles list for browsing
  const filteredRoles = useMemo(() => {
    return ALL_40_ROLES.filter((r) => {
      const matchFaction = factionFilter === 'all' || r.category === factionFilter;
      const matchSearch =
        searchTerm === '' ||
        r.nameVN.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.nameEN.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.badge.toLowerCase().includes(searchTerm.toLowerCase());
      return matchFaction && matchSearch;
    });
  }, [factionFilter, searchTerm]);

  // Update role count
  const updateRoleCount = (role: Role, delta: number) => {
    werewolfAudio.playVoteStamp();
    setRoleCounts((prev) => {
      const current = prev[role] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [role]: next };
    });
  };

  // Apply a preset
  const applyPresetByKey = (key: string) => {
    werewolfAudio.playGavel();
    const preset = PRESETS[key];
    if (preset) {
      setPlayerCount(preset.players);
      setRoleCounts({ ...(preset.roles as Record<string, number>) });
    }
  };

  // Apply seat size preset
  const applySeatCount = (num: number) => {
    werewolfAudio.playVoteStamp();
    setPlayerCount(num);
    const preset = PRESETS[`p${num}`];
    if (preset) {
      setRoleCounts({ ...(preset.roles as Record<string, number>) });
    } else {
      // Auto-adjust Villagers to fit
      const nonVillagerTotal = Object.entries(roleCounts)
        .filter(([r]) => r !== 'VILLAGER')
        .reduce((sum, [, count]) => sum + (count || 0), 0);
      setRoleCounts((prev) => ({
        ...prev,
        VILLAGER: Math.max(0, num - nonVillagerTotal),
      }));
    }
  };

  // Auto-balance: fill or reduce Villagers so total === playerCount
  const autoBalanceVillagers = () => {
    werewolfAudio.playGavel();
    const nonVillagerTotal = Object.entries(roleCounts)
      .filter(([r]) => r !== 'VILLAGER')
      .reduce((sum, [, count]) => sum + (count || 0), 0);
    const neededVillagers = Math.max(0, playerCount - nonVillagerTotal);
    setRoleCounts((prev) => ({
      ...prev,
      VILLAGER: neededVillagers,
    }));
  };

  // Clear all roles to 0
  const clearAllRoles = () => {
    werewolfAudio.playVoteStamp();
    setRoleCounts({});
  };

  // Submit Room Creation
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    werewolfAudio.playGavel();

    const finalSettings: Partial<RoomSettings> = {
      minPlayers: playerCount,
      maxPlayers: playerCount,
      roleConfig: roleCounts as any,
      seerRevealMode,
      revealRoleOnDeath,
      durations: {
        discussion: discussionDuration,
        voting: votingDuration,
        defense: 30,
        judgment: 15,
        execution: 6,
      } as any,
    };

    onCreateRoom(finalSettings, nickname.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-fadeIn select-none font-geist">
      <div className="relative w-full max-w-4xl bg-[#0b0f18] border border-amber-500/40 rounded-2xl shadow-[0_0_60px_rgba(245,158,11,0.25)] flex flex-col max-h-[92vh] overflow-hidden">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/10 bg-black/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/70 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              <span className="material-symbols-outlined text-[24px]">tune</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-syne font-bold text-base sm:text-lg text-white uppercase tracking-wider">
                  THIẾT LẬP & TẠO PHÒNG MA SÓI
                </h2>
                <span className="text-[11px] bg-red-950/90 border border-red-500/50 text-red-300 px-2.5 py-0.5 rounded-full font-mono font-bold shadow">
                  {playerCount} Người
                </span>
                <span className="text-[10px] bg-amber-950/80 border border-amber-500/40 text-amber-300 px-2 py-0.5 rounded-full font-mono hidden sm:inline">
                  40 Lá Vai Trò Sẵn Sàng
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                Tự do tùy biến quy mô bàn đấu, thời lượng tranh luận và toàn bộ 40 vai trò từ bách khoa Ma Sói.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-900 border border-white/10 hover:border-white/30 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center px-6 pt-2.5 border-b border-white/10 gap-2 bg-black/30">
          <button
            type="button"
            onClick={() => setActiveTab('basics')}
            className={`px-4 py-2 font-space text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'basics'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">groups</span>
            <span>1. Số Người & Thời Gian</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('roles')}
            className={`px-4 py-2 font-space text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'roles'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">style</span>
            <span>2. Thư Viện 40 Vai Trò ({totalRoles}/{playerCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2 font-space text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'rules'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">gavel</span>
            <span>3. Luật Chơi Mở Rộng</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* ========================================================================= */}
          {/* TAB 1: BASICS */}
          {/* ========================================================================= */}
          {activeTab === 'basics' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Host Nickname */}
              <div>
                <label className="block text-xs font-space uppercase text-slate-300 font-bold mb-1.5 flex items-center gap-1">
                  <span>Biệt Danh Của Bạn (Chủ Tọa Phòng)</span>
                  <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Nhập tên hiển thị..."
                  className="w-full bg-[#131926] border border-white/15 focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
                />
              </div>

              {/* Number of Players */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-space uppercase text-slate-300 font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-amber-400">table_restaurant</span>
                    <span>Quy Mô Bàn Đấu (Số Lượng Ghế Ngồi):</span>
                  </label>
                  <span className="text-sm font-black font-space text-amber-300 bg-amber-950/70 border border-amber-500/40 px-3 py-0.5 rounded-full shadow">
                    {playerCount} Người
                  </span>
                </div>

                {/* Quick Presets Buttons */}
                <div className="grid grid-cols-6 gap-2 mb-3">
                  {[4, 6, 8, 10, 12, 16].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => applySeatCount(num)}
                      className={`py-2 rounded-xl font-space font-bold text-xs uppercase tracking-wider transition-all border ${
                        playerCount === num
                          ? 'bg-amber-600 border-amber-400 text-white shadow-[0_0_15px_rgba(217,119,6,0.6)]'
                          : 'bg-[#131926] border-white/10 text-slate-400 hover:text-white hover:bg-zinc-800'
                      }`}
                    >
                      {num} Ghế
                    </button>
                  ))}
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min="4"
                  max="16"
                  step="1"
                  value={playerCount}
                  onChange={(e) => applySeatCount(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                  <span>4 Người (Bàn nhỏ)</span>
                  <span>8 Người (Chuẩn)</span>
                  <span>12 Người (Lớn)</span>
                  <span>16 Người (Đại hội đồng)</span>
                </div>
              </div>

              {/* Discussion Duration */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-space uppercase text-slate-300 font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-amber-400">hourglass_top</span>
                    <span>Thời Gian Thảo Luận Ban Ngày:</span>
                  </label>
                  <span className="text-sm font-black font-space text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 px-3 py-0.5 rounded-full shadow">
                    {discussionDuration} Giây
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
                  {[
                    { sec: 30, label: '30s (Nhanh)' },
                    { sec: 60, label: '60s (Vừa)' },
                    { sec: 90, label: '90s (Chuẩn)' },
                    { sec: 120, label: '120s (Sâu)' },
                    { sec: 180, label: '180s (Căng)' },
                    { sec: 240, label: '240s (Dài)' },
                  ].map((item) => (
                    <button
                      key={item.sec}
                      type="button"
                      onClick={() => {
                        werewolfAudio.playVoteStamp();
                        setDiscussionDuration(item.sec);
                      }}
                      className={`py-2 px-1 rounded-xl font-space font-bold text-[11px] uppercase transition-all border text-center ${
                        discussionDuration === item.sec
                          ? 'bg-emerald-700 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                          : 'bg-[#131926] border-white/10 text-slate-400 hover:text-white hover:bg-zinc-800'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <input
                  type="range"
                  min="15"
                  max="300"
                  step="15"
                  value={discussionDuration}
                  onChange={(e) => setDiscussionDuration(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Themed Presets Showcase */}
              <div className="bg-[#131926] p-4 rounded-xl border border-white/10">
                <span className="text-xs font-space font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">stars</span>
                  <span>Mẫu Cấu Hình Theo Chủ Đề:</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => applyPresetByKey('p8')}
                    className="p-2.5 rounded-lg bg-black/40 hover:bg-amber-950/40 border border-white/10 hover:border-amber-500/50 text-left transition"
                  >
                    <span className="font-space font-bold text-xs text-white block">⚔️ Tiêu Chuẩn (8 Người)</span>
                    <span className="text-[10px] text-slate-400 font-sans">2 Sói, Tiên Tri, Bảo Vệ, Thợ Săn, Phù Thủy, 2 Dân</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPresetByKey('p10')}
                    className="p-2.5 rounded-lg bg-black/40 hover:bg-red-950/40 border border-white/10 hover:border-red-500/50 text-left transition"
                  >
                    <span className="font-space font-bold text-xs text-white block">🩸 Huyết Sát (10 Người)</span>
                    <span className="text-[10px] text-slate-400 font-sans">2 Sói, Sói Con, Tiên Tri, Bảo Vệ, Thợ Săn, Cupid, Phù Thủy...</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPresetByKey('p12_chaos')}
                    className="p-2.5 rounded-lg bg-black/40 hover:bg-purple-950/40 border border-white/10 hover:border-purple-500/50 text-left transition"
                  >
                    <span className="font-space font-bold text-xs text-white block">🎪 Hỗn Loạn Tà Giáo (12)</span>
                    <span className="text-[10px] text-slate-400 font-sans">Ma Cà Rồng, Giáo Chủ, Kẻ Bán Da, Sói Hắc Ám...</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPresetByKey('p10_magic')}
                    className="p-2.5 rounded-lg bg-black/40 hover:bg-sky-950/40 border border-white/10 hover:border-sky-500/50 text-left transition"
                  >
                    <span className="font-space font-bold text-xs text-white block">🔮 Học Viện Ma Thuật (10)</span>
                    <span className="text-[10px] text-slate-400 font-sans">Tiên Tri Hào Quang, Tập Sự, Phù Thủy Hắc Ám, Pháp Sư...</span>
                  </button>
                </div>
              </div>

              {/* Private Room Toggle */}
              <div className="bg-[#131926] p-3.5 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs font-space font-bold text-white uppercase block">
                    Phòng Riêng Tư (Cần Mật Khẩu)
                  </span>
                  <span className="text-[11px] text-slate-400 font-sans">
                    Chỉ những người được cấp mật khẩu mới có thể tham gia bàn đấu.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isPrivateRoom}
                  onChange={(e) => setIsPrivateRoom(e.target.checked)}
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {isPrivateRoom && (
                <div>
                  <label className="block text-xs font-space uppercase text-slate-300 font-bold mb-1">
                    Mật Khẩu Vào Bàn
                  </label>
                  <input
                    type="password"
                    value={roomPassword}
                    onChange={(e) => setRoomPassword(e.target.value)}
                    placeholder="Nhập mã pin hoặc mật khẩu..."
                    className="w-full bg-[#131926] border border-white/15 focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: ROLES (FULL 40 ROLES WITH FILTER & SEARCH) */}
          {/* ========================================================================= */}
          {activeTab === 'roles' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Sticky Balance Status Header */}
              <div
                className={`sticky top-0 z-20 p-3.5 rounded-xl border backdrop-blur-md shadow-2xl flex flex-wrap items-center justify-between gap-3 ${
                  totalRoles === playerCount
                    ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-200'
                    : totalRoles < playerCount
                    ? 'bg-amber-950/90 border-amber-500/60 text-amber-200'
                    : 'bg-red-950/90 border-red-500/60 text-red-200'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {totalRoles === playerCount ? '✅' : totalRoles < playerCount ? '⚠️' : '❌'}
                    </span>
                    <span className="font-space font-black text-sm uppercase">
                      {totalRoles === playerCount
                        ? `Cân Bằng Hoàn Hảo: ${totalRoles}/${playerCount} Lá Bài`
                        : totalRoles < playerCount
                        ? `Còn Thiếu ${playerCount - totalRoles} Lá Bài (Hệ thống sẽ bù Dân Làng)`
                        : `Đang Thừa ${totalRoles - playerCount} Lá Bài (Vui lòng giảm bớt)`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono mt-0.5 opacity-90">
                    <span className="text-red-300 font-bold">🐺 Sói: {factionBreakdown.wolf}</span>
                    <span>•</span>
                    <span className="text-sky-300 font-bold">🌾 Dân: {factionBreakdown.village}</span>
                    <span>•</span>
                    <span className="text-purple-300 font-bold">🃏 Thứ Ba: {factionBreakdown.third}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={autoBalanceVillagers}
                    className="px-3 py-1.5 rounded-lg bg-black/60 hover:bg-black/90 border border-white/20 text-white font-space text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-1 shadow"
                  >
                    <span>⚡ Bù Dân Làng</span>
                  </button>
                  <button
                    type="button"
                    onClick={clearAllRoles}
                    className="px-2.5 py-1.5 rounded-lg bg-black/40 hover:bg-black/80 border border-white/10 text-slate-400 hover:text-white font-space text-[10px] font-bold uppercase transition"
                    title="Xóa trắng để chọn từ đầu"
                  >
                    🧹 Xóa Hết
                  </button>
                </div>
              </div>

              {/* Faction Filter Tabs & Search Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-1 bg-[#131926] p-1 rounded-xl border border-white/10 w-full sm:w-auto overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setFactionFilter('all')}
                    className={`px-3 py-1.5 rounded-lg font-space text-xs font-bold uppercase tracking-wider transition ${
                      factionFilter === 'all'
                        ? 'bg-amber-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Tất Cả (40)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFactionFilter('werewolf')}
                    className={`px-3 py-1.5 rounded-lg font-space text-xs font-bold uppercase tracking-wider transition ${
                      factionFilter === 'werewolf'
                        ? 'bg-red-900 text-red-100 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🐺 Ma Sói (11)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFactionFilter('villager')}
                    className={`px-3 py-1.5 rounded-lg font-space text-xs font-bold uppercase tracking-wider transition ${
                      factionFilter === 'villager'
                        ? 'bg-sky-900 text-sky-100 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🌾 Dân Làng (22)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFactionFilter('third')}
                    className={`px-3 py-1.5 rounded-lg font-space text-xs font-bold uppercase tracking-wider transition ${
                      factionFilter === 'third'
                        ? 'bg-purple-900 text-purple-100 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🃏 Thứ Ba (7)
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm theo tên hoặc kỹ năng..."
                    className="w-full bg-[#131926] border border-white/10 focus:border-amber-400 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none transition-colors"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* 40 Roles Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
                {filteredRoles.map((item) => {
                  const count = roleCounts[item.role] || 0;

                  return (
                    <div
                      key={item.role}
                      className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2.5 relative overflow-hidden ${
                        count > 0
                          ? item.category === 'werewolf'
                            ? 'bg-red-950/40 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                            : item.category === 'villager'
                            ? 'bg-sky-950/40 border-sky-500/50 shadow-[0_0_15px_rgba(14,165,233,0.2)]'
                            : 'bg-purple-950/40 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                          : 'bg-[#131926]/60 border-white/5 opacity-70 hover:opacity-100 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        {/* Artwork Thumbnail + Role Info */}
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-black/60 border border-white/15 shrink-0 shadow">
                            <img
                              src={item.image}
                              alt={item.nameVN}
                              className="w-full h-full object-cover object-top"
                              loading="lazy"
                            />
                            <span className="absolute bottom-0 inset-x-0 bg-black/80 text-center text-[9px] font-mono font-bold text-amber-300">
                              {item.points}
                            </span>
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-space font-bold text-xs text-white">
                                {item.nameVN}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({item.nameEN})
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span
                                className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase font-bold ${
                                  item.category === 'werewolf'
                                    ? 'bg-red-950 text-red-300 border border-red-500/40'
                                    : item.category === 'villager'
                                    ? 'bg-sky-950 text-sky-300 border border-sky-500/40'
                                    : 'bg-purple-950 text-purple-300 border border-purple-500/40'
                                }`}
                              >
                                {item.badge}
                              </span>

                              <span className="text-[9px] font-mono text-stone-400 bg-black/40 px-1 rounded">
                                {item.time}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Increment / Decrement Counter */}
                        <div className="flex items-center gap-1.5 bg-black/80 p-1 rounded-xl border border-white/10 shrink-0">
                          <button
                            type="button"
                            onClick={() => updateRoleCount(item.role, -1)}
                            disabled={count <= 0}
                            className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-25 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center transition"
                          >
                            -
                          </button>
                          <span
                            className={`font-space font-black text-sm w-5 text-center ${
                              count > 0 ? 'text-amber-300' : 'text-slate-600'
                            }`}
                          >
                            {count}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateRoleCount(item.role, 1)}
                            className="w-7 h-7 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center justify-center transition shadow"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-400 font-sans leading-tight">
                        {item.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: RULES */}
          {/* ========================================================================= */}
          {activeTab === 'rules' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Seer Mode */}
              <div className="bg-[#131926] p-4 rounded-xl border border-white/10 space-y-2">
                <span className="text-xs font-space font-bold text-white uppercase block flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-amber-400">visibility</span>
                  <span>Chế Độ Soi Của Tiên Tri:</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSeerRevealMode('WOLF_OR_NOT')}
                    className={`p-3 rounded-xl border text-left transition ${
                      seerRevealMode === 'WOLF_OR_NOT'
                        ? 'bg-amber-950/70 border-amber-400 text-amber-200'
                        : 'bg-black/40 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="font-space text-xs font-bold block">1. Sói Hay Không Sói (Chuẩn)</span>
                    <span className="text-[10px] block opacity-80 mt-0.5">
                      Tiên Tri chỉ biết đối tượng là Ma Sói hoặc Dân Làng (an toàn, chuẩn thi đấu).
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSeerRevealMode('EXACT_ROLE')}
                    className={`p-3 rounded-xl border text-left transition ${
                      seerRevealMode === 'EXACT_ROLE'
                        ? 'bg-amber-950/70 border-amber-400 text-amber-200'
                        : 'bg-black/40 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="font-space text-xs font-bold block">2. Tiết Lộ Chính Xác Vai Trò</span>
                    <span className="text-[10px] block opacity-80 mt-0.5">
                      Tiên Tri biết cụ thể chức năng của đối tượng (Thợ Săn, Phù Thủy, Bảo Vệ...).
                    </span>
                  </button>
                </div>
              </div>

              {/* Reveal On Death */}
              <div className="bg-[#131926] p-4 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs font-space font-bold text-white uppercase block">
                    Tiết Lộ Lá Bài Khi Chết
                  </span>
                  <span className="text-[11px] text-slate-400 font-sans">
                    Khi một người chơi bị treo cổ hoặc bị cắn, hệ thống sẽ công bố danh tính thật cho cả làng.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={revealRoleOnDeath}
                  onChange={(e) => setRevealRoleOnDeath(e.target.checked)}
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {/* Voting Duration */}
              <div className="bg-[#131926] p-4 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs font-space font-bold text-white uppercase block">
                    Thời Gian Bỏ Phiếu Treo Cổ
                  </span>
                  <span className="text-[11px] text-slate-400 font-sans">
                    Thời gian cho phép mỗi người đặt phiếu biểu quyết treo cổ (mặc định 30 giây).
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-amber-400 bg-black/60 px-3 py-1.5 rounded-lg border border-white/10">
                  <span>{votingDuration}s</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODAL FOOTER */}
          {/* ========================================================================= */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-slate-400 hover:text-white font-space font-bold text-xs uppercase tracking-wider transition"
            >
              Hủy Bỏ
            </button>

            <button
              type="submit"
              className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-red-800 via-amber-700 to-red-800 hover:from-red-700 hover:to-amber-600 text-white font-space font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all flex items-center justify-center gap-2 animate-glowBeat"
            >
              <span className="material-symbols-outlined text-[18px]">play_circle</span>
              <span>XÁC NHẬN TẠO PHÒNG ({playerCount} NGƯỜI • {totalRoles} LÁ VAI TRÒ)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateRoomModal;
