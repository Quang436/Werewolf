# Hướng Dẫn Cài Đặt & Phát Triển Unity Client (Liar's Bar 3D)

Thư mục này (`apps/client-unity`) là mã nguồn Client 3D của dự án, được thiết kế theo phong cách game **Liar's Bar** (góc nhìn thứ nhất FPS, nhân vật 3D cử động thật, cò súng Nga Roulette, bàn cược poker), kết nối thời gian thực với backend Node.js (`apps/server`).

---

## 1. Cài đặt Unity Hub & Unity Editor

1. Tải **Unity Hub**: [https://unity.com/download](https://unity.com/download)
2. Mở Unity Hub -> Chọn tab **Installs** -> Bấm **Install Editor**:
   - Chọn bản **Unity 2022.3 LTS** hoặc **Unity 6 (6000.0 LTS)**.
   - **LƯU Ý QUAN TRỌNG:** Trong bước chọn Modules đi kèm, hãy tích chọn:
     - ✅ **WebGL Build Support** (Để sau này xuất game chạy thẳng trên trình duyệt Web).
     - ✅ **Windows Build Support (Mono)** (Để xuất file `.exe` chơi trên máy tính).
3. Đăng nhập tài khoản Unity cá nhân (hoàn toàn miễn phí).

---

## 2. Mở dự án trong Unity

1. Mở Unity Hub -> Bấm **Add** -> Chọn thư mục:
   `F:\luu vao day di\Dự án cá nhân\Werewolf\apps\client-unity`
2. Chọn phiên bản Unity bạn vừa cài đặt để mở dự án.

---

## 3. Cài đặt thư viện kết nối Socket.IO

Client C# kết nối với Node.js server qua WebSocket bằng thư viện `SocketIOClient`:
1. Trong Unity Editor, vào menu **Window** -> **Package Manager**.
2. Bấm nút `+` góc trên bên trái -> Chọn **Add package from git URL...**
3. Dán đường dẫn sau và bấm **Add**:
   ```text
   https://github.com/doghappy/socket.io-client-csharp.git
   ```
*(Hoặc dùng OpenUPM / NuGet for Unity nếu có).*

---

## 4. Tải Asset 3D & Animation Miễn Phí (Không Cần Tự Nặn 3D)

### A. Tải nhân vật & Animation từ Adobe Mixamo (Miễn phí 100%)
1. Truy cập [https://www.mixamo.com/](https://www.mixamo.com/) (đăng nhập bằng tài khoản Google/Adobe).
2. Chọn mục **Characters**: Tìm các nhân vật kiểu Mafia, Thú nhân, hoặc Vest công sở (ví dụ: *Vampire, Mutant, Warrok, Joe*).
3. Chọn mục **Animations**:
   - Tìm kiếm từ khóa:
     - `Sitting Idle`: Nhân vật ngồi trên ghế, thở và gõ tay lên bàn.
     - `Argue / Talking`: Nhân vật vung tay, đập bàn khi bị tố cáo.
     - `Pistol Aim / Aiming`: Nhân vật giơ súng ngắm thẳng về phía trước.
     - `Death / Fall`: Nhân vật bị bắn ngã gục xuống bàn hoặc ngửa ra sau ghế.
4. Bấm nút **Download** (định dạng `FBX for Unity`, 30 hoặc 60 FPS) -> Kéo thả file tải về vào thư mục `Assets/Models/` trong Unity.

### B. Tải Bàn Poker & Súng Lục Revolver (Unity Asset Store)
1. Trong Unity Editor, vào menu **Window** -> **Asset Store** (hoặc mở trình duyệt [assetstore.unity.com](https://assetstore.unity.com/)).
2. Tìm kiếm với bộ lọc **Free Assets**:
   - `Free Revolver`: Tải model súng lục ổ xoay có tách rời nòng và búa đập.
   - `Saloon Props / Poker Table`: Tải bàn cược tròn, ghế gỗ, đèn chùm treo trần và bộ bài tây.

---

## 5. Cấu trúc C# Scripts đã viết sẵn

Mọi script đã được cấu trúc sẵn sàng tại `Assets/Scripts/`:

| Tên File | Chức năng |
| :--- | :--- |
| `Network/SocketNetworkManager.cs` | Kết nối tự động tới `http://localhost:3001`, bắt sự kiện `room:snapshot`, `game:phase_change`, `game:gun_action`. |
| `Player/CameraControllerFPS.cs` | Camera góc nhìn thứ nhất (FPS) đặt tại bàn cược, xoay chuột tự nhiên, hiệu ứng thở và zoom ngắm. |
| `Player/RevolverFPS.cs` | Cầm súng lục FPS trên tay, bấm `[R]` nâng súng lên ngắm (ADS), chuột trái bóp cò, giật súng (recoil), tia lửa nòng súng. |
| `Table/MobsterCharacter.cs` | Điều khiển Animator nhân vật 3D trên ghế: đổi tư thế khi bị tố cáo, giơ súng ngắm, kích hoạt Ragdoll vật lý khi bị bắn hạ. |
| `Table/TableManager.cs` | Định vị 8 vị trí ghế ngồi quanh bàn cược, spawn người chơi và đặt bài lên mặt bàn nỉ xanh. |

---

## 6. Xuất bản trò chơi (Build Game)

- **Xuất WebGL để nhúng vào web (`apps/web`)**:
  - Vào **File** -> **Build Settings** -> Chuyển Platform sang **WebGL** -> Bấm **Build**.
  - Chọn thư mục xuất ra là `apps/web/public/unity-build/`.
  - Trên giao diện web chỉ cần nhúng 1 thẻ iframe hoặc canvas để chơi trực tiếp mà không cần cài đặt gì.
- **Xuất file chạy Desktop (.exe)**:
  - Chọn Platform **Windows, Mac, Linux** -> Bấm **Build** để tạo file `.exe` cho trải nghiệm đồ họa tối đa.
