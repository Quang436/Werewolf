'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Role } from '@werewolf/shared';
import {
  ComputedSeat,
  TABLE_SURFACE_Y,
  getGoldenGlowTexture,
  getGothicTarotBackTexture,
  getGothicTarotFrontTexture,
  werewolfAudio,
} from './scene3d.helpers';
import { RoleCard } from './RoleCard';

export interface HangingNooseEffectProps {
  /** Active when phase === EXECUTION_PHASE / DAY_EXECUTION and a player is condemned */
  active: boolean;
  condemnedSeat: ComputedSeat | null;
  revealedRole: Role | string;
  /** Callback fired once noose reaches neck so player transitions to isAlive = false & slumps */
  onExecuteSlump?: (playerId: string) => void;
  /** Optional callback after full reveal sequence finishes */
  onSequenceComplete?: (playerId: string) => void;
}

function easeOutCubic(x: number): number {
  const t = THREE.MathUtils.clamp(x, 0, 1);
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(x: number): number {
  const t = THREE.MathUtils.clamp(x, 0, 1);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export const HangingNooseEffect: React.FC<HangingNooseEffectProps> = ({
  active,
  condemnedSeat,
  revealedRole,
  onExecuteSlump,
  onSequenceComplete,
}) => {
  const elapsedRef = useRef(0);
  const triggeredSlumpRef = useRef(false);
  const triggeredCompleteRef = useRef(false);
  const playedCardFlipRef = useRef(false);

  const spotLightRef = useRef<THREE.SpotLight>(null);
  const spotTargetRef = useRef<THREE.Object3D>(null);
  const beamMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const nooseGroupRef = useRef<THREE.Group>(null);
  const revealCardGroupRef = useRef<THREE.Group>(null);
  const revealFlipRef = useRef<THREE.Group>(null);
  const centerPinLightRef = useRef<THREE.PointLight>(null);

  const frontTex = useMemo(() => getGothicTarotFrontTexture(revealedRole), [revealedRole]);
  const backTex = useMemo(() => getGothicTarotBackTexture(), []);
  const glowTex = useMemo(() => getGoldenGlowTexture(), []);

  // Bind SpotLight target when active or seat changes
  useEffect(() => {
    if (spotLightRef.current && spotTargetRef.current) {
      spotLightRef.current.target = spotTargetRef.current;
      spotTargetRef.current.updateMatrixWorld();
    }
  }, [active, condemnedSeat]);

  // Reset timeline whenever a new execution begins
  useEffect(() => {
    if (!active || !condemnedSeat) return;

    elapsedRef.current = 0;
    triggeredSlumpRef.current = false;
    triggeredCompleteRef.current = false;
    playedCardFlipRef.current = false;

    werewolfAudio.playRopeExecution();
  }, [active, condemnedSeat?.player.id]);

  useFrame((state, delta) => {
    if (!active || !condemnedSeat) return;

    const dt = Math.min(delta, 0.1);
    elapsedRef.current += dt;
    const t = elapsedRef.current;
    const clockT = state.clock.elapsedTime;

    if (spotLightRef.current && spotTargetRef.current) {
      spotLightRef.current.target = spotTargetRef.current;
      spotTargetRef.current.updateMatrixWorld();

      // 1. Blood-Red Spotlight ramps up sharply over condemned player's chair
      const ramp = easeOutCubic(t / 0.55);
      spotLightRef.current.intensity = ramp * (26 + Math.sin(clockT * 7) * 1.4);
    }

    if (beamMatRef.current) {
      const ramp = easeOutCubic(t / 0.65);
      beamMatRef.current.opacity = ramp * 0.12;
    }

    // 2. Rope Noose lowers from ceiling (y = 3.95m) down to hover at character's neck (y = 1.24m)
    if (nooseGroupRef.current) {
      const dropProgress = easeInOutCubic((t - 0.2) / 1.55);
      const neckY = condemnedSeat.neckWorldPosition[1] + 0.03;
      const currentY = THREE.MathUtils.lerp(3.95, neckY, dropProgress);
      nooseGroupRef.current.position.set(
        condemnedSeat.neckWorldPosition[0],
        currentY,
        condemnedSeat.neckWorldPosition[2]
      );
      // Gentle sinister pendulum sway
      nooseGroupRef.current.rotation.z = Math.sin(clockT * 2.2) * 0.035 * (1.2 - dropProgress * 0.5);
      nooseGroupRef.current.rotation.x = Math.cos(clockT * 1.7) * 0.022;
    }

    // 3. Condemned character slumps head & arms down onto table -> isAlive = false
    // (Nếu là Hoàng tử PRINCE thì thoát chết, không gục đầu và không gọi onExecuteSlump)
    if (!triggeredSlumpRef.current && t >= 1.95) {
      triggeredSlumpRef.current = true;
      werewolfAudio.playGavel();
      if (revealedRole !== 'PRINCE') {
        onExecuteSlump?.(condemnedSeat.player.id);
      }
    }

    // 4. Dead player's Role Card glides to center of table & flips face-up for the whole room
    if (revealCardGroupRef.current && revealFlipRef.current) {
      if (t < 2.15) {
        revealCardGroupRef.current.visible = false;
      } else {
        revealCardGroupRef.current.visible = true;
        if (!playedCardFlipRef.current) {
          playedCardFlipRef.current = true;
          werewolfAudio.playCardDeal();
        }

        const cardProgress = easeInOutCubic((t - 2.15) / 1.25);
        // Fly directly from the condemned player's seat out to the poker table center [0, 0.85, 0]
        const startX = condemnedSeat.position[0] * 0.82;
        const startY = 0.92;
        const startZ = condemnedSeat.position[2] * 0.82;

        const endX = 0;
        const endY = 0.85;
        const endZ = 0;

        revealCardGroupRef.current.position.set(
          THREE.MathUtils.lerp(startX, endX, cardProgress),
          THREE.MathUtils.lerp(startY, endY, cardProgress) + Math.sin(cardProgress * Math.PI) * 0.22,
          THREE.MathUtils.lerp(startZ, endZ, cardProgress)
        );

        // Tilted face-up at table center [0, 0.85, 0] so the entire table reads the identity
        revealCardGroupRef.current.rotation.set(
          THREE.MathUtils.lerp(-Math.PI / 2, -1.05, cardProgress),
          0,
          0
        );

        // 180-degree flip from face-down (Math.PI) to face-up (0)
        revealFlipRef.current.rotation.y = THREE.MathUtils.lerp(Math.PI, 0, cardProgress);

        if (centerPinLightRef.current) {
          centerPinLightRef.current.intensity = cardProgress * 2.4;
        }
      }
    }

    if (!triggeredCompleteRef.current && t >= 6.8) {
      triggeredCompleteRef.current = true;
      onSequenceComplete?.(condemnedSeat.player.id);
    }
  });

  if (!active || !condemnedSeat) return null;

  const [seatX, , seatZ] = condemnedSeat.position;

  return (
    <group>
      {/* ================================================================
          1. BLOOD-RED EXECUTION SPOTLIGHT FROM CEILING ONTO CONDEMNED SEAT
         ================================================================ */}
      <object3D ref={spotTargetRef} position={[seatX, 0.55, seatZ]} />

      <spotLight
        ref={spotLightRef}
        position={[seatX, 4.5, seatZ]}
        color="#ff1226"
        intensity={0}
        distance={8.5}
        angle={0.34}
        penumbra={0.52}
        decay={1.4}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0004}
      />

      {/* Crimson Volumetric Light Cone through Smoky Pub Air */}
      <mesh position={[seatX, 2.45, seatZ]}>
        <coneGeometry args={[0.78, 4.1, 24, 1, true]} />
        <meshBasicMaterial
          ref={beamMatRef}
          color="#dc142c"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Subtle Red Floor Pool Ring under Condemned Chair */}
      <mesh position={[seatX, 0.006, seatZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.62, 28]} />
        <meshBasicMaterial
          color="#990a1a"
          transparent
          opacity={0.28}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* ================================================================
          2. 3D BRAIDED HEMP ROPE NOOSE DESCENDING TO CHARACTER'S NECK
         ================================================================ */}
      <group
        ref={nooseGroupRef}
        position={[
          condemnedSeat.neckWorldPosition[0],
          3.95,
          condemnedSeat.neckWorldPosition[2],
        ]}
        rotation={[0, condemnedSeat.rotationY, 0]}
      >
        {/* Taut Vertical Hemp Suspension Rope to Ceiling */}
        <mesh position={[0, 1.85, 0]} castShadow>
          <cylinderGeometry args={[0.013, 0.013, 3.4, 10]} />
          <meshStandardMaterial color="#8c6d46" roughness={0.93} metalness={0.04} />
        </mesh>

        {/* 7-Coil Hangman's Collar Knot */}
        {Array.from({ length: 7 }).map((_, idx) => (
          <mesh
            key={idx}
            position={[0, 0.145 + idx * 0.016, 0]}
            rotation={[Math.PI / 2 + 0.08, 0, 0]}
            castShadow
          >
            <torusGeometry args={[0.023, 0.0085, 8, 16]} />
            <meshStandardMaterial color="#9a784d" roughness={0.92} metalness={0.04} />
          </mesh>
        ))}

        {/* Braided Teardrop Noose Loop Hovering at Condemned Neck */}
        <mesh position={[0, 0.01, 0.02]} rotation={[0.28, 0, 0]} scale={[0.92, 1.16, 1]} castShadow>
          <torusGeometry args={[0.105, 0.0125, 10, 28]} />
          <meshStandardMaterial color="#967449" roughness={0.9} metalness={0.05} />
        </mesh>
      </group>

      {/* ================================================================
          3. EXECUTED PLAYER'S ROLE CARD FLIPPING FACE-UP AT TABLE CENTER [0, 0.85, 0]
         ================================================================ */}
      <pointLight
        ref={centerPinLightRef}
        position={[0, 1.28, 0.28]}
        color="#fff0c8"
        intensity={0}
        distance={2.4}
        decay={1.4}
      />

      <group ref={revealCardGroupRef} position={[0, 0.85, 0]} visible={false}>
        {glowTex && (
          <mesh position={[0, 0, -0.015]}>
            <planeGeometry args={[0.48, 0.66]} />
            <meshBasicMaterial
              map={glowTex}
              color="#ff4d4d"
              transparent
              opacity={0.62}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        )}

        <group ref={revealFlipRef} scale={[1.15, 1.15, 1.15]}>
          <RoleCard
            role={revealedRole}
            isInspecting={true}
            onToggleInspect={() => {}}
            isAlive={revealedRole === 'PRINCE'}
          />
        </group>
      </group>
    </group>
  );
};

export default HangingNooseEffect;
