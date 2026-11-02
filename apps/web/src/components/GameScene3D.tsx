'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Billboard, Sparkles } from '@react-three/drei';
import { PublicPlayerView, Role } from '@werewolf/shared';
import {
  CameraPerspective,
  ComputedSeat,
  TABLE_ARMREST_RADIUS,
  TABLE_FELT_RADIUS,
  TABLE_SURFACE_Y,
  computeTableSeats,
  getDarkLeatherTexture,
  getDarkWoodFloorTexture,
  getDiegeticPlaqueTexture,
  getFeltBumpTexture,
  getMatteFeltTexture,
  getSmokePuffTexture,
  interpolateCameraRig,
  werewolfAudio,
} from './scene3d.helpers';
import { TableSeat } from './TableSeat';
import { PersonalCardTray } from './PersonalCardTray';
import { HangingNooseEffect } from './HangingNooseEffect';

export interface GameScene3DProps {
  players: PublicPlayerView[];
  localPlayerId: string | null | undefined;
  localRole: Role | string;
  perspective: CameraPerspective;
  phase: string;
  isNight: boolean;
  canVote: boolean;
  voteTally: Record<string, number>;
  myVotedTargetId: string | null;
  selectedTargetId: string | null;
  /** Incrementing trigger whenever DEALING_CARDS / Phát Bài starts */
  dealTrigger: number;
  hasDealtCards: boolean;
  isCardInspecting: boolean;
  onToggleCardInspect: (next?: boolean) => void;
  onDealComplete?: () => void;
  /** Execution state when unique highest vote condemns a player */
  isExecutionPhase: boolean;
  condemnedPlayerId: string | null;
  condemnedRole: Role | string;
  onExecuteSlump?: (playerId: string) => void;
  onExecutionComplete?: () => void;
  /** Diegetic status plaque strings */
  diegeticPhaseTitle: string;
  diegeticTimerText: string;
  diegeticSubtitle: string;
  isPeacefulTie?: boolean;
  /** FSM Game Loop Director Props */
  isSleeping?: boolean;
  moodLighting?: 'pitch_dark' | 'bodyguard_cyan' | 'wolf_crimson' | 'seer_gold' | 'execution_red' | 'day_pub';
  isWolfAwake?: boolean;
  wolfTeammateIds?: Set<string>;
  wolfTargetId?: string | null;
  seerPeekResult?: { targetId: string; isWerewolf: boolean } | null;
  speakingPlayerIds?: Set<string>;
  eliminatedTonight?: Set<string>;
  /** Interaction callback when player clicks an opponent seat or vote badge */
  onCastVote: (targetId: string) => void;
}

// ============================================================================
// 1. DUAL PERSPECTIVE CAMERA CONTROLLER (1ST FPS POV + 2ND TACTICAL OBSERVER)
// ============================================================================

const DualPerspectiveCameraRig: React.FC<{
  perspective: CameraPerspective;
  executionFocusPos: [number, number, number] | null;
  isSleeping?: boolean;
}> = ({ perspective, executionFocusPos, isSleeping = false }) => {
  const { camera } = useThree();
  const currentLookAtRef = useRef(new THREE.Vector3(0, 0.85, 0));
  const smoothedPointerRef = useRef(new THREE.Vector2(0, 0));
  const rawPointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (window.innerWidth <= 0 || window.innerHeight <= 0) return;
      rawPointerRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      rawPointerRef.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  useFrame((_, delta) => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    interpolateCameraRig(
      camera,
      currentLookAtRef.current,
      smoothedPointerRef.current,
      rawPointerRef.current,
      perspective,
      delta,
      executionFocusPos,
      isSleeping
    );
  });

  return null;
};

// ============================================================================
// 2. PUB NOIR LIGHTING RIG (LOW AMBIENT, OVERHEAD CONE SPOT, CYAN & WINE RIMS)
// ============================================================================

