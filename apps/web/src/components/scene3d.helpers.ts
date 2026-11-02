import * as THREE from 'three';
import { PublicPlayerView, Role } from '@werewolf/shared';
import { getRoleDetailExtra, getRoleInfo } from '../constants/roles-data';

// ============================================================================
// 1. CAMERA, TABLE & SEAT CONSTANTS
// ============================================================================

export type CameraPerspective = '1ST' | '2ND';

export const SEAT_CIRCLE_RADIUS = 2.45; // 2.4m - 2.5m circular seating radius
export const TABLE_SURFACE_Y = 0.765; // Top surface height of matte poker felt (aligns with [0, 0.77, 1.6] tray)
export const TABLE_FELT_RADIUS = 1.9;
export const TABLE_ARMREST_RADIUS = 2.06;

export interface CameraRigPreset {
  position: [number, number, number];
  lookAt: [number, number, number];
  parallaxPos: { x: number; y: number };
  parallaxLook: { x: number; y: number };
  fov: number;
}

export const CAMERA_PRESETS: Record<CameraPerspective, CameraRigPreset> = {
  // Góc nhìn 1 (1ST - FPS POV): Ngang tầm mắt người ngồi ghế [0, 1.35, 2.3], chúc nhẹ xuống giữa bàn [0, 0.85, 0]
  '1ST': {
    position: [0, 1.35, 2.3],
    lookAt: [0, 0.84, 0],
    parallaxPos: { x: 0.14, y: 0.05 },
    parallaxLook: { x: 0.58, y: 0.22 },
    fov: 66,
  },
  // Góc nhìn 2 (2ND - Tactical Observer / Over-the-shoulder): [0, 2.3, 3.7], nhìn bao quát [0, 0.6, 0]
  '2ND': {
    position: [0, 2.3, 3.7],
    lookAt: [0, 0.6, 0],
    parallaxPos: { x: 0.2, y: 0.09 },
    parallaxLook: { x: 0.28, y: 0.15 },
    fov: 58,
  },
};

export interface ComputedSeat {
  player: PublicPlayerView;
  isLocal: boolean;
  angle: number;
  /** World seat center on floor [x, 0, z] at radius ~2.45m */
  position: [number, number, number];
  /** Y-axis rotation so chair and character face inward toward [0, 0, 0] */
  rotationY: number;
  /** Outward radial unit vector [ux, uz] from table center toward seat */
  radialDir: [number, number];
  /** Landing spot on table felt where voting tokens slide for this player */
  voteSpotPosition: [number, number, number];
  /** Resting spot on table felt for opponent's face-down role card */
  cardRestPosition: [number, number, number];
  /** World coordinates of seated character's neck for HangingNooseEffect */
  neckWorldPosition: [number, number, number];
  /** Total votes currently stacked on this player */
  voteCount: number;
  /** Deterministic noir silhouette archetype (0..5) */
  archetypeIndex: number;
}

// ============================================================================
// 2. CIRCULAR SEAT COORDINATE & CAMERA INTERPOLATION MATH
// ============================================================================

/**
 * Tính toán tọa độ ghế ngồi theo vòng tròn bán kính 2.45m xoay quanh tâm bàn [0, 0, 0].
 * Người chơi local luôn được xoay về ghế chính diện [0, 0, +2.45] để đồng bộ với góc nhìn 1ST POV.
 */
export function computeTableSeats(
  players: PublicPlayerView[],
  localPlayerId: string | null | undefined,
  voteTally: Record<string, number> = {},
  radius: number = SEAT_CIRCLE_RADIUS
): ComputedSeat[] {
  if (!players || players.length === 0) return [];

  const sorted = [...players].sort((a, b) => a.seat - b.seat);
  let localIdx = localPlayerId ? sorted.findIndex((p) => p.id === localPlayerId) : -1;
  if (localIdx < 0) {
    localIdx = sorted.length - 1;
  }

  const count = sorted.length;

  return sorted.map((player, idx) => {
    // Offset index so local player sits at relative step 0 -> angle = 0 -> (x = 0, z = +radius)
    const relativeStep = (idx - localIdx + count) % count;
    const angle = (relativeStep / count) * Math.PI * 2;

    // Clockwise around the table when viewed from above:
    // step 0 -> (0, +R), step N/4 -> (-R, 0) left, step N/2 -> (0, -R) across, step 3N/4 -> (+R, 0) right
    const ux = -Math.sin(angle);
    const uz = Math.cos(angle);

    const x = ux * radius;
    const z = uz * radius;

    // Local +Z of TableSeat points forward toward table center (-ux, -uz)
    const rotationY = Math.atan2(-x, -z);

    // Token landing spot on the matte felt in front of each player
    const voteRadius = 1.24;
    const cardRadius = 1.5;
    const neckRadius = radius - 0.08;

    return {
      player,
      isLocal: idx === localIdx,
      angle,
      position: [x, 0, z],
      rotationY,
      radialDir: [ux, uz],
      voteSpotPosition: [ux * voteRadius, TABLE_SURFACE_Y + 0.008, uz * voteRadius],
      cardRestPosition: [ux * cardRadius, TABLE_SURFACE_Y + 0.005, uz * cardRadius],
      neckWorldPosition: [ux * neckRadius, 1.22, uz * neckRadius],
      voteCount: voteTally[player.id] || 0,
      archetypeIndex: Math.abs(player.seat - 1) % 6,
    };
  });
}

