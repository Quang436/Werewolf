'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { ClientRoomView } from '@werewolf/shared';

// ============================================================================
// 1. TAVERN AUDIO ENGINE (SYNTHESIZED WEB AUDIO SFX)
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
    osc.frequency.exponentialRampToValueAtTime(1500, now + 0.08);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playCylinderSpin() {
    this.init();
    if (!this.ctx) return;
    for (let i = 0; i < 6; i++) {
      const t = this.ctx.currentTime + i * 0.045;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1100 + i * 70, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.02);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.02);
    }
  }

  public playGunshot() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(60, now + 0.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(1.0, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + 0.5);
  }

  public playCardFlip() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(560, now + 0.06);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }
}

const tavernAudio = new TavernAudioEngine();

// ============================================================================
// 2. CHARACTER DEFINITIONS & RIG TYPES
// ============================================================================
interface CharacterRig {
  id: string;
  name: string;
  role: string;
  angle: number; // Angle in radians around table
  isDead: boolean;
  isAccused: boolean;
  rootGroup: THREE.Group;
  headGroup: THREE.Group;
  torsoGroup: THREE.Group;
  leftArmGroup: THREE.Group;
  rightArmGroup: THREE.Group;
  cardsInHandGroup: THREE.Group;
  handsRaised: boolean;
  baseY: number;
  idlePhase: number;
  lookTarget: THREE.Vector3;
  // Screen projected coordinates for HUD
  screenX: number;
  screenY: number;
  visibleOnScreen: boolean;
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
  onPullRouletteTrigger?: () => boolean; // return true if fired bullet
}

