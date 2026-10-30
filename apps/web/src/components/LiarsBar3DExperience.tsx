'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
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
// 2. TYPES
// ============================================================================
export interface TableOpponent {
  id: string;
  seatNumber: number;
  nickname: string;
  roleHint: string;
  isDead: boolean;
  votes: number;
  dialogue?: string;
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

  // Local opponents state
  const [opponents, setOpponents] = useState<TableOpponent[]>([
    {
      id: 'rhino',
      seatNumber: 1,
      nickname: '#01 TRÙM TÊ GIÁC',
      roleHint: 'Tê Giác Mafia Hawaii',
      isDead: false,
      votes: 1,
      dialogue: 'Hai đứa mày đừng hòng qua mặt tao. Tao có 3 lá Át!',
    },
    {
      id: 'wolf',
      seatNumber: 2,
      nickname: '#02 SÁT THỦ SÓI',
      roleHint: 'Sát Thủ Sói Mobster',
      isDead: false,
      votes: 2,
      dialogue: 'Cứ thử bóp cò đi, xem đứa nào nằm xuống trước!',
    },
  ]);

  // Cards on hand
  const [handCards] = useState([
    { id: 1, name: 'TIÊN TRI', sub: 'SOI ĐÊM', type: 'seer', icon: '🔮', desc: 'Tìm diệt Ma Sói trong làng' },
    { id: 2, name: 'TREO CỔ', sub: '#02 SÁT THỦ SÓI', type: 'verdict', icon: '⚖️', desc: '3/5 Phiếu phán quyết' },
    { id: 3, name: 'DÂN LÀNG', sub: 'LƯƠNG THIỆN', type: 'village', icon: '🧑🌾', desc: 'Bầu chọn treo cổ kẻ ác' },
    { id: 4, name: 'PHIẾU TRẮNG', sub: 'TRUNG LẬP', type: 'skip', icon: '🕊️', desc: 'Từ chối phán quyết' },
  ]);
  const [inspectedCardId, setInspectedCardId] = useState<number | null>(null);

  const accusedId = room?.day?.accusedId || 'wolf';