const _desiredCamPos = new THREE.Vector3();
const _desiredLookAt = new THREE.Vector3();

/**
 * Nội suy mượt mà vị trí Camera, hướng nhìn (LookAt), FOV và hiệu ứng Mouse Parallax (Head-look)
 * trong phạm vi an toàn bằng Vector3.lerp & THREE.MathUtils.lerp.
 */
export function interpolateCameraRig(
  camera: THREE.PerspectiveCamera,
  currentLookAt: THREE.Vector3,
  smoothedPointer: THREE.Vector2,
  rawPointer: { x: number; y: number },
  perspective: CameraPerspective,
  delta: number,
  executionFocusTarget?: [number, number, number] | null,
  isSleeping: boolean = false
): void {
  const dt = Math.min(Math.max(delta, 0.001), 0.1);
  const preset = CAMERA_PRESETS[perspective];

  // Clamp normalized mouse coordinates [-1, 1] for safe head-look bounds
  const clampedX = THREE.MathUtils.clamp(rawPointer.x, -1, 1);
  const clampedY = THREE.MathUtils.clamp(rawPointer.y, -1, 1);

  const pointerAlpha = 1 - Math.exp(-7.5 * dt);
  smoothedPointer.x = THREE.MathUtils.lerp(smoothedPointer.x, clampedX, pointerAlpha);
  smoothedPointer.y = THREE.MathUtils.lerp(smoothedPointer.y, clampedY, pointerAlpha);

  _desiredCamPos.set(
    preset.position[0] + smoothedPointer.x * preset.parallaxPos.x,
    preset.position[1] + smoothedPointer.y * preset.parallaxPos.y,
    preset.position[2]
  );

  _desiredLookAt.set(
    preset.lookAt[0] + smoothedPointer.x * preset.parallaxLook.x,
    preset.lookAt[1] + smoothedPointer.y * preset.parallaxLook.y,
    preset.lookAt[2]
  );

  // Sleeping posture (PHA 1 & dormant night turns): head-down tilt toward table & tray
  if (isSleeping && perspective === '1ST') {
    _desiredCamPos.y = 1.18;
    _desiredCamPos.z = 2.22;
    _desiredLookAt.set(
      smoothedPointer.x * 0.12,
      0.46 + smoothedPointer.y * 0.06,
      1.46
    );
  }

  // Subtle cinematic glance toward condemned seat during Hanging Execution
  if (executionFocusTarget) {
    _desiredLookAt.x = THREE.MathUtils.lerp(_desiredLookAt.x, executionFocusTarget[0] * 0.42, 0.45);
    _desiredLookAt.y = THREE.MathUtils.lerp(_desiredLookAt.y, 1.02, 0.35);
    _desiredLookAt.z = THREE.MathUtils.lerp(_desiredLookAt.z, executionFocusTarget[2] * 0.42, 0.45);
  }

  const camAlpha = 1 - Math.exp(-5.2 * dt);
  camera.position.lerp(_desiredCamPos, camAlpha);
  currentLookAt.lerp(_desiredLookAt, camAlpha);

  if (Math.abs(camera.fov - preset.fov) > 0.02) {
    camera.fov = THREE.MathUtils.lerp(camera.fov, preset.fov, camAlpha);
    camera.updateProjectionMatrix();
  }

  camera.lookAt(currentLookAt);
}

// ============================================================================
// 3. VOTE TALLY RESOLUTION & PHASE HELPERS
// ============================================================================

export interface VoteResolutionResult {
  outcome: 'TIE_OR_PEACE' | 'EXECUTION';
  condemnedId: string | null;
  maxVotes: number;
  message: string;
}

/**
 * Xử lý kết quả bỏ phiếu chuẩn luật Ma Sói truyền thống:
 * - Nếu không có phiếu hoặc hòa phiếu cao nhất -> Bỏ qua xử tử, thông báo "Hòa phiếu - Ngày bình yên".
 * - Nếu có 1 người đạt số phiếu cao nhất duy nhất -> Kích hoạt EXECUTION_PHASE (Treo Cổ).
 */
export function resolveVoteTally(
  tally: Record<string, number>,
  players: PublicPlayerView[]
): VoteResolutionResult {
  const aliveIds = new Set(players.filter((p) => p.isAlive).map((p) => p.id));
  let maxVotes = 0;
  const leaders: string[] = [];

  for (const [targetId, count] of Object.entries(tally)) {
    if (targetId === 'SKIP' || !aliveIds.has(targetId) || count <= 0) continue;
    if (count > maxVotes) {
      maxVotes = count;
      leaders.length = 0;
      leaders.push(targetId);
    } else if (count === maxVotes) {
      leaders.push(targetId);
    }
  }

  if (maxVotes === 0 || leaders.length !== 1) {
    return {
      outcome: 'TIE_OR_PEACE',
      condemnedId: null,
      maxVotes,
      message: 'Hòa phiếu - Ngày bình yên',
    };
  }

  const target = players.find((p) => p.id === leaders[0]);
  return {
    outcome: 'EXECUTION',
    condemnedId: leaders[0],
    maxVotes,
    message: target
      ? `Phán quyết Hội Đồng: Treo cổ #${String(target.seat).padStart(2, '0')} ${target.nickname} (${maxVotes} Phiếu)`
      : `Phán quyết Hội Đồng: Xử tử (${maxVotes} Phiếu)`,
  };
}

