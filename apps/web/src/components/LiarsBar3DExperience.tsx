'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ClientRoomView } from '@werewolf/shared';

// ============================================================================
// 1. TAVERN WEB AUDIO SYNTHESIZER (IMMERSIVE SFX)
// ============================================================================
class TavernAudioEngine {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  public playGunCock() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(750, now);
    osc.frequency.exponentialRampToValueAtTime(1550, now + 0.08);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playCylinderSpin() {
    this.init();
    if (!this.ctx) return;
    for (let i = 0; i < 7; i++) {
      const t = this.ctx.currentTime + i * 0.04;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1100 + i * 65, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.02);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.02);
    }
  }

  public playDryFire() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playGunshot() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.65;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600, now);
    filter.frequency.exponentialRampToValueAtTime(40, now + 0.55);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(1.0, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + 0.6);
  }

  public playCardFlip() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.06);
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }
}

const tavernAudio = new TavernAudioEngine();

// ============================================================================
// 2. TYPES & 3D CHARACTER HELPERS (NO T-POSE, ANTHROPOMORPHIC WEREWOLF)
// ============================================================================
export interface TableOpponent {
  id: string;
  seatNumber: number;
  nickname: string;
  roleHint: string;
  isDead: boolean;
  votes: number;
  dialogue?: string;
  modelFile: string;
  scale: number;
}

export interface LiarsBar3DProps {
  room?: ClientRoomView | any;
  currentPlayerId?: string;
  isPov2?: boolean;
  setIsPov2?: (v: boolean | ((p: boolean) => boolean)) => void;
  onAimAtPlayer?: (targetId: string, nickname: string) => void;
  onShootPlayer?: (targetId: string, nickname: string) => void;
  onPlayCard?: (cardName: string) => void;
  onSpinChamber?: () => void;
  onPullRouletteTrigger?: () => boolean;
}

// Natural seated poker table poses for humanoid characters (removes awkward T-pose)
function applyPokerSittingPose(model: THREE.Object3D, isGirl = false) {
  const upperL = model.getObjectByName('UpperArmL');
  const lowerL = model.getObjectByName('LowerArmL');
  const upperR = model.getObjectByName('UpperArmR');
  const lowerR = model.getObjectByName('LowerArmR');
  const chest = model.getObjectByName('Chest');
  const head = model.getObjectByName('Head');

  if (upperL && lowerL && upperR && lowerR) {
    if (isGirl) {
      // Demure folded hands pose resting on the table
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

// Attach 3D Lupine Werewolf features to create authentic Liar's Bar style Ma Sói
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

  // 3. Piercing Predatory Werewolf Eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff2200 });
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), eyeMat);
  eyeL.position.set(-0.065, 0.07, 0.135);
  wolfGroup.add(eyeL);

  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), eyeMat);
  eyeR.position.set(0.065, 0.07, 0.135);
  wolfGroup.add(eyeR);

  headBone.add(wolfGroup);
}