const PubNoirLightingRig: React.FC<{
  isNight: boolean;
  isExecutionPhase: boolean;
  moodLighting?: 'pitch_dark' | 'bodyguard_cyan' | 'wolf_crimson' | 'seer_gold' | 'execution_red' | 'day_pub';
}> = ({ isNight, isExecutionPhase, moodLighting = 'day_pub' }) => {
  const mainSpotRef = useRef<THREE.SpotLight>(null);
  const spotTargetRef = useRef<THREE.Object3D>(null);
  const cyanRimRef = useRef<THREE.PointLight>(null);
  const redRimRef = useRef<THREE.PointLight>(null);
  const lampConeMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);

  useEffect(() => {
    if (mainSpotRef.current && spotTargetRef.current) {
      mainSpotRef.current.target = spotTargetRef.current;
      spotTargetRef.current.updateMatrixWorld();
    }
  }, []);

  useFrame((state, delta) => {
    const alpha = 1 - Math.exp(-4.2 * Math.min(delta, 0.1));
    const flicker = 1 + Math.sin(state.clock.elapsedTime * 11) * 0.012;

    let targetSpotIntensity = 22.0 * flicker;
    let targetSpotColor = '#ffe0b2';
    let targetCyanIntensity = 4.2;
    let targetRedIntensity = 4.6;
    let targetConeOpacity = 0.048;
    let targetAmbient = 0.05;

    if (moodLighting === 'pitch_dark') {
      // PHA 1: CẢ LÀNG ĐI NGỦ (ambientLight = 0.02, room pitch black)
      targetSpotIntensity = 0.3;
      targetSpotColor = '#1e1b4b';
      targetCyanIntensity = 0.2;
      targetRedIntensity = 0.2;
      targetConeOpacity = 0.005;
      targetAmbient = 0.02;
    } else if (moodLighting === 'bodyguard_cyan') {
      // PHA 2: BẢO VỆ THỨC DẬY - emerald / cyan ambient & rim glow
      targetSpotIntensity = 4.5;
      targetSpotColor = '#06b6d4';
      targetCyanIntensity = 8.5;
      targetRedIntensity = 0.8;
      targetConeOpacity = 0.025;
      targetAmbient = 0.035;
    } else if (moodLighting === 'wolf_crimson') {
      // PHA 3: MA SÓI THỨC DẬY - blood-red eerie ambient & wine rim
      targetSpotIntensity = 5.5;
      targetSpotColor = '#e11d48';
      targetCyanIntensity = 0.6;
      targetRedIntensity = 9.5;
      targetConeOpacity = 0.03;
      targetAmbient = 0.04;
    } else if (moodLighting === 'seer_gold') {
      // PHA 4: TIÊN TRI THỨC DẬY - golden mystic lighting
      targetSpotIntensity = 8.5;
      targetSpotColor = '#f59e0b';
      targetCyanIntensity = 2.5;
      targetRedIntensity = 2.0;
      targetConeOpacity = 0.035;
      targetAmbient = 0.045;
    } else if (isExecutionPhase || moodLighting === 'execution_red') {
      // PHA 9: XỬ TỬ TREO CỔ - room dims sharply so gallows spotlight dominates
      targetSpotIntensity = 2.2;
      targetSpotColor = '#7f1d1d';
      targetCyanIntensity = 0.8;
      targetRedIntensity = 1.4;
      targetConeOpacity = 0.012;
      targetAmbient = 0.02;
    } else if (isNight) {
      targetSpotIntensity = 9.5;
      targetSpotColor = '#c7d2fe';
      targetCyanIntensity = 5.5;
      targetRedIntensity = 3.5;
      targetConeOpacity = 0.028;
      targetAmbient = 0.03;
    }

    if (mainSpotRef.current) {
      mainSpotRef.current.intensity = THREE.MathUtils.lerp(
        mainSpotRef.current.intensity,
        targetSpotIntensity,
        alpha
      );
      mainSpotRef.current.color.lerp(new THREE.Color(targetSpotColor), alpha);
    }
    if (cyanRimRef.current) {
      cyanRimRef.current.intensity = THREE.MathUtils.lerp(
        cyanRimRef.current.intensity,
        targetCyanIntensity,
        alpha
      );
    }
    if (redRimRef.current) {
      redRimRef.current.intensity = THREE.MathUtils.lerp(
        redRimRef.current.intensity,
        targetRedIntensity,
        alpha
      );
    }
    if (lampConeMatRef.current) {
      lampConeMatRef.current.opacity = THREE.MathUtils.lerp(
        lampConeMatRef.current.opacity,
        targetConeOpacity,
        alpha
      );
    }
    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.lerp(
        ambientRef.current.intensity,
        targetAmbient,
        alpha
      );
    }
  });

  return (
    <group>
      {/* Dynamic Dark Noir Ambient Base */}
      <ambientLight ref={ambientRef} color="#050508" intensity={0.05} />

      {/* Center Overhead Narrow-Cone Spotlight at [0, 4.5, 0] -> Table Center */}
      <object3D ref={spotTargetRef} position={[0, 0.8, 0]} />
      <spotLight
        ref={mainSpotRef}
        position={[0, 4.5, 0]}
        color="#ffe0b2"
        intensity={22}
        distance={11}
        angle={0.5}
        penumbra={0.7}
        decay={1.35}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0003}
      />

      {/* Industrial Noir Hanging Pub Lamp Shade & Volumetric Haze Cone */}
      <group position={[0, 4.52, 0]}>
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.014, 0.014, 0.9, 8]} />
          <meshStandardMaterial color="#0b0b0e" roughness={0.6} metalness={0.8} />
        </mesh>
        <mesh castShadow>
          <coneGeometry args={[0.38, 0.24, 24, 1, true]} />
          <meshStandardMaterial color="#121318" roughness={0.5} metalness={0.75} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.05, 0]}>
          <sphereGeometry args={[0.055, 12, 12]} />
          <meshBasicMaterial color={isExecutionPhase ? '#5c1414' : '#ffe4b5'} />
        </mesh>
      </group>

      <mesh position={[0, 2.62, 0]}>
        <coneGeometry args={[1.95, 3.7, 32, 1, true]} />
        <meshBasicMaterial
          ref={lampConeMatRef}
          color="#ffe0b2"
          transparent
          opacity={0.048}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Cinematic Rim Lighting: Cyan (#00e5ff) behind-left, Wine-Red (#ff1744) behind-right */}
      <pointLight
        ref={cyanRimRef}
        position={[-3.7, 2.35, -3.45]}
        color="#00e5ff"
        intensity={4.2}
        distance={10.5}
        decay={1.6}
      />
      <pointLight
        ref={redRimRef}
        position={[3.7, 2.35, -3.45]}
        color="#ff1744"
        intensity={4.6}
        distance={10.5}
        decay={1.6}
      />
    </group>
  );
};