export function isNightPhase(phase?: string | null): boolean {
  if (!phase) return false;
  return phase.startsWith('NIGHT');
}

// ============================================================================
// 4. DARK NOIR PUB WEB AUDIO ENGINE
// ============================================================================

export class WerewolfAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted = false;

  private init(): void {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playGavel(): void {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(165, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.19);
    gain.gain.setValueAtTime(0.65, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.23);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.23);
  }

  public playTokenSlide(): void {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(290, now);
    osc.frequency.exponentialRampToValueAtTime(125, now + 0.16);
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playVoteStamp(): void {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(52, now + 0.09);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  public playCardDeal(): void {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(540, now);
    osc.frequency.exponentialRampToValueAtTime(190, now + 0.12);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playWolfHowl(): void {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(210, now);
    osc.frequency.exponentialRampToValueAtTime(460, now + 0.42);
    osc.frequency.exponentialRampToValueAtTime(175, now + 1.25);
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 1.3);
  }

  public playBell(): void {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 1.45);
    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.45);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 1.45);
  }

  public playWhisper(): void {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(128, now);
    osc.frequency.linearRampToValueAtTime(92, now + 0.7);
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.75);
  }

  public playRopeExecution(): void {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Deep gallows bell + taut hemp creak
    const bell = this.ctx.createOscillator();
    const bellGain = this.ctx.createGain();
    bell.type = 'sine';
    bell.frequency.setValueAtTime(196, now);
    bell.frequency.exponentialRampToValueAtTime(98, now + 1.8);
    bellGain.gain.setValueAtTime(0.45, now);
    bellGain.gain.exponentialRampToValueAtTime(0.001, now + 1.85);
    bell.connect(bellGain);
    bellGain.connect(this.ctx.destination);
    bell.start(now);
    bell.stop(now + 1.85);

    const creak = this.ctx.createOscillator();
    const creakGain = this.ctx.createGain();
    creak.type = 'sawtooth';
    creak.frequency.setValueAtTime(92, now + 0.25);
    creak.frequency.linearRampToValueAtTime(64, now + 0.95);
    creakGain.gain.setValueAtTime(0.001, now + 0.25);
    creakGain.gain.linearRampToValueAtTime(0.08, now + 0.5);
    creakGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    creak.connect(creakGain);
    creakGain.connect(this.ctx.destination);
    creak.start(now + 0.25);
    creak.stop(now + 1.02);
  }
}

export const werewolfAudio = new WerewolfAudioEngine();

// ============================================================================
// 5. PROCEDURAL HIGH-DPI CANVAS TEXTURES (CACHED FOR ZERO LEAKS)
// ============================================================================

const textureCache = new Map<string, THREE.CanvasTexture>();

function rememberTexture(key: string, tex: THREE.CanvasTexture): THREE.CanvasTexture {
  if (textureCache.size > 160) {
    const oldestKey = textureCache.keys().next().value;
    if (oldestKey && !oldestKey.startsWith('static:')) {
      textureCache.get(oldestKey)?.dispose();
      textureCache.delete(oldestKey);
    }
  }
  textureCache.set(key, tex);
  return tex;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length >= maxLines - 1) break;
    }
  }

  if (current && lines.length < maxLines) {
    // Append remaining words if truncated on final line
    const consumedWords = lines.join(' ').split(/\s+/).filter(Boolean).length;
    const remainder = words.slice(consumedWords).join(' ');
    let lastLine = remainder;
    while (ctx.measureText(lastLine).width > maxWidth && lastLine.length > 4) {
      lastLine = `${lastLine.slice(0, -4).trim()}…`;
    }
    lines.push(lastLine);
  }

  return lines.slice(0, maxLines);
}

/**
 * Mặt vải nỉ bàn Poker nhám sẫm màu (xanh rêu đậm / đỏ rượu vang, không bóng nhựa).
 */
