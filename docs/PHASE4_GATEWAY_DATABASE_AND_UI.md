# 🚀 Giai đoạn 4: Realtime Gateway, Database Schema & Giao diện Frontend Bàn Tròn

Tài liệu này tổng hợp toàn bộ kết quả phát triển của **Giai đoạn 4**, hoàn thiện hệ sinh thái Game Ma Sói từ Backend, Database cho tới Frontend Web App.

---

## 1. Realtime WebSocket Gateway (`GameGateway`)
Vị trí: [`apps/server/src/game/game.gateway.ts`](file:///f:/luu%20vao%20day%20di/D%E1%BB%B1%20%C3%A1n%20c%C3%A1%20nh%C3%A2n/Werewolf/apps/server/src/game/game.gateway.ts)

- **Xác thực Handshake:** Lấy và xác thực token JWT, gán định danh `userId` trong `socket.data` để chống giả mạo danh tính từ payload.
- **Phân luồng kênh Socket Rooms:**
  - `user:${userId}`: Kênh bí mật của từng người chơi (gửi `state:snapshot` đã che dữ liệu, `role:assigned`, kết quả soi của Tiên tri `seer:result`).
  - `room:${roomId}`: Toàn bộ phòng chơi (thông báo chuyển pha, kết quả bình minh, người bị treo cổ, chat chung).
  - `room:${roomId}:wolves`: Kênh riêng của bầy Sói (cập nhật phiếu cắn ban đêm, chat bầy sói).
  - `room:${roomId}:lovers`: Kênh riêng bí mật của Cặp đôi Cupid.
  - `room:${roomId}:dead`: Kênh trò chuyện riêng của các linh hồn đã chết.
- **Kiểm soát sự kiện Client $\rightarrow$ Server (C2S):**
  - Đầy đủ handlers cho: `room:create`, `room:join`, `room:leave`, `game:start`, `night:bodyguardProtect`, `night:wolfVote`, `night:witchAct`, `night:seerInspect`, `day:vote`, `day:judge`, `chat:send`, `time:ping`, `sync:request`.
  - Kiểm soát quyền gửi tin nhắn chat theo từng kênh: Dân sống không được chat kênh Sói, người chết không được chat vào kênh Làng, người sống không được can thiệp vào kênh Người Chết.

---

## 2. Database PostgreSQL & Prisma Schema
Vị trí: [`apps/server/prisma/schema.prisma`](file:///f:/luu%20vao%20day%20di/D%E1%BB%B1%20%C3%A1n%20c%C3%A1%20nh%C3%A2n/Werewolf/apps/server/prisma/schema.prisma)

- **`User`:** Lưu trữ thông tin tài khoản, mật khẩu băm, ảnh đại diện, điểm xếp hạng ELO, thống kê tổng trận thắng/thua, số trận thắng theo từng phe (`wolfWins`, `villageWins`, `loversWins`).
- **`MatchHistory`:** Lưu trữ toàn bộ lịch sử ván đấu sau khi kết thúc: phe thắng cuộc (`winnerTeam`), số vòng chơi, cấu hình phòng, và log JSON replay chi tiết.
- **`PlayerMatchStat`:** Lưu chỉ số từng người trong trận: vai trò, phe, tình trạng sống/chết, nguyên nhân chết, điểm ELO cộng/trừ sau trận.

---

## 3. Background Timer Worker (`TimerWorker`)
Vị trí: [`apps/server/src/game/timer.worker.ts`](file:///f:/luu%20vao%20day%20di/D%E1%BB%B1%20%C3%A1n%20c%C3%A1%20nh%C3%A2n/Werewolf/apps/server/src/game/timer.worker.ts)

- Sử dụng Redis Sorted Set `ww:timers` để điều phối timer phân tán.
- Chống Race Condition bằng `stateVersion`: Bỏ qua các timer trễ nếu phòng đã chuyển pha trước đó (ví dụ tất cả người chơi hoàn thành lượt sớm).
- Tự động áp dụng Fallback Timeout: Tự động vote `SKIP` nếu người chơi rớt mạng khi hết giờ bỏ phiếu, giữ bình thuốc cho Phù thủy nếu ngủ quên.

---

## 4. Giao diện Frontend Bàn Tròn Ma Sói (Next.js & Zustand)

- **Giao diện Bàn Tròn 360 độ:** [`apps/web/src/components/WerewolfGameApp.tsx`](file:///f:/luu%20vao%20day%20di/D%E1%BB%B1%20%C3%A1n%20c%C3%A1%20nh%C3%A2n/Werewolf/apps/web/src/components/WerewolfGameApp.tsx)
  - Vị trí ghế ngồi của người chơi được bố trí theo vòng tròn chuẩn lượng giác ($x = R \cos \theta, y = R \sin \theta$).
  - Trung tâm bàn hiển thị Pha (Đêm / Ngày), Round và Đồng hồ đếm ngược chuyển màu cảnh báo khi dưới 10 giây.
  - Bảng Action tương tác cho phép chọn mục tiêu chỉ với 1 click chuột trên bàn.
  - Hộp Chat 4 tab thời gian thực với phân quyền hiển thị.
  - Thẻ bài vai trò bí mật có nút lật xem an toàn.
- **Phong cách Thiết kế Dark Mode & Glassmorphism:** [`apps/web/src/styles/theme.css`](file:///f:/luu%20vao%20day%20di/D%E1%BB%B1%20%C3%A1n%20c%C3%A1%20nh%C3%A2n/Werewolf/apps/web/src/styles/theme.css)
- **State Store (Zustand):** [`apps/web/src/stores/game.store.ts`](file:///f:/luu%20vao%20day%20di/D%E1%BB%B1%20%C3%A1n%20c%C3%A1%20nh%C3%A2n/Werewolf/apps/web/src/stores/game.store.ts)

---

## 5. Tổng kết Kiểm thử (24/24 Test Cases Passed)
```bash
▶ GameRoomManager & GameLoopService Integration Boilerplate Tests (25.8ms)
  ✔ Quản lý vòng đời phòng: Tạo phòng, Join 6 người, Bắt đầu Game chia vai ngẫu nhiên
  ✔ Bảo mật: Người không phải host không thể bắt đầu game hoặc kick người khác
▶ GameGateway Realtime Events Tests (17.0ms)
  ✔ Socket Gateway: Tạo phòng, Join phòng, và Ping-Pong đồng bộ thời gian
  ✔ Bảo mật Chat: Kiểm soát phân quyền chat theo kênh (wolves, dead, public)
  ✔ Night Actions: Tiên tri soi bài và nhận kết quả chuẩn xác qua socket
▶ TimerWorker Distributed Scheduler Tests (3.6ms)
  ✔ TimerWorker: Xử lý hết hạn timer phân tán, tự động chuyển pha và bỏ qua timer cũ
▶ NightResolver Unit Tests (5.0ms)
  ✔ 6 kịch bản giải quyết xung đột Sói, Bảo vệ, Phù thủy, Cặp đôi Cupid, Thợ săn
▶ WinChecker Unit Tests (1.4ms)
  ✔ Dân làng thắng, Sói thắng, Cặp đôi khác phe thắng
▶ RoomProjector Data Masking Unit Tests (9.9ms)
  ✔ Chống hack map, Dân làng không thấy vai người khác, Sói thấy đồng đội, Game Over reveal
▶ ClockSync & TimerScheduler Unit Tests (21.2ms)
  ✔ NTP Offset, Remaining countdown, Redis ZSET serializer
▶ DisconnectHandler Unit Tests (7.2ms)
  ✔ Rớt mạng, Reconnect, Grace period lây lan tử vong, Timeout fallbacks
ℹ tests 24 | suites 8 | pass 24 | fail 0 | duration_ms 852.4ms
```