// ============================================================================
// 3. DETAILED TABLE PROPS: SMOKED-GLASS ASHTRAY + CIGAR & WHISKEY WITH ICE
// ============================================================================

const SmokedGlassAshtrayProp: React.FC = () => {
  const smokeTex = useMemo(() => getSmokePuffTexture(), []);
  const smokeRefs = useRef<Array<THREE.Mesh | null>>([]);
  const emberMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const smokeSeeds = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, idx) => ({
        offset: idx / 14,
        driftX: (idx % 2 === 0 ? 1 : -1) * (0.012 + (idx % 4) * 0.005),
        swirlSpeed: 1.4 + (idx % 3) * 0.35,
      })),
    []
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (emberMatRef.current) {
      emberMatRef.current.emissiveIntensity = 1.4 + Math.sin(t * 3.2) * 0.55;
    }

    smokeSeeds.forEach((seed, idx) => {
      const puff = smokeRefs.current[idx];
      if (!puff) return;

      const life = (t * 0.22 + seed.offset) % 1;
      const y = 0.042 + life * 0.44;
      const x = 0.056 + Math.sin(t * seed.swirlSpeed + idx) * (0.012 + life * 0.032) + seed.driftX * life;
      const z = 0.012 + Math.cos(t * 1.1 + idx) * (0.008 + life * 0.022);

      puff.position.set(x, y, z);
      const scale = 0.022 + life * 0.085;
      puff.scale.setScalar(scale);

      const mat = puff.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.sin(life * Math.PI) * 0.32;
    });
  });

  return (
    <group position={[-0.64, TABLE_SURFACE_Y, 1.36]} rotation={[0, 0.35, 0]}>
      {/* Heavy Faceted Smoked-Glass Ashtray Body */}
      <mesh position={[0, 0.015, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.082, 0.072, 0.03, 10]} />
        <meshStandardMaterial
          color="#171a20"
          roughness={0.16}
          metalness={0.14}
          transparent
          opacity={0.82}
        />
      </mesh>

      {/* Dark Smoked Inner Basin & Ash */}
      <mesh position={[0, 0.029, 0]}>
        <cylinderGeometry args={[0.058, 0.052, 0.005, 12]} />
        <meshStandardMaterial color="#0b0b0d" roughness={0.94} />
      </mesh>
      <mesh position={[0.012, 0.032, 0.004]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.022, 10]} />
        <meshStandardMaterial color="#3c3a38" roughness={0.98} />
      </mesh>

      {/* Hand-Rolled Noir Cigar Resting on Rim */}
      <group position={[0.012, 0.034, 0.006]} rotation={[0.06, -0.18, Math.PI / 2 - 0.05]}>
        {/* Dark Maduro Tobacco Wrapper */}
        <mesh castShadow>
          <cylinderGeometry args={[0.0105, 0.011, 0.115, 14]} />
          <meshStandardMaterial color="#3b2112" roughness={0.84} metalness={0.04} />
        </mesh>
        {/* Metallic Gold Cigar Band */}
        <mesh position={[0, 0.026, 0]}>
          <cylinderGeometry args={[0.0113, 0.0113, 0.014, 14]} />
          <meshStandardMaterial color="#d4a84b" roughness={0.32} metalness={0.82} />
        </mesh>
        {/* Charred Grey Ash Tip */}
        <mesh position={[0, -0.062, 0]}>
          <cylinderGeometry args={[0.0102, 0.0095, 0.014, 12]} />
          <meshStandardMaterial color="#6e6b68" roughness={0.96} />
        </mesh>
        {/* Smoldering Orange-Red Ember */}
        <mesh position={[0, -0.069, 0]}>
          <cylinderGeometry args={[0.0094, 0.007, 0.005, 12]} />
          <meshStandardMaterial
            ref={emberMatRef}
            color="#ff3d00"
            emissive="#ff4500"
            emissiveIntensity={1.6}
            roughness={0.6}
          />
        </mesh>
      </group>

      {/* Wispy Rising Cigar Smoke Plume */}
      {smokeTex &&
        smokeSeeds.map((_, idx) => (
          <Billboard key={idx} follow>
            <mesh
              ref={(el) => {
                smokeRefs.current[idx] = el;
              }}
              position={[0.056, 0.05, 0.01]}
            >
              <planeGeometry args={[1, 1]} />
              <meshBasicMaterial
                map={smokeTex}
                transparent
                opacity={0.2}
                depthWrite={false}
              />
            </mesh>
          </Billboard>
        ))}
    </group>
  );
};

