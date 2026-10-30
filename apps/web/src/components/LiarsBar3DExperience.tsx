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
  idleImg: string;
  actionImg: string;
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

  // 5 Iconic Characters matching the user's reference image
  const [opponents, setOpponents] = useState<TableOpponent[]>([
    {
      id: 'cowboy',
      seatNumber: 1,
      nickname: '#01 CAO BỒI (GUNSLINGER)',
      roleHint: 'Xạ Thủ Bất Tử',
      isDead: false,
      votes: 1,
      dialogue: 'Đừng có giở trò với tao. Tao đã thấy ngươi rút bài gian lận!',
      idleImg: '/assets/characters/cowboy_idle.png',
      actionImg: '/assets/characters/cowboy_action.png',
    },
    {
      id: 'plague',
      seatNumber: 2,
      nickname: '#02 BÁC SĨ DỊCH HẠCH',
      roleHint: 'Thầy Thuốc Bí Ẩn',
      isDead: false,
      votes: 0,
      dialogue: 'Mùi của cái chết đang bao trùm lấy bàn poker này...',
      idleImg: '/assets/characters/plague_idle.png',
      actionImg: '/assets/characters/plague_action.png',
    },
    {
      id: 'dog',
      seatNumber: 3,
      nickname: '#03 CHÓ BỐ GIÀ (PEAKY)',
      roleHint: 'Trùm Sòng Bạc Lão Luyện',
      isDead: false,
      votes: 0,
      dialogue: 'Cứ bình tĩnh hút điếu thuốc đã, xem ai là kẻ nói dối trước.',
      idleImg: '/assets/characters/dog_idle.png',
      actionImg: '/assets/characters/dog_action.png',
    },
    {
      id: 'wolf',
      seatNumber: 4,
      nickname: '#04 MA SÓI HẮC ÁM',
      roleHint: 'Ác Quỷ Đêm Trăng',
      isDead: false,
      votes: 2,
      dialogue: 'Cứ thử bóp cò đi! Máu của ngươi sẽ tưới đẫm bàn này!',
      idleImg: '/assets/characters/wolf_idle.png',
      actionImg: '/assets/characters/wolf_action.png',
    },
    {
      id: 'girl',
      seatNumber: 5,
      nickname: '#05 CÔ GÁI DÂN LÀNG',
      roleHint: 'Dân Làng Vô Tội',
      isDead: false,
      votes: 0,
      dialogue: 'Làm ơn tin tôi đi, tôi thực sự chỉ là dân làng thôi mà...',
      idleImg: '/assets/characters/girl_idle.png',
      actionImg: '/assets/characters/girl_action.png',
    },
  ]);

  // Cards on hand
  const [handCards] = useState([
    { id: 1, name: 'TIÊN TRI', sub: 'SOI ĐÊM', type: 'seer', icon: '🔮', desc: 'Tìm diệt Ma Sói trong làng' },
    { id: 2, name: 'TREO CỔ', sub: '#04 MA SÓI', type: 'verdict', icon: '⚖️', desc: '3/5 Phiếu phán quyết' },
    { id: 3, name: 'DÂN LÀNG', sub: 'LƯƠNG THIỆN', type: 'village', icon: '🧑🌾', desc: 'Bầu chọn treo cổ kẻ ác' },
    { id: 4, name: 'PHIẾU TRẮNG', sub: 'TRUNG LẬP', type: 'skip', icon: '🕊️', desc: 'Từ chối phán quyết' },
  ]);
  const [inspectedCardId, setInspectedCardId] = useState<number | null>(null);

  const accusedId = room?.day?.accusedId || 'wolf';

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
    particles: THREE.Points;
    raycaster: THREE.Raycaster;
    shootRecoil: number;
    charObjects: {
      [id: string]: {
        root: THREE.Mesh;
        idleTex: THREE.Texture;
        actTex: THREE.Texture;
        mat: THREE.MeshStandardMaterial;
        baseY: number;
      };
    };
  } | null>(null);

  // ============================================================================
  // 3. INITIALIZE REAL THREE.JS 3D WEBGL CINEMATIC TAVERN EXPERIENCE
  // ============================================================================
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // A. RENDERER (Warm, cinematic tone mapping)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.95;
    container.replaceChildren(renderer.domElement);

    // B. SCENE & ATMOSPHERE (Warm Speakeasy Tavern)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a100a);
    scene.fog = new THREE.Fog(0x1a100a, 8, 22);

    // C. CAMERA (First Person Perspective)
    const camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 40);
    camera.position.set(0, 1.46, 1.95);
    camera.lookAt(0, 1.15, -0.6);

    // D. CINEMATIC WARM TAVERN MULTI-SOURCE LIGHTING
    // 1. Global Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffeedb, 2.6);
    scene.add(ambientLight);

    // 2. Warm Hemisphere Bounce
    const hemiLight = new THREE.HemisphereLight(0xffecd2, 0x5a3116, 2.2);
    scene.add(hemiLight);

    // 3. Hanging Brass Overhead Lantern
    const lampGroup = new THREE.Group();
    lampGroup.position.set(0, 3.2, -1.35);

    const chainGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.2, 8);
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x221810, roughness: 0.7, metalness: 0.8 });
    const chainMesh = new THREE.Mesh(chainGeo, metalMat);
    chainMesh.position.y = -0.6;
    lampGroup.add(chainMesh);

    const shadeGeo = new THREE.ConeGeometry(0.42, 0.28, 24, 1, true);
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.35, metalness: 0.85 });
    const shadeMesh = new THREE.Mesh(shadeGeo, brassMat);
    shadeMesh.position.y = -1.2;
    shadeMesh.rotation.x = Math.PI;
    lampGroup.add(shadeMesh);

    const bulbMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xfff0aa })
    );
    bulbMesh.position.y = -1.25;
    lampGroup.add(bulbMesh);

    const lanternLight = new THREE.PointLight(0xffa834, 11.0, 14, 1.0);
    lanternLight.position.set(0, -1.3, 0);
    lampGroup.add(lanternLight);
    scene.add(lampGroup);

    // 4. Two Real 3D Candlelights on the Tavern Table
    const candleLight1 = new THREE.PointLight(0xffb84d, 3.4, 5.0, 1.0);
    candleLight1.position.set(-0.45, 0.52, -1.65);
    scene.add(candleLight1);

    const candleFlame1 = new THREE.Mesh(
      new THREE.ConeGeometry(0.02, 0.06, 8),
      new THREE.MeshBasicMaterial({ color: 0xffea88 })
    );
    candleFlame1.position.set(-0.45, 0.52, -1.65);
    scene.add(candleFlame1);

    const candleLight2 = new THREE.PointLight(0xffb84d, 3.4, 5.0, 1.0);
    candleLight2.position.set(0.68, 0.52, -1.65);
    scene.add(candleLight2);

    const candleFlame2 = new THREE.Mesh(
      new THREE.ConeGeometry(0.02, 0.06, 8),
      new THREE.MeshBasicMaterial({ color: 0xffea88 })
    );
    candleFlame2.position.set(0.68, 0.52, -1.65);
    scene.add(candleFlame2);

    // 5. Muzzle Flash Light attached to camera
    const muzzleLight = new THREE.PointLight(0xfff5e6, 0, 9, 1.5);
    muzzleLight.position.set(0, -0.1, -0.3);
    camera.add(muzzleLight);

    // E. MASTER CINEMATIC TAVERN ENVIRONMENT BACKDROP
    // Mapped with the exact dark fantasy tavern reference image
    const texLoader = new THREE.TextureLoader();
    const masterTex = texLoader.load('/assets/liars_bar_cinematic_master.png');
    masterTex.colorSpace = THREE.SRGBColorSpace;

    const masterGeo = new THREE.PlaneGeometry(8.9, 5.23);
    const masterMat = new THREE.MeshStandardMaterial({
      map: masterTex,
      roughness: 0.85,
      metalness: 0.05,
    });
    const masterBackdrop = new THREE.Mesh(masterGeo, masterMat);
    masterBackdrop.position.set(0, 1.25, -2.85);
    scene.add(masterBackdrop);

    // F. 5 INTERACTIVE 3D CHARACTERS WITH REALTIME HOVER & ACTION STATES
    const charConfigs = [
      {
        id: 'cowboy',
        pos: [-2.42, 1.05, -2.48] as [number, number, number],
        size: [1.6, 2.15] as [number, number],
        idleSrc: '/assets/characters/cowboy_idle.png',
        actSrc: '/assets/characters/cowboy_action.png',
      },
      {
        id: 'plague',
        pos: [-1.22, 1.25, -2.55] as [number, number, number],
        size: [1.45, 1.95] as [number, number],
        idleSrc: '/assets/characters/plague_idle.png',
        actSrc: '/assets/characters/plague_action.png',
      },
      {
        id: 'dog',
        pos: [0.0, 1.28, -2.62] as [number, number, number],
        size: [1.45, 1.95] as [number, number],
        idleSrc: '/assets/characters/dog_idle.png',
        actSrc: '/assets/characters/dog_action.png',
      },
      {
        id: 'wolf',
        pos: [1.25, 1.45, -2.55] as [number, number, number],
        size: [1.55, 2.1] as [number, number],
        idleSrc: '/assets/characters/wolf_idle.png',
        actSrc: '/assets/characters/wolf_action.png',
      },
      {
        id: 'girl',
        pos: [2.42, 1.05, -2.48] as [number, number, number],
        size: [1.45, 1.95] as [number, number],
        idleSrc: '/assets/characters/girl_idle.png',
        actSrc: '/assets/characters/girl_action.png',
      },
    ];

    const charObjects: {
      [id: string]: {
        root: THREE.Mesh;
        idleTex: THREE.Texture;
        actTex: THREE.Texture;
        mat: THREE.MeshStandardMaterial;
        baseY: number;
      };
    } = {};

    charConfigs.forEach((cfg) => {
      const idleTex = texLoader.load(cfg.idleSrc);
      const actTex = texLoader.load(cfg.actSrc);
      idleTex.colorSpace = THREE.SRGBColorSpace;
      actTex.colorSpace = THREE.SRGBColorSpace;

      const mat = new THREE.MeshStandardMaterial({
        map: idleTex,
        transparent: true,
        alphaTest: 0.04,
        roughness: 0.65,
        metalness: 0.05,
      });

      const geo = new THREE.PlaneGeometry(cfg.size[0], cfg.size[1]);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...cfg.pos);
      mesh.name = cfg.id;
      scene.add(mesh);

      charObjects[cfg.id] = {
        root: mesh,
        idleTex,
        actTex,
        mat,
        baseY: cfg.pos[1],
      };
    });

    // G. 3D ATMOSPHERIC FLOATING SMOKE & DUST PARTICLES
    const particleCount = 65;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    for (let p = 0; p < particleCount; p++) {
      particlePos[p * 3] = (Math.random() - 0.5) * 5.5;
      particlePos[p * 3 + 1] = 0.5 + Math.random() * 2.8;
      particlePos[p * 3 + 2] = -1.2 - Math.random() * 1.8;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xffd188,
      size: 0.04,
      transparent: true,
      opacity: 0.45,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // H. 3D PLAYED CARDS GROUP ON WOODEN TABLE
    const playedCardsGroup = new THREE.Group();
    playedCardsGroup.position.set(0, 0.58, -1.45);
    scene.add(playedCardsGroup);

    // I. PLAYER'S 3D FIRST-PERSON REVOLVER (FPS WEAPON)
    const revolverGroup = new THREE.Group();
    revolverGroup.position.set(0.22, -0.22, -0.42);

    const gltfLoader = new GLTFLoader();
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
      particles,
      raycaster: new THREE.Raycaster(),
      shootRecoil: 0,
      charObjects,
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
      camera.position.y = 1.46 + Math.sin(t * 1.6) * 0.005;

      // 2. Hanging Lamp Swing
      state.lampGroup.rotation.z = Math.sin(t * 1.4) * 0.024;
      state.lampGroup.rotation.x = Math.cos(t * 1.1) * 0.016;

      // 3. Realistic Candlelight Flicker
      const flicker1 = Math.sin(t * 11) * 0.25 + Math.cos(t * 17) * 0.15;
      const flicker2 = Math.cos(t * 13) * 0.25 + Math.sin(t * 19) * 0.15;
      state.candleLight1.intensity = 3.4 + flicker1;
      state.candleLight2.intensity = 3.4 + flicker2;

      // 4. Subtle Character Idle Breathing & Reaction to Hover
      Object.entries(state.charObjects).forEach(([id, char], idx) => {
        const isHovered = hoveredTargetId === id;
        const isAccused = accusedId === id;

        // Breathes gently when alive
        const breath = Math.sin(t * 2.2 + idx * 1.3) * 0.006;
        char.root.position.y = char.baseY + breath;

        // Texture swaps to action pose when hovered or accused
        const targetTex = isHovered || isAccused ? char.actTex : char.idleTex;
        if (char.mat.map !== targetTex) {
          char.mat.map = targetTex;
          char.mat.needsUpdate = true;
        }

        // Slight scale emphasis when hovered
        const targetScale = isHovered ? 1.05 : 1.0;
        char.root.scale.lerp(new THREE.Vector3(targetScale, targetScale, 1), 0.12);
      });

      // 5. Floating Smoke & Dust Animation
      const posAttr = state.particles.geometry.getAttribute('position') as THREE.BufferAttribute;
      const positions = posAttr.array as Float32Array;
      for (let p = 0; p < particleCount; p++) {
        positions[p * 3 + 1] += 0.003; // rise up
        positions[p * 3] += Math.sin(t * 1.5 + p) * 0.001; // gentle sway
        if (positions[p * 3 + 1] > 3.2) {
          positions[p * 3 + 1] = 0.5; // loop back to table level
        }
      }
      posAttr.needsUpdate = true;

      // 6. Player's Revolver Stance (Hip vs ADS Aiming)
      const targetGunPos = isAimingGun
        ? new THREE.Vector3(0, -0.13, -0.32) // Center ADS
        : new THREE.Vector3(0.22, -0.22, -0.42); // Hip

      // Apply recoil recovery
      state.shootRecoil = THREE.MathUtils.lerp(state.shootRecoil, 0, 0.14);
      const recoilOffset = new THREE.Vector3(0, state.shootRecoil * 0.08, state.shootRecoil * 0.12);

      state.revolverGroup.position.lerp(targetGunPos.clone().add(recoilOffset), 0.15);
      state.revolverGroup.rotation.x = isAimingGun
        ? state.shootRecoil * 0.4
        : THREE.MathUtils.lerp(state.revolverGroup.rotation.x, 0.05, 0.1);

      // 7. Update Screen Positions for 3D Nametags
      const projectToScreen = (mesh?: THREE.Mesh) => {
        if (!mesh) return { x: 0, y: 0, visible: false };
        const v = new THREE.Vector3();
        mesh.getWorldPosition(v);
        v.y += 1.05; // above character head
        v.project(camera);
        const sx = ((v.x + 1) * width) / 2;
        const sy = ((-v.y + 1) * height) / 2;
        return { x: sx, y: sy, visible: v.z < 1 };
      };

      setScreenPos({
        cowboy: projectToScreen(state.charObjects['cowboy']?.root),
        plague: projectToScreen(state.charObjects['plague']?.root),
        dog: projectToScreen(state.charObjects['dog']?.root),
        wolf: projectToScreen(state.charObjects['wolf']?.root),
        girl: projectToScreen(state.charObjects['girl']?.root),
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
  }, [isAimingGun, hoveredTargetId, accusedId]);

  // Mouse move handler for 3D FPS rotation & Raycasting
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mountRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / rect.width - 0.5;
    const normY = (e.clientY - rect.top) / rect.height - 0.5;

    mouseRef.current.targetYaw = -normX * 0.65;
    mouseRef.current.targetPitch = -normY * 0.38;

    // Raycast to detect hover on 3D character meshes
    if (threeRef.current) {
      const mouse = new THREE.Vector2(normX * 2, -normY * 2);
      threeRef.current.raycaster.setFromCamera(mouse, threeRef.current.camera);

      const targets: THREE.Object3D[] = [];
      const charIds: string[] = [];
      for (const [id, char] of Object.entries(threeRef.current.charObjects)) {
        targets.push(char.root);
        charIds.push(id);
      }

      const intersects = threeRef.current.raycaster.intersectObjects(targets, false);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        for (const id of charIds) {
          if (threeRef.current.charObjects[id]?.root === hit) {
            setHoveredTargetId(id);
            return;
          }
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

        // Play hit reaction on character plane
        const char = threeRef.current.charObjects[targetId];
        if (char) {
          char.root.rotation.z -= 0.35;
          char.root.position.y -= 0.6;
        }
      }

      setOpponents((prev) => prev.map((o) => (o.id === targetId ? { ...o, isDead: true } : o)));

      if (onShootPlayer) onShootPlayer(target.id, target.nickname);
    }, 50);
  };

  // Play card onto 3D table
  const handlePlayCardToTable = (card: { id: number; name: string }) => {
    tavernAudio.playCardFlip();

    if (threeRef.current) {
      const cardGeo = new THREE.BoxGeometry(0.18, 0.004, 0.26);
      const cardMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.5 });
      const cardMesh = new THREE.Mesh(cardGeo, cardMat);

      const randX = (Math.random() - 0.5) * 0.6;
      const randZ = (Math.random() - 0.5) * 0.35;
      const randRotY = (Math.random() - 0.5) * 0.8;

      cardMesh.position.set(randX, 0.01, randZ);
      cardMesh.rotation.y = randRotY;
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
