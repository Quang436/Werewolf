'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ClientRoomView, PublicPlayerView } from '@werewolf/shared';

// ============================================================================
// 1. WEREWOLF WEB AUDIO SYNTHESIZER (TAVERN NOIR SFX)
// ============================================================================
export class WerewolfAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Wooden Gavel Strike for Voting / Verdicts
  public playGavel() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);

    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  // Eerie Wolf Howl in the Night
  public playWolfHowl() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(480, now + 0.4);
    osc.frequency.exponentialRampToValueAtTime(180, now + 1.2);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 1.25);
  }

  // Daybreak Bell Toll
  public playBell() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(330, now + 1.5);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 1.5);
  }

  // Night Mystical Whisper
  public playWhisper() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(580, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.9);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.9);
  }

  // Crisp Vote Token Selection Sound
  public playVoteStamp() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.06);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  // Crisp Card Deal / Card Flip Swoosh Sound
  public playCardDeal() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(750, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.12);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }
}

export const werewolfAudio = new WerewolfAudioEngine();

// ============================================================================
// 1.1 NIGHT PHASES HELPER FOR 3D VISUAL SYNCHRONIZATION
// ============================================================================
export const NIGHT_PHASES_SET = new Set([
  'NIGHT_START',
  'CUPID_TURN',
  'LOVERS_TURN',
  'BODYGUARD_TURN',
  'WEREWOLF_TURN',
  'WITCH_TURN',
  'SEER_TURN',
  'NIGHT_RESOLVE',
]);

export function isNightPhase(phase?: string | null): boolean {
  if (!phase) return false;
  return NIGHT_PHASES_SET.has(phase) || phase.toUpperCase().includes('NIGHT');
}


// ============================================================================
// 2. 3D POSE & CHARACTER PROCEDURAL HELPERS
// ============================================================================

// Natural seated poker table poses for humanoid characters (NO T-POSE!)
function applyPokerSittingPose(model: THREE.Object3D, isGirl = false) {
  const upperL = model.getObjectByName('UpperArmL');
  const lowerL = model.getObjectByName('LowerArmL');
  const upperR = model.getObjectByName('UpperArmR');
  const lowerR = model.getObjectByName('LowerArmR');
  const chest = model.getObjectByName('Chest');
  const head = model.getObjectByName('Head');

  if (upperL && lowerL && upperR && lowerR) {
    if (isGirl) {
      // Demure folded hands pose resting on table
      upperL.rotation.set(0.40, 0.25, 1.25);
      lowerL.rotation.set(0.20, 0.90, -0.75);
      upperR.rotation.set(0.40, -0.25, -1.25);
      lowerR.rotation.set(0.20, -0.90, 0.75);
    } else {
      // Confident gambler pose: arms rested down and forward onto table felt
      upperL.rotation.set(0.35, 0.15, 1.20);
      lowerL.rotation.set(0.15, 0.75, -0.65);
      upperR.rotation.set(0.35, -0.15, -1.20);
      lowerR.rotation.set(0.15, -0.75, 0.65);
    }
  }

  if (chest) chest.rotation.x = 0.08;
  if (head) head.rotation.x = -0.04;
}

// Slump dead character forward onto table felt (in defeat/death)
function applyDeadSlumpPose(model: THREE.Object3D) {
  model.position.y = -0.24;
  model.rotation.x = -0.45;

  const head = model.getObjectByName('Head');
  if (head) {
    head.rotation.x = -0.65;
    head.rotation.z = 0.25;
  }
  const upperL = model.getObjectByName('UpperArmL');
  const upperR = model.getObjectByName('UpperArmR');
  if (upperL) upperL.rotation.set(0.6, 0.1, 1.4);
  if (upperR) upperR.rotation.set(0.6, -0.1, -1.4);
}

// Attach 3D Lupine Werewolf features (Wolf snout, wolf ears, fangs, glowing eyes)
function attachWolfHeadFeatures(model: THREE.Object3D) {
  const headBone = model.getObjectByName('Head');
  if (!headBone) return;

  const wolfGroup = new THREE.Group();
  wolfGroup.name = 'WolfFaceFeatures';

  const furMat = new THREE.MeshStandardMaterial({ color: 0x2b2e36, roughness: 0.85, metalness: 0.05 });

  // 1. Lupine Wolf Snout
  const snoutGeo = new THREE.ConeGeometry(0.10, 0.22, 6);
  snoutGeo.rotateX(Math.PI / 2);
  const snout = new THREE.Mesh(snoutGeo, furMat);
  snout.position.set(0, 0.0, 0.17);
  wolfGroup.add(snout);

  // Black wolf nose
  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(0.035, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x0f0f12, roughness: 0.3 })
  );
  nose.position.set(0, 0.02, 0.28);
  wolfGroup.add(nose);

  // Sharp canine fangs
  const fangMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
  const fangL = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.065, 4), fangMat);
  fangL.rotation.x = Math.PI;
  fangL.position.set(-0.05, -0.045, 0.16);
  wolfGroup.add(fangL);

  const fangR = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.065, 4), fangMat);
  fangR.rotation.x = Math.PI;
  fangR.position.set(0.05, -0.045, 0.16);
  wolfGroup.add(fangR);

  // 2. Pointed Lupine Ears
  const earGeo = new THREE.ConeGeometry(0.065, 0.16, 4);
  const earL = new THREE.Mesh(earGeo, furMat);
  earL.position.set(-0.11, 0.20, -0.02);
  earL.rotation.z = -0.32;
  earL.rotation.x = -0.15;
  wolfGroup.add(earL);

  const earR = new THREE.Mesh(earGeo, furMat);
  earR.position.set(0.11, 0.20, -0.02);
  earR.rotation.z = 0.32;
  earR.rotation.x = -0.15;
  wolfGroup.add(earR);

  // 3. Glowing Predatory Red Eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff1122 });
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), eyeMat);
  eyeL.position.set(-0.055, 0.085, 0.145);
  wolfGroup.add(eyeL);

  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), eyeMat);
  eyeR.position.set(0.055, 0.085, 0.145);
  wolfGroup.add(eyeR);

  // Subtle red eye point light for eerie glow
  const eyeGlow = new THREE.PointLight(0xff1122, 1.4, 1.2, 2.0);
  eyeGlow.position.set(0, 0.085, 0.18);
  wolfGroup.add(eyeGlow);

  headBone.add(wolfGroup);
}