export function LiarsBar3DExperience({
  room,
  currentPlayerId,
  isPov2,
  setIsPov2,
  onAimAtPlayer,
  onShootPlayer,
  onPlayCard,
}: LiarsBar3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  // Gameplay state
  const [isAimingGun, setIsAimingGun] = useState(false);
  const [hoveredTargetId, setHoveredTargetId] = useState<string | null>(null);
  const [revolverFired, setRevolverFired] = useState(false);
  const [rouletteOpen, setRouletteOpen] = useState(false);
  const [chamberSlot, setChamberSlot] = useState(1);
  const [bulletLoadedSlot] = useState(() => Math.floor(Math.random() * 6) + 1);
  const [rouletteResult, setRouletteResult] = useState<string | null>(null);

  // Screen-projected positions for 3D nametags / dialogue
  const [screenPos, setScreenPos] = useState<{ [id: string]: { x: number; y: number; visible: boolean } }>({});

  const accusedId = room?.day?.accusedId || 'wolf';

  // Refs for reactive values inside Three.js animation loop without rebuilding scene
  const isAimingGunRef = useRef(isAimingGun);
  useEffect(() => {
    isAimingGunRef.current = isAimingGun;
  }, [isAimingGun]);

  const hoveredTargetIdRef = useRef(hoveredTargetId);
  useEffect(() => {
    hoveredTargetIdRef.current = hoveredTargetId;
  }, [hoveredTargetId]);

  const accusedIdRef = useRef(accusedId);
  useEffect(() => {
    accusedIdRef.current = accusedId;
  }, [accusedId]);

  // 4 3D Opponents sitting at the poker table: Ma Sói, Bố Già, Cô Gái, Thợ Săn
  const [opponents, setOpponents] = useState<TableOpponent[]>([
    {
      id: 'wolf',
      seatNumber: 1,
      nickname: '#01 MA SÓI (WEREWOLF)',
      roleHint: 'Bóng Ma Khát Máu',
      isDead: false,
      votes: 1,
      dialogue: 'Mùi máu tươi của lũ cừu non... Đêm nay ai sẽ là bữa tối của ta?!',
      modelFile: '/models/punk_mobster.glb',
      scale: 0.94,
    },
    {
      id: 'mobster',
      seatNumber: 2,
      nickname: '#02 BỐ GIÀ (THE DON)',
      roleHint: 'Trùm Mafia Sòng Bạc',
      isDead: false,
      votes: 0,
      dialogue: 'Cứ bình tĩnh... Hãy đặt cược số phận của các ngươi lên bàn poker này.',
      modelFile: '/models/suit_mobster.glb',
      scale: 0.94,
    },
    {
      id: 'girl',
      seatNumber: 3,
      nickname: '#03 CÔ GÁI (VILLAGER)',
      roleHint: 'Dân Làng Vô Tội',
      isDead: false,
      votes: 0,
      dialogue: 'Làm ơn tin tôi đi, tôi thực sự chỉ là dân làng thôi mà...',
      modelFile: '/models/village_girl.glb',
      scale: 0.94,
    },
    {
      id: 'hunter',
      seatNumber: 4,
      nickname: '#04 THỢ SĂN (HUNTER)',
      roleHint: 'Xạ Thủ Bạc Đạn',
      isDead: false,
      votes: 2,
      dialogue: 'Khẩu súng này không bao giờ bắn trượt một con sói nào!',
      modelFile: '/models/cowboy_mobster.glb',
      scale: 0.94,
    },
  ]);

  // Cards on hand
  const [handCards] = useState([
    { id: 1, name: 'TIÊN TRI', sub: 'SOI ĐÊM', type: 'seer', icon: '🔮', desc: 'Tìm diệt Ma Sói trong làng' },
    { id: 2, name: 'TREO CỔ', sub: '#04 TAY ANH CHỊ', type: 'verdict', icon: '⚖️', desc: '3/5 Phiếu phán quyết' },
    { id: 3, name: 'DÂN LÀNG', sub: 'LƯƠNG THIỆN', type: 'village', icon: '🧑🌾', desc: 'Bầu chọn treo cổ kẻ ác' },
    { id: 4, name: 'PHIẾU TRẮNG', sub: 'TRUNG LẬP', type: 'skip', icon: '🕊️', desc: 'Từ chối phán quyết' },
  ]);
  const [inspectedCardId, setInspectedCardId] = useState<number | null>(null);

  // Refs for animation loop
  const mouseRef = useRef({ targetYaw: 0, targetPitch: 0 });
  const threeRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    revolverGroup: THREE.Group;
    muzzleLight: THREE.PointLight;
    lampGroup: THREE.Group;
    playedCardsGroup: THREE.Group;
    candleLight1: THREE.PointLight;
    candleLight2: THREE.PointLight;
    raycaster: THREE.Raycaster;
    shootRecoil: number;
    charObjects: {
      [id: string]: {
        root: THREE.Object3D;
        baseY: number;
      };
    };
  } | null>(null);

  // ============================================================================
  // 3. INITIALIZE 100% PURE REAL-TIME 3D WEBGL ENGINE SCENE (LIKE LIAR'S BAR)
  // ZERO 2D BACKGROUND IMAGES! FULLY 3D MODELED WORLD!
  // ============================================================================
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // A. RENDERER (Cinematic Dark Mode Noir Speakeasy)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.replaceChildren(renderer.domElement);

    // B. SCENE & ATMOSPHERE (Deep Noir Dark Speakeasy Tavern)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0706);
    scene.fog = new THREE.Fog(0x0a0706, 6, 22);

    // C. CAMERA (FPS Perspective)
    const camera = new THREE.PerspectiveCamera(58, width / height, 0.1, 40);
    camera.position.set(0, 1.52, 2.05);
    camera.lookAt(0, 1.15, -0.4);

    // D. MULTI-SOURCE CINEMATIC LIGHTING (DARK MODE BALANCED)
    // 1. Subtle Warm Ambient Fill (leaves deep cinematic shadows)
    const ambientLight = new THREE.AmbientLight(0xffecd2, 0.75);
    scene.add(ambientLight);

    // 2. Deep Floor Bounce
    const hemiLight = new THREE.HemisphereLight(0x3d2417, 0x0a0705, 0.55);
    scene.add(hemiLight);

    // 3. Overhead Swinging Brass Lantern
    const lampGroup = new THREE.Group();
    lampGroup.position.set(0, 3.4, 0);

    const chainGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.2, 8);
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1f1915, roughness: 0.7, metalness: 0.8 });
    const chainMesh = new THREE.Mesh(chainGeo, metalMat);
    chainMesh.position.y = -0.6;
    lampGroup.add(chainMesh);

    const shadeGeo = new THREE.ConeGeometry(0.44, 0.30, 24, 1, true);
    const brassMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.4, metalness: 0.8 });
    const shadeMesh = new THREE.Mesh(shadeGeo, brassMat);
    shadeMesh.position.y = -1.2;
    shadeMesh.rotation.x = Math.PI;
    lampGroup.add(shadeMesh);

    const bulbMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffd27d })
    );
    bulbMesh.position.y = -1.25;
    lampGroup.add(bulbMesh);

    const lanternLight = new THREE.PointLight(0xff9922, 5.0, 9, 1.2);
    lanternLight.position.set(0, -1.3, 0);
    lanternLight.castShadow = true;
    lampGroup.add(lanternLight);
    scene.add(lampGroup);

    // 4. Focused Table Spotlight (Pool of warm light on felt)
    const tableSpot = new THREE.SpotLight(0xffe0b2, 9.0, 9, Math.PI / 3.4, 0.5, 1.2);
    tableSpot.position.set(0, 3.2, 0);
    tableSpot.target.position.set(0, 1.0, 0);
    tableSpot.castShadow = true;
    scene.add(tableSpot);
    scene.add(tableSpot.target);

    // 5. Dynamic Flickering Table Candlelights
    const candleLight1 = new THREE.PointLight(0xff9922, 2.2, 3.5, 1.2);
    candleLight1.position.set(-0.65, 1.15, -0.2);
    scene.add(candleLight1);

    const candleLight2 = new THREE.PointLight(0xff9922, 2.2, 3.5, 1.2);
    candleLight2.position.set(0.65, 1.15, -0.2);
    scene.add(candleLight2);

    // 6. Character Face & Body Key Lights (Dedicated dramatic lighting for each seat)
    const charLights = [
      { pos: [-1.45, 1.70, -0.45], color: 0xffd59e, intensity: 2.8 }, // Seat 1
      { pos: [-0.65, 1.75, -1.30], color: 0xffe2b8, intensity: 2.8 }, // Seat 2
      { pos: [0.65, 1.75, -1.30], color: 0xffe2b8, intensity: 2.8 },  // Seat 3
      { pos: [1.45, 1.70, -0.45], color: 0xffd59e, intensity: 2.8 },  // Seat 4
    ];
    charLights.forEach((cl) => {
      const pl = new THREE.PointLight(cl.color, cl.intensity, 4.0, 1.2);
      pl.position.set(...(cl.pos as [number, number, number]));
      scene.add(pl);
    });

    // Muzzle flash light
    const muzzleLight = new THREE.PointLight(0xfff5e6, 0, 8, 1.5);
    muzzleLight.position.set(0, -0.1, -0.3);
    camera.add(muzzleLight);

    // E. 100% REAL 3D TAVERN ROOM (DARK NOIR SPEAKEASY)
    // 1. Dark Smoked Parquet Floor
    const floorGeo = new THREE.PlaneGeometry(16, 16);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x150e09, roughness: 0.6, metalness: 0.1 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // 2. Dark Rustic Timber Ceiling
    const ceilingGeo = new THREE.PlaneGeometry(16, 16);
    const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x0d0805, roughness: 0.85 });
    const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceilingMesh.position.y = 4.2;
    ceilingMesh.rotation.x = Math.PI / 2;
    scene.add(ceilingMesh);

    for (let beam = -3; beam <= 3; beam += 2) {
      const beamGeo = new THREE.BoxGeometry(16, 0.35, 0.25);
      const beamMat = new THREE.MeshStandardMaterial({ color: 0x100804, roughness: 0.75 });
      const beamMesh = new THREE.Mesh(beamGeo, beamMat);
      beamMesh.position.set(0, 4.05, beam);
      scene.add(beamMesh);
    }

    // 3. Dark Mahogany Back Wall with Bar & Shelves
    const backWallGeo = new THREE.PlaneGeometry(16, 5);
    const backWallMat = new THREE.MeshStandardMaterial({ color: 0x1a1008, roughness: 0.7 });
    const backWall = new THREE.Mesh(backWallGeo, backWallMat);
    backWall.position.set(0, 2.5, -3.8);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Bar Mirror
    const mirrorGeo = new THREE.PlaneGeometry(6.2, 1.8);
    const mirrorMat = new THREE.MeshStandardMaterial({ color: 0x1e2530, roughness: 0.2, metalness: 0.8 });
    const mirror = new THREE.Mesh(mirrorGeo, mirrorMat);
    mirror.position.set(0, 2.4, -3.75);
    scene.add(mirror);

    // 3 Tiers of Polished Wood Shelves
    const shelfHeights = [1.6, 2.2, 2.8];
    shelfHeights.forEach((shY) => {
      const shGeo = new THREE.BoxGeometry(6.6, 0.08, 0.38);
      const shMat = new THREE.MeshStandardMaterial({ color: 0x150b05, roughness: 0.5, metalness: 0.1 });
      const shMesh = new THREE.Mesh(shGeo, shMat);
      shMesh.position.set(0, shY, -3.6);
      scene.add(shMesh);

      // Under-shelf warm strip light
      const stripLight = new THREE.PointLight(0xff9922, 0.8, 3, 1.5);
      stripLight.position.set(0, shY - 0.05, -3.5);
      scene.add(stripLight);
    });

    // Radiant Liquor Bottles on the Shelves
    const bottlePalettes = [0xef4444, 0xf59e0b, 0x10b981, 0x3b82f6, 0xd97706];
    shelfHeights.forEach((shY) => {
      for (let b = 0; b < 14; b++) {
        const bottleColor = bottlePalettes[(b + Math.floor(shY * 3)) % bottlePalettes.length];
        const bottleGeo = new THREE.CylinderGeometry(0.045, 0.055, 0.28, 8);
        const bottleMat = new THREE.MeshStandardMaterial({
          color: bottleColor,
          roughness: 0.15,
          metalness: 0.3,
          transparent: true,
          opacity: 0.88,
        });
        const bottle = new THREE.Mesh(bottleGeo, bottleMat);
        bottle.position.set(-2.8 + b * 0.43, shY + 0.16, -3.58);
        scene.add(bottle);
      }
    });

    // Glowing Neon "LIAR'S BAR" Sign
    const neonFrameGeo = new THREE.BoxGeometry(2.4, 0.65, 0.08);
    const neonFrameMat = new THREE.MeshStandardMaterial({ color: 0x0f0f12, roughness: 0.8 });
    const neonFrame = new THREE.Mesh(neonFrameGeo, neonFrameMat);
    neonFrame.position.set(0, 3.4, -3.72);
    scene.add(neonFrame);

    const neonSignGeo = new THREE.BoxGeometry(2.1, 0.45, 0.04);
    const neonSignMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const neonSign = new THREE.Mesh(neonSignGeo, neonSignMat);
    neonSign.position.set(0, 3.4, -3.68);
    scene.add(neonSign);

    // Left and Right Walls
    const sideWallGeo = new THREE.PlaneGeometry(16, 5);
    const sideWallMat = new THREE.MeshStandardMaterial({ color: 0x180f08, roughness: 0.7 });

    const leftWall = new THREE.Mesh(sideWallGeo, sideWallMat);
    leftWall.position.set(-4.2, 2.5, 0);
    leftWall.rotation.y = Math.PI / 2;
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(sideWallGeo, sideWallMat);
    rightWall.position.set(4.2, 2.5, 0);
    rightWall.rotation.y = -Math.PI / 2;
    scene.add(rightWall);

    // F. 100% REAL 3D CASINO POKER TABLE (DEEP EMERALD NOIR)
    const tableGroup = new THREE.Group();
    tableGroup.position.set(0, 0, 0);

    // Deep Velvet Emerald Green Poker Felt
    const feltGeo = new THREE.CylinderGeometry(1.68, 1.68, 0.08, 48);
    const feltMat = new THREE.MeshStandardMaterial({ color: 0x0e4726, roughness: 0.72, metalness: 0.05 });
    const feltMesh = new THREE.Mesh(feltGeo, feltMat);
    feltMesh.position.y = 1.0;
    feltMesh.receiveShadow = true;
    tableGroup.add(feltMesh);

    // Inner Polished Golden Betting Ring
    const betRingGeo = new THREE.TorusGeometry(1.22, 0.016, 8, 48);
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.85 });
    const betRing = new THREE.Mesh(betRingGeo, goldMat);
    betRing.rotation.x = Math.PI / 2;
    betRing.position.y = 1.045;
    tableGroup.add(betRing);

    // Outer Dark Mahogany Beveled Armrest
    const rimGeo = new THREE.TorusGeometry(1.75, 0.15, 16, 48);
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x2e1408, roughness: 0.35, metalness: 0.15 });
    const rimMesh = new THREE.Mesh(rimGeo, woodMat);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.y = 1.04;
    rimMesh.castShadow = true;
    rimMesh.receiveShadow = true;
    tableGroup.add(rimMesh);

    // Heavy Central Pedestal Base
    const pillarGeo = new THREE.CylinderGeometry(0.38, 0.65, 1.0, 24);
    const pillarMesh = new THREE.Mesh(pillarGeo, woodMat);
    pillarMesh.position.y = 0.5;
    pillarMesh.castShadow = true;
    tableGroup.add(pillarMesh);

    // Table Props: Stacks of Casino Poker Chips
    const chipColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b];
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 1.65 - 0.82;
      const chipStackGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.05 + (i % 3) * 0.035, 16);
      const chipMat = new THREE.MeshStandardMaterial({ color: chipColors[i % chipColors.length], roughness: 0.3 });
      const stack = new THREE.Mesh(chipStackGeo, chipMat);
      stack.position.set(Math.sin(ang) * 1.25, 1.06, Math.cos(ang) * 1.25);
      stack.castShadow = true;
      tableGroup.add(stack);
    }

    // Whiskey Glasses with Amber Bourbon on Table
    for (let g = 0; g < 3; g++) {
      const gAng = [-0.9, 0, 0.9][g];
      const glassGroup = new THREE.Group();
      glassGroup.position.set(Math.sin(gAng) * 1.35, 1.05, Math.cos(gAng) * 1.35);

      const glassCup = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.05, 0.12, 16, 1, true),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, transparent: true, opacity: 0.45 })
      );
      glassCup.position.y = 0.06;
      glassGroup.add(glassCup);

      const whiskeyLiquid = new THREE.Mesh(
        new THREE.CylinderGeometry(0.048, 0.045, 0.06, 16),
        new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.2, metalness: 0.1 })
      );
      whiskeyLiquid.position.y = 0.035;
      glassGroup.add(whiskeyLiquid);
      tableGroup.add(glassGroup);
    }

    // Real 3D Candles on the table
    const candleGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.16, 12);
    const candleMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.3 });
    const candle1 = new THREE.Mesh(candleGeo, candleMat);
    candle1.position.set(-0.65, 1.12, -0.2);
    tableGroup.add(candle1);

    const candle2 = new THREE.Mesh(candleGeo, candleMat);
    candle2.position.set(0.65, 1.12, -0.2);
    tableGroup.add(candle2);

    // Dealt cards in front of each seat
    const cardGeo = new THREE.BoxGeometry(0.14, 0.004, 0.20);
    const cardBackMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.4 });
    const seatAngles = [-Math.PI / 3, -Math.PI / 8, Math.PI / 8, Math.PI / 3];
    seatAngles.forEach((ang) => {
      const cMesh = new THREE.Mesh(cardGeo, cardBackMat);
      cMesh.position.set(Math.sin(ang) * 1.1, 1.045, -Math.cos(ang) * 1.1 + 0.3);
      cMesh.rotation.y = ang + Math.PI;
      tableGroup.add(cMesh);
    });

    // Played cards group
    const playedCardsGroup = new THREE.Group();
    playedCardsGroup.position.set(0, 1.045, 0);
    tableGroup.add(playedCardsGroup);
    scene.add(tableGroup);

    // G. LOAD 3D CHAIRS & REAL 3D BIPEDAL CHARACTERS SITTING AT TABLE
    const gltfLoader = new GLTFLoader();
    const charObjects: { [id: string]: { root: THREE.Object3D; baseY: number } } = {};

    // 1. Load 3D Chairs at proper human scale (0.78x scale = 1.35m height)
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
              node.material.color.setHex(0x5c3014); // Polished mahogany saloon chair
              node.material.roughness = 0.45;
            }
          }
        });

        const chairConfigs = [
          { pos: [-1.76, 0, -0.78], rotY: 1.15 },
          { pos: [-0.78, 0, -1.80], rotY: 0.38 },
          { pos: [0.78, 0, -1.80], rotY: -0.38 },
          { pos: [1.76, 0, -0.78], rotY: -1.15 },
        ];

        chairConfigs.forEach((c) => {
          const chair = chairModel.clone();
          chair.scale.set(0.78, 0.78, 0.78);
          chair.position.set(...(c.pos as [number, number, number]));
          chair.rotation.y = c.rotY;
          scene.add(chair);
        });
      },
      undefined,
      (err) => console.error('Failed to load chair.glb:', err)
    );

    // 2. Load 4 Real 3D Characters: Ma Sói, Bố Già, Cô Gái, Thợ Săn (0.94x human scale)
    const charSeatData = [
      {
        id: 'wolf',
        file: '/models/punk_mobster.glb',
        pos: [-1.62, 0.04, -0.72] as [number, number, number],
        rotY: 1.15,
        scale: 0.94,
      },
      {
        id: 'mobster',
        file: '/models/suit_mobster.glb',
        pos: [-0.72, 0.04, -1.65] as [number, number, number],
        rotY: 0.38,
        scale: 0.94,
      },
      {
        id: 'girl',
        file: '/models/village_girl.glb',
        pos: [0.72, 0.04, -1.65] as [number, number, number],
        rotY: -0.38,
        scale: 0.94,
      },
      {
        id: 'hunter',
        file: '/models/cowboy_mobster.glb',
        pos: [1.62, 0.04, -0.72] as [number, number, number],
        rotY: -1.15,
        scale: 0.94,
      },
    ];

    charSeatData.forEach((seat) => {
      gltfLoader.load(
        seat.file,
        (gltf) => {
          const model = gltf.scene;
          model.scale.set(seat.scale, seat.scale, seat.scale);
          model.position.set(...seat.pos);
          model.rotation.y = seat.rotY;
          model.name = seat.id;

          // 1. Natural Poker Table Sitting Pose (NO T-POSE! Arms rested naturally on table)
          applyPokerSittingPose(model, seat.id === 'girl');

          // 2. If Ma Sói (Werewolf): Attach 3D wolf ears, snout, fangs, and glowing red eyes
          if (seat.id === 'wolf') {
            attachWolfHeadFeatures(model);
          }

          // 3. Materials & Shading tuned for rich Dark Mode Noir atmosphere
          model.traverse((node: any) => {
            if (node.isMesh) {
              node.castShadow = true;
              node.receiveShadow = true;
              if (node.material) {
                node.material = node.material.clone();
                node.material.roughness = 0.55;
                node.material.metalness = 0.08;

                // For Werewolf: turn skin & hair to dark charcoal wolf fur
                if (seat.id === 'wolf') {
                  const mName = (node.material.name || '').toLowerCase();
                  if (mName.includes('skin')) {
                    node.material.color.setHex(0x32353e); // Wolf grey fur
                  } else if (mName.includes('red') || mName.includes('hair')) {
                    node.material.color.setHex(0x181a1f); // Dark charcoal wolf mane
                  }
                }
              }
            }
          });

          scene.add(model);
          charObjects[seat.id] = { root: model, baseY: seat.pos[1] };
          console.log(`[LiarsBar3D] Character ${seat.id} loaded and posed successfully.`);
        },
        undefined,
        (err) => console.error(`[LiarsBar3D] Failed to load ${seat.file}:`, err)
      );
    });

    // H. LOAD PLAYER'S 3D FIRST-PERSON REVOLVER (FPS WEAPON)
    const revolverGroup = new THREE.Group();
    revolverGroup.position.set(0.22, -0.22, -0.42);

    gltfLoader.load('/models/revolver.glb', (gltf) => {
      const gunModel = gltf.scene;
      gunModel.scale.set(0.12, 0.12, 0.12);
      gunModel.rotation.y = -Math.PI / 2;
      gunModel.traverse((node: any) => {
        if (node.isMesh) {
          node.castShadow = true;
          if (node.material) {
            node.material = node.material.clone();
            const matName = (node.material.name || '').toLowerCase();
            if (matName.includes('grip') || matName.includes('wood')) {
              node.material.color.setHex(0x5c3014); // Walnut wood grip
              node.material.roughness = 0.45;
            } else {
              node.material.color.setHex(0x8a939d); // Polished blued steel barrel
              node.material.metalness = 0.85;
              node.material.roughness = 0.3;
            }
          }
        }
      });
      revolverGroup.add(gunModel);
    });

    camera.add(revolverGroup);
    scene.add(camera);

    // Save refs for animation loop
    threeRef.current = {
      renderer,
      scene,
      camera,
      revolverGroup,
      muzzleLight,
      lampGroup,
      playedCardsGroup,
      candleLight1,
      candleLight2,
      raycaster: new THREE.Raycaster(),
      shootRecoil: 0,
      charObjects,
    };

    // I. RESIZE HANDLER
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // J. ANIMATION LOOP
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const t = clock.getElapsedTime();
      const state = threeRef.current;
      if (!state) return;

      // 1. Smooth Camera FPS Look
      const targetYaw = mouseRef.current.targetYaw;
      const targetPitch = mouseRef.current.targetPitch;
      camera.rotation.y += (targetYaw - camera.rotation.y) * 0.08;
      camera.rotation.x += (targetPitch - camera.rotation.x) * 0.08;

      // Subtle breathing camera sway
      camera.position.y = 1.52 + Math.sin(t * 1.6) * 0.005;

      // 2. Hanging Lamp Swing
      state.lampGroup.rotation.z = Math.sin(t * 1.4) * 0.025;
      state.lampGroup.rotation.x = Math.cos(t * 1.1) * 0.018;

      // 3. Candle Flame Light Flicker
      state.candleLight1.intensity = 3.5 + Math.sin(t * 12) * 0.3;
      state.candleLight2.intensity = 3.5 + Math.cos(t * 14) * 0.3;

      // 4. Subtle Character Breathing & Hover Reaction
      Object.entries(state.charObjects).forEach(([id, char], idx) => {
        const isHovered = hoveredTargetIdRef.current === id;
        const breath = Math.sin(t * 2.0 + idx * 1.2) * 0.005;
        char.root.position.y = char.baseY + breath;

        // Subtle head turn towards camera
        const head = char.root.getObjectByName('Head');
        if (head) {
          head.rotation.y = Math.sin(t * 1.2 + idx) * 0.08;
        }

        // Proper human scale with subtle emphasis when hovered
        const targetScale = isHovered ? 0.98 : 0.94;
        char.root.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12);
      });

      // 5. Player's Revolver Stance (Hip vs ADS Aiming)
      const targetGunPos = isAimingGunRef.current
        ? new THREE.Vector3(0, -0.13, -0.32) // Center ADS
        : new THREE.Vector3(0.22, -0.22, -0.42); // Hip

      // Apply recoil recovery
      state.shootRecoil = THREE.MathUtils.lerp(state.shootRecoil, 0, 0.14);
      const recoilOffset = new THREE.Vector3(0, state.shootRecoil * 0.08, state.shootRecoil * 0.12);

      state.revolverGroup.position.lerp(targetGunPos.clone().add(recoilOffset), 0.15);
      state.revolverGroup.rotation.x = isAimingGunRef.current
        ? state.shootRecoil * 0.4
        : THREE.MathUtils.lerp(state.revolverGroup.rotation.x, 0.05, 0.1);

      // 6. Update Screen Positions for 3D Nametags
      const projectToScreen = (root?: THREE.Object3D) => {
        if (!root) return { x: 0, y: 0, visible: false };
        const v = new THREE.Vector3();
        root.getWorldPosition(v);
        v.y += 1.88; // above 3D character head
        v.project(camera);
        const sx = ((v.x + 1) * width) / 2;
        const sy = ((-v.y + 1) * height) / 2;
        return { x: sx, y: sy, visible: v.z < 1 };
      };

      setScreenPos({
        wolf: projectToScreen(state.charObjects['wolf']?.root),
        mobster: projectToScreen(state.charObjects['mobster']?.root),
        girl: projectToScreen(state.charObjects['girl']?.root),
        hunter: projectToScreen(state.charObjects['hunter']?.root),
      });

      // Render 3D Scene
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Mouse move handler for 3D FPS rotation & Raycasting
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mountRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / rect.width - 0.5;
    const normY = (e.clientY - rect.top) / rect.height - 0.5;

    mouseRef.current.targetYaw = -normX * 0.72;
    mouseRef.current.targetPitch = -normY * 0.42;

    // Raycast to detect hover on 3D character models
    if (threeRef.current) {
      const mouse = new THREE.Vector2(normX * 2, -normY * 2);
      threeRef.current.raycaster.setFromCamera(mouse, threeRef.current.camera);

      const targets: THREE.Object3D[] = [];
      const charIds: string[] = [];
      for (const [id, char] of Object.entries(threeRef.current.charObjects)) {
        targets.push(char.root);
        charIds.push(id);
      }

      const intersects = threeRef.current.raycaster.intersectObjects(targets, true);
      if (intersects.length > 0) {
        let hit = intersects[0].object;
        while (hit.parent && !charIds.includes(hit.name)) {
          for (const id of charIds) {
            if (threeRef.current.charObjects[id]?.root === hit) {
              setHoveredTargetId(id);
              return;
            }
          }
          hit = hit.parent;
        }
        if (charIds.includes(hit.name)) {
          setHoveredTargetId(hit.name);
          return;
        }
      } else {
        setHoveredTargetId(null);
      }
    }
  };

  // Keyboard controls [R] and [F]
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'r' || e.key === 'R') {
        tavernAudio.playGunCock();
        setIsAimingGun((prev) => !prev);
      }
      if (e.key === 'f' || e.key === 'F') {
        tavernAudio.playCylinderSpin();
        setChamberSlot((prev) => (prev % 6) + 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fire gun at opponent
  const handleFireAtOpponent = (targetId: string) => {
    const target = opponents.find((o) => o.id === targetId);
    if (!target || target.isDead) return;

    tavernAudio.playGunCock();
    setTimeout(() => {
      tavernAudio.playGunshot();
      setRevolverFired(true);

      if (threeRef.current) {
        threeRef.current.shootRecoil = 1.0;
        threeRef.current.muzzleLight.intensity = 9.0;
        setTimeout(() => {
          if (threeRef.current) threeRef.current.muzzleLight.intensity = 0;
          setRevolverFired(false);
        }, 60);

        // Character death animation in 3D: flinch and drop
        const char = threeRef.current.charObjects[targetId];
        if (char) {
          char.root.rotation.x -= 0.6;
          char.root.position.y -= 0.5;
        }
      }

      setOpponents((prev) => prev.map((o) => (o.id === targetId ? { ...o, isDead: true } : o)));

      if (onShootPlayer) onShootPlayer(target.id, target.nickname);
    }, 50);
  };

  // Play card onto 3D table felt
  const handlePlayCardToTable = (card: { id: number; name: string }) => {
    tavernAudio.playCardFlip();

    if (threeRef.current) {
      const cardGeo = new THREE.BoxGeometry(0.18, 0.004, 0.26);
      const cardMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.5 });
      const cardMesh = new THREE.Mesh(cardGeo, cardMat);

      const randX = (Math.random() - 0.5) * 0.6;
      const randZ = (Math.random() - 0.5) * 0.4;
      const randRotY = (Math.random() - 0.5) * 0.8;

      cardMesh.position.set(randX, 0.01, randZ);
      cardMesh.rotation.y = randRotY;
      cardMesh.castShadow = true;
      cardMesh.receiveShadow = true;
      threeRef.current.playedCardsGroup.add(cardMesh);
    }

    if (onPlayCard) onPlayCard(card.name);
  };

  // Russian Roulette pull trigger
  const handlePullRouletteTrigger = () => {
    tavernAudio.playGunCock();
    setTimeout(() => {
      if (chamberSlot === bulletLoadedSlot) {
        tavernAudio.playGunshot();
        setRevolverFired(true);
        if (threeRef.current) {
          threeRef.current.shootRecoil = 1.2;
          threeRef.current.muzzleLight.intensity = 9.0;
          setTimeout(() => {
            if (threeRef.current) threeRef.current.muzzleLight.intensity = 0;
            setRevolverFired(false);
          }, 80);
        }
        setRouletteResult('💥 BANG! BẠN ĐÃ TRÚNG ĐẠN VÀ TỬ TRẬN!');
      } else {
        tavernAudio.playDryFire();
        setRouletteResult('✨ CLICK! Ổ ĐẠN TRỐNG, BẠN VẪN SỐNG SÓT!');
        setChamberSlot((prev) => (prev % 6) + 1);
      }
    }, 120);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onClick={() => {
        if (isAimingGun && hoveredTargetId) {
          handleFireAtOpponent(hoveredTargetId);
        }
      }}
      className="relative w-full h-full overflow-hidden bg-black select-none cursor-crosshair"
    >
      {/* 1. 100% PURE REAL-TIME 3D WEBGL ENGINE VIEWPORT */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* 2. REALTIME 3D PROJECTED NAMETAGS & DIALOGUE IN 3D SPACE */}
      {opponents.map((opp) => {
        const pos = screenPos[opp.id];
        if (!pos || !pos.visible || opp.isDead) return null;
        const isTargeted = hoveredTargetId === opp.id;
        const isAccused = accusedId === opp.id;

        return (
          <div
            key={opp.id}
            style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
            className="absolute -translate-x-1/2 -translate-y-full pointer-events-none z-20 flex flex-col items-center gap-1.5 transition-transform duration-75"
          >
            {/* Dialogue Bubble */}
            {opp.dialogue && (
              <div
                className={`px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-2xl text-center max-w-[240px] ${
                  isAccused
                    ? 'bg-red-950/95 border-red-500 text-red-200 animate-bounce'
                    : isTargeted
                    ? 'bg-amber-950/95 border-amber-400 text-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.5)]'
                    : 'bg-black/85 border-stone-600/60 text-stone-300'
                }`}
              >
                <p className="font-space text-[10px] font-bold leading-tight">
                  &ldquo;{opp.dialogue}&rdquo;
                </p>
              </div>
            )}

            {/* Nametag */}
            <div
              className={`px-2.5 py-0.5 rounded-xl backdrop-blur-md border text-center transition-all whitespace-nowrap shadow-2xl ${
                isAccused
                  ? 'bg-red-950/95 border-red-500 text-red-200 animate-pulse'
                  : isTargeted
                  ? 'bg-amber-950/95 border-amber-400 text-amber-200 scale-110 shadow-[0_0_25px_rgba(251,191,36,0.8)]'
                  : 'bg-[#0b0f17]/90 border-white/15 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isAccused ? 'bg-red-500 animate-ping' : isTargeted ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                />
                <span className="font-space font-bold text-[10px] uppercase tracking-wider">
                  {opp.nickname}
                </span>
                {opp.votes > 0 && (
                  <span className="px-1.5 py-0.2 rounded bg-red-600 text-white font-mono font-bold text-[9px]">
                    {opp.votes} PHIẾU
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* 3. FPS AIMING RETICLE */}
      {isAimingGun && (
        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-red-500/90 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.9)]">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          </div>
          <div className="absolute w-16 h-[1.5px] bg-red-500/80" />
          <div className="absolute h-16 w-[1.5px] bg-red-500/80" />
        </div>
      )}

      {/* 4. FLASH ON GUNSHOT */}
      {revolverFired && (
        <div className="fixed inset-0 z-40 bg-white/70 pointer-events-none animate-ping" />
      )}

      {/* 5. INTERACTIVE CARDS ON HAND */}
      {!isAimingGun && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex items-end justify-center">
          <div className="pointer-events-auto relative flex items-end -space-x-8 mb-2">
            {handCards.map((card, idx) => {
              const isHovered = inspectedCardId === card.id;
              const tilt = (idx - 1.5) * 6;
              const translateY = isHovered ? -42 : 0;

              return (
                <div
                  key={card.id}
                  onMouseEnter={() => {
                    setInspectedCardId(card.id);
                    tavernAudio.playCardFlip();
                  }}
                  onMouseLeave={() => setInspectedCardId(null)}
                  onClick={() => handlePlayCardToTable(card)}
                  className="relative cursor-pointer transition-all duration-300 ease-out group"
                  style={{
                    transform: `translateY(${translateY}px) rotate(${tilt}deg) scale(${
                      isHovered ? 1.18 : 1
                    })`,
                    transformOrigin: 'bottom center',
                    zIndex: isHovered ? 60 : idx + 10,
                  }}
                >
                  <div
                    className={`w-32 h-48 rounded-2xl p-2.5 border flex flex-col justify-between backdrop-blur-xl transition-all shadow-2xl ${
                      isHovered
                        ? 'bg-gradient-to-t from-amber-950 via-slate-900 to-amber-900/95 border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.7)]'
                        : 'bg-gradient-to-t from-slate-950/95 via-slate-900/95 to-slate-800/90 border-slate-700/80 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-space font-bold uppercase text-amber-400">
                      <span>{card.type}</span>
                      <span>{card.icon}</span>
                    </div>

                    <div className="text-center my-auto">
                      <span className="text-3xl block group-hover:scale-125 transition-transform">
                        {card.icon}
                      </span>
                      <span className="font-space font-bold text-xs uppercase tracking-wider block mt-1.5 text-white">
                        {card.name}
                      </span>
                      <span className="text-[9px] font-mono text-amber-300/80 block mt-0.5">
                        {card.sub}
                      </span>
                    </div>

                    <div className="text-center">
                      <span className="text-[8px] font-geist text-slate-400 block group-hover:text-amber-300">
                        {isHovered ? 'CLICK ĐỂ ĐÁNH BÀI' : card.desc}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. BOTTOM CONTROLS & WEAPON ACTIONS */}
      <div className="absolute bottom-4 right-6 z-40 pointer-events-auto flex items-center gap-2.5">
        {/* Nút Cò Súng Nga */}
        <button
          onClick={() => {
            tavernAudio.playCylinderSpin();
            setRouletteOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-950 to-stone-900 border border-red-500/80 hover:border-red-400 text-red-200 hover:text-white font-space font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all hover:scale-105 active:scale-95"
        >
          <span>🎲</span>
          <span>CÒ SÚNG NGA (1/6)</span>
        </button>

        {/* Nút Rút / Hạ Súng [R] */}
        <button
          onClick={() => {
            tavernAudio.playGunCock();
            setIsAimingGun((prev) => !prev);
          }}
          className={`px-5 py-2.5 rounded-xl border font-space font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 shadow-2xl transition-all hover:scale-105 active:scale-95 ${
            isAimingGun
              ? 'bg-red-600 border-red-400 text-white shadow-[0_0_30px_rgba(239,68,68,0.8)] animate-pulse'
              : 'bg-stone-900/90 border-amber-500/80 text-amber-300 hover:border-amber-400 hover:bg-stone-800'
          }`}
        >
          <span>🔫</span>
          <span>{isAimingGun ? 'HẠ SÚNG [R]' : 'RÚT SÚNG [R]'}</span>
        </button>
      </div>

      {/* 7. RUSSIAN ROULETTE MODAL */}
      {rouletteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative w-full max-w-md bg-stone-950 border border-red-600/80 rounded-2xl p-6 shadow-[0_0_60px_rgba(220,38,38,0.5)] text-center font-geist">
            <h3 className="font-space font-black text-xl text-red-400 tracking-wider uppercase mb-1">
              🎲 CÒ QUAY NGA — RUSSIAN ROULETTE
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Ổ đạn 6 lỗ có đúng 1 viên đạn. Thử vận may của bạn!
            </p>

            <div className="relative w-44 h-44 mx-auto mb-6 flex items-center justify-center">
              <div className="w-36 h-36 rounded-full bg-stone-900 border-2 border-stone-700 flex items-center justify-center relative">
                {[1, 2, 3, 4, 5, 6].map((slot) => {
                  const ang = ((slot - 1) / 6) * Math.PI * 2;
                  const x = Math.sin(ang) * 45;
                  const y = -Math.cos(ang) * 45;
                  const isCurrent = slot === chamberSlot;

                  return (
                    <div
                      key={slot}
                      className={`absolute w-7 h-7 rounded-full border flex items-center justify-center text-xs font-space font-bold transition-all ${
                        isCurrent
                          ? 'bg-red-600 border-red-300 text-white scale-125 shadow-[0_0_15px_rgba(239,68,68,1)]'
                          : 'bg-stone-800 border-stone-600 text-slate-400'
                      }`}
                      style={{ transform: `translate(${x}px, ${y}px)` }}
                    >
                      {slot}
                    </div>
                  );
                })}
                <span className="text-2xl">💀</span>
              </div>
            </div>

            {rouletteResult && (
              <div
                className={`p-3 rounded-xl mb-4 font-space font-bold text-sm uppercase ${
                  rouletteResult.includes('BANG')
                    ? 'bg-red-950/90 border border-red-500 text-red-200 animate-bounce'
                    : 'bg-emerald-950/90 border border-emerald-500 text-emerald-200'
                }`}
              >
                {rouletteResult}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  tavernAudio.playCylinderSpin();
                  setChamberSlot((prev) => (prev % 6) + 1);
                  setRouletteResult(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-600 text-slate-200 font-space text-xs font-bold uppercase transition-all"
              >
                🔄 XOAY Ổ ĐẠN [F]
              </button>
              <button
                onClick={handlePullRouletteTrigger}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-space text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(239,68,68,0.7)]"
              >
                💥 BÓP CÒ
              </button>
              <button
                onClick={() => setRouletteOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-slate-400 font-space text-xs font-bold uppercase"
              >
                ĐÓNG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LiarsBar3DExperience;