export function getMatteFeltTexture(variant: 'moss' | 'wine' = 'moss'): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const key = `static:felt:${variant}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  const cy = size / 2;
  const grad = ctx.createRadialGradient(cx, cy, 40, cx, cy, size * 0.52);
  if (variant === 'moss') {
    grad.addColorStop(0, '#193526');
    grad.addColorStop(0.58, '#11251b');
    grad.addColorStop(0.88, '#0b1811');
    grad.addColorStop(1, '#060d09');
  } else {
    grad.addColorStop(0, '#3a141c');
    grad.addColorStop(0.6, '#270d12');
    grad.addColorStop(1, '#120508');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Fine woven wool baize fibers
  for (let i = 0; i < 24000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const alpha = 0.02 + Math.random() * 0.04;
    ctx.fillStyle = i % 2 === 0 ? `rgba(255,245,220,${alpha})` : `rgba(0,0,0,${alpha * 1.5})`;
    ctx.fillRect(x, y, 2, 1.5);
  }

  // Subtle vintage brass betting ring & gothic werewolf compass watermark on felt
  ctx.save();
  ctx.strokeStyle = 'rgba(212, 175, 95, 0.16)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.35, 0, Math.PI * 2);
  ctx.stroke();

  ctx.setLineDash([10, 10]);
  ctx.strokeStyle = 'rgba(212, 175, 95, 0.11)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.335, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = 'rgba(212, 175, 95, 0.09)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.13, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return rememberTexture(key, tex);
}

export function getFeltBumpTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const key = 'static:felt-bump';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 9000; i++) {
    const v = Math.floor(105 + Math.random() * 50);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 1.5, 1.5);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  return rememberTexture(key, tex);
}

/**
 * Sàn nhà gỗ sồi tối màu độ nhám cao của quán bar ngầm.
 */
export function getDarkWoodFloorTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const key = 'static:wood-floor';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#140e0a';
  ctx.fillRect(0, 0, size, size);

  const plankCount = 8;
  const plankH = size / plankCount;
  for (let p = 0; p < plankCount; p++) {
    const y = p * plankH;
    const tone = 16 + ((p * 7) % 10);
    ctx.fillStyle = `rgb(${tone + 7}, ${tone + 2}, ${Math.max(6, tone - 3)})`;
    ctx.fillRect(0, y + 1, size, plankH - 2);

    // Wood grain streaks
    for (let g = 0; g < 45; g++) {
      const gy = y + 3 + Math.random() * (plankH - 6);
      ctx.strokeStyle = g % 3 === 0 ? 'rgba(0,0,0,0.28)' : 'rgba(65,42,26,0.16)';
      ctx.lineWidth = 1 + Math.random();
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.bezierCurveTo(size * 0.33, gy + (Math.random() - 0.5) * 4, size * 0.66, gy + (Math.random() - 0.5) * 4, size, gy);
      ctx.stroke();
    }

    // Vertical plank joint
    const jointX = ((p * 173 + 80) % (size - 80)) + 40;
    ctx.fillStyle = '#070403';
    ctx.fillRect(jointX, y, 2.5, plankH);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 5);
  return rememberTexture(key, tex);
}

/**
 * Chất liệu da sẫm màu cho đệm tỳ tay bàn Poker và ghế bành cổ điển.
 */
export function getDarkLeatherTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const key = 'static:dark-leather';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1c110e';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 4500; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(48,28,22,0.32)' : 'rgba(6,3,2,0.36)';
    ctx.beginPath();
    ctx.arc(x, y, 0.8 + Math.random() * 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 2);
  return rememberTexture(key, tex);
}

/**
 * Quầng sáng vàng kim mềm (Golden Glow) phía sau lá bài khi Float & Flip.
 */
export function getGoldenGlowTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const key = 'static:golden-glow';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  const grad = ctx.createRadialGradient(cx, cx, 10, cx, cx, cx);
  grad.addColorStop(0, 'rgba(255, 226, 138, 0.95)');
  grad.addColorStop(0.32, 'rgba(245, 184, 65, 0.52)');
  grad.addColorStop(0.68, 'rgba(212, 136, 24, 0.14)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return rememberTexture(key, tex);
}

/**
 * Hạt khói mỏng bốc lên từ điếu xì gà trên gạt tàn kính khói.
 */
export function getSmokePuffTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const key = 'static:smoke-puff';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const c = size / 2;
  const grad = ctx.createRadialGradient(c, c, 4, c, c, c);
  grad.addColorStop(0, 'rgba(215, 220, 230, 0.42)');
  grad.addColorStop(0.45, 'rgba(175, 182, 196, 0.18)');
  grad.addColorStop(1, 'rgba(120, 125, 135, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return rememberTexture(key, tex);
}

/**
 * Mặt sau lá bài phong cách Gothic Tarot huyền bí.
 */
export function getGothicTarotBackTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const key = 'static:tarot-back';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const w = 512;
  const h = 800;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#120c14');
  bg.addColorStop(0.5, '#1b0f16');
  bg.addColorStop(1, '#0b080d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Outer & inner golden tarot filigree frames
  ctx.strokeStyle = '#d4af5f';
  ctx.lineWidth = 8;
  drawRoundedRect(ctx, 22, 22, w - 44, h - 44, 24);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(212, 175, 95, 0.55)';
  ctx.lineWidth = 2.5;
  drawRoundedRect(ctx, 38, 38, w - 76, h - 76, 16);
  ctx.stroke();

  // Sacred geometry star & crescent moon centerpiece
  const cx = w / 2;
  const cy = h / 2;
  ctx.strokeStyle = '#e5c16c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, 132, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(229, 193, 108, 0.4)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(cx, cy, 108, 0, Math.PI * 2);
  ctx.stroke();

  // 8-point esoteric tarot star
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 40, cy + Math.sin(a) * 40);
    ctx.lineTo(cx + Math.cos(a) * 126, cy + Math.sin(a) * 126);
    ctx.stroke();
  }

  // Golden crescent moon
  ctx.fillStyle = '#e6c168';
  ctx.beginPath();
  ctx.arc(cx, cy, 52, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#180e15';
  ctx.beginPath();
  ctx.arc(cx + 18, cy - 10, 44, 0, Math.PI * 2);
  ctx.fill();

  // Corner moons
  for (const [px, py] of [
    [68, 72],
    [w - 68, 72],
    [68, h - 72],
    [w - 68, h - 72],
  ]) {
    ctx.fillStyle = 'rgba(212, 175, 95, 0.75)';
    ctx.beginPath();
    ctx.arc(px, py, 9, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return rememberTexture(key, tex);
}

function drawTarotRoleEmblem(
  ctx: CanvasRenderingContext2D,
  roleCode: string,
  category: 'werewolf' | 'villager' | 'third',
  cx: number,
  cy: number
): void {
  ctx.save();
  // Radiant halo behind emblem
  const halo = ctx.createRadialGradient(cx, cy, 12, cx, cy, 125);
  if (category === 'werewolf') {
    halo.addColorStop(0, 'rgba(220, 38, 38, 0.46)');
    halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
  } else if (category === 'third') {
    halo.addColorStop(0, 'rgba(168, 85, 247, 0.42)');
    halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
  } else {
    halo.addColorStop(0, 'rgba(245, 190, 75, 0.36)');
    halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
  }
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, 125, 0, Math.PI * 2);
  ctx.fill();

  // Gothic medallion ring
  ctx.strokeStyle = '#e7c36a';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 94, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(231, 195, 106, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 82, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#ffd97d';
  ctx.fillStyle = '#ffd97d';
  ctx.lineWidth = 4;

  if (category === 'werewolf') {
    // Stylized Gothic Wolf Crest & Blood Moon
    ctx.fillStyle = 'rgba(185, 28, 28, 0.55)';
    ctx.beginPath();
    ctx.arc(cx, cy - 6, 54, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f5cb6e';
    ctx.beginPath();
    ctx.moveTo(cx, cy + 52);
    ctx.lineTo(cx - 42, cy + 8);
    ctx.lineTo(cx - 48, cy - 48);
    ctx.lineTo(cx - 18, cy - 18);
    ctx.lineTo(cx, cy - 28);
    ctx.lineTo(cx + 18, cy - 18);
    ctx.lineTo(cx + 48, cy - 48);
    ctx.lineTo(cx + 42, cy + 8);
    ctx.closePath();
    ctx.fill();

    // Glowing crimson eyes
    ctx.fillStyle = '#ff1744';
    ctx.beginPath();
    ctx.arc(cx - 16, cy + 2, 5.5, 0, Math.PI * 2);
    ctx.arc(cx + 16, cy + 2, 5.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (roleCode === 'SEER' || roleCode === 'AURA_SEER') {
    // All-Seeing Mystic Eye
    ctx.beginPath();
    ctx.moveTo(cx - 64, cy);
    ctx.quadraticCurveTo(cx, cy - 48, cx + 64, cy);
    ctx.quadraticCurveTo(cx, cy + 48, cx - 64, cy);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    ctx.fill();
  } else if (roleCode === 'WITCH') {
    // Alchemist Chalice & Elixir
    ctx.beginPath();
    ctx.arc(cx, cy + 16, 36, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(16, 185, 129, 0.55)';
    ctx.beginPath();
    ctx.arc(cx, cy + 22, 30, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = '#ffd97d';
    ctx.fillRect(cx - 12, cy - 42, 24, 22);
    ctx.fillRect(cx - 18, cy - 48, 36, 7);
  } else if (roleCode === 'BODYGUARD') {
    // Templar Kite Shield
    ctx.beginPath();
    ctx.moveTo(cx, cy - 52);
    ctx.lineTo(cx + 44, cy - 34);
    ctx.lineTo(cx + 36, cy + 18);
    ctx.lineTo(cx, cy + 56);
    ctx.lineTo(cx - 36, cy + 18);
    ctx.lineTo(cx - 44, cy - 34);
    ctx.closePath();
    ctx.stroke();
    ctx.fillRect(cx - 3, cy - 32, 6, 68);
    ctx.fillRect(cx - 24, cy - 8, 48, 6);
  } else if (roleCode === 'HUNTER') {
    // Crosshair & Silver Arrow
    ctx.beginPath();
    ctx.arc(cx, cy, 42, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 46, cy + 46);
    ctx.lineTo(cx + 44, cy - 44);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 48, cy - 48);
    ctx.lineTo(cx + 24, cy - 42);
    ctx.lineTo(cx + 42, cy - 24);
    ctx.closePath();
    ctx.fill();
  } else {
    // Lantern of the Village Council
    ctx.strokeRect(cx - 24, cy - 26, 48, 58);
    ctx.beginPath();
    ctx.moveTo(cx - 32, cy - 26);
    ctx.lineTo(cx, cy - 52);
    ctx.lineTo(cx + 32, cy - 26);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = '#ffcf5c';
    ctx.beginPath();
    ctx.arc(cx, cy + 6, 13, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Mặt trước lá bài phong cách Gothic Tarot:
 * - Tên vai trò (chữ Vàng kim nổi bật)
 * - Phe phái ("Phe Dân Làng" hoặc "Phe Bóng Đêm")
 * - Mô tả tóm tắt kỹ năng vai trò ngắn gọn
 */
export function getGothicTarotFrontTexture(roleCode: Role | string): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const safeCode = roleCode || 'VILLAGER';
  const key = `tarot-front:${safeCode}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const info = getRoleInfo(safeCode);
  const detail = getRoleDetailExtra(safeCode);

  const w = 512;
  const h = 800;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Obsidian parchment background
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  if (info.category === 'werewolf') {
    bg.addColorStop(0, '#1c0b10');
    bg.addColorStop(0.5, '#12090d');
    bg.addColorStop(1, '#0a0608');
  } else if (info.category === 'third') {
    bg.addColorStop(0, '#180d22');
    bg.addColorStop(0.5, '#100a17');
    bg.addColorStop(1, '#08060c');
  } else {
    bg.addColorStop(0, '#0f1620');
    bg.addColorStop(0.5, '#0c1017');
    bg.addColorStop(1, '#080a0e');
  }
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Double Gothic gold border
  ctx.strokeStyle = '#e5be67';
  ctx.lineWidth = 8;
  drawRoundedRect(ctx, 18, 18, w - 36, h - 36, 22);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(229, 190, 103, 0.45)';
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, 32, 32, w - 64, h - 64, 15);
  ctx.stroke();

  // Top Roman Arch Header
  ctx.fillStyle = 'rgba(229, 190, 103, 0.85)';
  ctx.font = '700 18px Georgia, "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.fillText('✦  ARCANA ĐỊNH MỆNH  ✦', w / 2, 72);

  // Tarot Centerpiece Illustration
  drawTarotRoleEmblem(ctx, safeCode, info.category, w / 2, 230);

  // Prominent Metallic Gold Role Name
  ctx.save();
  ctx.shadowColor = 'rgba(255, 196, 64, 0.65)';
  ctx.shadowBlur = 18;
  const goldText = ctx.createLinearGradient(0, 365, 0, 420);
  goldText.addColorStop(0, '#fff1b8');
  goldText.addColorStop(0.5, '#f6c85f');
  goldText.addColorStop(1, '#b98324');
  ctx.fillStyle = goldText;
  ctx.font = '900 42px Georgia, "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.fillText(info.nameVN.toUpperCase(), w / 2, 405);
  ctx.restore();

  // Faction Ribbon ("Phe Dân Làng" hoặc "Phe Bóng Đêm")
  const factionLabel =
    info.category === 'villager'
      ? 'Phe Dân Làng'
      : info.category === 'werewolf'
      ? 'Phe Bóng Đêm'
      : 'Phe Bóng Đêm • Độc Lập';

  const pillW = 290;
  const pillH = 42;
  const pillX = (w - pillW) / 2;
  const pillY = 432;

  ctx.fillStyle =
    info.category === 'villager'
      ? 'rgba(24, 58, 74, 0.85)'
      : info.category === 'werewolf'
      ? 'rgba(110, 18, 28, 0.88)'
      : 'rgba(78, 28, 110, 0.85)';
  drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 21);
  ctx.fill();

  ctx.strokeStyle = info.category === 'villager' ? '#7dd3fc' : '#fca5a5';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = info.category === 'villager' ? '#e0f2fe' : '#ffe4e6';
  ctx.font = '700 22px Georgia, "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.fillText(factionLabel, w / 2, pillY + 28);

  // Ornamental divider
  ctx.strokeStyle = 'rgba(229, 190, 103, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(64, 504);
  ctx.lineTo(w - 64, 504);
  ctx.stroke();

  // Ability Title
  ctx.fillStyle = '#f2c96b';
  ctx.font = '700 21px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(detail.abilityTitle.toUpperCase(), w / 2, 540);

  // Concise Skill Description Box
  ctx.fillStyle = '#e7e2d8';
  ctx.font = '500 22px "Segoe UI", system-ui, sans-serif';
  const summaryText = info.desc || detail.abilityInstruction;
  const lines = wrapCanvasText(ctx, summaryText, w - 116, 5);
  lines.forEach((line, idx) => {
    ctx.fillText(line, w / 2, 584 + idx * 32);
  });

  // Bottom Tarot Footer Hint
  ctx.fillStyle = 'rgba(212, 175, 95, 0.65)';
  ctx.font = '600 15px monospace';
  ctx.fillText('NHẤN LÁ BÀI HOẶC [C] ĐỂ XEM / CẤT', w / 2, h - 46);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return rememberTexture(key, tex);
}