// Procedural Canvas Texture for Glowing Neon Sign on Back Wall
function createNeonSignCanvasTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Deep Noir Wood/Brick Wall Backdrop
  ctx.fillStyle = '#080507';
  ctx.fillRect(0, 0, 1024, 256);

  // Outer Neon Crimson Frame
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 12;
  ctx.shadowColor = '#ff2244';
  ctx.shadowBlur = 28;
  ctx.strokeRect(18, 18, 988, 220);

  // Inner Amber Neon Tube
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 4;
  ctx.shadowColor = '#f59e0b';
  ctx.shadowBlur = 14;
  ctx.strokeRect(30, 30, 964, 196);

  // Main Header Text: 🐺 LIAR'S BAR • MA SÓI
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 60px "Arial Black", "Cinzel", sans-serif';
  ctx.shadowColor = '#ff1133';
  ctx.shadowBlur = 35;
  ctx.fillStyle = '#ffffff';
  ctx.fillText("🐺 LIAR'S BAR • MA SÓI", 512, 106);

  // Subheader: HỘI ĐỒNG PHÁN QUYẾT BÓNG ĐÊM
  ctx.font = '700 26px "Arial", sans-serif';
  ctx.shadowColor = '#f59e0b';
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#fde68a';
  ctx.fillText('HỘI ĐỒNG PHÁN QUYẾT BÓNG ĐÊM', 512, 172);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Procedural Canvas Texture for 3D Werewolf Playing Card Backs
function createCardBackCanvasTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 384;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Deep Obsidian background
  ctx.fillStyle = '#090d14';
  ctx.fillRect(0, 0, 256, 384);

  // Gold borders
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, 236, 364);

  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, 220, 348);

  // Inner filigree pattern
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(26, 26, 204, 332);

  // Central Werewolf Crescent Emblem
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '64px sans-serif';
  ctx.fillStyle = '#f59e0b';
  ctx.fillText('🐺', 128, 165);

  ctx.font = '900 20px "Arial Black", sans-serif';
  ctx.fillStyle = '#fbbf24';
  ctx.fillText('WEREWOLF', 128, 235);

  ctx.font = '700 13px monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('COUNCIL DECK', 128, 260);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Seat configuration type
export interface TableSeat {
  id: string;
  seatNumber: number;
  nickname: string;
  isAlive: boolean;
  isHost: boolean;
  isAccused: boolean;
  votes: number;
  dialogue?: string;
  modelFile: string;
  isWerewolf: boolean;
  isGirl: boolean;
  pos: [number, number, number];
  chairPos: [number, number, number];
  angle: number;
}

export interface LiarsBar3DProps {
  room?: ClientRoomView | any;
  currentPlayerId?: string;
  isPov2?: boolean;
  setIsPov2?: (v: boolean | ((p: boolean) => boolean)) => void;
  selectedTargetId?: string | null;
  isDealing?: boolean;
  hasDealtCards?: boolean;
  onAimAtPlayer?: (targetId: string, nickname: string) => void;
  onSelectTarget?: (targetId: string, nickname: string) => void;
  onShootPlayer?: (targetId: string, nickname: string) => void; // Keep for backward compatibility
  onPlayCard?: (cardName: string) => void; // Keep for backward compatibility
}

// Available 3D Humanoid Model Assets
const MODEL_PRESETS = [
  { file: '/models/punk_mobster.glb', isWolf: true, isGirl: false },   // 0: Ma Sói
  { file: '/models/village_girl.glb', isWolf: false, isGirl: true },    // 1: Cô Gái Dân Làng
  { file: '/models/suit_mobster.glb', isWolf: false, isGirl: false },   // 2: Trưởng Làng
  { file: '/models/cowboy_mobster.glb', isWolf: false, isGirl: false }, // 3: Thợ Săn
  { file: '/models/enforcer.glb', isWolf: false, isGirl: false },       // 4: Bảo Vệ
];

