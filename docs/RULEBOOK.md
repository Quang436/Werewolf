# 📜 RULEBOOK — Luật chơi Ma Sói (nguồn sự thật cho Game Engine)

> **Nguồn tham khảo:**
> - [Lens Xoắn — Hướng dẫn chơi Ma Sói cho người mới](https://lensxoan.vn/blogs/kham-pha/huong-dan-choi-ma-soi-cho-nguoi-moi)
> - `docs/[studocu.com] - NHÂN VẬT VÀ CÁCH CHƠI TRÒ MA SÓI - HƯỚNG DẪN CHI TIẾT.pdf` (bộ **Ultimate Werewolf Deluxe** + bản mở rộng **Wolfpack**)
>
> Mọi chỗ hai nguồn khác nhau đều được biến thành **tuỳ chọn cấu hình (`settings`)**, giá trị mặc định ghi rõ ở cột “Mặc định”.
> Ký hiệu nguồn: 🅛 = bài viết Lens Xoắn · 🅟 = file PDF.

---

## 1. Tổng quan

- **Phe chính:** Dân Làng (Thiện) và Ma Sói (Ác). Ngoài ra có **phe Cặp Đôi** (sinh ra từ Cupid) và **phe Solo/Biệt lập** (bản mở rộng).
- Game luân phiên **Đêm ↔ Ngày**, điều khiển bởi Quản Trò → trong bản online, **Server đóng vai Quản Trò**.
- **Số người chơi:** 6–12 (V1). Kiến trúc cho phép nâng lên 18.

### 1.1 Điều kiện thắng (kiểm tra theo thứ tự, sau MỖI lần có người chết)

| Ưu tiên | Phe | Điều kiện | Nguồn |
|---|---|---|---|
| 1 | **Cặp đôi khác phe** | Chỉ còn đúng 2 người sống và đó là cặp đôi | 🅛🅟 |
| 2 | **Dân Làng** | Không còn người phe Sói nào sống (Sói trong cặp đôi khác phe vẫn tính là Sói) | 🅛 |
| 3 | **Ma Sói** | Sói sống (trừ Sói trong cặp khác phe) **≥** tất cả người sống còn lại | 🅛 |
| — | Solo (V2) | Theo điều kiện riêng của vai (Chán đời, Sói trắng, Thổi sáo…) | 🅛🅟 |

> Cặp đôi **cùng phe** thắng cùng phe gốc của họ. 🅛

---

## 2. Vòng chơi

### 2.1 Đêm — thứ tự gọi vai

Server gọi theo thứ tự cố định dưới đây. **Vai đã chết hoặc không có trong ván vẫn được “gọi” với thời lượng bình thường** để không lộ thông tin. 🅛 *(“Nếu một người chơi có chức năng đã chết, quản trò vẫn phải gọi tên chức năng đó để tránh làm lộ vai trò.”)*

| # | Lượt | Khi nào | Ghi chú |
|---|---|---|---|
| 0 | **Cupid** ghép đôi | Chỉ đêm 1 | Được chọn cả chính mình 🅟 |
| 0b | **Cặp đôi** thức dậy nhận nhau | Chỉ đêm 1 | Mở kênh chat riêng `lovers` 🅛 |
| 1 | **Bảo Vệ** | Mỗi đêm | Chọn trước khi Sói cắn → mù thông tin (giống bàn thật) |
| 2 | **Ma Sói** | Mỗi đêm | Đầu tiên đêm 1: Sói nhận diện nhau 🅛 |
| 3 | **Phù Thủy** | Mỗi đêm | Được báo nạn nhân (xem §3.4) |
| 4 | **Tiên Tri** | Mỗi đêm | |
| 5 | Vai khác (V1.1+) | — | Thêm theo `nightOrder` trong Role Registry |

> 🅛 ghi thứ tự “Sói → Bảo vệ → Phù thủy → Tiên tri”. Trong bản online, Bảo vệ được gọi **trước** Sói vì Bảo vệ không được biết mục tiêu của Sói — kết quả tính toán **giống hệt** bàn thật, và đóng được một kẽ hở timing.

### 2.2 Ngày

| Bước | Mô tả | Nguồn |
|---|---|---|
| **Công bố** | “Trời sáng rồi!” — thông báo người chết trong đêm (không nói nguyên nhân) | 🅛 |
| **Di ngôn / Kích hoạt khi chết** | Thợ Săn bắn, cặp đôi chết theo… | 🅛🅟 |
| **Thảo luận** | Mọi người sống cùng thảo luận | 🅛 |
| **Bỏ phiếu đề cử** | Mỗi người sống chọn 1 người nghi ngờ hoặc bỏ qua | 🅛 |
| **Biện hộ** | Người bị đề cử nhiều nhất có thời gian ngắn tự biện hộ | 🅛 *(“Người bị chọn có một khoảng thời gian ngắn để tự biện hộ trước khi bị loại.”)* |
| **Phán quyết** | Cả làng (trừ bị cáo) chọn **Treo / Tha** | Chuẩn online phổ biến |
| **Treo cổ** | Thực thi + kích hoạt hiệu ứng chết | 🅛 |

### 2.3 Luật bỏ phiếu chi tiết

| Tình huống | Xử lý | Cấu hình |
|---|---|---|
| 1 người có phiếu đề cử cao nhất (duy nhất) và > số phiếu bỏ qua | Sang **Biện hộ** | — |
| Phiếu bỏ qua ≥ phiếu cao nhất | Không ai bị treo | — |
| Hòa lần 1 | Bỏ phiếu lại giữa các người hòa | `tieBreak: REVOTE` |
| Hòa lần 2 | Không ai bị treo | `tieBreak: NO_LYNCH` |
| Không vote khi hết giờ | Tính là bỏ qua | — |
| Phán quyết: Treo > Tha | Treo | Hòa ⇒ **Tha** |
| Trưởng làng / Thị trưởng (V1.1) | Phiếu × 2 | 🅛🅟 |

---

## 3. Vai trò V1 (bắt buộc làm trước)

| Vai | Phe | Tiên tri soi ra | Thức dậy | Tóm tắt |
|---|---|---|---|---|
| **Dân Làng** (Villager) | Dân | Không phải Sói | Không | Suy luận & bỏ phiếu 🅛🅟 |
| **Ma Sói** (Werewolf) | Sói | **Sói** | Mỗi đêm | Cùng chọn 1 nạn nhân; **có thể không giết ai**; **không được giết Sói** 🅟 |
| **Tiên Tri** (Seer) | Dân | Không phải Sói | Mỗi đêm | Soi 1 người: “Sói / Không phải Sói” 🅟 |
| **Bảo Vệ** (Bodyguard) | Dân | Không phải Sói | Mỗi đêm | Bảo vệ 1 người khỏi Sói; **không 2 đêm liên tiếp cùng 1 người**; **được tự bảo vệ** 🅛 |
| **Phù Thủy** (Witch) | Dân | Không phải Sói | Mỗi đêm | 1 bình cứu + 1 bình độc, mỗi bình 1 lần; **được dùng cả 2 trong cùng 1 đêm** 🅛🅟 |
| **Thợ Săn** (Hunter) | Dân | Không phải Sói | Khi chết | Bị Sói giết hoặc bị treo ⇒ được bắn chết 1 người 🅛🅟 |
| **Cupid** (Thần Tình Yêu) | Dân | Không phải Sói | Đêm 1 | Ghép 2 người thành cặp đôi, một người chết thì người kia chết theo 🅛🅟 |

### 3.1 Ma Sói — chi tiết
- Mỗi Sói chọn 1 mục tiêu (hoặc `SKIP`). Mục tiêu cuối = **đa số phiếu**.
- Hòa phiếu giữa các mục tiêu: `wolfTieBreak` = `RANDOM` (mặc định, chọn ngẫu nhiên trong nhóm hòa) | `NO_KILL`.
- Sói có kênh chat riêng ban đêm; đêm 1 được biết đồng đội 🅛.
- Không được chọn Sói khác (server từ chối, không đưa vào `candidates`).

### 3.2 Tiên Tri — chi tiết
- Kết quả dựa trên thuộc tính **`seerAppearance`** của vai, **không** dựa trên phe — vì có các vai “soi sai” 🅟: Người hóa sói (Lycan, phe Dân nhưng soi ra Sói), Kẻ phản bội (Minion, phe Sói nhưng soi ra Dân), Kẻ bị nguyền (soi ra Dân cho tới khi bị biến thành Sói).
- `seerRevealMode`: `WOLF_OR_NOT` (mặc định, theo 🅟) | `EXACT_ROLE` (theo 🅛 “biết danh tính thật”).

### 3.3 Bảo Vệ — chi tiết
- Không chọn lại người đã bảo vệ đêm trước 🅛 (kể cả chính mình).
- `bodyguardCanSelfProtect`: `true` (mặc định — 🅛 có ví dụ “C tự bảo vệ mình”).
- Chỉ chặn **đòn cắn của Sói**; **không** chặn bình độc của Phù thủy, không chặn treo cổ, không chặn phát bắn của Thợ săn.
- Biến thể 🅟 “bảo vệ cả ngày hôm sau” → `bodyguardProtectsDay: false` (để dành V2).

### 3.4 Phù Thủy — chi tiết
- Được báo nạn nhân của Sói trong lượt của mình. Theo 🅛: *“nếu đã được bảo vệ thì ra hiệu cho phù thủy biết không có ai chết”* ⇒ `witchInfoMode`:
  - `AFTER_PROTECTION` (mặc định, theo 🅛): nếu nạn nhân đã được Bảo vệ thì báo “Đêm nay không ai bị cắn”.
  - `RAW_TARGET`: luôn báo đúng người Sói chọn.
- Bình cứu chỉ dùng lên **nạn nhân của Sói** đêm đó.
- `witchCanSelfSave`: `FIRST_NIGHT_ONLY` (mặc định) | `ALWAYS` | `NEVER`.
- Bình độc giết 1 người bất kỳ còn sống (trừ chính mình); **xuyên qua Bảo vệ**.

### 3.5 Thợ Săn — chi tiết
- Kích hoạt khi chết do **Sói cắn** hoặc **bị treo** 🅛. Mặc định **không** kích hoạt khi chết do bình độc hay chết theo người yêu (`hunterTriggers` cấu hình được).
- Chết ban đêm ⇒ bắn trong bước “Kích hoạt khi chết” đầu buổi sáng 🅟 *(“Quản trò sẽ đụng vai Thợ săn để báo Thợ săn ngắm bắn”)*.
- Được bỏ qua không bắn. Hết giờ ⇒ coi như không bắn.
- Người bị bắn chết ngay → có thể kích hoạt chuỗi (người yêu chết theo, kiểm tra thắng).

### 3.6 Cupid & Cặp Đôi — chi tiết
- Đêm 1 chọn 2 người khác nhau (được chọn chính mình) 🅟. Hết giờ không chọn ⇒ server **ghép ngẫu nhiên** (`cupidTimeoutMode: RANDOM`) để vai không bị “phí”.
- Hai người yêu được báo danh tính + vai của nhau, có kênh chat `lovers`.
- Một người chết (bất kỳ nguyên nhân) ⇒ người kia **chết ngay theo** (nguyên nhân `HEARTBREAK`) 🅛🅟.
- Khác phe ⇒ thành **phe Cặp Đôi**, thắng khi là 2 người cuối cùng 🅛.

---

## 4. Giải quyết đêm (Night Resolution) — thứ tự ưu tiên

```
1. wolfTarget  = đa số phiếu Sói (hoặc null)
2. Nếu wolfTarget == bodyguardTarget  → wolfTarget được cứu (BLOCKED_BY_GUARD)
3. Nếu witchSave && wolfTarget còn bị cắn → cứu (SAVED_BY_WITCH)
4. Nếu wolfTarget vẫn bị cắn → chết (cause = WOLF)
5. Nếu witchPoisonTarget → chết (cause = POISON)   // Bảo vệ KHÔNG chặn được
6. Chuỗi hệ quả: người yêu chết theo (HEARTBREAK) → lặp tới khi ổn định
7. Gom danh sách chết, xáo trộn thứ tự trước khi công bố (không lộ ai chết vì gì)
8. Ghi pending triggers: Thợ săn (nếu cause ∈ hunterTriggers)
```

> Trường hợp Bảo vệ và Phù thủy cùng cứu một người: người đó sống, Phù thủy **vẫn mất bình cứu** (đã dùng).

---

## 5. Chia vai gợi ý (preset)

Dựa theo bảng 🅛 cho 8–13 người, mở rộng xuống 6–7 người:

| Số người | Sói | Tiên Tri | Bảo Vệ | Phù Thủy | Thợ Săn | Cupid | Dân |
|---|---|---|---|---|---|---|---|
| 6 | 1 | 1 | 1 | 1 | – | – | 2 |
| 7 | 2 | 1 | 1 | – | – | – | 3 |
| 8 | 2 | 1 | 1 | – | – | – | 4 🅛 |
| 9 | 2 | 1 | 1 | – | – | – | 5 🅛 |
| 10 | 3 | 1 | 1 | – | 1 | – | 4 🅛 |
| 11 | 3 | 1 | 1 | – | 1 | – | 5 🅛 |
| 12 | 3 | 1 | 1 | – | 1 | 1 | 5 🅛 |

Ràng buộc khi host tự cấu hình: tổng vai = số người; 1 ≤ Sói < số người / 2; tối đa 1 Tiên tri / Bảo vệ / Phù thủy / Thợ săn / Cupid.

---

## 6. Role Registry — kiến trúc mở rộng vai

Mỗi vai là một bản mô tả (`RoleDefinition`) + các hook. Thêm vai mới **không cần sửa** engine:

```ts
interface RoleDefinition {
  id: Role;
  faction: 'VILLAGE' | 'WEREWOLF' | 'SOLO';
  seerAppearance: 'WEREWOLF' | 'NOT_WEREWOLF';
  wakesWithWolves: boolean;          // Sói, Sói con, Kẻ phản bội (biết sói)…
  nightTurn?: { order: number; firstNightOnly?: boolean; everyNNights?: number };
  voteWeight: number;                // Trưởng làng = 2
  lives: number;                     // Già làng = 2 (với đòn Sói)
  onDeath?: (ctx: DeathContext) => PendingTrigger | null;   // Thợ săn, Sói con
  onExecuted?: (ctx: DeathContext) => 'SURVIVE' | 'DIE';    // Hoàng tử, Chàng ngốc
  onBittenByWolf?: (ctx: NightContext) => 'DIE' | 'SURVIVE' | 'CONVERT' | 'DELAYED'; // Kẻ bị nguyền, Người cứng cỏi
  winCondition?: (state: RoomState, self: PlayerState) => boolean; // Solo
}
```

---

## 7. Lộ trình vai mở rộng

| Đợt | Vai | Lý do xếp đợt |
|---|---|---|
| **V1** | Dân, Sói, Tiên Tri, Bảo Vệ, Phù Thủy, **Thợ Săn**, **Cupid** | Bộ cơ bản + 2 vai có trong preset 10–12 người của 🅛 |
| **V1.1** | Già Làng (2 mạng 🅛), Trưởng Làng (phiếu ×2 🅛🅟), Hoàng Tử (không bị treo 🅟), Chàng Ngốc (bị treo không chết, mất quyền vote 🅛), Người Hóa Sói (Lycan 🅟), Kẻ Phản Bội (Minion 🅟🅛), Kẻ Bị Nguyền (Cursed 🅟🅛), Sói Con (Wolf Cub 🅟🅛), Sói Đầu Đàn (quyết khi Sói hòa phiếu 🅛), Tiên Tri Tập Sự 🅟, Người Bệnh 🅟, Người Cứng Cỏi 🅟, Chán Đời (Tanner 🅟) | Chỉ cần hook, không cần pha mới |
| **V2** | Sói Trắng 🅛, Thổi Sáo 🅛, Ăn Trộm 🅛, Nhân Bản 🅟, Trưởng Giáo Phái 🅟, Ma Cà Rồng 🅟, Du Côn 🅟, Sói Đại Ca 🅟, Sói Tuyết 🅟, Pháp Sư Sói 🅟, Thám Tử 🅟, Thầy Tu 🅟🅛, Kẻ Phá Rối 🅟, Phù Thủy Già 🅟, Người Phù Phép 🅟, Cô Bé 🅛 | Cần phe mới, pha mới hoặc cơ chế đặc biệt |
| **Không làm** | Hồn Ma (viết giấy), Sinh Đôi (phạt khi ám chỉ), Vuốt Sói (tiếng kim loại), Say Rượu (rút bài vật lý) | Cơ chế dựa trên bàn chơi thật, khó số hóa công bằng |