export function LiarsBar3DExperience({
  room,
  currentPlayerId,
  isPov2,
  setIsPov2,
  onAimAtPlayer,
  onShootPlayer,
  onPlayCard,
  onSpinChamber,
  onPullRouletteTrigger,
}: LiarsBar3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  // Gameplay state
  const [isAimingGun, setIsAimingGun] = useState(false);
  const [hoveredTarget, setHoveredTarget] = useState<string | null>(null);
  const [rouletteOpen, setRouletteOpen] = useState(false);
  const [revolverFired, setRevolverFired] = useState(false);
  const [screenHudPositions, setScreenHudPositions] = useState<{ [id: string]: { x: number; y: number; visible: boolean } }>({});

  // Russian Roulette state
  const [chamberSlot, setChamberSlot] = useState(1);
  const [bulletLoadedSlot] = useState(() => Math.floor(Math.random() * 6) + 1);
  const [rouletteResult, setRouletteResult] = useState<string | null>(null);

  // Cards on hand
  const [handCards, setHandCards] = useState([
    { id: 1, name: 'DÂN LÀNG', type: 'village', icon: '🧑‍🌾' },
    { id: 2, name: 'TIÊN TRI', type: 'seer', icon: '🔮' },
    { id: 3, name: 'BẢO VỆ', type: 'guard', icon: '🛡️' },
    { id: 4, name: 'PHIẾU TRẮNG', type: 'skip', icon: '🕊️' },
    { id: 5, name: 'QUỶ ÁM', type: 'devil', icon: '🃏' },
  ]);
  const [inspectedCard, setInspectedCard] = useState<number | null>(null);

  // Camera & Mouse tracking
  const mousePosRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const threeStateRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    characters: CharacterRig[];
    lanternLight: THREE.PointLight;
    lanternMesh: THREE.Group;
    gunGroup: THREE.Group;
    muzzleLight: THREE.PointLight;
    muzzleFlashMesh: THREE.Mesh;
    recoilAmount: number;
    playedCardsGroup: THREE.Group;
  } | null>(null);

  // --------------------------------------------------------------------------
  // 3. INITIALIZE THREE.JS SCENE WITH 3D RIGGED CHARACTERS & TAVERN
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06080d);
    scene.fog = new THREE.FogExp2(0x06080d, 0.045);

    // 2. Camera: Placed at player eye level looking slightly down at center table
    const camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 100);
    camera.position.set(0, 2.3, 3.8);
    camera.lookAt(0, 1.4, 0);

    // 3. Renderer with soft shadows
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 4. Atmospheric Lights
    const ambientLight = new THREE.AmbientLight(0x181e2b, 1.2);
    scene.add(ambientLight);

    // Rim light from behind opponents
    const backRimLight = new THREE.DirectionalLight(0x3b82f6, 0.55);
    backRimLight.position.set(0, 6, -8);
    scene.add(backRimLight);

    // Swinging Lantern Hanging Over Table
    const lanternGroup = new THREE.Group();
    lanternGroup.position.set(0, 4.6, 0);

    // Lamp Chain & Shade
    const chainGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.4, 8);
    const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.5, metalness: 0.8 });
    const chainMesh = new THREE.Mesh(chainGeo, darkMetalMat);
    chainMesh.position.y = -0.7;
    lanternGroup.add(chainMesh);

    const shadeGeo = new THREE.ConeGeometry(0.35, 0.28, 16, 1, true);
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.7 });
    const shadeMesh = new THREE.Mesh(shadeGeo, brassMat);
    shadeMesh.position.y = -1.4;
    lanternGroup.add(shadeMesh);

    // Glowing Bulb & Warm Swinging Point Light
    const bulbGeo = new THREE.SphereGeometry(0.08, 12, 12);
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
    bulbMesh.position.y = -1.48;
    lanternGroup.add(bulbMesh);

    const lanternLight = new THREE.PointLight(0xffb238, 3.8, 14, 1.2);
    lanternLight.position.set(0, -1.5, 0);
    lanternLight.castShadow = true;
    lanternLight.shadow.bias = -0.002;
    lanternLight.shadow.mapSize.width = 1024;
    lanternLight.shadow.mapSize.height = 1024;
    lanternGroup.add(lanternLight);

    scene.add(lanternGroup);

    // 5. Tavern Room Environment (Wood floor & dark walls)
    const floorGeo = new THREE.PlaneGeometry(24, 24);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f0b08,
      roughness: 0.85,
      metalness: 0.1,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = 0;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Back wall
    const wallGeo = new THREE.PlaneGeometry(24, 10);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x0a0c12, roughness: 0.9 });
    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.set(0, 5, -8);
    scene.add(backWall);

    // 6. Round Liar's Bar Poker Table
    const tableGroup = new THREE.Group();
    tableGroup.position.set(0, 0, 0);

    // Main circular wooden tabletop
    const tableTopGeo = new THREE.CylinderGeometry(2.35, 2.35, 0.12, 48);
    const tableWoodMat = new THREE.MeshStandardMaterial({ color: 0x27170e, roughness: 0.45, metalness: 0.2 });
    const tableTop = new THREE.Mesh(tableTopGeo, tableWoodMat);
    tableTop.position.y = 1.35;
    tableTop.receiveShadow = true;
    tableTop.castShadow = true;
    tableGroup.add(tableTop);

    // Green/Burgundy Felt Inlay
    const feltGeo = new THREE.CylinderGeometry(2.1, 2.1, 0.13, 48);
    const feltMat = new THREE.MeshStandardMaterial({ color: 0x0f2d1e, roughness: 0.95, metalness: 0.05 });
    const feltMesh = new THREE.Mesh(feltGeo, feltMat);
    feltMesh.position.y = 1.355;
    feltMesh.receiveShadow = true;
    tableGroup.add(feltMesh);

    // Brass edge trim
    const rimGeo = new THREE.TorusGeometry(2.28, 0.035, 12, 48);
    const rimMesh = new THREE.Mesh(rimGeo, brassMat);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.y = 1.42;
    tableGroup.add(rimMesh);

    // Center Table Pillar
    const pillarGeo = new THREE.CylinderGeometry(0.45, 0.65, 1.35, 24);
    const pillarMesh = new THREE.Mesh(pillarGeo, tableWoodMat);
    pillarMesh.position.y = 1.35 / 2;
    pillarMesh.castShadow = true;
    tableGroup.add(pillarMesh);

    // Table Props: Poker chips, glasses, revolver on table
    const chipColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b];
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2 + 0.2;
      const chipStackGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.06 + (i % 3) * 0.04, 16);
      const chipMat = new THREE.MeshStandardMaterial({ color: chipColors[i % chipColors.length], roughness: 0.4 });
      const stack = new THREE.Mesh(chipStackGeo, chipMat);
      stack.position.set(Math.cos(ang) * 1.5, 1.45, Math.sin(ang) * 1.5);
      stack.castShadow = true;
      tableGroup.add(stack);
    }

    // Played Cards group on the table
    const playedCardsGroup = new THREE.Group();
    playedCardsGroup.position.set(0, 1.425, 0);
    tableGroup.add(playedCardsGroup);

    scene.add(tableGroup);

    // ------------------------------------------------------------------------
    // 7. BUILD 7 DISTINCT 3D CHARACTER RIGS (PROCEDURAL MODELS & SKELETONS)
    // ------------------------------------------------------------------------
    const charConfigs = [
      { id: 'p1', name: 'Bác Sĩ Dịch Hạch', role: 'BÁC SĨ MỎ QUẠ', angle: -2.3, color: 0x111827, type: 'plague' },
      { id: 'p2', name: 'LordVader', role: 'CHÓ SÓI ĐẦU ĐÀN', angle: -1.6, color: 0x18181b, type: 'vader' },
      { id: 'p3', name: 'Xemesis', role: 'CÁO LỪA ĐẢO', angle: -0.85, color: 0xc2410c, type: 'fox' },
      { id: 'p4', name: 'Quản Trò', role: 'ROBOT TRỌNG TÀI', angle: 0.0, color: 0xb45309, type: 'automaton' },
      { id: 'p5', name: 'PewPew', role: 'KẺ NỔI LOẠN', angle: 0.85, color: 0x475569, type: 'bandit' },
      { id: 'p6', name: 'Độ Mixi', role: 'TRÙM BĂNG ĐẢNG', angle: 1.6, color: 0x831843, type: 'boar' },
      { id: 'p7', name: 'Mặt Nạ Vàng', role: 'DÂN LÀNG', angle: 2.3, color: 0xeab308, type: 'cultist' },
    ];

    const characters: CharacterRig[] = [];
    const tableRadius = 2.45;

    charConfigs.forEach((cfg, idx) => {
      const rootGroup = new THREE.Group();
      const x = Math.sin(cfg.angle) * tableRadius;
      const z = -Math.cos(cfg.angle) * tableRadius;
      rootGroup.position.set(x, 0, z);
      // Face towards center table
      rootGroup.lookAt(0, 1.2, 0);

      // Chair
      const chairGroup = new THREE.Group();
      const chairSeat = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.1, 0.7),
        new THREE.MeshStandardMaterial({ color: 0x3d2112, roughness: 0.6 })
      );
      chairSeat.position.set(0, 0.8, 0);
      chairSeat.castShadow = true;
      chairGroup.add(chairSeat);

      const chairBack = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.9, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x221208, roughness: 0.6 })
      );
      chairBack.position.set(0, 1.25, -0.32);
      chairBack.castShadow = true;
      chairGroup.add(chairBack);
      rootGroup.add(chairGroup);

      // Upper Body Hierarchy (Torso -> Neck -> Head)
      const torsoGroup = new THREE.Group();
      torsoGroup.position.set(0, 0.9, 0);

      // Torso / Coat Mesh
      const torsoGeo = new THREE.CylinderGeometry(0.3, 0.38, 0.85, 12);
      const coatMat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        roughness: 0.6,
        metalness: 0.2,
      });
      const torsoMesh = new THREE.Mesh(torsoGeo, coatMat);
      torsoMesh.position.y = 0.42;
      torsoMesh.castShadow = true;
      torsoMesh.receiveShadow = true;
      torsoGroup.add(torsoMesh);

      // Head Group (Pivoting neck)
      const headGroup = new THREE.Group();
      headGroup.position.set(0, 0.9, 0);

      // Procedural Head based on character type
      if (cfg.type === 'plague') {
        // Plague Doctor with beak mask and hat
        const skullGeo = new THREE.SphereGeometry(0.24, 16, 16);
        const leatherMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.7 });
        const skull = new THREE.Mesh(skullGeo, leatherMat);
        headGroup.add(skull);

        // Curved Raven Beak
        const beakGeo = new THREE.ConeGeometry(0.12, 0.55, 12);
        const beakMat = new THREE.MeshStandardMaterial({ color: 0xf3f4f6, roughness: 0.4 });
        const beak = new THREE.Mesh(beakGeo, beakMat);
        beak.rotation.x = Math.PI / 2 + 0.2;
        beak.position.set(0, -0.06, 0.35);
        beak.castShadow = true;
        headGroup.add(beak);

        // Goggles with glowing lenses
        const goggleGeo = new THREE.TorusGeometry(0.065, 0.02, 8, 16);
        const lensGeo = new THREE.CircleGeometry(0.06, 16);
        const lensMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.8 });
        [-0.1, 0.1].forEach((eyeX) => {
          const goggle = new THREE.Mesh(goggleGeo, darkMetalMat);
          goggle.position.set(eyeX, 0.05, 0.22);
          headGroup.add(goggle);
          const lens = new THREE.Mesh(lensGeo, lensMat);
          lens.position.set(eyeX, 0.05, 0.225);
          headGroup.add(lens);
        });

        // Wide-Brim Hat
        const brimGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.03, 24);
        const crownGeo = new THREE.CylinderGeometry(0.26, 0.28, 0.3, 20);
        const hatBrim = new THREE.Mesh(brimGeo, darkMetalMat);
        hatBrim.position.y = 0.22;
        hatBrim.castShadow = true;
        headGroup.add(hatBrim);
        const hatCrown = new THREE.Mesh(crownGeo, darkMetalMat);
        hatCrown.position.y = 0.37;
        headGroup.add(hatCrown);
      } else if (cfg.type === 'fox') {
        // Fox Gambler: Orange muzzle, pointed ears
        const skullGeo = new THREE.SphereGeometry(0.23, 16, 16);
        const foxFurMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 });
        const whiteFurMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.9 });
        const skull = new THREE.Mesh(skullGeo, foxFurMat);
        headGroup.add(skull);

        // Muzzle
        const muzzleGeo = new THREE.ConeGeometry(0.12, 0.32, 12);
        const muzzle = new THREE.Mesh(muzzleGeo, whiteFurMat);
        muzzle.rotation.x = Math.PI / 2;
        muzzle.position.set(0, -0.05, 0.28);
        headGroup.add(muzzle);

        // Ears
        [-0.14, 0.14].forEach((earX) => {
          const earGeo = new THREE.ConeGeometry(0.08, 0.24, 8);
          const ear = new THREE.Mesh(earGeo, foxFurMat);
          ear.position.set(earX, 0.28, 0);
          ear.rotation.z = earX > 0 ? -0.2 : 0.2;
          headGroup.add(ear);
        });
      } else if (cfg.type === 'automaton') {
        // Steampunk Robot: Brass cylindrical head, single cyclops eye
        const brassHeadGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.36, 16);
        const brassHead = new THREE.Mesh(brassHeadGeo, brassMat);
        headGroup.add(brassHead);

        // Glowing Blue Cyclops Eye
        const eyeGeo = new THREE.SphereGeometry(0.08, 12, 12);
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 1.5 });
        const eye = new THREE.Mesh(eyeGeo, eyeMat);
        eye.position.set(0, 0.05, 0.2);
        headGroup.add(eye);
      } else if (cfg.type === 'boar') {
        // Boar / Pig Boss: Tusks, snout, cigar
        const headGeo = new THREE.SphereGeometry(0.26, 16, 16);
        const pigSkinMat = new THREE.MeshStandardMaterial({ color: 0x9d174d, roughness: 0.7 });
        const headMesh = new THREE.Mesh(headGeo, pigSkinMat);
        headGroup.add(headMesh);

        // Snout
        const snoutGeo = new THREE.CylinderGeometry(0.12, 0.13, 0.12, 16);
        const snout = new THREE.Mesh(snoutGeo, new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.6 }));
        snout.rotation.x = Math.PI / 2;
        snout.position.set(0, -0.02, 0.25);
        headGroup.add(snout);

        // Tusks
        [-0.14, 0.14].forEach((tuskX) => {
          const tuskGeo = new THREE.ConeGeometry(0.04, 0.2, 8);
          const tusk = new THREE.Mesh(tuskGeo, new THREE.MeshStandardMaterial({ color: 0xfef08a }));
          tusk.position.set(tuskX, -0.06, 0.24);
          tusk.rotation.x = -0.4;
          headGroup.add(tusk);
        });

        // Cigar in mouth
        const cigarGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.16, 8);
        const cigarMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
        const cigar = new THREE.Mesh(cigarGeo, cigarMat);
        cigar.rotation.x = Math.PI / 2;
        cigar.rotation.y = 0.4;
        cigar.position.set(0.08, -0.08, 0.28);
        headGroup.add(cigar);

        // Cigar burning ember
        const emberGeo = new THREE.SphereGeometry(0.022, 8, 8);
        const emberMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        const ember = new THREE.Mesh(emberGeo, emberMat);
        ember.position.set(0, 0.08, 0);
        cigar.add(ember);
      } else {
        // Vader / Masked Bandit / Enforcer
        const helmetGeo = new THREE.SphereGeometry(0.24, 16, 16);
        const darkHelmMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.3, metalness: 0.6 });
        const helmet = new THREE.Mesh(helmetGeo, darkHelmMat);
        headGroup.add(helmet);

        // Glowing red visor
        const visorGeo = new THREE.BoxGeometry(0.28, 0.06, 0.12);
        const visorMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0xdc2626, emissiveIntensity: 1.2 });
        const visor = new THREE.Mesh(visorGeo, visorMat);
        visor.position.set(0, 0.04, 0.2);
        headGroup.add(visor);
      }

      torsoGroup.add(headGroup);

      // Arms & Forearms holding 3D cards
      const leftArmGroup = new THREE.Group();
      leftArmGroup.position.set(-0.35, 0.75, 0);
      const armMat = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.6 });
      const leftArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 8), armMat);
      leftArmMesh.position.y = -0.22;
      leftArmMesh.rotation.z = -0.3;
      leftArmMesh.rotation.x = 0.5;
      leftArmGroup.add(leftArmMesh);
      torsoGroup.add(leftArmGroup);

      const rightArmGroup = new THREE.Group();
      rightArmGroup.position.set(0.35, 0.75, 0);
      const rightArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 8), armMat);
      rightArmMesh.position.y = -0.22;
      rightArmMesh.rotation.z = 0.3;
      rightArmMesh.rotation.x = 0.5;
      rightArmGroup.add(rightArmMesh);
      torsoGroup.add(rightArmGroup);

      // Cards held in hands
      const cardsInHandGroup = new THREE.Group();
      cardsInHandGroup.position.set(0, 0.65, 0.42);
      for (let c = 0; c < 3; c++) {
        const cardMesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.18, 0.005),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 })
        );
        cardMesh.position.x = (c - 1) * 0.06;
        cardMesh.position.y = Math.sin(c) * 0.02;
        cardMesh.rotation.z = (c - 1) * 0.15;
        cardMesh.rotation.x = 0.2;
        cardsInHandGroup.add(cardMesh);
      }
      torsoGroup.add(cardsInHandGroup);

      rootGroup.add(torsoGroup);
      scene.add(rootGroup);

      characters.push({
        id: cfg.id,
        name: cfg.name,
        role: cfg.role,
        angle: cfg.angle,
        isDead: false,
        isAccused: false,
        rootGroup,
        headGroup,
        torsoGroup,
        leftArmGroup,
        rightArmGroup,
        cardsInHandGroup,
        handsRaised: false,
        baseY: 0,
        idlePhase: idx * 0.9,
        lookTarget: new THREE.Vector3(0, 1.4, 0),
        screenX: 0,
        screenY: 0,
        visibleOnScreen: false,
      });
    });

    // ------------------------------------------------------------------------
    // 8. FIRST-PERSON REVOLVER WEAPON (MOUNTED TO CAMERA)
    // ------------------------------------------------------------------------
    const gunGroup = new THREE.Group();
    // Default lowered position
    gunGroup.position.set(0.45, -0.45, -0.75);

    // Revolver Barrel & Frame
    const gunSteelMat = new THREE.MeshStandardMaterial({ color: 0x1f242d, roughness: 0.25, metalness: 0.85 });
    const woodGripMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.5, metalness: 0.1 });

    const barrelMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.45, 12), gunSteelMat);
    barrelMesh.rotation.x = Math.PI / 2;
    barrelMesh.position.set(0, 0.05, -0.22);
    gunGroup.add(barrelMesh);

    // 6-Round Cylinder
    const cylinderMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.16, 12), gunSteelMat);
    cylinderMesh.rotation.x = Math.PI / 2;
    cylinderMesh.position.set(0, 0.04, 0.02);
    gunGroup.add(cylinderMesh);

    // Frame & Grip
    const frameMesh = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.28), gunSteelMat);
    frameMesh.position.set(0, 0.02, 0.02);
    gunGroup.add(frameMesh);

    const gripMesh = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.22, 0.09), woodGripMat);
    gripMesh.rotation.x = -0.45;
    gripMesh.position.set(0, -0.1, 0.14);
    gunGroup.add(gripMesh);

    // Hammer
    const hammerMesh = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.05, 0.03), gunSteelMat);
    hammerMesh.position.set(0, 0.1, 0.13);
    gunGroup.add(hammerMesh);

    // Muzzle Flash Mesh & Dynamic Flash Light (Hidden until shot)
    const flashGeo = new THREE.SphereGeometry(0.18, 12, 12);
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xffedd5, transparent: true, opacity: 0 });
    const muzzleFlashMesh = new THREE.Mesh(flashGeo, flashMat);
    muzzleFlashMesh.position.set(0, 0.05, -0.48);
    gunGroup.add(muzzleFlashMesh);

    const muzzleLight = new THREE.PointLight(0xf97316, 0, 8);
    muzzleLight.position.set(0, 0.05, -0.5);
    gunGroup.add(muzzleLight);

    camera.add(gunGroup);
    scene.add(camera);

    threeStateRef.current = {
      renderer,
      scene,
      camera,
      characters,
      lanternLight,
      lanternMesh: lanternGroup,
      gunGroup,
      muzzleLight,
      muzzleFlashMesh,
      recoilAmount: 0,
      playedCardsGroup,
    };

    // ------------------------------------------------------------------------
    // 9. ANIMATION & RENDER LOOP (60 FPS CONTINUOUS 3D MOTION)
    // ------------------------------------------------------------------------
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const renderLoop = () => {
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // 1. Smooth Camera Mouse Look
      const mouse = mousePosRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      // Base camera look
      camera.position.x = mouse.x * 0.6;
      camera.position.y = 2.3 + mouse.y * 0.35 + (threeStateRef.current?.recoilAmount || 0);
      camera.lookAt(mouse.x * 0.4, 1.35 - mouse.y * 0.3, 0);

      // Decay recoil
      if (threeStateRef.current && threeStateRef.current.recoilAmount > 0) {
        threeStateRef.current.recoilAmount = Math.max(0, threeStateRef.current.recoilAmount - delta * 1.8);
      }

      // 2. Swinging Lantern Dynamics
      const swingZ = Math.sin(elapsed * 1.3) * 0.09;
      const swingX = Math.cos(elapsed * 0.9) * 0.06;
      lanternGroup.rotation.z = swingZ;
      lanternGroup.rotation.x = swingX;
      lanternLight.intensity = 3.6 + Math.sin(elapsed * 8) * 0.2; // subtle flicker

      // 3. First-Person Gun ADS & Sway Animation
      const targetGunPos = isAimingGun
        ? new THREE.Vector3(0.08, -0.16, -0.5) // ADS Center Aim
        : new THREE.Vector3(0.42, -0.42, -0.72); // Hip Rest

      gunGroup.position.lerp(targetGunPos, delta * 12);
      // Breathing weapon bobbing
      gunGroup.position.y += Math.sin(elapsed * 2.5) * 0.003;
      gunGroup.position.x += Math.cos(elapsed * 1.2) * 0.003;

      // 4. ANIMATE 3D SKELETAL CHARACTERS (BREATHING, HEAD GLANCES, FIDGETING)
      const hudPositions: { [id: string]: { x: number; y: number; visible: boolean } } = {};
      const tempVec = new THREE.Vector3();

      characters.forEach((char) => {
        const time = elapsed + char.idlePhase;

        // A. Breathing: Torso subtly expands and rises
        const breath = Math.sin(time * 2.2) * 0.015;
        char.torsoGroup.position.y = 0.9 + breath;
        char.torsoGroup.rotation.x = Math.sin(time * 2.2) * 0.012;

        // B. Hands Fidgeting / Holding cards
        char.cardsInHandGroup.rotation.z = Math.sin(time * 1.5) * 0.05;
        char.cardsInHandGroup.position.y = 0.65 + Math.cos(time * 1.8) * 0.01;

        // C. Accused / Targeted / Surrender reaction
        const isHovered = hoveredTarget === char.id;
        if (isAimingGun && isHovered) {
          // Surrender: Raise hands up defensively!
          char.leftArmGroup.rotation.x = THREE.MathUtils.lerp(char.leftArmGroup.rotation.x, -1.8, delta * 10);
          char.rightArmGroup.rotation.x = THREE.MathUtils.lerp(char.rightArmGroup.rotation.x, -1.8, delta * 10);
          char.torsoGroup.position.z = THREE.MathUtils.lerp(char.torsoGroup.position.z, -0.2, delta * 6);
        } else {
          char.leftArmGroup.rotation.x = THREE.MathUtils.lerp(char.leftArmGroup.rotation.x, 0.5, delta * 4);
          char.rightArmGroup.rotation.x = THREE.MathUtils.lerp(char.rightArmGroup.rotation.x, 0.5, delta * 4);
          char.torsoGroup.position.z = THREE.MathUtils.lerp(char.torsoGroup.position.z, 0, delta * 6);
        }

        // D. Dynamic Head Tracking:
        // If hovered by player or target of discussion, turn head towards player's camera!
        if (isHovered) {
          // Turn head directly to player camera
          char.headGroup.lookAt(camera.position);
        } else {
          // Look around room / table
          const glanceAngle = Math.sin(time * 0.8) * 0.28;
          const nodAngle = Math.cos(time * 1.4) * 0.08;
          char.headGroup.rotation.y = glanceAngle;
          char.headGroup.rotation.x = nodAngle;
        }

        // E. Project 3D Head position to 2D Screen for HUD Bubbles
        char.headGroup.getWorldPosition(tempVec);
        tempVec.y += 0.55; // Floating above head
        tempVec.project(camera);

        const isBehind = tempVec.z > 1;
        const screenX = (tempVec.x * 0.5 + 0.5) * width;
        const screenY = (-(tempVec.y * 0.5) + 0.5) * height;

        hudPositions[char.id] = {
          x: screenX,
          y: screenY,
          visible: !isBehind && screenX >= 0 && screenX <= width && screenY >= 0 && screenY <= height,
        };
      });

      setScreenHudPositions(hudPositions);

      // Render 3D Scene
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    // Handle Window Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [isAimingGun, hoveredTarget]);

  // --------------------------------------------------------------------------
  // 4. MOUSE MOVE FOR FIRST-PERSON 360° CAM LOOK
  // --------------------------------------------------------------------------
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mountRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / rect.width - 0.5;
    const normY = (e.clientY - rect.top) / rect.height - 0.5;

    // Pan bounds
    mousePosRef.current.targetX = normX * 1.8;
    mousePosRef.current.targetY = -normY * 1.1;
  };

  // Keyboard shortcut [R] to toggle Gun Stance
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        tavernAudio.playGunCock();
        setIsAimingGun((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --------------------------------------------------------------------------
  // 5. TRIGGER REVOLVER SHOT & MUZZLE FLASH
  // --------------------------------------------------------------------------
  const handleShootGun = (targetId?: string) => {
    const state = threeStateRef.current;
    if (!state) return;

    tavernAudio.playGunCock();
    setTimeout(() => {
      tavernAudio.playGunshot();
      setRevolverFired(true);

      // 3D Recoil Kick & Muzzle Flash Light
      state.recoilAmount = 0.22;
      state.muzzleLight.intensity = 15;
      (state.muzzleFlashMesh.material as THREE.MeshBasicMaterial).opacity = 0.95;

      setTimeout(() => {
        setRevolverFired(false);
        if (state) {
          state.muzzleLight.intensity = 0;
          (state.muzzleFlashMesh.material as THREE.MeshBasicMaterial).opacity = 0;
        }
      }, 75);

      if (onShootPlayer && targetId) {
        const char = state.characters.find((c) => c.id === targetId);
        onShootPlayer(targetId, char?.name || 'Đối thủ');
      }
    }, 90);
  };

  // --------------------------------------------------------------------------
  // 6. PLAY 3D CARD TO FELT TABLE
  // --------------------------------------------------------------------------
  const handlePlayCard = (card: { id: number; name: string }) => {
    tavernAudio.playCardFlip();
    const state = threeStateRef.current;
    if (state) {
      // Spawn real 3D card on the table
      const cardMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.38, 0.006),
        new THREE.MeshStandardMaterial({
          color: 0x92400e,
          roughness: 0.35,
          metalness: 0.2,
        })
      );
      const randOffset = (Math.random() - 0.5) * 0.6;
      cardMesh.position.set(randOffset, 0.01 + Math.random() * 0.02, randOffset * 0.5);
      cardMesh.rotation.y = (Math.random() - 0.5) * 1.2;
      cardMesh.castShadow = true;
      cardMesh.receiveShadow = true;
      state.playedCardsGroup.add(cardMesh);
    }
    if (onPlayCard) onPlayCard(card.name);
  };

  // --------------------------------------------------------------------------
  // 7. RUSSIAN ROULETTE TRIGGER PULL
  // --------------------------------------------------------------------------
  const handlePullRouletteTrigger = () => {
    tavernAudio.playGunCock();
    setTimeout(() => {
      if (chamberSlot === bulletLoadedSlot) {
        // DEAD!
        tavernAudio.playGunshot();
        setRouletteResult('BANG! BẠN ĐÃ TRÚNG ĐẠN!');
        setRevolverFired(true);
        setTimeout(() => setRevolverFired(false), 200);
      } else {
        // CLICK (Safe)
        tavernAudio.playGunCock();
        setRouletteResult('CLICK! Ổ đạn rỗng, bạn may mắn sống sót!');
        setChamberSlot((prev) => (prev % 6) + 1);
      }
    }, 180);
  };

  return (
    <div
      ref={mountRef}
      onMouseMove={handleMouseMove}
      className="relative w-screen h-screen overflow-hidden bg-[#06080d] select-none cursor-crosshair font-geist"
    >
      {/* ==================== 1. SCREEN RECOIL FLASH OVERLAY ==================== */}
      {revolverFired && (
        <div className="fixed inset-0 z-50 bg-white/40 pointer-events-none animate-ping" />
      )}

      {/* ==================== 2. PINNED 3D HUD OVERLAYS OVER OPPONENTS' HEADS ==================== */}
      {threeStateRef.current?.characters.map((char) => {
        const pos = screenHudPositions[char.id];
        if (!pos || !pos.visible) return null;
        const isTargeted = hoveredTarget === char.id;

        return (
          <div
            key={char.id}
            onClick={() => {
              setHoveredTarget(char.id);
              if (isAimingGun) {
                handleShootGun(char.id);
              } else if (onAimAtPlayer) {
                onAimAtPlayer(char.id, char.name);
              }
            }}
            onMouseEnter={() => setHoveredTarget(char.id)}
            onMouseLeave={() => setHoveredTarget(null)}
            className="absolute z-20 pointer-events-auto -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform duration-150"
            style={{
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              transform: `translate(-50%, -50%) scale(${isTargeted ? 1.08 : 1.0})`,
            }}
          >
            {/* Target Reticle when Gun is Aimed */}
            {isAimingGun && isTargeted && (
              <div className="absolute -inset-8 border-2 border-dashed border-red-500 rounded-full animate-spin pointer-events-none shadow-[0_0_20px_rgba(239,68,68,0.9)]" />
            )}

            {/* Character Info Card */}
            <div
              className={`px-3 py-1.5 rounded-xl backdrop-blur-md border text-center transition-all shadow-2xl ${
                char.isAccused
                  ? 'bg-red-950/95 border-red-500 text-red-200 animate-pulse'
                  : isTargeted
                  ? 'bg-amber-950/95 border-amber-400 text-amber-200 shadow-[0_0_25px_rgba(251,191,36,0.5)]'
                  : 'bg-[#0f141f]/85 border-[#334155]/60 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-space font-bold text-xs uppercase tracking-wider">{char.name}</span>
              </div>
              <span className="font-geist text-[10px] text-amber-300/80 block mt-0.5">{char.role}</span>

              {isAimingGun && isTargeted && (
                <span className="mt-1 px-2 py-0.5 rounded bg-red-600 text-white font-space text-[9px] font-bold block animate-bounce">
                  CLICK ĐỂ BẮN 💥
                </span>
              )}
            </div>
          </div>
        );
      })}

      {/* ==================== 3. CENTER CROSSHAIR WHEN AIMING REVOLVER ==================== */}
      {isAimingGun && (
        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border border-red-500/80 flex items-center justify-center shadow-[0_0_12px_rgba(239,68,68,0.8)]">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
          </div>
          <div className="absolute w-12 h-[1px] bg-red-500/60" />
          <div className="absolute h-12 w-[1px] bg-red-500/60" />
        </div>
      )}

      {/* ==================== 4. FIRST-PERSON INTERACTIVE CARD FAN (BOTTOM) ==================== */}
      <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none flex items-end justify-between px-10 pb-4">
        {/* PLAYER TAROT CARDS ON HAND */}
        <div className="pointer-events-auto relative flex items-end -space-x-8 mb-2">
          {handCards.map((card, idx) => {
            const isHovered = inspectedCard === card.id;
            const tilt = (idx - 2) * 6; // Fan curvature
            const translateY = isHovered ? -35 : 0;

            return (
              <div
                key={card.id}
                onMouseEnter={() => {
                  setInspectedCard(card.id);
                  tavernAudio.playCardFlip();
                }}
                onMouseLeave={() => setInspectedCard(null)}
                onClick={() => handlePlayCard(card)}
                className="relative cursor-pointer transition-all duration-300 ease-out group"
                style={{
                  transform: `translateY(${translateY}px) rotate(${tilt}deg) scale(${isHovered ? 1.15 : 1})`,
                  transformOrigin: 'bottom center',
                  zIndex: isHovered ? 40 : idx + 10,
                }}
              >
                <div
                  className={`w-32 h-48 rounded-2xl p-3 border flex flex-col justify-between backdrop-blur-xl transition-all shadow-2xl ${
                    isHovered
                      ? 'bg-gradient-to-t from-amber-950 via-slate-900 to-amber-900/90 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.5)]'
                      : 'bg-gradient-to-t from-slate-950 via-slate-900 to-slate-800/90 border-slate-700/80 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-space font-bold uppercase text-amber-400">
                    <span>{card.type}</span>
                    <span>{card.icon}</span>
                  </div>

                  <div className="text-center my-auto">
                    <span className="text-4xl block group-hover:scale-125 transition-transform">
                      {card.icon}
                    </span>
                    <span className="font-space font-bold text-xs uppercase tracking-wider block mt-2 text-white">
                      {card.name}
                    </span>
                  </div>

                  <div className="text-center">
                    <span className="text-[9px] font-geist text-slate-400 block group-hover:text-amber-300">
                      {isHovered ? 'CLICK ĐỂ ĐÁNH' : 'LÁ BÀI TRÊN TAY'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* WEAPON & RUSSIAN ROULETTE CONTROLS (BOTTOM RIGHT) */}
        <div className="pointer-events-auto flex items-center gap-3">
          <button
            onClick={() => {
              tavernAudio.playCylinderSpin();
              setRouletteOpen(true);
            }}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-red-950 to-stone-900 border border-red-500/80 hover:border-red-400 text-red-200 hover:text-white font-space font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_25px_rgba(220,38,38,0.4)] transition-all hover:scale-105 active:scale-95"
          >
            <span>🎲</span>
            <span>CÒ SÚNG NGA (1/6)</span>
          </button>

          <button
            onClick={() => {
              tavernAudio.playGunCock();
              setIsAimingGun((prev) => !prev);
            }}
            className={`px-6 py-3 rounded-xl border font-space font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-2xl transition-all hover:scale-105 active:scale-95 ${
              isAimingGun
                ? 'bg-red-600 border-red-400 text-white shadow-[0_0_30px_rgba(239,68,68,0.8)] animate-pulse'
                : 'bg-stone-900/90 border-amber-500/80 text-amber-300 hover:border-amber-400 hover:bg-stone-800'
            }`}
          >
            <span>🔫</span>
            <span>{isAimingGun ? 'HẠ SÚNG [R]' : 'RÚT SÚNG [R]'}</span>
          </button>
        </div>
      </div>

      {/* ==================== 5. RUSSIAN ROULETTE POPUP MODAL ==================== */}
      {rouletteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="relative w-full max-w-md bg-stone-950 border border-red-600/80 rounded-2xl p-6 shadow-[0_0_60px_rgba(220,38,38,0.5)] text-center font-geist">
            <h3 className="font-space font-black text-xl text-red-400 tracking-wider uppercase mb-1">
              🎲 CÒ QUAY NGA — RUSSIAN ROULETTE
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Ổ đạn 6 lỗ có đúng 1 viên đạn. Thử vận may của bạn!
            </p>

            {/* Cylinder graphic */}
            <div className="relative w-44 h-44 mx-auto mb-6 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-dashed border-stone-600 animate-spin-slow" />
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
                🔄 XOAY Ổ ĐẠN
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
