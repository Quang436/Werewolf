# 🏗️ Giai đoạn 3: Cấu trúc Thư mục Clean Architecture & Mã Khung (Boilerplate)

Tài liệu này trình bày cấu trúc thư mục chuẩn cấp doanh nghiệp (Production-ready), kiến trúc tách lớp Clean Architecture / Feature-based và giải thích mã khung cốt lõi đã hoàn thành.

---

## 1. Cấu trúc Thư mục Chuẩn (Monorepo Workspaces)

```text
werewolf/
├── apps/
│   ├── server/                         # Backend NestJS / Node.js
│   │   ├── src/
│   │   │   ├── config/                 # Redis, Postgres, JWT, CORS configs
│   │   │   ├── common/                 # Guards, Interceptors, Filters, Decorators
│   │   │   ├── modules/
│   │   │   │   ├── auth/               # User Authentication & JWT Session
│   │   │   │   ├── match-history/      # Lưu trữ PostgreSQL lịch sử & thành tích trận đấu
│   │   │   │   └── game/               # Realtime Game Module (Core Domain)
│   │   │   │       ├── game.gateway.ts # Socket.io Gateway (/game namespace)
│   │   │   │       ├── game-room.manager.ts # Quản lý Room CRUD & Redis Cache
│   │   │   │       ├── game-loop.service.ts # State Transition & FSM Coordinator
│   │   │   │       └── timer.worker.ts # Background Worker xử lý ZSET Timer phân tán
│   │   │   └── main.ts
│   │   ├── prisma/
│   │   │   └── schema.prisma           # Database Schema (Users, Matches, PlayerStats)
│   │   └── package.json
│   │
│   └── web/                            # Frontend Next.js 15 (App Router) + Zustand
│       ├── src/
│       │   ├── app/
│       │   │   ├── lobby/              # Phòng chờ & Cấu hình vai
│       │   │   ├── game/[code]/        # Giao diện bàn tròn Ma Sói (Bàn chơi chính)
│       │   │   └── page.tsx            # Trang chủ: Tạo phòng / Nhập mã phòng
│       │   ├── components/             # Reusable UI Components
│       │   │   ├── table/              # Vòng tròn ghế ngồi (Circular Table Seats)
│       │   │   ├── night-action/       # Bảng hành động riêng cho từng vai
│       │   │   ├── voting-modal/       # Phiếu bầu treo cổ & phán quyết
│       │   │   └── chat/               # Chatbox đa kênh (Public / Wolves / Lovers / Dead)
│       │   ├── hooks/                  # useSocket, useTimer, useGameState
│       │   └── stores/                 # Zustand Store (gameStore, authStore)
│       └── package.json
│
├── packages/
│   └── shared/                         # Dùng chung giữa Server và Client (@werewolf/shared)
│       ├── src/
│       │   ├── index.ts                # Zod Schemas, TypeScript Interfaces, Socket Events
│       │   └── engine/                 # Core Game Logic độc lập (Pure TypeScript)
│       │       ├── night-resolver.ts   # Xử lý kết quả Ban Đêm
│       │       ├── win-checker.ts      # Kiểm tra điều kiện thắng (Dân/Sói/Cặp đôi)
│       │       ├── room-projector.ts   # Data Masking chống Hack Map
│       │       ├── timer-sync.ts       # NTP Clock Sync & Redis ZSET Helper
│       │       ├── disconnect-handler.ts # Fallback timeout & Grace period
│       │       └── __tests__/          # 20 automated unit tests (100% pass)
│       └── package.json
│
├── docs/                               # Toàn bộ tài liệu kiến trúc & luật chơi
│   ├── RULEBOOK.md                     # Luật chơi chuẩn (Lens Xoắn + PDF Ultimate)
│   ├── PHASE1_DESIGN.md                # Thiết kế FSM, Schema & Data Masking
│   ├── PHASE2_CORE_ENGINE.md           # Xử lý nghiệp vụ & Bất đồng bộ
│   └── PHASE3_ARCHITECTURE_AND_BOILERPLATE.md # Tài liệu giai đoạn 3
│
├── package.json                        # Root Monorepo configuration (pnpm / npm workspaces)
└── tsconfig.json                       # Path alias mapping (@werewolf/shared)
```

---

## 2. Mã Khung Cốt Lõi (Core Boilerplate)