  // Refs for animation loop
  const mouseRef = useRef({ x: 0, y: 0, targetYaw: 0, targetPitch: 0 });
  const threeRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    revolverGroup: THREE.Group;
    muzzleLight: THREE.PointLight;
    lampGroup: THREE.Group;
    rhinoGroup: THREE.Group;
    wolfGroup: THREE.Group;
    rhinoMat: THREE.MeshStandardMaterial;
    wolfMat: THREE.MeshStandardMaterial;
    playedCardsGroup: THREE.Group;
    raycaster: THREE.Raycaster;
    shootRecoil: number;
  } | null>(null);

  // ============================================================================
  // 3. INITIALIZE REAL THREE.JS 3D WEBGL SCENE
  // ============================================================================
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // A. RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.replaceChildren(renderer.domElement);

    // B. SCENE & ATMOSPHERE
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0604);
    scene.fog = new THREE.FogExp2(0x0e0805, 0.052);

    // C. CAMERA (FPS Perspective)
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 50);
    camera.position.set(0, 1.48, 1.95);
    camera.lookAt(0, 1.15, -0.4);

    // D. TEXTURES
    const texLoader = new THREE.TextureLoader();
    const rhinoIdleTex = texLoader.load('/assets/characters_ue5/rhino_idle.png');
    const rhinoActionTex = texLoader.load('/assets/characters_ue5/rhino_action.png');
    const wolfIdleTex = texLoader.load('/assets/characters_ue5/wolf_idle.png');
    const wolfAimingTex = texLoader.load('/assets/characters_ue5/wolf_aiming.png');

    // E. LIGHTING
    // Ambient tavern low light
    const ambientLight = new THREE.AmbientLight(0x382216, 0.9);
    scene.add(ambientLight);

    // Hanging overhead lamp with swinging chain
    const lampGroup = new THREE.Group();
    lampGroup.position.set(0, 3.4, 0);

    const chainGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.2, 8);
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.8, metalness: 0.8 });
    const chainMesh = new THREE.Mesh(chainGeo, metalMat);
    chainMesh.position.y = -0.6;
    lampGroup.add(chainMesh);

    const shadeGeo = new THREE.ConeGeometry(0.38, 0.25, 24, 1, true);
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4, metalness: 0.85 });
    const shadeMesh = new THREE.Mesh(shadeGeo, brassMat);
    shadeMesh.position.y = -1.2;
    shadeMesh.rotation.x = Math.PI;
    lampGroup.add(shadeMesh);

    const bulbGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
    bulbMesh.position.y = -1.25;
    lampGroup.add(bulbMesh);

    const lanternLight = new THREE.PointLight(0xffaa44, 3.4, 9, 1.25);
    lanternLight.position.set(0, -1.3, 0);
    lanternLight.castShadow = true;
    lanternLight.shadow.mapSize.width = 1024;
    lanternLight.shadow.mapSize.height = 1024;
    lanternLight.shadow.bias = -0.001;
    lampGroup.add(lanternLight);
    scene.add(lampGroup);

    // Back wall Red Neon "BAR" light
    const neonLight = new THREE.PointLight(0xff3311, 2.0, 7, 1.5);
    neonLight.position.set(0, 2.6, -4.2);
    scene.add(neonLight);

    // Muzzle flash light attached to camera
    const muzzleLight = new THREE.PointLight(0xfff5e6, 0, 6, 1.8);
    muzzleLight.position.set(0, -0.1, -0.3);
    camera.add(muzzleLight);

    // F. 3D TAVERN ROOM
    // Wood plank floor
    const floorGeo = new THREE.PlaneGeometry(16, 16);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x1f140c, roughness: 0.75, metalness: 0.1 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Brick back wall
    const wallGeo = new THREE.PlaneGeometry(16, 8);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x18100b, roughness: 0.9 });
    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.set(0, 4, -4.6);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Glowing Neon "BAR" sign mesh
    const neonSignGeo = new THREE.BoxGeometry(1.6, 0.45, 0.05);
    const neonSignMat = new THREE.MeshBasicMaterial({ color: 0xff4422 });
    const neonSign = new THREE.Mesh(neonSignGeo, neonSignMat);
    neonSign.position.set(0, 2.6, -4.55);
    scene.add(neonSign);

    // G. 3D POKER TABLE IN CENTER
    const tableGroup = new THREE.Group();
    tableGroup.position.set(0, 0, 0);

    // Emerald Green Poker Felt
    const feltGeo = new THREE.CylinderGeometry(1.65, 1.65, 0.08, 48);
    const feltMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.88, metalness: 0.04 });
    const feltMesh = new THREE.Mesh(feltGeo, feltMat);
    feltMesh.position.y = 1.0;
    feltMesh.receiveShadow = true;
    tableGroup.add(feltMesh);

    // Outer Mahogany Wood Beveled Armrest
    const rimGeo = new THREE.TorusGeometry(1.72, 0.14, 16, 48);
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x2e1309, roughness: 0.35, metalness: 0.15 });
    const rimMesh = new THREE.Mesh(rimGeo, woodMat);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.y = 1.04;
    rimMesh.castShadow = true;
    rimMesh.receiveShadow = true;
    tableGroup.add(rimMesh);

    // Heavy Central Pedestal Base
    const pillarGeo = new THREE.CylinderGeometry(0.35, 0.6, 1.0, 24);
    const pillarMesh = new THREE.Mesh(pillarGeo, woodMat);
    pillarMesh.position.y = 0.5;
    pillarMesh.castShadow = true;
    tableGroup.add(pillarMesh);

    // Table Props: Stacks of Poker Chips
    const chipColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b];
    for (let i = 0; i < 7; i++) {
      const ang = (i / 7) * Math.PI * 1.6 - 0.8;
      const chipStackGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.05 + (i % 3) * 0.03, 16);
      const chipMat = new THREE.MeshStandardMaterial({ color: chipColors[i % chipColors.length], roughness: 0.4 });
      const stack = new THREE.Mesh(chipStackGeo, chipMat);
      stack.position.set(Math.sin(ang) * 1.25, 1.06, Math.cos(ang) * 1.25);
      stack.castShadow = true;
      tableGroup.add(stack);
    }

    // Played Cards group on the table
    const playedCardsGroup = new THREE.Group();
    playedCardsGroup.position.set(0, 1.045, 0);
    tableGroup.add(playedCardsGroup);

    scene.add(tableGroup);

    // H. 3D CHAIRS & MOBSTER OPPONENTS
    const createChair = (x: number, z: number, lookX: number, lookZ: number) => {
      const chair = new THREE.Group();
      chair.position.set(x, 0, z);
      chair.lookAt(lookX, 0.8, lookZ);

      // Seat
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.08, 0.65), woodMat);
      seat.position.y = 0.72;
      seat.castShadow = true;
      chair.add(seat);

      // Backrest
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.85, 0.08), woodMat);
      back.position.set(0, 1.15, -0.3);
      back.castShadow = true;
      chair.add(back);

      return chair;
    };

    // Chair 1: Rhino
    const rhinoChair = createChair(-1.35, -0.85, 0, 0);
    scene.add(rhinoChair);

    // Chair 2: Wolf
    const wolfChair = createChair(1.35, -0.85, 0, 0);
    scene.add(wolfChair);

    // 3D Rhino Character Entity
    const rhinoGroup = new THREE.Group();
    rhinoGroup.position.set(-1.35, 1.25, -0.85);
    rhinoGroup.lookAt(camera.position.x, 1.3, camera.position.z);

    const charPlaneGeo = new THREE.PlaneGeometry(1.35, 1.6);
    const rhinoMat = new THREE.MeshStandardMaterial({
      map: rhinoIdleTex,
      transparent: true,
      alphaTest: 0.15,
      roughness: 0.7,
      metalness: 0.1,
    });
    const rhinoMesh = new THREE.Mesh(charPlaneGeo, rhinoMat);
    rhinoMesh.castShadow = true;
    rhinoMesh.receiveShadow = true;
    rhinoGroup.add(rhinoMesh);
    scene.add(rhinoGroup);

    // 3D Wolf Character Entity
    const wolfGroup = new THREE.Group();
    wolfGroup.position.set(1.35, 1.25, -0.85);
    wolfGroup.lookAt(camera.position.x, 1.3, camera.position.z);

    const wolfMat = new THREE.MeshStandardMaterial({
      map: wolfIdleTex,
      transparent: true,
      alphaTest: 0.15,
      roughness: 0.7,
      metalness: 0.1,
    });
    const wolfMesh = new THREE.Mesh(charPlaneGeo, wolfMat);
    wolfMesh.castShadow = true;
    wolfMesh.receiveShadow = true;
    wolfGroup.add(wolfMesh);
    scene.add(wolfGroup);

    // I. PLAYER'S FIRST-PERSON REVOLVER (ATTACHED TO CAMERA)
    const revolverGroup = new THREE.Group();
    revolverGroup.position.set(0.24, -0.25, -0.48);

    // Barrel
    const barrelGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.28, 8);
    const gunSteelMat = new THREE.MeshStandardMaterial({ color: 0x262626, roughness: 0.35, metalness: 0.85 });
    const barrel = new THREE.Mesh(barrelGeo, gunSteelMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.04, -0.14);
    revolverGroup.add(barrel);

    // Cylinder with 6 chambers
    const cylGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.1, 6);
    const cylinderMesh = new THREE.Mesh(cylGeo, gunSteelMat);
    cylinderMesh.rotation.x = Math.PI / 2;
    cylinderMesh.position.set(0, 0.04, 0.02);
    revolverGroup.add(cylinderMesh);

    // Frame body
    const frameGeo = new THREE.BoxGeometry(0.042, 0.09, 0.18);
    const frameMesh = new THREE.Mesh(frameGeo, gunSteelMat);
    frameMesh.position.set(0, 0.02, 0.04);
    revolverGroup.add(frameMesh);

    // Grip
    const gripGeo = new THREE.BoxGeometry(0.045, 0.14, 0.07);
    const gripMat = new THREE.MeshStandardMaterial({ color: 0x3d1c06, roughness: 0.6, metalness: 0.1 });
    const grip = new THREE.Mesh(gripGeo, gripMat);
    grip.rotation.x = -0.3;
    grip.position.set(0, -0.07, 0.1);
    revolverGroup.add(grip);

    // Muzzle tip flash spark mesh
    const flashGeo = new THREE.SphereGeometry(0.05, 8, 8);
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xfffaed, visible: false });
    const flashMesh = new THREE.Mesh(flashGeo, flashMat);
    flashMesh.position.set(0, 0.04, -0.3);
    revolverGroup.add(flashMesh);

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
      rhinoGroup,
      wolfGroup,
      rhinoMat,
      wolfMat,
      playedCardsGroup,
      raycaster: new THREE.Raycaster(),
      shootRecoil: 0,
    };

    // J. RESIZE HANDLER
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // K. ANIMATION LOOP
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const state = threeRef.current;
      if (!state) return;

      // 1. Smooth Camera FPS Look
      const targetYaw = mouseRef.current.targetYaw;
      const targetPitch = mouseRef.current.targetPitch;
      camera.rotation.y += (targetYaw - camera.rotation.y) * 0.08;
      camera.rotation.x += (targetPitch - camera.rotation.x) * 0.08;

      // Subtle breathing camera sway
      camera.position.y = 1.48 + Math.sin(t * 1.6) * 0.006;

      // 2. Hanging Lamp Swing
      state.lampGroup.rotation.z = Math.sin(t * 1.5) * 0.032;
      state.lampGroup.rotation.x = Math.cos(t * 1.2) * 0.022;

      // 3. Characters Idle Breathing Animation
      state.rhinoGroup.position.y = 1.25 + Math.sin(t * 2.2) * 0.014;
      state.wolfGroup.position.y = 1.25 + Math.cos(t * 2.0) * 0.014;

      // 4. Player's Revolver Stance (Hip vs ADS Aiming)
      const targetGunPos = isAimingGun
        ? new THREE.Vector3(0, -0.13, -0.38) // Center ADS
        : new THREE.Vector3(0.24, -0.25, -0.48); // Hip

      // Apply recoil recovery
      state.shootRecoil = THREE.MathUtils.lerp(state.shootRecoil, 0, 0.14);
      const recoilOffset = new THREE.Vector3(0, state.shootRecoil * 0.08, state.shootRecoil * 0.12);

      state.revolverGroup.position.lerp(targetGunPos.clone().add(recoilOffset), 0.15);
      state.revolverGroup.rotation.x = isAimingGun
        ? state.shootRecoil * 0.4
        : THREE.MathUtils.lerp(state.revolverGroup.rotation.x, 0.08, 0.1);

      // 5. Update Screen Positions for 3D Nametags
      const projectToScreen = (obj: THREE.Object3D) => {
        const v = new THREE.Vector3();
        obj.getWorldPosition(v);
        v.y += 0.95; // above character head
        v.project(camera);
        const sx = ((v.x + 1) * width) / 2;
        const sy = ((-v.y + 1) * height) / 2;
        return { x: sx, y: sy, visible: v.z < 1 };
      };

      setScreenPos({
        rhino: projectToScreen(state.rhinoGroup),
        wolf: projectToScreen(state.wolfGroup),
      });

      // Render
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [isAimingGun]);

  // Update Character Textures when targeted / accused
  useEffect(() => {
    const state = threeRef.current;
    if (!state) return;
    const texLoader = new THREE.TextureLoader();

    // Rhino texture
    const isRhinoActive = hoveredTargetId === 'rhino' || accusedId === 'rhino';
    state.rhinoMat.map = texLoader.load(
      isRhinoActive ? '/assets/characters_ue5/rhino_action.png' : '/assets/characters_ue5/rhino_idle.png'
    );
    state.rhinoMat.needsUpdate = true;

    // Wolf texture
    const isWolfActive = hoveredTargetId === 'wolf' || accusedId === 'wolf';
    state.wolfMat.map = texLoader.load(
      isWolfActive ? '/assets/characters_ue5/wolf_aiming.png' : '/assets/characters_ue5/wolf_idle.png'
    );
    state.wolfMat.needsUpdate = true;
  }, [hoveredTargetId, accusedId]);

  // Mouse move handler for 3D FPS rotation
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mountRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 -> 0.5
    const normY = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 -> 0.5

    mouseRef.current.targetYaw = -normX * 0.75; // 3D Yaw ~43 degrees left/right
    mouseRef.current.targetPitch = -normY * 0.42; // 3D Pitch ~24 degrees up/down

    // Raycast to detect if cursor is over Rhino or Wolf
    if (threeRef.current) {
      const mouse = new THREE.Vector2(normX * 2, -normY * 2);
      threeRef.current.raycaster.setFromCamera(mouse, threeRef.current.camera);
      const intersects = threeRef.current.raycaster.intersectObjects([
        threeRef.current.rhinoGroup,
        threeRef.current.wolfGroup,
      ], true);

      if (intersects.length > 0) {
        let parent = intersects[0].object.parent;
        if (parent === threeRef.current.rhinoGroup) setHoveredTargetId('rhino');
        else if (parent === threeRef.current.wolfGroup) setHoveredTargetId('wolf');
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
        threeRef.current.muzzleLight.intensity = 8.0;
        setTimeout(() => {
          if (threeRef.current) threeRef.current.muzzleLight.intensity = 0;
          setRevolverFired(false);
        }, 60);

        // Character death animation in 3D: flinch and fall
        const targetGroup = targetId === 'rhino' ? threeRef.current.rhinoGroup : threeRef.current.wolfGroup;
        targetGroup.rotation.x -= 0.45;
        targetGroup.position.y -= 0.65;
      }

      setOpponents((prev) => prev.map((o) => (o.id === targetId ? { ...o, isDead: true } : o)));

      if (onShootPlayer) onShootPlayer(target.id, target.nickname);
    }, 50);
  };

  // Play card onto 3D table felt
  const handlePlayCardToTable = (card: { id: number; name: string }) => {
    tavernAudio.playCardFlip();

    if (threeRef.current) {
      // Create 3D card on the table felt
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
      {/* 1. REAL THREE.JS 3D WEBGL VIEWPORT */}
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
                    : 'bg-black/85 border-amber-500/50 text-amber-200'
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
