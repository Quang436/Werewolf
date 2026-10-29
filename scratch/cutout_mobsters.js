const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const SRC = 'C:/Users/Administrator/.gemini/antigravity-ide/brain/603c5b93-52cc-4ee0-a146-6a49c25eab95';
const OUT = path.join(process.cwd(), 'apps/web/public/assets/characters_ue5');
fs.mkdirSync(OUT, { recursive: true });

const jobs = [
  { file: 'mobster_rhino_idle_1793282257353.jpg', out: 'rhino_idle', fadeBottom: true, hard: 6, soft: 14 },
  { file: 'mobster_rhino_action_1793282110807.jpg', out: 'rhino_action', fadeBottom: true, hard: 6, soft: 14 },
  { file: 'mobster_wolf_idle_1793282300999.jpg', out: 'wolf_idle', fadeBottom: true, hard: 6, soft: 14 },
  { file: 'mobster_wolf_aiming_1793282053560.jpg', out: 'wolf_aiming', fadeBottom: true, hard: 6, soft: 14 },
  { file: 'player_fps_cards_1793282351297.jpg', out: 'player_fps_cards', fadeBottom: false, hard: 6, soft: 14 },
  { file: 'player_fps_revolver_aiming_1793282390888.jpg', out: 'player_fps_revolver', fadeBottom: false, hard: 6, soft: 14 },
];

async function run() {
  for (const job of jobs) {
    const srcPath = path.join(SRC, job.file);
    if (!fs.existsSync(srcPath)) {
      console.error('File not found:', srcPath);
      continue;
    }
    const { data, info } = await sharp(srcPath)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width: W, height: H } = info;
    const lum = (i) => Math.max(data[i], data[i + 1], data[i + 2]);

    // Flood fill từ 4 mép viền ngoài để chỉ loại bỏ nền đen bao quanh
    const bg = new Uint8Array(W * H);
    const stack = [];
    const push = (x, y) => {
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      const k = y * W + x;
      if (bg[k]) return;
      if (lum(k * 4) > job.hard) return;
      bg[k] = 1;
      stack.push(k);
    };

    // Khởi tạo từ top, 2 bên sườn và chỉ góc dưới (không seed vào đáy thân người)
    for (let x = 0; x < W; x++) { push(x, 0); }
    for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }
    for (let x = 0; x < W * 0.12; x++) { push(x, H - 1); }
    for (let x = Math.floor(W * 0.88); x < W; x++) { push(x, H - 1); }

    while (stack.length) {
      const k = stack.pop();
      const x = k % W, y = (k / W) | 0;
      push(x + 1, y);
      push(x - 1, y);
      push(x, y + 1);
      push(x, y - 1);
    }

    // Gán alpha trong suốt
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const k = y * W + x, i = k * 4;
        if (bg[k]) {
          data[i + 3] = 0;
          continue;
        }

        // Khử viền răng cưa (Antialiasing feathering)
        const nearBg =
          (x > 1 && bg[k - 2]) || (x < W - 2 && bg[k + 2]) ||
          (y > 1 && bg[k - 2 * W]) || (y < H - 2 && bg[k + 2 * W]);

        if (nearBg) {
          const l = lum(i);
          data[i + 3] = Math.round(255 * Math.min(1, Math.max(0, (l - job.hard) / (job.soft - job.hard))));
        }

        // Nếu là nhân vật ngồi sau bàn thì fade nhẹ mép dưới để chìm tự nhiên sau thành bàn
        if (job.fadeBottom) {
          const fadeStart = H * 0.88;
          if (y > fadeStart) {
            data[i + 3] = Math.round(data[i + 3] * (1 - (y - fadeStart) / (H - fadeStart)));
          }
        }
      }
    }

    const outPath = path.join(OUT, `${job.out}.png`);
    await sharp(data, { raw: { width: W, height: H, channels: 4 } })
      .resize({ width: job.out.startsWith('player') ? 850 : 640 })
      .png({ compressionLevel: 8 })
      .toFile(outPath);

    console.log('✓ Successfully created:', outPath);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