const WhiskeyRocksGlassProp: React.FC = () => {
  return (
    <group position={[0.52, TABLE_SURFACE_Y, 1.42]}>
      {/* Leather Coaster Under Glass */}
      <mesh position={[0, 0.002, 0]} receiveShadow>
        <cylinderGeometry args={[0.056, 0.058, 0.004, 24]} />
        <meshStandardMaterial color="#1c110c" roughness={0.85} metalness={0.08} />
      </mesh>

      {/* Heavy Cut-Crystal Glass Base */}
      <mesh position={[0, 0.012, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.043, 0.041, 0.016, 22]} />
        <meshStandardMaterial
          color="#cfdce6"
          roughness={0.1}
          metalness={0.12}
          transparent
          opacity={0.45}
        />
      </mesh>

      {/* Amber Bourbon / Whiskey Liquid */}
      <mesh position={[0, 0.042, 0]}>
        <cylinderGeometry args={[0.041, 0.039, 0.046, 22]} />
        <meshStandardMaterial
          color="#c86d14"
          emissive="#4a2103"
          emissiveIntensity={0.35}
          roughness={0.14}
          metalness={0.08}
          transparent
          opacity={0.86}
        />
      </mesh>

      {/* 3 Chilled Crystalline Ice Cubes Floating in Whiskey */}
      <mesh position={[-0.011, 0.052, 0.008]} rotation={[0.25, 0.42, 0.18]}>
        <boxGeometry args={[0.021, 0.021, 0.021]} />
        <meshStandardMaterial
          color="#e2f1ff"
          roughness={0.08}
          metalness={0.1}
          transparent
          opacity={0.62}
        />
      </mesh>
      <mesh position={[0.013, 0.05, -0.007]} rotation={[-0.22, 0.78, -0.15]}>
        <boxGeometry args={[0.02, 0.02, 0.02]} />
        <meshStandardMaterial
          color="#e2f1ff"
          roughness={0.08}
          metalness={0.1}
          transparent
          opacity={0.6}
        />
      </mesh>
      <mesh position={[0.002, 0.044, 0.012]} rotation={[0.4, -0.3, 0.28]}>
        <boxGeometry args={[0.018, 0.018, 0.018]} />
        <meshStandardMaterial
          color="#d8ecff"
          roughness={0.1}
          metalness={0.1}
          transparent
          opacity={0.55}
        />
      </mesh>

      {/* Outer Crystal Lowball Glass Wall */}
      <mesh position={[0, 0.056, 0]} castShadow>
        <cylinderGeometry args={[0.047, 0.043, 0.092, 24, 1, true]} />
        <meshStandardMaterial
          color="#e6f0f7"
          roughness={0.08}
          metalness={0.15}
          transparent
          opacity={0.32}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Subtle Rim Specular Ring */}
      <mesh position={[0, 0.102, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.047, 0.0016, 8, 24]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.12} metalness={0.3} transparent opacity={0.55} />
      </mesh>
    </group>
  );
};