/**
 * Bảng tên & số ghế phong cách Retro Noir sắc nét treo phía trên đầu nhân vật.
 */
export function getRetroNameplateTexture(
  seatNum: number,
  nickname: string,
  isAlive: boolean,
  isHovered: boolean,
  isSelected: boolean,
  isCondemned: boolean
): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const key = `nameplate:${seatNum}:${nickname}:${isAlive ? 1 : 0}:${isHovered ? 1 : 0}:${isSelected ? 1 : 0}:${isCondemned ? 1 : 0}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const w = 512;
  const h = 136;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, w, h);

  // Vintage pub brass & smoked-slate plaque
  ctx.fillStyle = !isAlive
    ? 'rgba(12, 10, 12, 0.78)'
    : isCondemned
    ? 'rgba(72, 8, 14, 0.94)'
    : isHovered || isSelected
    ? 'rgba(42, 24, 12, 0.94)'
    : 'rgba(11, 10, 14, 0.88)';
  drawRoundedRect(ctx, 12, 16, w - 24, h - 32, 18);
  ctx.fill();

  ctx.strokeStyle = !isAlive
    ? 'rgba(110, 105, 100, 0.45)'
    : isCondemned
    ? '#ff1744'
    : isHovered || isSelected
    ? '#fbbf24'
    : 'rgba(212, 175, 95, 0.68)';
  ctx.lineWidth = isHovered || isSelected || isCondemned ? 5 : 3;
  ctx.stroke();

  // Left brass seat badge (#02)
  const seatLabel = `#${String(seatNum).padStart(2, '0')}`;
  ctx.fillStyle = !isAlive
    ? 'rgba(65, 60, 58, 0.7)'
    : isCondemned
    ? '#b91c1c'
    : '#c99838';
  drawRoundedRect(ctx, 26, 30, 96, h - 60, 12);
  ctx.fill();

  ctx.fillStyle = !isAlive ? '#cfc8be' : '#140c04';
  ctx.font = '900 34px "Courier New", Courier, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(seatLabel, 74, h / 2 + 1);

  // Retro Serif Player Nickname
  ctx.fillStyle = !isAlive ? '#7c7772' : isCondemned ? '#fecdd3' : '#f8ecd4';
  ctx.font = '800 36px Georgia, "Times New Roman", serif';
  ctx.textAlign = 'left';
  const trimmedName = nickname.length > 15 ? `${nickname.slice(0, 14)}…` : nickname;
  ctx.fillText(trimmedName, 142, h / 2 + 1);

  if (!isAlive) {
    // Crimson strike-through & skull mark for executed player
    ctx.strokeStyle = 'rgba(220, 38, 38, 0.75)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(138, h / 2);
    ctx.lineTo(w - 38, h / 2);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return rememberTexture(key, tex);
}

