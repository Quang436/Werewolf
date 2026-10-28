'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface CardRole {
  id: number;
  nameVN: string;
  nameEN: string;
  faction: 'villager' | 'werewolf' | 'third';
  factionLabel: string;
  points: string;
  pointsType: 'pos' | 'neg' | 'neu';
  time: string;
  badge: string;
  desc: string;
  image: string;
}

const ROLES_DATA: CardRole[] = [
  // PHE DÂN LÀNG (22 Roles)
  { id: 1, nameVN: "Thị Trưởng", nameEN: "Mayor", faction: "villager", factionLabel: "Phe Dân Làng", points: "+2 Điểm", pointsType: "pos", time: "Ban Ngày", badge: "2 Lá Phiếu", desc: "Lá phiếu của Thị Trưởng có giá trị gấp đôi (2 phiếu) khi biểu quyết ban ngày. Nếu bị loại, Thị Trưởng có quyền chỉ định người kế nhiệm.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDkL6Z4G4sczkTkKPhZc9uAOqSB9a1qZCdA9NlG_AOjJhDghQ0fAIc9jA2pUDVXNgXpd4SxSo7vnAavmna40EVmlM0soAJexwNzq5Cjc0niA0zjwO3ZA-tab8_6LKgA_kaRpoqsd-jC_3Aemw9gIoF7u33L4_vIJp2zppKu-nSqG2o5kUGwiFRcjI0DwTEoyKZYsDWMn4XU5CFnBDas9e6VH9qzaMCbw0vVvFtEsugsOf4m5R46Os_pYA" },
  { id: 2, nameVN: "Hội Tam Điểm", nameEN: "Mason", faction: "villager", factionLabel: "Phe Dân Làng", points: "+2 Điểm", pointsType: "pos", time: "Đêm Đầu Tiên", badge: "Liên Minh Làng", desc: "Được gọi dậy vào đêm đầu tiên để nhận diện các thành viên Tam Điểm khác, tạo thành một liên minh dân làng đáng tin cậy 100%.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB3_x5DnZ6IID6r_A0v2qRx4JfOYXzfCA57Tee7pAJqURgDPRCNQwizzKK8NJxIWyhjAhXyrwSD0COxEt-kaBd-XRQf-MAJtAlo7Do14PTyJjXblqZ50z_nNzuM2VYRCw61Qsk8H0jWUau2g3EHoh0PDwJL7_N7ZKLyeYrwvlcKTBs_Sk44RmAF_lvn8BdAZIv1IW862P196BRuC90snkl7EtVwdEXhLSyKzRBIhha5AX6cLKmnjUeSIw" },
  { id: 3, nameVN: "Kẻ Hóa Thú", nameEN: "Lycanthrope", faction: "villager", factionLabel: "Phe Dân Làng", points: "-1 Điểm", pointsType: "neg", time: "Bị Động", badge: "Soi Ra Sói", desc: "Thực chất thuộc phe Dân Làng, nhưng mang dòng máu sói nên nếu bị Tiên Tri soi sẽ hiện ra kết quả là Ma Sói thực thụ.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC4YwxUzuVWEuW7yn2Wathp5yPwhfu9RKFiKQKKHZwreG0X2si6zyVA53h9FHSiXd3NIFIm412oWUGZKysq5P79SefKRNpCJlaS2aV4nNgF8KcXyXOPPiuSBo12d79YUycbMX-VlJ_cP9ckygcaJ5Ej-J0iQfMhs9hTVN0JlBOx8Q3vGyIFBrilK7TzoXERVfrZn-HOSB-432nRF9ozc1wq1K1iflVzS8g2vN-qvlDqJMgOP4NFZTd-hA" },
  { id: 4, nameVN: "Kẻ Ngốc Trong Làng", nameEN: "Village Idiot", faction: "villager", factionLabel: "Phe Dân Làng", points: "-2 Điểm", pointsType: "neg", time: "Mỗi Đêm", badge: "Kết Quả Sai", desc: "Tự tưởng mình là Tiên Tri và thức dậy mỗi đêm để soi vai trò, nhưng Quản Trò sẽ đưa ra kết quả hoàn toàn ngẫu nhiên sai lệch.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAxL71sCiVpJxVRbAxSqVAGd8YF5anHBLF5b1yAuNh60fosoqvTXu7kZ-zkAZh1cWw3FY0q8P02I0PmoVyq8zyF44S6lBJaghgtiP8igfsZc71_VmIzc0yXfqAjnrzrHY1r6qbCpzt9Hx453qKdxiIq2Yyo_yXePn5UiPSMZeoRNKHcYV-I_JohwVeeJvmYScnrkpFLaSHHO3XsXqGVMi6oOcaa3oNoq0o0wIm2mg9iGaToIM3ZaTUTOA" },
  { id: 5, nameVN: "Thợ Săn", nameEN: "Hunter", faction: "villager", factionLabel: "Phe Dân Làng", points: "+3 Điểm", pointsType: "pos", time: "Bị Động", badge: "Kéo Theo 1 Mạng", desc: "Khi Thợ Săn bị loại bỏ bởi Sói cắn hoặc bị treo cổ, người này được quyền lập tức nổ súng kéo theo 1 người bất kỳ cùng chết.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD_t029UrD0YEcCA9Rbd1ZJAyYx8spLCAIAyfWtCYIor6kRdiOtiEb3Ne3mcBzt9j7C3w8DLKDp2Qo8_VA6K15OKSnYueX4-SGnp75qW-sc1tpMnrUcojU_o1ZJUo4vF8R7GIczopLcc6DSQAO6i8VxPljSF_4gTE_aMfJoP1hJdE1-GO3zLl19AFHLe1l-zH4ZO60G731zDXVPsp17hY5MWpm2kGv-OKnHkN5CZZ8izhGSlwfSfnP1dw" },
  { id: 6, nameVN: "Oan Hồn", nameEN: "Ghost", faction: "villager", factionLabel: "Phe Dân Làng", points: "+2 Điểm", pointsType: "pos", time: "Mỗi Đêm", badge: "Để Lại Ký Tự", desc: "Bị chết ngay trong đêm đầu tiên. Mỗi đêm sau đó, Oan Hồn được viết 1 chữ cái duy nhất lên giấy để báo manh mối cho dân làng trước khi ngủ lại.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBy0lIzb1osD3OzNTQFgfSfSbx4bhYyx_TVeI_cXhuepdIn2CrFtCBjFTPokE-MyTtM31wVc4rHK813bYPMLkjduz35rSz6LIycZ6augPonF5rtRhrGDQOjXmVGAun-RHJ_U_SWerX_A7ASNEBiREcuwyHpxn-9ECIK5IenEmDlrpHsskvB6ygMYo-5ic_yIttDHVHChUux200YWlBnPg8tOG8UkVOPSaGb6Wq5r9iFm_V1VPNlti1JDg" },
  { id: 7, nameVN: "Người Nhiễm Bệnh", nameEN: "Diseased", faction: "villager", factionLabel: "Phe Dân Làng", points: "+3 Điểm", pointsType: "pos", time: "Bị Động", badge: "Khóa Sói 1 Đêm", desc: "Nếu bị Ma Sói cắn, bầy sói sẽ bị lây dịch bệnh hiểm nghèo và không thể thức dậy đi săn người trong cả đêm tiếp theo.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBPQ1oo5BCJ7EukNznfO55qnyqgHm1wMuaY-j_C_-a4U7n7tByj5kKVk4jqTLHTa4SkRgcdO9JXFIXzwtdrvTTEbwhxltjTa7xBAI0A5dtX1XEPU4bH7kULw42jbIK6Q52VWb79_mYKfOkjTJnqrX2IIwtRHB1f4is9_EowICZ9Zvoj3bpQkzWvKv2xBgbMFSkcmNnXWD-ZoWqkku0EigC4GQuy11-L-rUOmlKJ2Q_tOL3yJFRHGmx7oQ" },
  { id: 8, nameVN: "Tiên Tri Hào Quang", nameEN: "Aura Seer", faction: "villager", factionLabel: "Phe Dân Làng", points: "+3 Điểm", pointsType: "pos", time: "Mỗi Đêm", badge: "Soi Năng Lực", desc: "Mỗi đêm soi 1 người chơi để biết người đó có sở hữu năng lực đặc biệt nào hay không (không chỉ định rõ danh tính cụ thể hay Ma Sói).", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBl-7G4z5LbwbppNWsGzMb9xeQu1zHbdlB6jleXIS0UG1FkCHMPtJJ_u26igYg0JfCwRmfQ9wO4W1-Ka53snFaKCazE4sm36Jb767hJNB2VqekGNXpeAAan-D4bXJmP9qN5IAK6UXFUk9xU1MjgeeTdPnwKtIr85Y0JEnV145kcaYlUn63qRa2yI6CPOkDH9C9zsOmt7Wqp6-D6y39WfWDLw5FhbIWMCtmL7EitelS83L6bK4x_X9XwTA" },
  { id: 9, nameVN: "Tập Sự Tiên Tri", nameEN: "Apprentice Seer", faction: "villager", factionLabel: "Phe Dân Làng", points: "+4 Điểm", pointsType: "pos", time: "Kế Thừa", badge: "Kế Nhiệm Seer", desc: "Chỉ là Dân Làng bình thường cho đến khi Tiên Tri chính thức bị loại bỏ, Tập Sự sẽ lập tức thức tỉnh trở thành Tiên Tri mới của ngôi làng.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAbHMxtL1GcdPfH8fgTT4uZmW2SiH6WA9rA0H8JrYm4JDJRRiZnWvR_Pe1BCa3-Jd-vUMGfElWjidllg5dJihJ7KZvZCF3-A5NTDUBd9mwRzd8tZi8Jh_knEZYV4aMO-STD6TW5tXQvKdeP363d1lVfk57f8uXNZADzsDtw3Rm8DYB3ZXmbvTue3lh9UlcmWbeQ0I1O0gKA2Nj0SotcKOjMd1Qjja6fx_-Iq_wWChDJHT-78EGsP97qGg" },
  { id: 10, nameVN: "Bảo Vệ", nameEN: "Bodyguard", faction: "villager", factionLabel: "Phe Dân Làng", points: "+3 Điểm", pointsType: "pos", time: "Mỗi Đêm", badge: "Hộ Vệ Sống Sót", desc: "Mỗi đêm chọn bảo hộ 1 người chơi khỏi đòn cắn của Ma Sói. Không được phép bảo vệ cùng một người trong hai đêm liên tiếp.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAAT71TU4ca8Ud2_yLdoOeuAL6GWN06wyG_b9CC52pjzLZD9ASqXzuxpxCXnmDZpIMcTIAiyOBQNAxvigf2jy_u_g_gqWNtVUnP5j0BPUvnsG2lGbwBrYdN5CWP5V7M13saKWW-xRu4GfaKJd5eAxoTBvdhuWsODWXn7B6B5CnHMozQNaSxRXVrMf7lMj3yr3sNFlywQdhxoRDTz0eJFpi-8iPydFdZL4lC7XkICsASHRSnFOYkxxwd_A" },
  { id: 11, nameVN: "Tiên Tri", nameEN: "Seer", faction: "villager", factionLabel: "Phe Dân Làng", points: "+7 Điểm", pointsType: "pos", time: "Mỗi Đêm", badge: "Phát Hiện Sói", desc: "Mỗi đêm thức dậy chỉ định 1 người chơi để Quản Trò tiết lộ thân phận: người đó có phải là Ma Sói hay thuộc phe Làng hiền lành.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAXGNVBSwaYybHs49ILN6EbPRE0-nnnzMStimewfSXQVuWbprhjv59aoDwYA4RuiKGB9jF7loPr4GCQdFGI8SFcnSVDSLEZNp76eHXQGIL0OvGYW-MDXAFbg88bZNFjtyYZodciLyZbGIuKvE2tDgUZ2u0sTKNd_rG6ztNU6aSYlLMx7GHDoxtVUcyB_hqw9Xlj3ahDpZTBwHciZuPmWPbcyFHqcZZpH_9ibff10TmGVL4zUhxzTZZa-g" },
  { id: 12, nameVN: "Phù Thủy", nameEN: "Witch", faction: "villager", factionLabel: "Phe Dân Làng", points: "+4 Điểm", pointsType: "pos", time: "Mỗi Đêm", badge: "2 Bình Thuốc", desc: "Sở hữu 2 bình thần dược: 1 bình cứu sống người vừa bị Sói cắn và 1 bình độc dược để trừ khử 1 kẻ tình nghi. Mỗi bình dùng 1 lần trong cả trận.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAYgEmS9IqQVBCYlStLfGx1UB45kvMGD4o-EqvaPBsioWeseOPkdWgz-HLA25ywA-bes1wP6IZG0Hh_hMDPn-1EmYsn2MzxH10E5DRjuDs3eAjhyFnZiWcyshjErnR7xdl88n7izd2ZAZtm5PbRFjT0psnv6SAw9nRdk7fleEGemaCHq0PRHEokPFzo9Pm03rXopCsrA_ACvpai_8qwzybgxP3Ro6HFbDNN0zzv-8kcwqgTJVBppN_igg" },
  { id: 13, nameVN: "Kẻ Say Rượu", nameEN: "Drunk", faction: "villager", factionLabel: "Phe Dân Làng", points: "+4 Điểm", pointsType: "pos", time: "Đêm Thứ 3", badge: "Tỉnh Rượu Đêm 3", desc: "Bạn là Dân thường cho tới đêm thứ 3, khi bạn tỉnh rượu và biết vai trò thật của mình được chỉ định từ đầu trận.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBvlCFTPEujEhpjG2z49jmhhFfNUtTHtnSbZ6NRCUDrYiOrpu6fkLu7OOeizJfPjVjoh1ypojMWqr6GuhILEBy2OkZnfka8DOqEGHetHoziSZEHlDdz-u6Z2xPYePff5s-eSfRfSS-J1CAN7sOKzKjp8uAxEJx9fE_wsIyteLrRFZVb_5O4LiObx8IIYHE9XzEtFyBT9BvS0iS__j1M6pTMVDHJIzV3fetb0WlJ50dAqgi_TiWn8UTdGw" },
  { id: 14, nameVN: "Dân Làng", nameEN: "Villager", faction: "villager", factionLabel: "Phe Dân Làng", points: "+1 Điểm", pointsType: "pos", time: "Ban Ngày", badge: "Biểu Quyết", desc: "Không có năng lực đặc biệt ban đêm. Vũ khí mạnh nhất là suy luận sắc bén, khả năng phân tích biểu cảm và lá phiếu sinh tử vào ban ngày.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAr4HqnffL7kCHYAXoCyAVoeHfdCWaQJd9RSd-swHXTxvOqHPv1TuS5JuEJNFumv2wbaVFVOt6FXAwXxNpTHorzvWORHwTWzsPnK9EjAgrRg5hc_RhzHC4OP91kB2d43H7u2uIGJRuhFmzvNxVI0AQavHPY-viteei8MxAuZkRubzDel3pJXHKMIjQyvFm8EvGA6n4eBUdRnOV6Yhao6PDnAzA0snWWE19rcqCkajfOD--W2tEGZl5a6Q" },
  { id: 15, nameVN: "Kẻ Gây Rối", nameEN: "Troublemaker", faction: "villager", factionLabel: "Phe Dân Làng", points: "-3 Điểm", pointsType: "neg", time: "1 Đêm Duy Nhất", badge: "2 Phiếu Treo", desc: "1 lần duy nhất trong ván, kích hoạt năng lực khiến ngày hôm sau ngôi làng bắt buộc phải treo cổ 2 người chơi có số phiếu cao nhất thay vì 1.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC0nM49RPFX05NpDazFCu62c0--FluEV1y_RQ2coiMDpmSKbwV2yrFIGH3Sgln0mLAUhVH-LS6JhT43RUMJpBiDktNztD1DbEpU5F57Ts5ClCFuERMC1nUWZT26-cZaLtvN3YpU1M1aZzs36abN91Xv3A80_XRR5TUPwhgxh1J26rjeYmXJpB8Qx7kJl7VkqA-nirlW55Geco0jshfEQIvBkhkw_SSJk_24bDwDhWQf8aF3tN5n1A_m6g" },
  { id: 16, nameVN: "Gã Ngoan Cường", nameEN: "Tough Guy", faction: "villager", factionLabel: "Phe Dân Làng", points: "+3 Điểm", pointsType: "pos", time: "Bị Động", badge: "Trì Hoãn Chết", desc: "Nếu bị Ma Sói cắn trong đêm, Gã Ngoan Cường không chết vào sáng hôm sau mà vẫn sống sót bình thường, chỉ gục ngã vào rạng sáng đêm kế tiếp.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAOMwRb486tCu25xkthTPTv5tRTmZTzyEtltdlBZcVQJQ4p5O8GQrSYCTXSqQeegZs9bFeoOMCI8a3q7aAA5nVzGx6EW0r4T1fiQOOX6PMfOirWY4gWqUE5UWYb8_1ZeBVwOhko0l-xJTWylhsbAQ-7Nb-0Ih_-CS4lY-fEUoiXs1JvOAuXGmSkSVQaFc-9dN5TWdgV7zjkusntojKNighQp7gBxNRDa-W2GuFhJfPYVVTBglNbFqYdzA" },
  { id: 17, nameVN: "Pháp Sư Phong Ấn", nameEN: "Spellcaster", faction: "villager", factionLabel: "Phe Dân Làng", points: "+1 Điểm", pointsType: "pos", time: "Mỗi Đêm", badge: "Cấm Nói", desc: "Mỗi đêm chỉ định 1 người chơi. Người bị phong ấn sẽ hoàn toàn bị câm, không được phép lên tiếng hay dùng cử chỉ nói chuyện vào ngày tiếp theo.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAs3mdi0WnPBaBEgR4MI7rAtiMbL1oQEm2ZqGreD84bV_uCAlGeW5lh_DfP5NB6UYLI70tLaYx2-wt3AGAJAvoJp9QO4YQpIhgvItzR9AR-OGUNpAbwOh9407jiQfLqlmmhibJ7T0dyxc187_sE154i5uemzSl5izXqWbuOv3o6kc5kiXXeUmImZpQzQMBsBRtqiny41mO9pci239grauCCR5hgZbkXQpTjXqxR9OkrZ009L7NA5d2U8A" },
  { id: 18, nameVN: "Hoàng Tử", nameEN: "Prince", faction: "villager", factionLabel: "Phe Dân Làng", points: "+3 Điểm", pointsType: "pos", time: "Ban Ngày", badge: "Miễn Treo Cổ", desc: "Nếu bị dân làng bỏ phiếu treo cổ ban ngày, Hoàng Tử lật bài chứng minh thân thế quý tộc. Cuộc hành quyết lập tức bị hủy bỏ và anh ta vẫn sống.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAOh-5HMpubGA6i5WgigLKNXV61n3wym4A8YBnrkheFE2CPc1AHdBFZhNKSZTwYFzP5AlnQbCg4qPGZSZ3sNwvMy7Typ1us-cO9iOofBNBzy5nVEOe6sJsr8_yMY-TZ8KqeYEH2V8OWoa9ZMR2SocGQsLhw74y0tb4lLfEvonhch_WUgX0Oo77M2gQVrYoOEppb6YGjldKR6pgk82RcG1FreDNa8DLMSQQIWA9cnPrmvpGXx6W6wO_8rA" },
  { id: 19, nameVN: "Mục Sư", nameEN: "Priest", faction: "villager", factionLabel: "Phe Dân Làng", points: "+3 Điểm", pointsType: "pos", time: "1 Đêm Duy Nhất", badge: "Thánh Hóa Bất Tử", desc: "1 lần duy nhất trong trò chơi, Mục Sư thức dậy ban phước thánh cho 1 người chơi. Người đó sẽ hoàn toàn bất tử miễn nhiễm cái chết trong đêm.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCYBV_5J0BsIRksV_PauzXTBGuqKFl2TY6sGg1pUV1B7AeB7KlL-Oxnxn5FgYz60DGASP-_im_tdDMj2ij8fkArgLR_T4JsPOwqjPB1ovKU1GbHqY8SRVdGtlyJPsiE-E2BCpYjQPmAsx8n-XwaXD60GCoODILs-k8FVCXRujMIaI4MtgSEySJ3f1btWry_fm8gbcZOYZAntLCRoy2b2OImD_RO_4fznZqX6h-EM7sqdmJT-MNKf8Pbdw" },
  { id: 20, nameVN: "Thám Tử Tư", nameEN: "P.I. (Investigator)", faction: "villager", factionLabel: "Phe Dân Làng", points: "+3 Điểm", pointsType: "pos", time: "1 Đêm Duy Nhất", badge: "Quét 3 Người", desc: "1 đêm trong ván, chọn soi 1 người chơi. Quản Trò ra hiệu xem trong bộ ba gồm người đó và 2 người ngồi sát hai bên có ít nhất 1 Ma Sói hay không.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD4nMKZcEdBdofi94KrOI0tkDOfYA_pnWSfqiHJUIKPIYCnvQRtXytp5pyLklAe39NLO9MCpgHG5-WHGLjo5_oHZ4xbO-2aEqQIIDwFZNahDG-lMrDZknl6S-zOz7ZRnHl3cx3h2Wc63KKU_wF6iMA2pEVQQ1XaqPLxqsHkRfT5Th1h9CxOblG4RVtvH1kJ2YJ3aFZzETKC4XtTcQpkqld2xZKeYGlzLAs-G-GbE4Ou-MWjTuJd1s4ZSA" },
  { id: 21, nameVN: "Người Hòa Bình", nameEN: "Pacifist", faction: "villager", factionLabel: "Phe Dân Làng", points: "-1 Điểm", pointsType: "neg", time: "Ban Ngày", badge: "Phi Bạo Lực", desc: "Tín đồ ôn hòa tuyệt đối. Luôn luôn bắt buộc phải bỏ phiếu cho người chơi không bị treo cổ trong tất cả các cuộc bỏ phiếu ban ngày.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDtxZxxC0oQXnZkoeo6_uEcEqIi7ho_N7blF0FLQRDmrgAOjpemp95Ns0sIvHgOFcX_ZvV5jo3A0MtQpcgBWYROofQdpvHaG_FLFm4DGdq-J_4ffMixcHp7xT-4RAD6Z1xJKr0eLa_0rhiF6MeT_5lzuPxbNSjw0pfKk0LvY9mfq9oCZotIKjFZ3aWB9iQtmjVyM6ny2-59Y--cHSxSV3HUoTtw9FN2z7kyVUPK9G9kPSBRIopY1SBpqw" },
  { id: 22, nameVN: "Bà Lão Cổ Quái", nameEN: "Old Hag", faction: "villager", factionLabel: "Phe Dân Làng", points: "+1 Điểm", pointsType: "pos", time: "Mỗi Đêm", badge: "Đuổi Khỏi Làng", desc: "Mỗi đêm chỉ định 1 người chơi phải rời khỏi làng trong cả ngày hôm sau (không được tham gia thảo luận tranh luận và không được biểu quyết).", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDmd2Wa4dbaORBkIl2cRfuF_BknEWsKQTgcq4Km8GnbZVADfPvbXUvCM2VfweD_sB6HOPdyjnKp8M-IPrKdeUL7uzudM_u__yKWeBGjcE9l12HNFaPoFAKyy78q5Po_6VkFzP_prRCEMPJTfjVXCqGARs0x6RUkWYH5RtjxEgEnwocg2FqAenUbms4EJw9lKb9YRp3eG6zHSohfY7bL0ESTi9zrLehjFjfiKgL-tAAUdLRPUEaL1vSI4A" },

  // PHE MA SÓI (11 Roles)
  { id: 23, nameVN: "Sói Đầu Đàn", nameEN: "Big Bad Wolf", faction: "werewolf", factionLabel: "Phe Ma Sói", points: "-9 Điểm", pointsType: "neg", time: "Mỗi Đêm", badge: "Cắn 2 Liền Kề", desc: "Mỗi đêm thức dậy cùng Ma Sói. Khi còn trong game, bầy Sói được cắn 2 người chơi ngồi cạnh nhau.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDZvgrOjbYFsvmu-KdGTSSveI3tjDqFSuZEsWCFzjOLG1TJapT16WOXSBQyU19m2hhyw091HaAn2vQXWOqLC5jue6aUqgHKnVvMyyobKX78pEKPMaMocuCzrzY0-0Ii8Ipd7hlp4xKhUyHWuC8rig1uycdzvuV3VEFb2cjYtxX0_Wuryx0_IbcLiqygeYb6uqEZeSg4r94tzlha-9oGlhnfDoAZZSkE_PqYw3ONQ-VRwWFn5a3F_95TOg" },
  { id: 24, nameVN: "Sói Wolverine", nameEN: "Wolverine", faction: "werewolf", factionLabel: "Phe Ma Sói", points: "-4 Điểm", pointsType: "neg", time: "Mỗi Đêm", badge: "Âm Thanh Vuốt Kim Loại", desc: "Mỗi đêm thức dậy cùng Ma Sói. Nếu bạn là Ma Sói gần mục tiêu nhất, người chơi sẽ nghe thấy âm thanh kim loại báo hiệu.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD7MtC8Nt4ZSbUcWipXfw3-cwOwXh_kfz4G0_DTgbUoBAqQq5uKwVI34gYU9va5Z4DUKkwpWCp0A6UhZ8U1f9VIwi89o4Xn5pJx0zF35OOgm8sXPbA_q3Xc4REZrr17JWQUmADkk_HzRqJ5Xi_gqg7gdMiNVTxGKNHX8me8eksPB1q9vTih-8a0QMgAwrLCspK9JS-Kj2yaPVivvQpHb21wD-pzwW5n6JIx-6qNiBIIBA65T3qUuvatng" },
  { id: 25, nameVN: "Sói Mặt Nanh", nameEN: "Fang Face", faction: "werewolf", factionLabel: "Phe Ma Sói", points: "-5 Điểm", pointsType: "neg", time: "Đêm Đầu & Đơn Độc", badge: "Đêm Sau Ẩn Dật", desc: "Đêm đầu thức dậy cùng Ma Sói. Khi còn các Ma Sói khác trong game, bạn không thức dậy cùng họ trong những đêm tiếp theo.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBKi9NsgvGCm0HNWo_4pCgz9nKMvkcBdkPHZ2UWgqzHaVOahnWGnRZMdmA58z0wCHLga8ts3m5JelwtvowQo-iftfl0xT_LONnAu7h-vv7UXl_TaGwC_k97AxB9NDwdTvcvzBPOOPFY1fnfe70KddAE39rB0aWePzY9dyMeD1dM4lywEviO0tK4M8nUn85wp_u0OdR4pbBOlYKv_cxClCpH82Myh4FlaHvd_jKqpjukNDeptmgxvu78Wg" },
  { id: 26, nameVN: "Sói Ăn Chay", nameEN: "Fruit Brute", faction: "werewolf", factionLabel: "Phe Ma Sói", points: "-3 Điểm", pointsType: "neg", time: "Mỗi Đêm", badge: "Sói Cuối Không Cắn", desc: "Mỗi đêm thức dậy cùng Ma Sói. Nếu là Ma Sói sống sót cuối cùng, bạn không được cắn người vào ban đêm.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCX8ff1VcwcYAfcBHhL3zx7i0bOvoXjqx9WfMfMm7weIYBcN8mdK0WSUDI_j1qsYk1aizqWgFY_2nbJvJZpkhvWBWpgPFuXx5qB_bUxBz0-NswzniUbQOP5R09KPXVaMyBS-wb87nuVY_1ccf1x3xBwPLx2Vgfy-X7OQ5P9mDbA_wqJenesnD4cZIVdxpVXvezNZTvvQ3R_HLJhQZBx7mV21P2ZL7qHT5KcG09MkW2wJtov0qwVhgJmxA" },
  { id: 27, nameVN: "Sói Hắc Ám", nameEN: "Dire Wolf", faction: "werewolf", factionLabel: "Phe Ma Sói", points: "-4 Điểm", pointsType: "neg", time: "Đêm Đầu & Mỗi Đêm", badge: "Liên Kết Bạn Đồng Hành", desc: "Mỗi đêm thức dậy cùng Ma Sói. Đêm đầu chọn 1 bạn đồng hành. Nếu người đó bị loại, bạn cũng bị loại theo.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAP-Zbzn2kY-ZXaAZG3nKTMcwEMs0ZhkmLtXs8gpVqruafQgM2H8YmA8urXVq-itH9SP6y_Cvgu6y60yqgbzlKM1lp_XqgooE9R8ELJUpdtrGzuqeWj0MRSTgQAZbowmKafXRlklkayw6HjdknRjI0TsCtZJZMwPik4UCQDqnQU9iD7GjIIKg9NfbVzxFFgNZPh1IZ9xZbMHpze0hRo19JyWaDwJXQ_mLe-6HyEqG6GaMq0fN_935tyAw" },
  { id: 28, nameVN: "Sói Con", nameEN: "Wolf Cub", faction: "werewolf", factionLabel: "Phe Ma Sói", points: "-8 Điểm", pointsType: "neg", time: "Mỗi Đêm", badge: "Cắn 2 Mạng Phẫn Nộ", desc: "Thức dậy cùng đàn sói mỗi đêm. Nếu Sói Con bị loại bỏ dưới bất kỳ hình thức nào, đêm ngay sau đó đàn sói sẽ phẫn nộ và được cắn 2 nạn nhân.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCodTFVOX9tfVm48j4Dh7o2kYo-SNQm3wHbR5lLRzqeRjasQhemwSVZCnXLv0g5xQbOX2ZJ8zI4PyzF_RbUweNTXVbOW88Ubc81L7Sx2BUuftZcLFTMISI_d8s9q0oGRMrjjKznYXYTDUKdwOQ9KmyRu4LCKocQ-uF2-OonsEOgXQkNntK4eUJ_iDLzVrGbfSkwwPTP9QEo70uj1tH8kJDWZGmn_LlhtoKltYEOtzd96Zs6fvBrDabP0w" },
  { id: 29, nameVN: "Sói Đơn Độc", nameEN: "Lone Wolf", faction: "werewolf", factionLabel: "Sói Độc Lập", points: "-5 Điểm", pointsType: "neg", time: "Mỗi Đêm", badge: "Sống Sót Cuối Cùng", desc: "Thức dậy đi săn cùng bầy sói ban đêm. Tuy nhiên, Sói Đơn Độc chỉ chiến thắng khi và chỉ khi là người sống sót duy nhất còn lại trên bàn.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAOP9OSdJYzxf3LWWEltgLUMBSHOhtptcuZkSqVgHNmstndM9RWlMMVEjhfZOQpsCZoxXFzjuCscUYuu8Bxym86Bv3rEveNRlxuMiGG2TYjtuCFDX_r5-4xSg07sDY7Zgk5zKRcf0RzmMo6o3b12od75EAmb9PoMMD45e60IWRead0GMWMmVRTpPs_19Y7JjVng8EEeR4p0Ea26WL45xbhoKiZ2yj_P6-JgvD77vx3lfJ--KYG-owkKcg" },
  { id: 30, nameVN: "Ma Sói Thường", nameEN: "Werewolf", faction: "werewolf", factionLabel: "Phe Ma Sói", points: "-6 Điểm", pointsType: "neg", time: "Mỗi Đêm", badge: "Sát Thương Cốt Lõi", desc: "Thức dậy mỗi đêm cùng đàn để biểu quyết chọn 1 người dân cắn xé. Ban ngày ngụy trang hòa nhập tránh bị treo cổ trên giàn thiêu.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDncHcxSodB00mVx2ibOGvR7pd94J2JDAqYzQcixt9Wdzpd-PD9Ep0ECywL0ypSJuQkcrPRNAQpvL1ZXpNEE1fC0ONfaW3K74eY0Bk0mMNJR8xlOqKMddofD7EHs7QqDs_TvjWn3DA99IMMwdk0YxcK3xCS4939cnIZOFKvQwmBcRcESjRrTCSLjO-ChBcOpZxwIrwG8kICTtq4CwXbZVO252D5Lk7pbJ7Q7FYLgQc8HOWHkJkv7BiA0Q" },
  { id: 31, nameVN: "Phù Thủy Hắc Ám", nameEN: "Sorceress", faction: "werewolf", factionLabel: "Phe Ma Sói", points: "-3 Điểm", pointsType: "neg", time: "Mỗi Đêm", badge: "Tìm Tiên Tri", desc: "Thuộc phe Ma Sói. Mỗi đêm thức dậy chỉ định 1 người chơi để kiểm tra xem người đó có phải là Tiên Tri hay Tiên Tri Hào Quang hay không.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDJr8cEirur4HECxO5kJpCQLZf1CggJzboJlbaHWdxVUaiR-l4Gk6nvJ45vormgREL6kQ02WPFDaTq7wqUSI5tof2ZGIqPNhTL3EXPXtRIDJ0yvcT9uPSBYr0lCrhV3QRrdAub8279DbuFEXaBfCxHOkeF6xf7hcAwziJmeaoXDWQb9XeJp8sAamG0diAHfG6a5SO500HUWNGdAgRNo_FGP1oyv3tQAgDkfbFv4hCOMwyXEvxvQweaMsw" },
  { id: 32, nameVN: "Tay Sai Ma Sói", nameEN: "Minion", faction: "werewolf", factionLabel: "Phe Ma Sói", points: "-6 Điểm", pointsType: "neg", time: "Đêm Đầu Tiên", badge: "Hộ Tống Sói", desc: "Được Quản Trò cho biết danh tính toàn bộ bầy Ma Sói nhưng không thức dậy cùng bầy. Tìm mọi thủ đoạn để bẫy Dân Làng và bảo vệ đàn sói.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBO9mnDbwGXyxRhI3GXH4kozHLrFaqiFGycYwN_CyDYmdKNZ3XxYxMM1m3_8fVcT_ls_Q7NecTfyMPSuVAryzwfOVTVDstG6F1dKta7xifHTkh-W0jPz3RS1lTxuFsgTBNJc3qrVt7MQxo_2hjcmqcigmG3zPjAkag2K86mOU7SBAhCpVJLDV8VykQn52sTkYOAGchdVE3A7VOBIK9z2nSc33QReIyS_K-6bvgS8oVOIF9c6D7z4R3htg" },
  { id: 33, nameVN: "Kẻ Bị Nguyền Rủa", nameEN: "Cursed", faction: "werewolf", factionLabel: "Sói Tiềm Ẩn", points: "-3 Điểm", pointsType: "neg", time: "Bị Động", badge: "Chuyển Hóa Thành Sói", desc: "Bắt đầu với tư cách Dân Làng. Tuy nhiên nếu bị Ma Sói chọn cắn trong đêm, kẻ bị nguyền rủa không chết mà bị chuyển hóa thành Ma Sói mới.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCKZFKY3fqp9k_NBeE4RXfsZeMPv44LS_Q5arVsx68dPI5emsT16BX0Gg-q2biA9Y2mIuUzL5K-Qn4Xan9Vk1nWiNvmK6eI_zb9pEHm9B6caHlzVfocS__GbMbGMq-RiaAnZkiKbUCPTvQqiav8lSAwtEFuGh1Do1yFFmGwgYZXpysup_Fv3P8dqSNbitTDhcVBVl2eWe9PiV_cE0TKB45iYQ3gw85iOGFxiZ0xn9RUp6MVqfY5fM_X1Q" },

  // PHE THỨ BA (7 Roles)
  { id: 34, nameVN: "Ma Cà Rồng", nameEN: "Vampire", faction: "third", factionLabel: "Phe Thứ Ba", points: "-7 Điểm", pointsType: "neg", time: "Mỗi Đêm", badge: "Tố Cáo Thứ 2 Bị Loại", desc: "Mỗi đêm chọn 1 người chơi. Người đó sẽ bị loại khi nhận lời tố cáo thứ 2 vào ngày hôm sau.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDLBvTGmcw_0rTa42v4bljp7yYR1PFgzVP3dnE5DCREE6qV05Nc7yn-5SGFrTALzG62IdGXOUJJtqUZbhhFJTgKikSCua-m9KawvWRgORwi5IUKlTjuA1JzBSlDHq9_1FNhaDPNCaRKBsM_0-V791bbwgCCIqFbervKgzrAFw3y5ucxQLK6cpmktWzxyIx9QDlrksAZx8rzCrxI0NWHrlwPpeNaJV4LVtxzZYmU06Wzt_N81pDSlvMCcA" },
  { id: 35, nameVN: "Kẻ Bán Da", nameEN: "Tanner", faction: "third", factionLabel: "Phe Thứ Ba", points: "-2 Điểm", pointsType: "neg", time: "Ban Ngày", badge: "Thắng Khi Bị Treo", desc: "Bạn ghét công việc và cuộc đời mình. Bạn thắng ngay lập tức nếu bị dân làng biểu quyết treo cổ trên giàn thiêu.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDczwuCtC2ai61VBMLIMY9vz45tTO77Wia2SVb_rZKq22FwmzC1IMdUy2eQ9jEFg3gjFSa0djcAEO8X2PaYWkkPp5697A2x2dbIvd7P88eBdQnrKMiBw7enIQwrNFLaRCfqz6KwWUv429KEfCdHHIM9oCI99gtcK2u2HSR0eVIrjUn52nO0kHhan5-hYxNG_PDPlDvqfuZzi888NzguNrRf-s7fTqHg6CNB9Wp56no2Z3GZ3Y501a351A" },
  { id: 36, nameVN: "Virginia Woolf", nameEN: "Virginia Woolf", faction: "third", factionLabel: "Phe Thứ Ba / Dân", points: "-2 Điểm", pointsType: "neg", time: "Đêm Đầu Tiên", badge: "Kéo Kẻ Sợ Cùng Chết", desc: "Đêm đầu tiên, chọn 1 người chơi phải sợ bạn. Nếu bạn bị loại, người đó cũng bị loại theo ngay lập tức.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBbjvrH4gNNNEJWrlQN8vydJs615_pOqMBeIrizd5QwvDd2BFODAsfBP5Wx9xV_2DNd_appC_vFWkGHx3ibFh3fByoTgLonfNV7szFX6E6EBSzYBvF11cgpFtvjwLA2Ht7HAWc7dcArSG5iEzzD4AcEU0sZSHOkmG_zHI-3SeyyXWwhbE6Um0a9GGt637u6RDnEZjK3YCd0ExB-EVRNO0wl1aDv2kXXMgzjCQVRiscWFS9jwEGEe-jEZA" },
  { id: 37, nameVN: "Kẻ Du Côn", nameEN: "Hoodlum", faction: "third", factionLabel: "Phe Thứ Ba", points: "0 Điểm", pointsType: "neu", time: "Đêm Đầu Tiên", badge: "Mục Tiêu 2 Người", desc: "Chọn 2 người đêm đầu. Để thắng, cả 2 người phải bị loại và bạn vẫn còn sống vào cuối ván đấu.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCc2ax64B33AkzYzFuil3iv2Am7pQxt0dAALeYhBf5NseQB3EG5YsFFTHi5m8m9WEt4hCTSPFYsMGXKU6qhsxl12aUBi5hAO2xzE5Ad0WXEycMAPJ2fpbPvm-Z8HGmYuAe2Af_EYfO3sFDdIir0EY6mFgmri8BOHVK1hGzuqmnfg46tT1LEJhRu3PwnocF5ugTt2b6OBK0HGD6txVHt9VDhpXMiBahvrcQzeA8tHxWJ366w4qbLE4x2Rw" },
  { id: 38, nameVN: "Giáo Chủ Tà Giáo", nameEN: "Cult Leader", faction: "third", factionLabel: "Phe Thứ Ba", points: "+1 Điểm", pointsType: "pos", time: "Mỗi Đêm", badge: "Thu Phục Tín Đồ", desc: "Mỗi đêm chọn 1 người gia nhập giáo phái. Nếu toàn bộ người sống đều vào giáo phái, bạn thắng ngay lập tức.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA8eP43vlWiUJ3usMG0wGzOMjYHmaLUdcZKZSEltUo7yjts1cJKGfNQYBkd-NTvrdbD8s-MtDT9rr6DUwb0MRd7a2SF_qd6wSaMV95hiEfpbRA7IBaQQQTYWl6sUe4vSCDRmkSJxlkaOrIm4s4kntJtVZC8aEhXqnZXpEwnbuQ2UiITLIEfvLYPQXqxyzCXOClM4YkhghiaHWouEWu0GSFqcCBv7j326AdQg8tcZsnbs4bs-xER57wHEQ" },
  { id: 39, nameVN: "Thần Tình Yêu", nameEN: "Cupid", faction: "third", factionLabel: "Phe Thứ Ba / Dân", points: "-3 Điểm", pointsType: "neg", time: "Đêm Đầu Tiên", badge: "Kết Đôi Sinh Tử", desc: "Đêm đầu bắn tên ghép đôi 2 người chơi. Nếu 1 trong 2 người chết, người kia chết theo. Nếu ghép trúng Dân-Sói, tạo thành phe thứ ba độc lập.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAwTnz5Jh8kE1FWy_4mMVefODqGXHY79TBRLmX4MZYFemQyUXU2C-VKS2KmZ6_rQMQQ20uv67YTjfj1f4x5m5uTboKs4Kqlgt3rWYO96nxLw3z_1WaDK3DXZ38CTuTuRV0QRBmcS998Vbpxqxuv2jJy1Y0TQXFvGX_tC5iZYa-eAel3-x6DrlVB-5NlmASOL776VU3T1BUeKYo2H9RYB-5IwRZvR47ShUqjgkLJ0YayrKLkTTNcyvvmAg" },
  { id: 40, nameVN: "Kẻ Đổi Hồn", nameEN: "Doppelgänger", faction: "third", factionLabel: "Dân / Thứ Ba", points: "-2 Điểm", pointsType: "neg", time: "Đêm Đầu Tiên", badge: "Sao Chép Kế Thừa", desc: "Đêm đầu chọn sao chép 1 người. Khi người đó bị loại, Kẻ Đổi Hồn sẽ lập tức bí mật kế thừa năng lực và phe phái của người đó để tiếp tục chơi.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBlq-DrsK3AtcDkpC-JA-7fkVQs6fVpuZx0wGjiOizmNbezMOsVD6PUfdR9DIj7pHRHWpbnwC67ZKtlYV1dA0ukr0KGonnauNRA6ZxJTRgFkT9dXQtckusmOvXFk1HJFFxwJeCiiEieRzXE4lv1VYLfiYhIDubpFovRlnPplNZIW0hSVBtLWZroQPXoNo1mb9ssmZ7aJbENarEVTPbyCyWzMzNUsOyalNOJcCBqPFxPP_W4qTG5QMrs0g" },
];

export default function CardsPage() {
  const router = useRouter();
  const [faction, setFaction] = useState<'all' | 'villager' | 'werewolf' | 'third'>('all');
  const [pageSize, setPageSize] = useState<number>(8);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [search, setSearch] = useState<string>('');

  const counts = useMemo(() => {
    return {
      all: ROLES_DATA.length,
      villager: ROLES_DATA.filter((r) => r.faction === 'villager').length,
      werewolf: ROLES_DATA.filter((r) => r.faction === 'werewolf').length,
      third: ROLES_DATA.filter((r) => r.faction === 'third').length,
    };
  }, []);

  const filteredRoles = useMemo(() => {
    return ROLES_DATA.filter((r) => {
      const matchFaction = faction === 'all' || r.faction === faction;
      const matchSearch =
        search === '' ||
        r.nameVN.toLowerCase().includes(search.toLowerCase()) ||
        r.nameEN.toLowerCase().includes(search.toLowerCase()) ||
        r.desc.toLowerCase().includes(search.toLowerCase()) ||
        r.badge.toLowerCase().includes(search.toLowerCase());
      return matchFaction && matchSearch;
    });
  }, [faction, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRoles.length / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const paginatedRoles = filteredRoles.slice(startIndex, startIndex + pageSize);

  const meta = {
    all: {
      title: 'TẤT CẢ CÁC PHE PHÁI',
      desc: 'Khám phá toàn bộ 40 vai trò trong cuộc đối đầu sinh tử giữa Dân Làng, bầy Ma Sói khát máu và những thế lực Phe Thứ Ba mưu mô.',
      icon: 'apps',
      color: 'primary',
    },
    villager: {
      title: 'PHE DÂN LÀNG (22 VAI TRÒ)',
      desc: 'Lực lượng đông đảo nhất bảo vệ sự yên bình của ngôi làng thông qua lý luận, bỏ phiếu ban ngày và các quyền năng thần thánh bảo hộ.',
      icon: 'shield',
      color: 'primary',
    },
    werewolf: {
      title: 'PHE MA SÓI (11 VAI TRÒ)',
      desc: 'Bầy quái vật khát máu ngụy trang giữa bầy cừu với Sói Đầu Đàn, Wolverine, Mặt Nanh... Mỗi đêm thức dậy cắn xé nạn nhân và thao túng biểu quyết.',
      icon: 'skull',
      color: 'tertiary',
    },
    third: {
      title: 'PHE THỨ BA / ĐỘC LẬP (7 VAI TRÒ)',
      desc: 'Những thế lực cá nhân huyền bí: Vampire, Kẻ Bán Da Tanner, Virginia Woolf, Giáo Chủ Tà Giáo... Mỗi nhân vật sở hữu điều kiện thắng độc lập.',
      icon: 'balance',
      color: 'secondary',
    },
  }[faction];

  return (
    <div className="bg-[#0a0d16] text-[#f1f5f9] min-h-screen flex">
      {/* 1. LEFT SIDEBAR (Chuẩn 100% Stitch) */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-lowest/90 backdrop-blur-xl border-r border-outline-variant/30 flex flex-col justify-between p-4 z-50">
        <div className="flex flex-col gap-6">
          <div onClick={() => router.push('/')} className="flex items-center gap-3 px-2 cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(56,189,248,0.2)]">
              <span className="material-symbols-outlined text-[24px]">nightlight</span>
            </div>
            <div>
              <h1 className="font-syne font-bold text-base uppercase tracking-tight text-white">MA SÓI HUD</h1>
              <p className="font-space text-[10px] uppercase tracking-widest text-primary font-semibold">Bách Khoa Thẻ Bài</p>
            </div>
          </div>

          {/* Faction Filter Buttons */}
          <div className="flex flex-col gap-1.5">
            <span className="px-2 font-space text-[11px] uppercase tracking-wider text-outline">Bộ Lọc Phe Phái</span>

            <button
              onClick={() => { setFaction('all'); setCurrentPage(1); }}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                faction === 'all'
                  ? 'bg-surface-container text-white border border-primary/40 shadow-md'
                  : 'text-on-surface-variant hover:bg-surface-container/60 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-outline">apps</span>
                Tất Cả Thẻ Bài
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-space">
                {counts.all}
              </span>
            </button>

            <button
              onClick={() => { setFaction('villager'); setCurrentPage(1); }}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                faction === 'villager'
                  ? 'bg-surface-container text-white border border-primary/40 shadow-md'
                  : 'text-on-surface-variant hover:bg-surface-container/60 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-primary">shield</span>
                Phe Dân Làng
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-space font-semibold">
                {counts.villager}
              </span>
            </button>

            <button
              onClick={() => { setFaction('werewolf'); setCurrentPage(1); }}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                faction === 'werewolf'
                  ? 'bg-surface-container text-white border border-tertiary/40 shadow-md'
                  : 'text-on-surface-variant hover:bg-surface-container/60 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-tertiary">skull</span>
                Phe Ma Sói
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-tertiary/10 text-tertiary font-space font-semibold">
                {counts.werewolf}
              </span>
            </button>

            <button
              onClick={() => { setFaction('third'); setCurrentPage(1); }}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                faction === 'third'
                  ? 'bg-surface-container text-white border border-secondary/40 shadow-md'
                  : 'text-on-surface-variant hover:bg-surface-container/60 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-secondary">balance</span>
                Phe Thứ Ba
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-secondary/10 text-secondary font-space font-semibold">
                {counts.third}
              </span>
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col gap-1.5 pt-4 border-t border-outline-variant/20">
            <span className="px-2 font-space text-[11px] uppercase tracking-wider text-outline">Chuyển Giao Diện</span>
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container/60 hover:text-white text-sm transition-all text-left"
            >
              <span className="material-symbols-outlined text-[18px]">home</span>Sảnh Chờ Huyết Nguyệt
            </button>
            <button
              onClick={() => router.push('/auth')}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container/60 hover:text-white text-sm transition-all text-left"
            >
              <span className="material-symbols-outlined text-[18px]">lock</span>Đăng Nhập / Đăng Ký
            </button>
            <button
              onClick={() => router.push('/game/NEW')}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container/60 hover:text-white text-sm transition-all text-left"
            >
              <span className="material-symbols-outlined text-[18px]">casino</span>Bàn Chơi 3D POV
            </button>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="font-space text-[10px] uppercase text-outline">Đêm Trăng Máu</span>
            <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
          </div>
          <p className="text-[11px] text-on-surface-variant">Bộ quy tắc chuẩn hóa theo Ultimate Werewolf Deluxe.</p>
        </div>
      </aside>

      {/* 2. MAIN CONTENT (Offset by Sidebar 256px) */}
      <div className="ml-64 flex-1 flex flex-col min-w-0">
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-40 bg-surface-container-lowest/80 backdrop-blur-xl border-b border-outline-variant/30 px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-outline">search</span>
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Tìm kiếm vai trò theo tên, kỹ năng, chức năng..."
                className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-outline focus:outline-none focus:border-primary/60 transition-colors font-geist"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-surface-container-low border border-outline-variant/30 rounded-xl px-3 py-1.5">
              <span className="text-xs text-outline font-space">Hiển thị:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-transparent text-xs font-space font-bold text-primary focus:outline-none cursor-pointer"
              >
                <option value="8" className="bg-surface-container text-white">8 Thẻ</option>
                <option value="12" className="bg-surface-container text-white">12 Thẻ</option>
                <option value="16" className="bg-surface-container text-white">16 Thẻ</option>
                <option value="40" className="bg-surface-container text-white">Tất Cả</option>
              </select>
            </div>

            <button
              onClick={() => router.push('/game/NEW')}
              className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-space font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_12px_rgba(56,189,248,0.25)] hover:bg-sky-300 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">play_arrow</span>Vào Bàn Chơi Ngay
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-8 max-w-7xl mx-auto flex flex-col gap-8 w-full">
          {/* Hero Header */}
          <section className="rounded-2xl bg-gradient-to-r from-surface-container-low via-surface-container to-surface-container-low border border-outline-variant/40 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>
            <div className="relative z-10 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary font-space text-[10px] font-bold uppercase tracking-wider">
                  Hệ Thống Thẻ Bài Mở Rộng 40 Lá
                </span>
                <span className="text-outline text-xs">•</span>
                <span className="text-on-surface-variant font-space text-xs uppercase tracking-wider">Phiên bản Quốc Tế & Tiếng Việt</span>
              </div>
              <h1 className="font-syne font-extrabold text-2xl md:text-3xl text-white uppercase tracking-tight">
                BÁCH KHOA THẺ BÀI MA SÓI — PHÂN TÁCH 3 PHE
              </h1>
              <p className="text-on-surface-variant text-sm max-w-2xl leading-relaxed">
                Tổng hợp đầy đủ 40 vai trò chia làm 3 phe chiến lược: <span className="text-primary font-semibold">Phe Dân Làng (22)</span>, <span className="text-tertiary font-semibold">Phe Ma Sói (11)</span> và <span className="text-secondary font-semibold">Phe Thứ Ba (7)</span>. Đã tích hợp trọn bộ vai trò mở rộng mới chuẩn hóa hình ảnh Poker không viền.
              </p>
            </div>

            {/* Quick Counters */}
            <div className="relative z-10 grid grid-cols-3 gap-3 bg-surface-container-lowest/80 border border-outline-variant/30 p-3 rounded-xl flex-shrink-0">
              <div className="px-3 py-1 flex flex-col">
                <span className="font-space text-[10px] uppercase text-outline">Tổng Thẻ</span>
                <span className="font-syne font-bold text-xl text-white">{counts.all}</span>
              </div>
              <div className="px-3 py-1 flex flex-col border-l border-outline-variant/30">
                <span className="font-space text-[10px] uppercase text-primary">Dân Làng</span>
                <span className="font-syne font-bold text-xl text-primary">{counts.villager}</span>
              </div>
              <div className="px-3 py-1 flex flex-col border-l border-outline-variant/30">
                <span className="font-space text-[10px] uppercase text-tertiary">Sói & Thứ 3</span>
                <span className="font-syne font-bold text-xl text-tertiary">{counts.werewolf + counts.third}</span>
              </div>
            </div>
          </section>

          {/* Faction Selector Bar */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-4 pb-2 border-b border-outline-variant/20">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => { setFaction('all'); setCurrentPage(1); }}
                  className={`px-4 py-2 rounded-xl text-xs font-space uppercase font-bold tracking-wider transition-all flex items-center gap-2 ${
                    faction === 'all'
                      ? 'bg-primary text-on-primary shadow-md'
                      : 'bg-surface-container text-on-surface-variant hover:text-primary hover:bg-surface-container-high border border-outline-variant/30'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">apps</span>
                  Tất Cả Thẻ Bài ({counts.all})
                </button>

                <button
                  onClick={() => { setFaction('villager'); setCurrentPage(1); }}
                  className={`px-4 py-2 rounded-xl text-xs font-space uppercase font-bold tracking-wider transition-all flex items-center gap-2 ${
                    faction === 'villager'
                      ? 'bg-primary text-on-primary shadow-md'
                      : 'bg-surface-container text-on-surface-variant hover:text-primary hover:bg-surface-container-high border border-outline-variant/30'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px] text-primary">shield</span>
                  PHE DÂN LÀNG ({counts.villager})
                </button>

                <button
                  onClick={() => { setFaction('werewolf'); setCurrentPage(1); }}
                  className={`px-4 py-2 rounded-xl text-xs font-space uppercase font-bold tracking-wider transition-all flex items-center gap-2 ${
                    faction === 'werewolf'
                      ? 'bg-tertiary text-white shadow-md'
                      : 'bg-surface-container text-on-surface-variant hover:text-tertiary hover:bg-surface-container-high border border-outline-variant/30'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px] text-tertiary">skull</span>
                  PHE MA SÓI ({counts.werewolf})
                </button>

                <button
                  onClick={() => { setFaction('third'); setCurrentPage(1); }}
                  className={`px-4 py-2 rounded-xl text-xs font-space uppercase font-bold tracking-wider transition-all flex items-center gap-2 ${
                    faction === 'third'
                      ? 'bg-secondary text-white shadow-md'
                      : 'bg-surface-container text-on-surface-variant hover:text-secondary hover:bg-surface-container-high border border-outline-variant/30'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px] text-secondary">balance</span>
                  PHE THỨ BA ({counts.third})
                </button>
              </div>

              <div className="flex items-center gap-2 font-space text-xs text-outline">
                <span className="px-2.5 py-1 rounded bg-surface-container border border-outline-variant/40 text-white font-medium">
                  Đang hiển thị: {meta.title}
                </span>
              </div>
            </div>

            {/* Faction Description Banner */}
            <div className="p-4 rounded-xl bg-surface-container-low border border-primary/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-${meta.color}/10 text-${meta.color} flex items-center justify-center flex-shrink-0`}>
                  <span className="material-symbols-outlined text-[24px]">{meta.icon}</span>
                </div>
                <div>
                  <h2 className="font-syne font-bold text-sm uppercase text-white tracking-wide">{meta.title}</h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">{meta.desc}</p>
                </div>
              </div>
            </div>
          </section>

          {/* 3. CARDS GRID */}
          <section>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {paginatedRoles.map((role) => {
                const isWolf = role.faction === 'werewolf';
                const isThird = role.faction === 'third';
                const badgeColor = isWolf ? 'text-tertiary' : isThird ? 'text-secondary' : 'text-primary';
                const hoverBorder = isWolf ? 'hover:border-tertiary/60' : isThird ? 'hover:border-secondary/60' : 'hover:border-primary/60';
                const pointClass =
                  role.pointsType === 'pos'
                    ? 'text-primary bg-primary/10 border border-primary/20'
                    : role.pointsType === 'neg'
                    ? 'text-tertiary bg-tertiary/10 border border-tertiary/20'
                    : 'text-outline bg-surface-container border border-outline-variant/30';

                return (
                  <article
                    key={role.id}
                    className={`role-card group flex flex-col rounded-2xl bg-surface-container-low border border-outline-variant/30 ${hoverBorder} overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1`}
                  >
                    {/* Top Pill Header */}
                    <div className="flex items-center justify-between px-3 py-2 bg-surface-container border-b border-outline-variant/20">
                      <span className={`flex items-center gap-1.5 font-space text-[11px] font-bold uppercase ${badgeColor}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {role.factionLabel}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded font-space text-[10px] font-bold ${pointClass}`}>
                        {role.points}
                      </span>
                    </div>

                    {/* Visual Aspect Image */}
                    <div className="relative w-full aspect-[7/9] bg-surface-container-lowest overflow-hidden flex items-center justify-center">
                      <img
                        alt={role.nameEN}
                        src={role.image}
                        className="w-full h-full object-cover scale-[1.03] group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-transparent to-transparent opacity-90 pointer-events-none"></div>
                      <span className={`absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded bg-surface-container-lowest/80 backdrop-blur-md font-space text-[10px] uppercase font-bold ${badgeColor}`}>
                        {role.time}
                      </span>
                      <span className="absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded bg-surface-container-lowest/80 text-[10px] font-space text-outline">
                        #{role.id.toString().padStart(2, '0')}
                      </span>
                    </div>

                    {/* Info Body */}
                    <div className="p-3.5 flex flex-col flex-1 justify-between gap-2.5">
                      <div>
                        <h3 className="font-syne font-bold text-base text-white tracking-tight uppercase leading-snug">{role.nameVN}</h3>
                        <span className="font-space text-[11px] text-outline uppercase block">{role.nameEN}</span>
                        <p className="text-xs text-on-surface-variant line-clamp-3 mt-1.5 leading-relaxed">{role.desc}</p>
                      </div>
                      <div className="pt-2 flex items-center justify-between font-space text-[11px] border-t border-outline-variant/20">
                        <span className="text-outline flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">bolt</span>{role.badge}
                        </span>
                        <span className={`${badgeColor} font-bold`}>Chuẩn PnP</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Empty State */}
            {filteredRoles.length === 0 && (
              <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-surface-container-low border border-outline-variant/30">
                <span className="material-symbols-outlined text-5xl text-outline mb-3">search_off</span>
                <h3 className="font-syne font-bold text-lg text-white uppercase">Không tìm thấy thẻ bài phù hợp</h3>
                <p className="text-sm text-on-surface-variant max-w-sm mt-1">
                  Hãy thử tìm kiếm với từ khóa khác như "Sói", "Tiên Tri", "Vampire", "Wolverine", "Tanner".
                </p>
                <button
                  onClick={() => { setFaction('all'); setSearch(''); }}
                  className="mt-4 px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-space text-xs uppercase font-bold tracking-wider transition-all"
                >
                  Đặt Lại Bộ Lọc
                </button>
              </div>
            )}
          </section>

          {/* 4. PAGINATION CONTROLS */}
          <section className="rounded-xl bg-surface-container-low border border-outline-variant/30 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-2 font-space text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-primary text-[18px]">layers</span>
              <span>
                Đang hiển thị {filteredRoles.length > 0 ? startIndex + 1 : 0} -{' '}
                {Math.min(startIndex + pageSize, filteredRoles.length)} trong tổng số {filteredRoles.length} thẻ
              </span>
              <span className="hidden md:inline px-2 py-0.5 rounded bg-surface-container text-outline text-[11px]">
                {pageSize} thẻ / trang
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={validPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-white font-space text-xs uppercase font-bold tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                <span>Trước</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pNum = idx + 1;
                  return (
                    <button
                      key={pNum}
                      onClick={() => setCurrentPage(pNum)}
                      className={`w-7 h-7 rounded-lg font-space text-xs font-bold transition-all ${
                        validPage === pNum
                          ? 'bg-primary text-on-primary shadow-md'
                          : 'bg-surface-container text-on-surface-variant hover:text-white'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={validPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-white font-space text-xs uppercase font-bold tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span>Sau</span>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </section>

          {/* 5. NIGHT ORDER CHEAT SHEET (Thứ Tự Gọi Đêm Mở Rộng) */}
          <section className="rounded-2xl bg-surface-container-low border border-outline-variant/30 p-6 shadow-xl flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/20 pb-4">
              <div>
                <span className="font-space text-[10px] uppercase tracking-wider text-primary font-bold">HƯỚNG DẪN QUẢN TRÒ & THỨ TỰ GỌI ĐÊM MỞ RỘNG</span>
                <h2 className="font-syne font-bold text-lg uppercase text-white tracking-tight mt-0.5">Trình Tự Thức Dậy Ban Đêm Toàn Diện</h2>
              </div>
              <span className="px-2.5 py-1 rounded bg-surface-container text-outline font-space text-xs">Chuẩn Quốc Tế Ultimate Werewolf</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Night */}
              <div className="p-4 rounded-xl bg-surface-container border border-secondary/20 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-space text-xs uppercase font-bold text-secondary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">wb_twilight</span>ĐÊM ĐẦU TIÊN (THIẾT LẬP LIÊN KẾT)
                  </span>
                  <span className="font-space text-[10px] text-outline">Gọi 1 lần duy nhất</span>
                </div>
                <ol className="flex flex-col gap-2 text-xs text-on-surface-variant">
                  <li className="flex items-start gap-2"><strong className="text-white font-space">1.</strong> <span><strong className="text-white uppercase">Kẻ Đổi Hồn (Doppelgänger):</strong> Thức dậy chọn 1 người làm bản sao kế thừa.</span></li>
                  <li className="flex items-start gap-2"><strong className="text-white font-space">2.</strong> <span><strong className="text-white uppercase">Kẻ Du Côn (Hoodlum):</strong> Chỉ định 2 người cần bị loại để đạt điều kiện thắng.</span></li>
                  <li className="flex items-start gap-2"><strong className="text-white font-space">3.</strong> <span><strong className="text-white uppercase">Virginia Woolf:</strong> Chọn 1 người chơi phải sợ mình.</span></li>
                  <li className="flex items-start gap-2"><strong className="text-white font-space">4.</strong> <span><strong className="text-white uppercase">Sói Hắc Ám (Dire Wolf):</strong> Chọn 1 người làm bạn đồng hành kết nối sinh tử.</span></li>
                  <li className="flex items-start gap-2"><strong className="text-white font-space">5.</strong> <span><strong className="text-white uppercase">Thần Tình Yêu (Cupid):</strong> Bắn tên ghép đôi 2 người yêu nhau.</span></li>
                  <li className="flex items-start gap-2"><strong className="text-white font-space">6.</strong> <span><strong className="text-white uppercase">Mặt Nanh (Fang Face):</strong> Thức dậy làm quen bầy Sói.</span></li>
                  <li className="flex items-start gap-2"><strong className="text-white font-space">7.</strong> <span><strong className="text-white uppercase">Hội Tam Điểm (Masons):</strong> Thức dậy nhìn nhau nhận diện đồng minh.</span></li>
                  <li className="flex items-start gap-2"><strong className="text-white font-space">8.</strong> <span><strong className="text-white uppercase">Tay Sai (Minion):</strong> Thức dậy nhìn bầy Ma Sói giơ tay.</span></li>
                </ol>
              </div>

              {/* Every Night */}
              <div className="p-4 rounded-xl bg-surface-container border border-tertiary/20 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-space text-xs uppercase font-bold text-tertiary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">bedtime</span>MỖI ĐÊM (VÒNG LẶP HÀNG ĐÊM)
                  </span>
                  <span className="font-space text-[10px] text-outline">Thực hiện theo thứ tự</span>
                </div>
                <ol className="flex flex-col gap-2 text-xs text-on-surface-variant">
                  <li className="flex items-start gap-2"><strong className="text-white font-space">1.</strong> <span><strong className="text-white uppercase">Bảo Vệ / Mục Sư:</strong> Chọn 1 người bảo hộ khỏi móng vuốt Sói.</span></li>
                  <li className="flex items-start gap-2"><strong className="text-white font-space">2.</strong> <span><strong className="text-white uppercase">Tiên Tri / Tiên Tri Hào Quang / P.I:</strong> Thức dậy soi danh tính / năng lực.</span></li>
                  <li className="flex items-start gap-2"><strong className="text-white font-space">3.</strong> <span><strong className="text-white uppercase">Bà Lão Cổ Quái & Pháp Sư:</strong> Chọn người phải rời làng hoặc bị cấm nói.</span></li>
                  <li className="flex items-start gap-2"><strong className="text-white font-space">4.</strong> <span><strong className="text-white uppercase">Bầy Ma Sói & Sói Đầu Đàn / Wolverine / Sói Ăn Chay:</strong> Cả đàn chọn cắn người.</span></li>
                  <li className="flex items-start gap-2"><strong className="text-white font-space">5.</strong> <span><strong className="text-white uppercase">Phù Thủy Hắc Ám:</strong> Thức dậy tìm Tiên Tri.</span></li>
                  <li className="flex items-start gap-2"><strong className="text-white font-space">6.</strong> <span><strong className="text-white uppercase">Ma Cà Rồng (Vampire):</strong> Chọn 1 người bị yểm bùa.</span></li>
                  <li className="flex items-start gap-2"><strong className="text-white font-space">7.</strong> <span><strong className="text-white uppercase">Phù Thủy (Witch):</strong> Quyết định dùng bình Cứu hoặc bình Độc.</span></li>
                  <li className="flex items-start gap-2"><strong className="text-white font-space">8.</strong> <span><strong className="text-white uppercase">Giáo Chủ Tà Giáo:</strong> Thu phục 1 người chơi mới vào giáo phái.</span></li>
                </ol>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