// ============================================================================
// 4. POKER TABLE, LEATHER ARMREST, HARDWOOD FLOOR & UNDERGROUND PUB BACKDROP
// ============================================================================

const PubNoirEnvironmentAndTable: React.FC<{
  diegeticPhaseTitle: string;
  diegeticTimerText: string;
  diegeticSubtitle: string;
  plaqueMode: 'day' | 'night' | 'execution' | 'peace';
  onClickTableSurface?: () => void;
}> = ({
  diegeticPhaseTitle,
  diegeticTimerText,
  diegeticSubtitle,
  plaqueMode,
  onClickTableSurface,
}) => {
  const feltTex = useMemo(() => getMatteFeltTexture('moss'), []);
  const feltBumpTex = useMemo(() => getFeltBumpTexture(), []);
  const leatherTex = useMemo(() => getDarkLeatherTexture(), []);
  const woodFloorTex = useMemo(() => getDarkWoodFloorTexture(), []);

  const plaqueTex = useMemo(
    () => getDiegeticPlaqueTexture(diegeticPhaseTitle, diegeticTimerText, diegeticSubtitle, plaqueMode),
    [diegeticPhaseTitle, diegeticTimerText, diegeticSubtitle, plaqueMode]
  );

  return (
    <group
      onClick={(e) => {
        if (onClickTableSurface) {
          e.stopPropagation();
          onClickTableSurface();
        }
      }}
    >
      {/* HIGH-ROUGHNESS DARK HARDWOOD PUB FLOOR */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[12, 48]} />
        <meshStandardMaterial
          color="#18110c"
          map={woodFloorTex ?? undefined}
          roughness={0.92}
          metalness={0.04}
        />
      </mesh>

      {/* ROUND MATTE FELT POKER TABLE + DARK LEATHER ARMREST PADDING */}
      <group>
        {/* Heavy Carved Mahogany Central Pedestal & Foot Base */}
        <mesh position={[0, 0.045, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.88, 0.96, 0.09, 28]} />
          <meshStandardMaterial color="#180e09" roughness={0.8} metalness={0.08} />
        </mesh>
        <mesh position={[0, 0.37, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.38, 0.5, 0.62, 24]} />
          <meshStandardMaterial color="#1c100a" roughness={0.78} metalness={0.09} />
        </mesh>

        {/* Sub-table Hardwood Apron */}
        <mesh position={[0, TABLE_SURFACE_Y - 0.065, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.98, 1.92, 0.11, 48]} />
          <meshStandardMaterial color="#1a0f0a" roughness={0.76} metalness={0.1} />
        </mesh>

        {/* Matte Moss-Green Poker Felt Top Surface (roughness: 0.85, metalness: 0.05, zero plastic shine) */}
        <mesh position={[0, TABLE_SURFACE_Y - 0.015, 0]} receiveShadow>
          <cylinderGeometry args={[TABLE_FELT_RADIUS, TABLE_FELT_RADIUS, 0.03, 64]} />
          <meshStandardMaterial
            color="#163022"
            map={feltTex ?? undefined}
            bumpMap={feltBumpTex ?? undefined}
            bumpScale={0.004}
            roughness={0.85}
            metalness={0.05}
          />
        </mesh>

        {/* Recessed Brass Inlay Groove Between Felt and Leather Armrest */}
        <mesh position={[0, TABLE_SURFACE_Y + 0.002, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[TABLE_FELT_RADIUS + 0.01, 0.012, 10, 64]} />
          <meshStandardMaterial color="#7d5e28" roughness={0.46} metalness={0.68} />
        </mesh>

        {/* Dark Padded Leather Armrest Rim (Leather Armrest Padding) */}
        <mesh
          position={[0, TABLE_SURFACE_Y + 0.018, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
          receiveShadow
        >
          <torusGeometry args={[TABLE_ARMREST_RADIUS - 0.06, 0.115, 20, 64]} />
          <meshStandardMaterial
            color="#1c100d"
            map={leatherTex ?? undefined}
            roughness={0.62}
            metalness={0.08}
          />
        </mesh>
      </group>

      {/* DIEGETIC 3D TABLE STATUS & TIMER PLAQUE EMBEDDED ON FELT */}
      {plaqueTex && (
        <group position={[0, TABLE_SURFACE_Y + 0.014, -0.34]} rotation={[-1.32, 0, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.56, 0.16, 0.014]} />
            <meshStandardMaterial color="#2a1d11" roughness={0.52} metalness={0.55} />
          </mesh>
          <mesh position={[0, 0, 0.008]}>
            <planeGeometry args={[0.54, 0.15]} />
            <meshStandardMaterial
              map={plaqueTex}
              roughness={0.45}
              metalness={0.18}
              emissive="#1a1208"
              emissiveIntensity={0.35}
            />
          </mesh>
        </group>
      )}

      {/* SHADOWY UNDERGROUND SPEAKEASY PUB SILHOUETTE WALLS & BAR COUNTER */}
      <group>
        {/* Back Speakeasy Bar Counter & Bottle Rack Silhouette (kissed by Cyan & Wine-Red rim lights) */}
        <mesh position={[0, 0.58, -5.4]} receiveShadow>
          <boxGeometry args={[5.8, 1.16, 0.7]} />
          <meshStandardMaterial color="#120c09" roughness={0.86} metalness={0.08} />
        </mesh>
        <mesh position={[0, 1.9, -5.85]}>
          <boxGeometry args={[5.4, 2.2, 0.28]} />
          <meshStandardMaterial color="#0e0a08" roughness={0.88} metalness={0.06} />
        </mesh>
        {/* Subtle Glass Liquor Bottle Silhouettes on Back Shelf */}
        {[-1.8, -1.35, -0.9, -0.3, 0.25, 0.85, 1.3, 1.75].map((bx, idx) => (
          <mesh key={idx} position={[bx, 1.38 + (idx % 2) * 0.52, -5.68]}>
            <cylinderGeometry args={[0.045, 0.055, 0.3, 10]} />
            <meshStandardMaterial
              color={idx % 3 === 0 ? '#1b3a3e' : idx % 2 === 0 ? '#3d151c' : '#3a2712'}
              roughness={0.22}
              metalness={0.2}
              transparent
              opacity={0.72}
            />
          </mesh>
        ))}

        {/* Dark Brick & Timber Speakeasy Pillars */}
        {[
          [-4.8, 2.2, -4.4],
          [4.8, 2.2, -4.4],
          [-5.4, 2.2, 0.6],
          [5.4, 2.2, 0.6],
        ].map(([px, py, pz], idx) => (
          <mesh key={idx} position={[px, py, pz]} receiveShadow>
            <boxGeometry args={[0.58, 4.4, 0.58]} />
            <meshStandardMaterial color="#0c0a0c" roughness={0.92} metalness={0.05} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

// ============================================================================
// 5. MAIN EXPORTED <GameScene3D /> CANVAS COMPONENT
// ============================================================================

export const GameScene3D: React.FC<GameScene3DProps> = ({
  players,
  localPlayerId,
  localRole,
  perspective,
  isNight,
  canVote,
  voteTally,
  myVotedTargetId,
  selectedTargetId,
  dealTrigger,
  hasDealtCards,
  isCardInspecting,
  onToggleCardInspect,
  onDealComplete,
  isExecutionPhase,
  condemnedPlayerId,
  condemnedRole,
  onExecuteSlump,
  onExecutionComplete,
  diegeticPhaseTitle,
  diegeticTimerText,
  diegeticSubtitle,
  isPeacefulTie = false,
  isSleeping = false,
  moodLighting = 'day_pub',
  isWolfAwake = false,
  wolfTeammateIds,
  wolfTargetId = null,
  seerPeekResult = null,
  speakingPlayerIds = new Set(),
  eliminatedTonight = new Set(),
  onCastVote,
}) => {
  const seats: ComputedSeat[] = useMemo(
    () => computeTableSeats(players, localPlayerId, voteTally),
    [players, localPlayerId, voteTally]
  );

  const localSeat = useMemo(
    () => seats.find((s) => s.isLocal) || seats[seats.length - 1] || null,
    [seats]
  );

  const condemnedSeat = useMemo(
    () => (condemnedPlayerId ? seats.find((s) => s.player.id === condemnedPlayerId) || null : null),
    [condemnedPlayerId, seats]
  );

  const maxVotes = useMemo(() => {
    let max = 0;
    for (const s of seats) {
      if (s.player.isAlive && s.voteCount > max) max = s.voteCount;
    }
    return max;
  }, [seats]);

  const opponentCardPositions = useMemo(
    () => seats.filter((s) => !s.isLocal && s.player.isAlive).map((s) => s.cardRestPosition),
    [seats]
  );

  const plaqueMode: 'day' | 'night' | 'execution' | 'peace' = isExecutionPhase
    ? 'execution'
    : isPeacefulTie
    ? 'peace'
    : isNight
    ? 'night'
    : 'day';

  const handleDismissCardInspect = () => {
    if (isCardInspecting) {
      werewolfAudio.playCardDeal();
      onToggleCardInspect(false);
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full bg-[#040407]">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 1.35, 2.3], fov: 66, near: 0.08, far: 35 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.08 }}
        onPointerMissed={handleDismissCardInspect}
      >
        <color attach="background" args={['#040407']} />
        <fog attach="fog" args={['#040407', 4.8, 13.8]} />

        {/* 1. Dual Perspective Camera Rig (1ST FPS POV + 2ND Tactical Observer) */}
        <DualPerspectiveCameraRig
          perspective={perspective}
          executionFocusPos={isExecutionPhase && condemnedSeat ? condemnedSeat.position : null}
          isSleeping={isSleeping}
        />

        {/* 2. Dark Noir Pub Lighting Rig */}
        <PubNoirLightingRig
          isNight={isNight}
          isExecutionPhase={isExecutionPhase}
          moodLighting={moodLighting}
        />

        {/* Subtle Floating Dust Motes Under the Overhead Pub Lamp */}
        <Sparkles
          count={38}
          scale={[3.4, 2.2, 3.4]}
          position={[0, 2.0, 0]}
          size={1.3}
          speed={0.18}
          opacity={isExecutionPhase ? 0.15 : 0.35}
          color={isExecutionPhase ? '#ff4d6d' : '#ffe0b2'}
        />

        {/* 3. Underground Pub Floor, Matte Felt Poker Table, Leather Armrest & Diegetic Plaque */}
        <PubNoirEnvironmentAndTable
          diegeticPhaseTitle={diegeticPhaseTitle}
          diegeticTimerText={diegeticTimerText}
          diegeticSubtitle={diegeticSubtitle}
          plaqueMode={plaqueMode}
          onClickTableSurface={isCardInspecting ? handleDismissCardInspect : undefined}
        />

        {/* 4. Detailed Noir Table Props: Smoked-Glass Ashtray + Smoldering Cigar & Whiskey Glass */}
        <SmokedGlassAshtrayProp />
        <WhiskeyRocksGlassProp />

        {/* 5. Circular Table Seats (r = 2.45m): Click Opponent Seat / Name directly to Vote */}
        {seats.map((seat) => (
          <TableSeat
            key={seat.player.id}
            seat={seat}
            cameraPerspective={perspective}
            isNight={isNight}
            canVote={canVote && !isExecutionPhase}
            isSelected={selectedTargetId === seat.player.id || myVotedTargetId === seat.player.id}
            isCondemned={isExecutionPhase && condemnedPlayerId === seat.player.id}
            isLeadingVote={maxVotes > 0 && seat.voteCount === maxVotes}
            hasDealtCards={hasDealtCards && !(isExecutionPhase && condemnedPlayerId === seat.player.id)}
            isSleeping={isSleeping}
            isWolfAwake={Boolean(isWolfAwake && (wolfTeammateIds ? wolfTeammateIds.has(seat.player.id) : seat.player.revealedRole === 'WEREWOLF'))}
            isWolfTarget={Boolean(wolfTargetId === seat.player.id)}
            seerPeekResult={seerPeekResult}
            isSpeaking={Boolean(speakingPlayerIds?.has(seat.player.id))}
            isKilledTonight={Boolean(eliminatedTonight?.has(seat.player.id))}
            moodLighting={moodLighting}
            onSelectSeat={(targetId) => {
              if (isCardInspecting) {
                onToggleCardInspect(false);
              }
              onCastVote(targetId);
            }}
          />
        ))}

        {/* 6. Wooden Personal Card Tray & Identity Plaque (~ [0, 0.77, 1.6]) + Tarot Rest & Inspect */}
        <PersonalCardTray
          seatNumber={localSeat?.player.seat ?? 8}
          playerName={localSeat?.player.nickname ?? 'Bạn'}
          isAlive={localSeat?.player.isAlive ?? true}
          role={localRole}
          perspective={perspective}
          dealTrigger={dealTrigger}
          isInspecting={isCardInspecting}
          onToggleInspect={onToggleCardInspect}
          onDealComplete={onDealComplete}
          opponentCardPositions={opponentCardPositions}
        />

        {/* 7. Cinematic Hanging Execution: Blackout, Red Spotlight, Rope Noose, Slump & Center Card Reveal [0, 0.85, 0] */}
        <HangingNooseEffect
          active={isExecutionPhase}
          condemnedSeat={condemnedSeat}
          revealedRole={condemnedRole}
          onExecuteSlump={onExecuteSlump}
          onSequenceComplete={onExecutionComplete}
        />
      </Canvas>
    </div>
  );
};

export default GameScene3D;