/**
 * Mặt khắc gỗ & đồng thau cho Thẻ Bỏ Phiếu (Voting Token) trong khay và trên mặt bàn.
 */
export function getVoteTokenTexture(
  label: string,
  isSkip = false,
  isActive = false
): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const key = `vote-token:${label}:${isSkip ? 1 : 0}:${isActive ? 1 : 0}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const c = size / 2;

  const grad = ctx.createRadialGradient(c - 20, c - 20, 12, c, c, c);
  if (isSkip) {
    grad.addColorStop(0, '#3a3734');
    grad.addColorStop(1, '#1a1817');
  } else if (isActive) {
    grad.addColorStop(0, '#6b221a');
    grad.addColorStop(1, '#2b0d0a');
  } else {
    grad.addColorStop(0, '#4f331d');
    grad.addColorStop(1, '#24150b');
  }

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(c, c, c - 4, 0, Math.PI * 2);
  ctx.fill();

  // Engraved brass ring
  ctx.strokeStyle = isActive ? '#fbbf24' : '#c89d4c';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(c, c, c - 18, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 224, 150, 0.35)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(c, c, c - 34, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = isActive ? '#fde68a' : '#f0d290';
  ctx.font = isSkip ? '900 44px Georgia, serif' : '900 66px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, c, c + 3);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return rememberTexture(key, tex);
}

/**
 * Huy hiệu tổng số phiếu nổi phía trước ghế đối thủ bị vote (ví dụ: "[ 3 Phiếu ]").
 */
export function getFloatingVoteCountTexture(
  voteCount: number,
  isLeading = false
): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const key = `vote-float-bracket:${voteCount}:${isLeading ? 1 : 0}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const w = 384;
  const h = 108;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = isLeading ? 'rgba(98, 14, 22, 0.94)' : 'rgba(18, 14, 11, 0.92)';
  drawRoundedRect(ctx, 10, 12, w - 20, h - 24, 18);
  ctx.fill();

  ctx.strokeStyle = isLeading ? '#ff4d6d' : '#d4af5f';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = isLeading ? '#ffe4e6' : '#fde68a';
  ctx.font = '900 36px Georgia, "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`[ ${voteCount} Phiếu ]`, w / 2, h / 2 + 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return rememberTexture(key, tex);
}