### 2.1 `GameRoomManager`
Vị trí: [`apps/server/src/game/game-room.manager.ts`](file:///f:/luu%20vao%20day%20di/D%E1%BB%B1%20%C3%A1n%20c%C3%A1%20nh%C3%A2n/Werewolf/apps/server/src/game/game-room.manager.ts)

- **Trách nhiệm:** Quản lý vòng đời phòng chơi.
- **Tính năng đã hoàn thiện:**
  1. `createRoom(hostUser, initialSettings)`: Sinh mã phòng 6 ký tự ngẫu nhiên (chữ in hoa + số, loại bỏ ký tự dễ nhầm lẫn như 0, O, 1, I), lưu vào Redis với TTL 2 giờ.
  2. `joinRoom(codeOrId, user)`: 
     - Kiểm tra phòng tồn tại.
     - Tự động nhận diện **Reconnect** nếu người chơi đã có trong phòng -> Khôi phục `connection = 'ONLINE'`.
     - Với người chơi mới: Kiểm tra phòng còn ở `LOBBY` và chưa vượt quá `maxPlayers`, tự động cấp ghế (Seat) trống đầu tiên.
  3. `leaveRoom(roomId, userId)`: 
     - Nếu ở `LOBBY`: Xóa khỏi danh sách, tự động chuyển quyền Host cho người kế tiếp nếu Host rời; xóa phòng nếu không còn ai.
     - Nếu trong trận: Đánh dấu `connection = 'LEFT'`, không xóa dữ liệu để bảo toàn lịch sử trận.
  4. `kickPlayer(roomId, hostUserId, targetUserId)`: Đảm bảo chỉ Chủ phòng mới có quyền kick và chỉ được kick khi ở `LOBBY`.
  5. **Cơ chế lưu trữ Redis:** Tích hợp `RedisStoreAdapter` hỗ trợ Optimistic Locking qua `stateVersion` và Distributed Locking (`acquireLock`/`releaseLock`).

### 2.2 `GameLoopService`
Vị trí: [`apps/server/src/game/game-loop.service.ts`](file:///f:/luu%20vao%20day%20di/D%E1%BB%B1%20%C3%A1n%20c%C3%A1%20nh%C3%A2n/Werewolf/apps/server/src/game/game-loop.service.ts)

- **Trách nhiệm:** Bộ điều phối chuyển pha (State Transition Coordinator).
- **Tính năng đã hoàn thiện:**
  1. `startGame(roomId, hostUserId)`:
     - Khóa Redlock phòng để chống race condition.
     - Kiểm tra số lượng người chơi (6-12) và khớp với tổng số lượng vai cấu hình.
     - Xáo trộn vai (Role Shuffle) và xáo trộn số ghế ngồi bằng `crypto.randomInt` (Fisher-Yates) an toàn tuyệt đối.
     - Gửi event `role:assigned` riêng cho từng socket của người chơi.
     - Bắt đầu pha `ASSIGN_ROLES` với đồng hồ đếm ngược.
  2. `transition(roomId, targetPhase)`:
     - Kiểm tra và tăng nguyên tử `stateVersion`.
     - Phân bổ timestamp tuyệt đối `phaseEndsAt = Date.now() + duration * 1000`.
     - Gọi tự động các Domain Engine tại pha tương ứng:
       - Tại `NIGHT_RESOLVE`: Chạy `NightResolver.resolve()`, cập nhật trạng thái sống/chết, ghi log lịch sử, chuẩn bị trigger Thợ săn.
       - Tại `CHECK_WIN`: Chạy `WinChecker.check()`, nếu có phe thắng -> chuyển thẳng sang `GAME_OVER`; nếu chưa -> chuyển tiếp sang `DAY_DISCUSSION` (nếu sáng) hoặc `NIGHT_START` (nếu vừa xong treo cổ).
  3. `broadcastRoomSnapshot(room)`:
     - Đi qua `RoomProjector.projectFor(player.id, room)` may đo riêng cho từng người xem rồi mới broadcast gói tin `state:snapshot`.
     - Đảm bảo 100% không rò rỉ vai của người khác qua Network Tab.

---

## 3. Kết Quả Kiểm Thử Toàn Diện (End-to-End Suite)

Đã chạy toàn bộ **20/20 test cases** tích hợp và đơn vị với `npx tsx --test`:
```bash
▶ GameRoomManager & GameLoopService Integration Boilerplate Tests
  ✔ Quản lý vòng đời phòng: Tạo phòng, Join 6 người, Bắt đầu Game chia vai ngẫu nhiên (19.2ms)
  ✔ Bảo mật: Người không phải host không thể bắt đầu game hoặc kick người khác (9.8ms)
✔ GameRoomManager & GameLoopService Integration Boilerplate Tests (31.4ms)
▶ NightResolver Unit Tests (6 scenarios: Sói cắn, Bảo vệ, Phù thủy, Cặp đôi Cupid, Thợ săn) (13.9ms)
▶ WinChecker Unit Tests (Dân làng thắng, Sói thắng, Cặp đôi khác phe thắng) (1.6ms)
▶ RoomProjector Data Masking Unit Tests (Anti-hack, Sói thấy đồng đội, Game Over reveal) (13.9ms)
▶ ClockSync & TimerScheduler Unit Tests (NTP Offset, Redis ZSET serializer) (3.4ms)
▶ DisconnectHandler Unit Tests (Grace period, Reconnect, Timeout fallbacks) (3.5ms)
ℹ tests 20 | suites 6 | pass 20 | fail 0 | duration_ms 952.8ms
```
