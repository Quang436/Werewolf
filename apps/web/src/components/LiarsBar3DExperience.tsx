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

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  // Wooden Gavel Strike for Voting / Verdicts
  public playGavel() {
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
}

export const werewolfAudio = new WerewolfAudioEngine();

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
  onAimAtPlayer,
  onSelectTarget,
  onShootPlayer,
}: LiarsBar3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredSeatId, setHoveredSeatId] = useState<string | null>(null);

  // Screen-projected 2D coordinates for 3D nametags and vote counters
  const [screenPos, setScreenPos] = useState<{ [id: string]: { x: number; y: number; visible: boolean } }>({});

  // 1. DYNAMIC PLAYER LIST RESOLUTION
  // Extract actual players from room or fallback to 8-player council
  const playersList: PublicPlayerView[] = useMemo(() => {
    if (room?.players && room.players.length > 0) {
      return room.players;
    }
    return [
      { id: 'p1', seat: 1, nickname: 'Bác Sĩ', avatarUrl: null, isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
      { id: 'p2', seat: 2, nickname: 'LordVader', avatarUrl: null, isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
      { id: 'p3', seat: 3, nickname: 'Xemesis', avatarUrl: null, isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
      { id: 'p4', seat: 4, nickname: 'Quản Trò', avatarUrl: null, isHost: true, isAlive: true, ready: true, connection: 'ONLINE' },
      { id: 'p5', seat: 5, nickname: 'PewPew', avatarUrl: null, isHost: false, isAlive: false, ready: true, connection: 'ONLINE' },
      { id: 'p6', seat: 6, nickname: 'Độ Mixi', avatarUrl: null, isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
      { id: 'p7', seat: 7, nickname: 'Mặt Nạ', avatarUrl: null, isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
      { id: 'p8', seat: 8, nickname: 'Bạn', avatarUrl: null, isHost: false, isAlive: true, ready: true, connection: 'ONLINE' },
    ];
  }, [room?.players]);

  const totalSeats = playersList.length;

  // Identify local viewer seat
  const localPlayer = useMemo(() => {
    return (
      playersList.find((p) => p.id === currentPlayerId || p.id === room?.me?.id) ||
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

  // 2. DYNAMIC TABLE RADIUS SIZING (Expands smoothly for 4 to 16 players)
  // Arc length per seated person is kept at ~1.30m
  const dynamicTableRadius = useMemo(() => {
    return Math.max(1.35, (totalSeats * 1.30) / (2 * Math.PI));
  }, [totalSeats]);

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

  const isNightRef = useRef(Boolean(room?.phase && room.phase.includes('NIGHT')));
  useEffect(() => {
    isNightRef.current = Boolean(room?.phase && room.phase.includes('NIGHT'));
  }, [room?.phase]);

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
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.replaceChildren(renderer.domElement);

    // B. SCENE & ATMOSPHERE (Deep Speakeasy Noir)
    const scene = new THREE.Scene();
    const initialBgColor = isNightRef.current ? 0x05070c : 0x0a0706;
    scene.background = new THREE.Color(initialBgColor);
    scene.fog = new THREE.Fog(initialBgColor, 6, 26);

    // C. CAMERA (FPS View seated at table)
    const camera = new THREE.PerspectiveCamera(62, width / height, 0.1, 40);
    camera.position.set(0, 1.55, dynamicTableRadius + 0.50);
    camera.lookAt(0, 1.05, -dynamicTableRadius * 0.20);

    // D. MULTI-SOURCE NOIR LIGHTING
    // 1. Ambient Fill
    const ambientLight = new THREE.AmbientLight(isNightRef.current ? 0x1a2639 : 0xffecd2, 0.75);
    scene.add(ambientLight);

    // 2. Floor Bounce
    const hemiLight = new THREE.HemisphereLight(0x3d2417, 0x0a0705, 0.55);
    scene.add(hemiLight);

    // 3. Overhead Brass Chandelier
    const lampGroup = new THREE.Group();
    lampGroup.position.set(0, 3.6 + dynamicTableRadius * 0.15, 0);

    const chainMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 1.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x1f1915, roughness: 0.7, metalness: 0.8 })
    );
    chainMesh.position.y = -0.6;
    lampGroup.add(chainMesh);

    const shadeMesh = new THREE.Mesh(
      new THREE.ConeGeometry(0.48, 0.32, 24, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.4, metalness: 0.8 })
    );
    shadeMesh.position.y = -1.2;
    shadeMesh.rotation.x = Math.PI;
    lampGroup.add(shadeMesh);

    const bulbMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffd27d })
    );
    bulbMesh.position.y = -1.25;
    lampGroup.add(bulbMesh);

    const lanternLight = new THREE.PointLight(isNightRef.current ? 0x60a5fa : 0xff9922, 5.0, 10 + dynamicTableRadius, 1.2);
    lanternLight.position.set(0, -1.3, 0);
    lanternLight.castShadow = true;
    lampGroup.add(lanternLight);
    scene.add(lampGroup);

    // 4. Central Table Spotlight
    const tableSpot = new THREE.SpotLight(0xffe0b2, 9.0, 10 + dynamicTableRadius, Math.PI / 3.2, 0.5, 1.2);
    tableSpot.position.set(0, 3.5 + dynamicTableRadius * 0.2, 0);
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

    // 3. Dark Mahogany Back Wall with Bar & Shelves
    const backWallDist = Math.max(4.0, dynamicTableRadius + 2.4);
    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(28, 6),
      new THREE.MeshStandardMaterial({ color: 0x1a1008, roughness: 0.7 })
    );
    backWall.position.set(0, 3.0, -backWallDist);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Shelves with bottles
    const shelfHeights = [1.6, 2.2, 2.8];
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

    // Glowing Neon "HỘI ĐỒNG MA SÓI" Sign
    const neonFrame = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.65, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x0f0f12, roughness: 0.8 })
    );
    neonFrame.position.set(0, 3.5, -backWallDist + 0.08);
    scene.add(neonFrame);

    const neonSign = new THREE.Mesh(
      new THREE.BoxGeometry(3.3, 0.45, 0.04),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    neonSign.position.set(0, 3.5, -backWallDist + 0.12);
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

    scene.add(tableGroup);

    // G. LOAD 3D CHAIRS & DYNAMIC 3D CHARACTERS SITTING AT TABLE
    const gltfLoader = new GLTFLoader();
    const charObjects: { [id: string]: { root: THREE.Object3D; baseY: number; isAlive: boolean } } = {};

    // 1. Load 3D Chairs
    gltfLoader.load(
      '/models/chair.glb',
      (gltf) => {
        const chairModel = gltf.scene;
        chairModel.traverse((node: any) => {
          if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
            if (node.material) {
              node.material = node.material.clone();
              node.material.color.setHex(0x3d1f0d);
              node.material.roughness = 0.5;
            }
          }
        });

        // Place a chair behind each seat
        opponentSeats.forEach((seat) => {
          const chair = chairModel.clone();
          chair.scale.set(0.78, 0.78, 0.78);
          chair.position.set(...seat.chairPos);
          chair.lookAt(0, 0.5, 0);
          scene.add(chair);
        });
      },
      undefined,
      (err) => console.error('Failed to load chair.glb:', err)
    );

    // 2. Load and place all opponent characters
    opponentSeats.forEach((seat) => {
      gltfLoader.load(
        seat.modelFile,
        (gltf) => {
          const model = gltf.scene;
          model.scale.set(0.94, 0.94, 0.94);
          model.position.set(...seat.pos);
          model.lookAt(0, 1.10, 0);
          model.name = seat.id;

          // 1. Natural Sitting Pose (NO T-POSE!)
          applyPokerSittingPose(model, seat.isGirl);

          // 2. If Ma Sói (Werewolf): Attach 3D wolf head features
          if (seat.isWerewolf) {
            attachWolfHeadFeatures(model);
          }

          // 3. Shading & Materials
          model.traverse((node: any) => {
            if (node.isMesh) {
              node.castShadow = true;
              node.receiveShadow = true;
              if (node.material) {
                node.material = node.material.clone();
                node.material.roughness = 0.55;
                node.material.metalness = 0.08;

                // Werewolf styling
                if (seat.isWerewolf) {
                  const mName = (node.material.name || '').toLowerCase();
                  if (mName.includes('skin')) {
                    node.material.color.setHex(0x32353e); // Wolf grey fur
                  } else if (mName.includes('red') || mName.includes('hair')) {
                    node.material.color.setHex(0x181a1f); // Dark charcoal wolf mane
                  }
                }

                // If player is dead: desaturate/darken into tombstone tones
                if (!seat.isAlive) {
                  node.material.color.multiplyScalar(0.42);
                }
              }
            }
          });

          // 4. Dead player pose: Slump head onto table
          if (!seat.isAlive) {
            applyDeadSlumpPose(model);
          }

          scene.add(model);
          charObjects[seat.id] = { root: model, baseY: seat.pos[1], isAlive: seat.isAlive };
        },
        undefined,
        (err) => console.error(`[LiarsBar3D] Failed to load ${seat.modelFile}:`, err)
      );
    });

    // Dedicated key lights for each seat
    opponentSeats.forEach((seat) => {
      const light = new THREE.PointLight(0xffecd2, 2.8, 4.5, 1.2);
      light.position.set(seat.pos[0] * 0.85, 1.70, seat.pos[2] * 0.85);
      scene.add(light);
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
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
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
        state.ambientLight.color.lerp(new THREE.Color(0x1a2639), 0.05);
        state.lanternLight.color.lerp(new THREE.Color(0x60a5fa), 0.05);
        scene.background = new THREE.Color(0x05070c);
        if (scene.fog) scene.fog.color.lerp(new THREE.Color(0x05070c), 0.05);
      } else {
        state.ambientLight.color.lerp(new THREE.Color(0xffecd2), 0.05);
        state.lanternLight.color.lerp(new THREE.Color(0xff9922), 0.05);
        scene.background = new THREE.Color(0x0a0706);
        if (scene.fog) scene.fog.color.lerp(new THREE.Color(0x0a0706), 0.05);
      }

      // 3. Chandelier & Candle Flicker
      state.lampGroup.rotation.z = Math.sin(t * 1.3) * 0.02;
      state.candleLight1.intensity = 2.2 + Math.sin(t * 12) * 0.25;
      state.candleLight2.intensity = 2.2 + Math.cos(t * 14) * 0.25;

      // 4. Alive Character Breathing & Hover / Selection Reaction
      const curHovered = hoveredSeatIdRef.current;
      const curSelected = selectedTargetIdRef.current;

      Object.entries(state.charObjects).forEach(([id, char], idx) => {
        if (!char.isAlive) return; // Dead players stay slumped

        const isHovered = curHovered === id;
        const isSelected = curSelected === id;
        const breath = Math.sin(t * 2.0 + idx * 1.1) * 0.005;
        char.root.position.y = char.baseY + breath;

        // Subtle head turn
        const head = char.root.getObjectByName('Head');
        if (head) {
          head.rotation.y = Math.sin(t * 1.2 + idx) * 0.06;
        }

        const targetScale = isSelected ? 1.02 : isHovered ? 0.98 : 0.94;
        char.root.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12);
      });

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
      {/* 1. 100% PURE REAL-TIME 3D WEBGL ENGINE VIEWPORT */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* 2. REALTIME 3D PROJECTED NAMETAGS & DIALOGUE IN 3D SPACE */}
      {opponentSeats.map((seat) => {
        const pos = screenPos[seat.id];
        if (!pos || !pos.visible) return null;
        const isTargeted = hoveredSeatId === seat.id;
        const isSelected = selectedTargetId === seat.id;
        const isAccused = accusedId === seat.id;

        return (
          <div
            key={seat.id}
            style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
            onClick={() => handlePlayerClick(seat.id, seat.nickname)}
            className="absolute -translate-x-1/2 -translate-y-full pointer-events-auto z-20 flex flex-col items-center gap-1.5 cursor-pointer transition-transform duration-75 hover:scale-105"
          >
            {/* Live Dialogue Bubble */}
            {seat.dialogue && (
              <div
                className={`px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-2xl text-center max-w-[240px] ${
                  isAccused
                    ? 'bg-red-950/95 border-red-500 text-red-200 animate-bounce'
                    : isSelected
                    ? 'bg-amber-950/95 border-amber-400 text-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.6)]'
                    : isTargeted
                    ? 'bg-zinc-900/95 border-amber-500/60 text-amber-100'
                    : 'bg-zinc-950/90 border-zinc-800 text-zinc-300'
                }`}
              >
                <p className="font-space text-[10px] font-bold leading-tight">
                  &ldquo;{seat.dialogue}&rdquo;
                </p>
              </div>
            )}

            {/* Nametag & Vote Badge */}
            <div
              className={`px-3 py-1 rounded-xl backdrop-blur-md border text-center transition-all whitespace-nowrap shadow-2xl flex items-center gap-2 ${
                !seat.isAlive
                  ? 'bg-zinc-950/90 border-stone-800 text-stone-500 opacity-70'
                  : isSelected
                  ? 'bg-red-950/95 border-red-400 text-white scale-110 shadow-[0_0_25px_rgba(239,68,68,0.9)] ring-2 ring-red-500'
                  : isAccused
                  ? 'bg-red-950/95 border-red-500 text-red-200 animate-pulse shadow-[0_0_25px_rgba(239,68,68,0.8)]'
                  : isTargeted
                  ? 'bg-amber-950/95 border-amber-400 text-amber-200 scale-105 shadow-[0_0_20px_rgba(251,191,36,0.7)]'
                  : 'bg-zinc-950/90 border-zinc-800 text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    !seat.isAlive
                      ? 'bg-stone-600'
                      : isSelected
                      ? 'bg-red-400 animate-ping'
                      : isAccused
                      ? 'bg-red-500 animate-ping'
                      : isTargeted
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                />
                <span className="font-space font-bold text-[10px] uppercase tracking-wider">
                  {!seat.isAlive ? `💀 [CHẾT] ${seat.nickname}` : seat.nickname}
                </span>

                {/* Vote Counter Badge */}
                {seat.votes > 0 && seat.isAlive && (
                  <span className="px-1.5 py-0.2 rounded bg-red-600 text-white font-mono font-black text-[9px] shadow animate-pulse">
                    🔥 {seat.votes} PHIẾU
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default LiarsBar3DExperience;