export function LiarsBar3DExperience({
  room,
  currentPlayerId,
  isPov2 = false,
  setIsPov2,
  selectedTargetId,
  isDealing = false,
  hasDealtCards = false,
  onAimAtPlayer,
  onSelectTarget,
  onShootPlayer,
}: LiarsBar3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredSeatId, setHoveredSeatId] = useState<string | null>(null);

  // Screen-projected 2D coordinates for 3D nametags and vote counters
  const [screenPos, setScreenPos] = useState<{ [id: string]: { x: number; y: number; visible: boolean } }>({});

  // 1. DYNAMIC PLAYER LIST RESOLUTION
  // Extract actual players from room or fill empty seats with council members
  // so the 3D room is NEVER empty and always shows characters sitting at chairs!
  const playersList: PublicPlayerView[] = useMemo(() => {
    const rawPlayers = room?.players && room.players.length > 0 ? room.players : [];
    const targetCapacity = Math.max(room?.settings?.maxPlayers || 8, rawPlayers.length, 6);

    if (rawPlayers.length === 0) {
      return [
        { id: 'p1', seat: 1, nickname: 'Bác Sĩ', avatarUrl: null, isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
        { id: 'p2', seat: 2, nickname: 'LordVader', avatarUrl: null, isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
        { id: 'p3', seat: 3, nickname: 'Xemesis', avatarUrl: null, isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
        { id: 'p4', seat: 4, nickname: 'Quản Trò', avatarUrl: null, isHost: true, isAlive: true, ready: true, connection: 'ONLINE' },
        { id: 'p5', seat: 5, nickname: 'PewPew', avatarUrl: null, isHost: false, isAlive: false, ready: true, connection: 'ONLINE' },
        { id: 'p6', seat: 6, nickname: 'Độ Mixi', avatarUrl: null, isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
        { id: 'p7', seat: 7, nickname: 'Mặt Nạ', avatarUrl: null, isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
        { id: 'p8', seat: 8, nickname: 'Bạn', avatarUrl: null, isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
      ].slice(0, targetCapacity);
    }

    if (rawPlayers.length >= targetCapacity) {
      return rawPlayers;
    }

    // Fill remaining empty seats with council member bots so the room is NEVER empty
    const result: PublicPlayerView[] = [...rawPlayers];
    const usedSeats = new Set(rawPlayers.map((p: any) => p.seat));
    const sampleBots = [
      { id: 'bot_2', seat: 2, nickname: 'LordVader', isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
      { id: 'bot_3', seat: 3, nickname: 'Xemesis', isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
      { id: 'bot_4', seat: 4, nickname: 'Quản Trò', isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
      { id: 'bot_5', seat: 5, nickname: 'PewPew', isHost: false, isAlive: false, ready: true, connection: 'ONLINE' },
      { id: 'bot_6', seat: 6, nickname: 'Độ Mixi', isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
      { id: 'bot_7', seat: 7, nickname: 'Mặt Nạ', isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
      { id: 'bot_8', seat: 8, nickname: 'Thầy Bói', isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
      { id: 'bot_9', seat: 9, nickname: 'Thợ Săn', isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
      { id: 'bot_10', seat: 10, nickname: 'Bác Sĩ', isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
      { id: 'bot_11', seat: 11, nickname: 'Bảo Vệ', isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
      { id: 'bot_12', seat: 12, nickname: 'Phù Thủy', isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
    ];

    let bIdx = 0;
    for (let s = 1; s <= targetCapacity; s++) {
      if (result.length >= targetCapacity) break;
      if (usedSeats.has(s)) continue;
      const bot = sampleBots[bIdx % sampleBots.length];
      bIdx++;
      result.push({
        id: `bot_${s}_${bot.id}`,
        seat: s,
        nickname: bot.nickname,
        avatarUrl: null,
        isHost: false,
        isAlive: bot.isAlive,
        ready: true,
        connection: 'ONLINE',
      });
      usedSeats.add(s);
    }

    return result.sort((a, b) => a.seat - b.seat);
  }, [room?.players, room?.settings?.maxPlayers]);

  const totalSeats = playersList.length;

  // Identify local viewer seat
  const localPlayer = useMemo(() => {
    return (
      playersList.find((p) => p.id === currentPlayerId || p.id === room?.me?.id) ||
      playersList.find((p) => !p.id.startsWith('bot_')) ||
      playersList[playersList.length - 1]
    );
  }, [playersList, currentPlayerId, room?.me?.id]);

  // Accused player (e.g. #02 LordVader with highest votes)
  const accusedId = room?.day?.accusedId || 'p2';

  // Vote tallies from room day state or demo tallies
  const voteTally: Record<string, number> = useMemo(() => {
    if (room?.day?.tally) return room.day.tally;
    return { p2: 3, p6: 1 };
  }, [room?.day?.tally]);

  // Dialogue lines for atmospheric immersion
  const dialogues: Record<string, string> = {
    p1: 'Đêm qua tôi đã dùng bình thuốc cứu một người!',
    p2: 'Tôi là Dân làng lương thiện, đừng nghe kẻ xấu!',
    p3: 'Mặt Nạ và PewPew có hành tung rất đáng ngờ...',
    p4: 'Mọi người hãy biểu quyết trong trật tự!',
    p5: '...', // Dead
    p6: 'Cáo buộc #02 LordVader có biểu hiện mờ ám!',
    p7: 'Tôi chỉ là thôn nữ gánh nước thôi mà...',
  };

  // 2. ELEGANT CIRCULAR TABLE RADIUS (Keeps table compact & perfectly framed like Image 2)
  const dynamicTableRadius = useMemo(() => {
    return 1.48;
  }, []);

  // 3. SEAT POSITIONS GENERATION AROUND CIRCLE
  const opponentSeats: TableSeat[] = useMemo(() => {
    const seats: TableSeat[] = [];
    const otherPlayers = playersList.filter((p) => p.id !== localPlayer?.id);
    const count = otherPlayers.length;

    const seatDist = dynamicTableRadius + 0.18;
    const chairDist = dynamicTableRadius + 0.35;

    otherPlayers.forEach((p, idx) => {
      // Evenly distribute along the panoramic arc opposite to local player
      const fraction = count > 0 ? (idx + 1) / (count + 1) : 0.5;
      const angle = Math.PI / 2 + (fraction - 0.5) * Math.PI * 1.65 + Math.PI;

      const x = Math.cos(angle) * seatDist;
      const z = Math.sin(angle) * seatDist;

      const chairX = Math.cos(angle) * chairDist;
      const chairZ = Math.sin(angle) * chairDist;

      // Select model preset
      const preset = MODEL_PRESETS[idx % MODEL_PRESETS.length];

      seats.push({
        id: p.id,
        seatNumber: p.seat,
        nickname: `#0${p.seat} ${p.nickname}`,
        isAlive: p.isAlive,
        isHost: p.isHost,
        isAccused: accusedId === p.id,
        votes: voteTally[p.id] || 0,
        dialogue: p.isAlive ? dialogues[p.id] || '' : undefined,
        modelFile: preset.file,
        isWerewolf: preset.isWolf,
        isGirl: preset.isGirl,
        pos: [x, 0.04, z],
        chairPos: [chairX, 0, chairZ],
        angle,
      });
    });

    return seats;
  }, [playersList, localPlayer, dynamicTableRadius, accusedId, voteTally]);

  // Unique key to prevent re-building 3D scene when only votes change
  const seatsRosterKey = useMemo(() => {
    return playersList.map((p) => `${p.id}:${p.isAlive}`).join(',');
  }, [playersList]);

  // Refs for reactive values in animation loop
  const mouseRef = useRef({ targetYaw: 0, targetPitch: 0 });
  const hoveredSeatIdRef = useRef<string | null>(null);
  useEffect(() => {
    hoveredSeatIdRef.current = hoveredSeatId;
  }, [hoveredSeatId]);

  const selectedTargetIdRef = useRef<string | null | undefined>(selectedTargetId);
  useEffect(() => {
    selectedTargetIdRef.current = selectedTargetId;
  }, [selectedTargetId]);

  const isPov2Ref = useRef(isPov2);
  useEffect(() => {
    isPov2Ref.current = isPov2;
  }, [isPov2]);

  const isNightRef = useRef(isNightPhase(room?.phase));
  useEffect(() => {
    isNightRef.current = isNightPhase(room?.phase);
  }, [room?.phase]);

  const isDealingRef = useRef(isDealing);
  useEffect(() => {
    isDealingRef.current = isDealing;
  }, [isDealing]);

  const hasDealtRef = useRef(hasDealtCards);
  useEffect(() => {
    hasDealtRef.current = hasDealtCards;
  }, [hasDealtCards]);

  const threeRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    ambientLight: THREE.AmbientLight;
    lanternLight: THREE.PointLight;
    lampGroup: THREE.Group;
    candleLight1: THREE.PointLight;
    candleLight2: THREE.PointLight;
    accusedSpot: THREE.SpotLight;
    raycaster: THREE.Raycaster;
    charObjects: {
      [id: string]: {
        root: THREE.Object3D;
        baseY: number;
        isAlive: boolean;
      };
    };
  } | null>(null);

  // ============================================================================
  // 4. INITIALIZE DYNAMIC 3D NOIR TAVERN SCENE
  // ============================================================================
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // A. RENDERER (Cinematic Dark Mode Noir)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.replaceChildren(renderer.domElement);

    // B. SCENE & ATMOSPHERE (Deep Speakeasy Noir - Identical to Image 2)
    const scene = new THREE.Scene();
    const initialBgColor = isNightRef.current ? 0x05070c : 0x080504;
    scene.background = new THREE.Color(initialBgColor);
    scene.fog = new THREE.Fog(initialBgColor, 20, 50);

    // C. CAMERA (FPS View seated at table)
    const camera = new THREE.PerspectiveCamera(62, width / height, 0.1, 50);
    camera.position.set(0, 1.55, dynamicTableRadius + 0.50);
    camera.lookAt(0, 1.05, -dynamicTableRadius * 0.15);

    // D. MULTI-SOURCE NOIR LIGHTING
    // 1. Ambient Fill
    const ambientLight = new THREE.AmbientLight(isNightRef.current ? 0x0f172a : 0xffecd2, 0.65);
    scene.add(ambientLight);

    // 2. Floor Bounce
    const hemiLight = new THREE.HemisphereLight(0x3d2417, 0x0a0705, 0.45);
    scene.add(hemiLight);

    // 3. Overhead Ceiling Illumination (Placed high up at ceiling - NO hanging cone/shade blocking characters)
    const lampGroup = new THREE.Group();
    lampGroup.position.set(0, 4.2, 0);

    const lanternLight = new THREE.PointLight(
      isNightRef.current ? 0x38bdf8 : 0xff9922,
      isNightRef.current ? 1.6 : 4.0,
      12,
      1.2
    );
    lanternLight.position.set(0, -0.2, 0);
    lanternLight.castShadow = true;
    lampGroup.add(lanternLight);
    scene.add(lampGroup);

    // 4. Central Table Spotlight
    const tableSpot = new THREE.SpotLight(0xffe0b2, 6.0, 10, Math.PI / 3.2, 0.5, 1.2);
    tableSpot.position.set(0, 3.6, 0);
    tableSpot.target.position.set(0, 1.0, 0);
    tableSpot.castShadow = true;
    scene.add(tableSpot);
    scene.add(tableSpot.target);

    // 5. Flickering Candles on Table
    const candleLight1 = new THREE.PointLight(0xff9922, 2.2, 3.5, 1.2);
    candleLight1.position.set(-dynamicTableRadius * 0.45, 1.15, -0.2);
    scene.add(candleLight1);

    const candleLight2 = new THREE.PointLight(0xff9922, 2.2, 3.5, 1.2);
    candleLight2.position.set(dynamicTableRadius * 0.45, 1.15, -0.2);
    scene.add(candleLight2);

    // 6. Accused Execution Spotlight (Dramatic Red beam)
    const accusedSpot = new THREE.SpotLight(0xef4444, 0, 12, Math.PI / 4.5, 0.3, 1.2);
    accusedSpot.position.set(0, 3.8, 0);
    accusedSpot.castShadow = true;
    scene.add(accusedSpot);
    scene.add(accusedSpot.target);

    // E. 100% REAL 3D ROOM (DARK NOIR)
    // 1. Dark Smoked Parquet Floor
    const floorMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(28, 28),
      new THREE.MeshStandardMaterial({ color: 0x150e09, roughness: 0.6, metalness: 0.1 })
    );
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // 2. Dark Timber Ceiling & Beams
    const ceilingMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(28, 28),
      new THREE.MeshStandardMaterial({ color: 0x0d0805, roughness: 0.85 })
    );
    ceilingMesh.position.y = 4.4;
    ceilingMesh.rotation.x = Math.PI / 2;
    scene.add(ceilingMesh);

    for (let beam = -6; beam <= 6; beam += 2) {
      const beamMesh = new THREE.Mesh(
        new THREE.BoxGeometry(28, 0.35, 0.25),
        new THREE.MeshStandardMaterial({ color: 0x100804, roughness: 0.75 })
      );
      beamMesh.position.set(0, 4.25, beam);
      scene.add(beamMesh);
    }

    // 3. Dark Mahogany Back Wall with Bar & Shelves (Deep Noir Mahogany - NO GREY!)
    const backWallDist = 4.2;
    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(28, 6),
      new THREE.MeshStandardMaterial({ color: 0x0c0704, roughness: 0.92, metalness: 0.05 })
    );
    backWall.position.set(0, 3.0, -backWallDist);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Shelves with bottles (3 Tiers of sparkling bottles identical to Image 2)
    const shelfHeights = [1.6, 2.15, 2.7];
    const bottlePalettes = [0xef4444, 0xf59e0b, 0x10b981, 0x3b82f6, 0xd97706];
    shelfHeights.forEach((shY) => {
      const shMesh = new THREE.Mesh(
        new THREE.BoxGeometry(12.0, 0.08, 0.38),
        new THREE.MeshStandardMaterial({ color: 0x150b05, roughness: 0.5, metalness: 0.1 })
      );
      shMesh.position.set(0, shY, -backWallDist + 0.2);
      scene.add(shMesh);

      for (let b = 0; b < 22; b++) {
        const bottleColor = bottlePalettes[(b + Math.floor(shY * 3)) % bottlePalettes.length];
        const bottle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.045, 0.055, 0.28, 8),
          new THREE.MeshStandardMaterial({ color: bottleColor, roughness: 0.15, metalness: 0.3, transparent: true, opacity: 0.88 })
        );
        bottle.position.set(-5.0 + b * 0.48, shY + 0.16, -backWallDist + 0.22);
        scene.add(bottle);
      }
    });

    // Glowing Neon "HỘI ĐỒNG MA SÓI" Sign with Custom Canvas Texture
    const neonFrame = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 1.0, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x0a0a0e, roughness: 0.9 })
    );
    neonFrame.position.set(0, 3.4, -backWallDist + 0.08);
    scene.add(neonFrame);

    const neonTex = createNeonSignCanvasTexture();
    const neonSign = new THREE.Mesh(
      new THREE.PlaneGeometry(3.6, 0.9),
      new THREE.MeshBasicMaterial({ map: neonTex, transparent: true })
    );
    neonSign.position.set(0, 3.4, -backWallDist + 0.13);
    scene.add(neonSign);

    // F. DYNAMICALLY SIZED COUNCIL TABLE (SCALES PROPORTIONALLY WITH PLAYER COUNT)
    const tableGroup = new THREE.Group();
    tableGroup.position.set(0, 0, 0);

    // Deep Velvet Emerald Green Table Felt
    const feltMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(dynamicTableRadius, dynamicTableRadius, 0.08, 48),
      new THREE.MeshStandardMaterial({ color: 0x0e4726, roughness: 0.72, metalness: 0.05 })
    );
    feltMesh.position.y = 1.0;
    feltMesh.receiveShadow = true;
    tableGroup.add(feltMesh);

    // Golden Council Ring
    const betRing = new THREE.Mesh(
      new THREE.TorusGeometry(dynamicTableRadius * 0.76, 0.016, 8, 48),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.85 })
    );
    betRing.rotation.x = Math.PI / 2;
    betRing.position.y = 1.045;
    tableGroup.add(betRing);

    // Dark Mahogany Armrest Rim
    const rimMesh = new THREE.Mesh(
      new THREE.TorusGeometry(dynamicTableRadius + 0.08, 0.14, 16, 48),
      new THREE.MeshStandardMaterial({ color: 0x2e1408, roughness: 0.35, metalness: 0.15 })
    );
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.y = 1.04;
    rimMesh.castShadow = true;
    rimMesh.receiveShadow = true;
    tableGroup.add(rimMesh);

    // Central Pillar Base
    const pillarMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(dynamicTableRadius * 0.28, dynamicTableRadius * 0.45, 1.0, 24),
      new THREE.MeshStandardMaterial({ color: 0x2e1408, roughness: 0.35 })
    );
    pillarMesh.position.y = 0.5;
    tableGroup.add(pillarMesh);

    // Stacks of council vote tokens around table
    for (let i = 0; i < totalSeats; i++) {
      const ang = (i / totalSeats) * Math.PI * 2;
      const chipStack = new THREE.Mesh(
        new THREE.CylinderGeometry(0.065, 0.065, 0.06, 16),
        new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? 0xef4444 : 0xf59e0b, roughness: 0.3 })
      );
      chipStack.position.set(Math.cos(ang) * (dynamicTableRadius * 0.82), 1.06, Math.sin(ang) * (dynamicTableRadius * 0.82));
      tableGroup.add(chipStack);
    }

    // Central Card Deck on the table felt
    const cardBackTex = createCardBackCanvasTexture();
    const cardBackMat = new THREE.MeshStandardMaterial({
      map: cardBackTex,
      roughness: 0.35,
      metalness: 0.1,
    });
    const cardGeo = new THREE.BoxGeometry(0.14, 0.004, 0.22);

    const deckGroup = new THREE.Group();
    deckGroup.position.set(0, 1.045, 0);

    const deckMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.05, 0.26),
      new THREE.MeshStandardMaterial({ color: 0x0f131c, roughness: 0.5, metalness: 0.2 })
    );
    deckMesh.position.y = 0.025;
    deckMesh.castShadow = true;
    deckMesh.receiveShadow = true;
    deckGroup.add(deckMesh);

    // Top card of deck
    const topDeckCard = new THREE.Mesh(
      new THREE.BoxGeometry(0.176, 0.004, 0.256),
      cardBackMat
    );
    topDeckCard.position.y = 0.052;
    deckGroup.add(topDeckCard);

    // Crimson Wax Seal on deck
    const sealMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.015, 16),
      new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.3, metalness: 0.2 })
    );
    sealMesh.position.y = 0.06;
    deckGroup.add(sealMesh);

    tableGroup.add(deckGroup);

    // 3D Cards for all seats on table
    const seatCards: Array<{
      mesh: THREE.Mesh;
      targetPos: THREE.Vector3;
      targetRotY: number;
      seatIdx: number;
    }> = [];

    for (let i = 0; i < totalSeats; i++) {
      const ang = (i / totalSeats) * Math.PI * 2;
      const cardDist = dynamicTableRadius * 0.65;
      const targetX = Math.cos(ang) * cardDist;
      const targetZ = Math.sin(ang) * cardDist;
      const targetRotY = -ang + Math.PI / 2;

      const card = new THREE.Mesh(cardGeo, cardBackMat);
      card.position.set(targetX, 1.043, targetZ);
      card.rotation.y = targetRotY;
      card.castShadow = true;
      card.receiveShadow = true;
      // Start hidden if cards have not been dealt yet
      card.visible = hasDealtRef.current;
      tableGroup.add(card);

      seatCards.push({
        mesh: card,
        targetPos: new THREE.Vector3(targetX, 1.043, targetZ),
        targetRotY,
        seatIdx: i,
      });
    }

    scene.add(tableGroup);

    // G. SEATED 3D NOIR POKER CHARACTERS (Zero T-poses, Sleek Tavern Figures)
    const charObjects: { [id: string]: { root: THREE.Object3D; baseY: number; isAlive: boolean } } = {};

    opponentSeats.forEach((seat, idx) => {
      const charGroup = new THREE.Group();
      charGroup.name = seat.id;
      charGroup.position.set(seat.pos[0], seat.pos[1], seat.pos[2]);
      charGroup.rotation.y = seat.angle + Math.PI; // Face table center

      // 1. Sleek Leather Poker Chair
      const chairGroup = new THREE.Group();
      chairGroup.position.set(0, 0, 0.18);

      const seatMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.30, 0.08, 16),
        new THREE.MeshStandardMaterial({ color: 0x181411, roughness: 0.5, metalness: 0.2 })
      );
      seatMesh.position.y = 0.54;
      seatMesh.castShadow = true;
      chairGroup.add(seatMesh);

      const chairBack = new THREE.Mesh(
        new THREE.BoxGeometry(0.48, 0.55, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x221711, roughness: 0.5, metalness: 0.2 })
      );
      chairBack.position.set(0, 0.88, 0.18);
      chairBack.rotation.x = -0.08;
      chairBack.castShadow = true;
      chairGroup.add(chairBack);

      const chairLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.18, 0.52, 12),
        new THREE.MeshStandardMaterial({ color: 0x0f0b08, roughness: 0.3, metalness: 0.8 })
      );
      chairLeg.position.y = 0.26;
      chairGroup.add(chairLeg);
      charGroup.add(chairGroup);

      // 2. Humanoid Body (Sitting at table)
      const bodyGroup = new THREE.Group();
      bodyGroup.name = 'Body';
      bodyGroup.position.set(0, 0.56, 0.04);

      // Jacket / Coat Colors in Noir Palette
      const coatColors = [0x1c1917, 0x1e293b, 0x3b1212, 0x143525, 0x242038, 0x3d2612];
      const coatColor = coatColors[idx % coatColors.length];

      // Torso
      const torso = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.21, 0.65, 12),
        new THREE.MeshStandardMaterial({ color: coatColor, roughness: 0.7, metalness: 0.1 })
      );
      torso.position.y = 0.38;
      torso.castShadow = true;
      torso.receiveShadow = true;
      bodyGroup.add(torso);

      // Arms resting on table felt
      const armMat = new THREE.MeshStandardMaterial({ color: coatColor, roughness: 0.7 });
      const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.38, 4, 8), armMat);
      armL.position.set(-0.28, 0.42, -0.15);
      armL.rotation.set(0.65, 0.15, 0.35);
      bodyGroup.add(armL);

      const armR = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.38, 4, 8), armMat);
      armR.position.set(0.28, 0.42, -0.15);
      armR.rotation.set(0.65, -0.15, -0.35);
      bodyGroup.add(armR);

      // Hands
      const skinTones = [0xdfba9e, 0xcc9966, 0xb37440, 0x7c4923];
      const skinTone = skinTones[idx % skinTones.length];
      const handMat = new THREE.MeshStandardMaterial({ color: skinTone, roughness: 0.6 });

      const handL = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), handMat);
      handL.position.set(-0.24, 0.46, -0.32);
      bodyGroup.add(handL);

      const handR = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), handMat);
      handR.position.set(0.24, 0.46, -0.32);
      bodyGroup.add(handR);

      // Head & Features
      const headGroup = new THREE.Group();
      headGroup.name = 'Head';
      headGroup.position.set(0, 0.82, 0);

      const headMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 16, 16),
        new THREE.MeshStandardMaterial({ color: skinTone, roughness: 0.5 })
      );
      headMesh.castShadow = true;
      headGroup.add(headMesh);

      // Fedora or Cowboy Hat for atmospheric noir tavern
      if (idx % 2 === 0) {
        const hatMat = new THREE.MeshStandardMaterial({ color: 0x111116, roughness: 0.6 });
        const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.30, 0.02, 16), hatMat);
        brim.position.y = 0.12;
        headGroup.add(brim);

        const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.20, 0.16, 16), hatMat);
        crown.position.y = 0.20;
        headGroup.add(crown);
      }

      bodyGroup.add(headGroup);
      charGroup.add(bodyGroup);

      // Pose: If dead, slump immediately; if alive, set up
      if (!seat.isAlive) {
        bodyGroup.position.y = 0.28;
        bodyGroup.rotation.x = -0.45;
        headGroup.rotation.set(-0.70, 0, 0.25);
      }

      scene.add(charGroup);
      charObjects[seat.id] = {
        root: charGroup,
        baseY: seat.pos[1],
        isAlive: seat.isAlive,
      };
    });

    threeRef.current = {
      renderer,
      scene,
      camera,
      ambientLight,
      lanternLight,
      lampGroup,
      candleLight1,
      candleLight2,
      accusedSpot,
      raycaster: new THREE.Raycaster(),
      charObjects,
    };

    // H. RESIZE HANDLER
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // I. ANIMATION LOOP
    let animationFrameId: number;
    let dealStartTime: number | null = null;
    const loopStartTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const t = (performance.now() - loopStartTime) * 0.001;
      const state = threeRef.current;
      if (!state) return;

      // 1. Smooth Camera POV Positioning & Looking
      const isPov2Active = isPov2Ref.current;
      const pov2Y = 2.85 + dynamicTableRadius * 0.22;
      const pov2Z = dynamicTableRadius + 1.80;
      const targetY = isPov2Active ? pov2Y : 1.55 + Math.sin(t * 1.5) * 0.005;
      const targetZ = isPov2Active ? pov2Z : dynamicTableRadius + 0.50;

      camera.position.y += (targetY - camera.position.y) * 0.06;
      camera.position.z += (targetZ - camera.position.z) * 0.06;

      const targetYaw = mouseRef.current.targetYaw;
      const targetPitch = mouseRef.current.targetPitch + (isPov2Active ? -0.28 : 0);
      camera.rotation.y += (targetYaw - camera.rotation.y) * 0.08;
      camera.rotation.x += (targetPitch - camera.rotation.x) * 0.08;

      // 2. Day / Night Atmosphere Transition
      const isNight = isNightRef.current;
      if (isNight) {
        state.ambientLight.color.lerp(new THREE.Color(0x0f172a), 0.05);
        state.lanternLight.color.lerp(new THREE.Color(0x38bdf8), 0.05);
        state.lanternLight.intensity = THREE.MathUtils.lerp(state.lanternLight.intensity, 1.6, 0.05);
        scene.background = new THREE.Color(0x05070c);
        if (scene.fog) scene.fog.color.lerp(new THREE.Color(0x05070c), 0.05);
      } else {
        state.ambientLight.color.lerp(new THREE.Color(0xffecd2), 0.05);
        state.lanternLight.color.lerp(new THREE.Color(0xff9922), 0.05);
        state.lanternLight.intensity = THREE.MathUtils.lerp(state.lanternLight.intensity, 4.0, 0.05);
        scene.background = new THREE.Color(0x0a0706);
        if (scene.fog) scene.fog.color.lerp(new THREE.Color(0x0a0706), 0.05);
      }

      // 3. Chandelier & Candle Flicker
      state.lampGroup.rotation.z = Math.sin(t * 1.3) * 0.02;
      state.candleLight1.intensity = 2.2 + Math.sin(t * 12) * 0.25;
      state.candleLight2.intensity = 2.2 + Math.cos(t * 14) * 0.25;

      // 4. Character Animation: Sleep / Awake & Reactions
      const curHovered = hoveredSeatIdRef.current;
      const curSelected = selectedTargetIdRef.current;

      Object.entries(state.charObjects).forEach(([id, char], idx) => {
        if (!char.isAlive) return; // Dead players stay slumped

        const isHovered = curHovered === id;
        const isSelected = curSelected === id;
        const breathSpeed = isNight ? 1.0 : 2.0;
        const breathAmount = isNight ? 0.003 : 0.005;
        const breath = Math.sin(t * breathSpeed + idx * 1.1) * breathAmount;
        char.root.position.y = char.baseY + breath;

        // Head and Body pose transitions: SLEEP vs AWAKE
        const head = char.root.getObjectByName('Head');
        const body = char.root.getObjectByName('Body');
        if (head) {
          if (isNight) {
            // SLEEP POSE: Head tilted down forward resting on table felt
            head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, -0.65, 0.06);
            head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, 0, 0.06);
            if (body) body.rotation.x = THREE.MathUtils.lerp(body.rotation.x, -0.22, 0.06);
          } else {
            // AWAKE POSE: Head upright, looking around tavern naturally
            head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, -0.05, 0.06);
            head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, Math.sin(t * 1.2 + idx) * 0.08, 0.06);
            if (body) body.rotation.x = THREE.MathUtils.lerp(body.rotation.x, 0, 0.06);
          }
        }

        const targetScale = isSelected ? 1.02 : isHovered ? 0.98 : 0.94;
        char.root.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12);
      });

      // 4.5. Card Dealing Flight Animation across Council Table (Slow, Majestic & Smooth ~4.6s)
      if (isDealingRef.current) {
        if (dealStartTime === null) {
          dealStartTime = t;
        }
        const dealElapsed = t - dealStartTime;
        const totalDealTime = 4.6; // 4.6s total flight window
        const flightDuration = 1.15; // 1.15s per card slow, smooth flight

        seatCards.forEach(({ mesh, targetPos, targetRotY, seatIdx }) => {
          // Stagger card launch times sequentially around the table
          const cardLaunchTime = (seatIdx / totalSeats) * (totalDealTime - flightDuration);
          const elapsed = dealElapsed - cardLaunchTime;

          if (elapsed <= 0) {
            mesh.visible = false;
            mesh.position.set(0, 1.06, 0);
            mesh.scale.set(0.001, 0.001, 0.001);
          } else if (elapsed < flightDuration) {
            mesh.visible = true;
            mesh.scale.set(1, 1, 1);
            const progress = elapsed / flightDuration;
            // easeOutCubic for luxurious smooth flight
            const ease = 1 - Math.pow(1 - progress, 3);
            mesh.position.x = THREE.MathUtils.lerp(0, targetPos.x, ease);
            mesh.position.z = THREE.MathUtils.lerp(0, targetPos.z, ease);
            mesh.position.y = THREE.MathUtils.lerp(1.10, targetPos.y, ease) + Math.sin(progress * Math.PI) * 0.42;
            mesh.rotation.y = targetRotY + (1 - progress) * Math.PI * 2.0;
            mesh.rotation.z = Math.sin(progress * Math.PI) * 0.22;
          } else {
            mesh.visible = true;
            mesh.scale.set(1, 1, 1);
            mesh.position.copy(targetPos);
            mesh.rotation.set(0, targetRotY, 0);
          }
        });
      } else if (hasDealtRef.current) {
        dealStartTime = null;
        seatCards.forEach(({ mesh, targetPos, targetRotY }) => {
          mesh.visible = true;
          mesh.scale.set(1, 1, 1);
          mesh.position.copy(targetPos);
          mesh.rotation.set(0, targetRotY, 0);
        });
      } else {
        // When entering room or before dealing: NO cards on the table yet!
        dealStartTime = null;
        seatCards.forEach(({ mesh }) => {
          mesh.visible = false;
          mesh.scale.set(0.001, 0.001, 0.001);
        });
      }

      // 5. Update Screen Positions for 3D Nametags
      const projectToScreen = (root?: THREE.Object3D, isAlive = true) => {
        if (!root) return { x: 0, y: 0, visible: false };
        const v = new THREE.Vector3();
        root.getWorldPosition(v);
        v.y += isAlive ? 1.88 : 1.25; // Dead player nametag sits lower
        v.project(camera);
        const sx = ((v.x + 1) * width) / 2;
        const sy = ((-v.y + 1) * height) / 2;
        return { x: sx, y: sy, visible: v.z < 1 };
      };

      const newPos: { [id: string]: { x: number; y: number; visible: boolean } } = {};
      opponentSeats.forEach((s) => {
        const obj = state.charObjects[s.id];
        newPos[s.id] = projectToScreen(obj?.root, s.isAlive);
      });
      setScreenPos(newPos);

      // Render 3D Scene
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [dynamicTableRadius, totalSeats, seatsRosterKey]);

  // Mouse Move Handler: Look around & Raycast hover on 3D players
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mountRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / rect.width - 0.5;
    const normY = (e.clientY - rect.top) / rect.height - 0.5;

    mouseRef.current.targetYaw = -normX * 0.85;
    mouseRef.current.targetPitch = -normY * 0.38;

    if (threeRef.current) {
      const mouse = new THREE.Vector2(normX * 2, -normY * 2);
      threeRef.current.raycaster.setFromCamera(mouse, threeRef.current.camera);

      const targets: THREE.Object3D[] = [];
      const charIds: string[] = [];
      for (const [id, char] of Object.entries(threeRef.current.charObjects)) {
        if (char.isAlive) {
          targets.push(char.root);
          charIds.push(id);
        }
      }

      const intersects = threeRef.current.raycaster.intersectObjects(targets, true);
      if (intersects.length > 0) {
        let hit = intersects[0].object;
        while (hit.parent && !charIds.includes(hit.name)) {
          for (const id of charIds) {
            if (threeRef.current.charObjects[id]?.root === hit) {
              setHoveredSeatId(id);
              if (onAimAtPlayer) onAimAtPlayer(id, id);
              return;
            }
          }
          hit = hit.parent;
        }
        if (charIds.includes(hit.name)) {
          setHoveredSeatId(hit.name);
          if (onAimAtPlayer) onAimAtPlayer(hit.name, hit.name);
          return;
        }
      } else {
        setHoveredSeatId(null);
      }
    }
  };

  // Click on 3D Player to Vote / Inspect / Target
  const handlePlayerClick = (targetId: string, nickname: string) => {
    const seat = opponentSeats.find((s) => s.id === targetId);
    if (!seat || !seat.isAlive) return;

    werewolfAudio.playGavel();
    if (onSelectTarget) {
      onSelectTarget(targetId, nickname);
    } else if (onShootPlayer) {
      onShootPlayer(targetId, nickname);
    }
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative w-full h-full overflow-hidden bg-black select-none cursor-default"
    >
      {/* 1. 100% PURE REAL-TIME 3D WEBGL ENGINE VIEWPORT (Clean Noir Canvas) */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}

export default LiarsBar3DExperience;