/**
 * Vân gỗ sồi tối màu (Dark Oak) cho Khay đựng bài cá nhân (PersonalCardTray).
 */
export function getDarkOakTrayTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const key = 'static:dark-oak-tray';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#2b1b11');
  grad.addColorStop(0.5, '#21140c');
  grad.addColorStop(1, '#170d08');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 140; i++) {
    const y = (i / 140) * size;
    ctx.strokeStyle = i % 3 === 0 ? 'rgba(10, 5, 2, 0.42)' : 'rgba(72, 46, 28, 0.22)';
    ctx.lineWidth = 1 + (i % 3) * 0.6;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(
      size * 0.3,
      y + Math.sin(i * 0.5) * 6,
      size * 0.7,
      y - Math.cos(i * 0.4) * 6,
      size,
      y + Math.sin(i * 0.3) * 4
    );
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return rememberTexture(key, tex);
}

/**
 * Bảng kim loại đồng khắc chữ nổi ở gờ trước Khay đựng bài cá nhân: "${seatNumber} - ${playerName}".
 */
export function getBrassIdentityPlaqueTexture(
  seatNumber: number | string,
  playerName: string,
  isAlive: boolean
): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const formattedSeat =
    typeof seatNumber === 'number' ? `#${String(seatNumber).padStart(2, '0')}` : String(seatNumber);
  const key = `brass-identity:${formattedSeat}:${playerName}:${isAlive ? 1 : 0}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const w = 512;
  const h = 112;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Brushed antique bronze / brass metallic gradient
  const metal = ctx.createLinearGradient(0, 0, w, h);
  if (isAlive) {
    metal.addColorStop(0, '#785726');
    metal.addColorStop(0.25, '#b88c42');
    metal.addColorStop(0.5, '#dfba6e');
    metal.addColorStop(0.75, '#a67b34');
    metal.addColorStop(1, '#5e4219');
  } else {
    metal.addColorStop(0, '#3a393c');
    metal.addColorStop(0.5, '#59585e');
    metal.addColorStop(1, '#2b2a2e');
  }
  ctx.fillStyle = metal;
  drawRoundedRect(ctx, 6, 6, w - 12, h - 12, 14);
  ctx.fill();

  // Inner engraved dark bezel line
  ctx.strokeStyle = isAlive ? '#3b250a' : '#1d1c1f';
  ctx.lineWidth = 4;
  drawRoundedRect(ctx, 14, 14, w - 28, h - 28, 10);
  ctx.stroke();

  // Subtle horizontal brushed-metal hairlines
  for (let i = 0; i < 40; i++) {
    const y = 12 + Math.random() * (h - 24);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.fillRect(16, y, w - 32, 1);
  }

  // Left & Right decorative brass rivets
  for (const rx of [34, w - 34]) {
    ctx.fillStyle = isAlive ? '#452c0c' : '#1e1e21';
    ctx.beginPath();
    ctx.arc(rx, h / 2, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isAlive ? '#f7d98c' : '#7a7a80';
    ctx.beginPath();
    ctx.arc(rx - 1.5, h / 2 - 1.5, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Embossed / Engraved Identity Text: "${seatNumber} - ${playerName}"
  const cleanName = playerName.length > 16 ? `${playerName.slice(0, 15)}…` : playerName;
  const label = `${formattedSeat} - ${cleanName}`;

  ctx.font = '900 34px Georgia, "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Light embossed highlight below-right
  ctx.fillStyle = isAlive ? 'rgba(255, 240, 195, 0.55)' : 'rgba(200, 200, 210, 0.2)';
  ctx.fillText(label, w / 2 + 1, h / 2 + 2.5);

  // Deep engraved dark bronze fill
  ctx.fillStyle = isAlive ? '#1e1104' : '#161618';
  ctx.fillText(label, w / 2, h / 2 + 1);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return rememberTexture(key, tex);
}

/**
 * Bảng đồng Diegetic UI gắn trên mặt bàn Poker hiển thị Pha hiện tại, Đồng hồ đếm ngược & Kết quả phán quyết.
 */
export function getDiegeticPlaqueTexture(
  phaseTitle: string,
  timerStr: string,
  subtitle: string,
  mode: 'day' | 'night' | 'execution' | 'peace'
): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const key = `plaque:${phaseTitle}:${timerStr}:${subtitle}:${mode}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const w = 640;
  const h = 180;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const bg = ctx.createLinearGradient(0, 0, w, h);
  if (mode === 'execution') {
    bg.addColorStop(0, '#2a080c');
    bg.addColorStop(1, '#140406');
  } else if (mode === 'night') {
    bg.addColorStop(0, '#0d1322');
    bg.addColorStop(1, '#070911');
  } else if (mode === 'peace') {
    bg.addColorStop(0, '#10241b');
    bg.addColorStop(1, '#09140f');
  } else {
    bg.addColorStop(0, '#1e1610');
    bg.addColorStop(1, '#100b08');
  }

  ctx.fillStyle = bg;
  drawRoundedRect(ctx, 10, 10, w - 20, h - 20, 20);
  ctx.fill();

  ctx.strokeStyle =
    mode === 'execution'
      ? '#ff1744'
      : mode === 'night'
      ? '#38bdf8'
      : mode === 'peace'
      ? '#6ee7b7'
      : '#d4af5f';
  ctx.lineWidth = 5;
  ctx.stroke();

  // Phase title + countdown
  ctx.fillStyle = mode === 'execution' ? '#fda4af' : '#f5d487';
  ctx.font = '900 32px Georgia, "Times New Roman", serif';
  ctx.textAlign = 'left';
  ctx.fillText(phaseTitle, 36, 68);

  ctx.fillStyle = mode === 'execution' ? '#ff4d6d' : '#fde68a';
  ctx.font = '900 38px "Courier New", monospace';
  ctx.textAlign = 'right';
  ctx.fillText(timerStr, w - 36, 70);

  // Divider
  ctx.strokeStyle = 'rgba(212, 175, 95, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(36, 94);
  ctx.lineTo(w - 36, 94);
  ctx.stroke();

  // Subtitle / Verdict
  ctx.fillStyle = '#e7e2d8';
  ctx.font = '600 24px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  const trimmedSub = subtitle.length > 44 ? `${subtitle.slice(0, 43)}…` : subtitle;
  ctx.fillText(trimmedSub, w / 2, 136);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return rememberTexture(key, tex);
}
