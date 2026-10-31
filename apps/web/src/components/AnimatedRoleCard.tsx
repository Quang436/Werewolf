'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useCursor } from '@react-three/drei';
import { Role } from '@werewolf/shared';
import {
  TABLE_SURFACE_Y,
  getGoldenGlowTexture,
  getGothicTarotBackTexture,
  getGothicTarotFrontTexture,
  werewolfAudio,
} from './scene3d.helpers';

export interface AnimatedRoleCardProps {
  role: Role | string;
  /** Incrementing nonce / trigger whenever phase enters DEALING_CARDS or user deals */
  dealTrigger: number;
  /** Controlled or uncontrolled manual inspect toggle (e.g., via [C] shortcut or clicking the peeked card) */
  isInspecting: boolean;
  onToggleInspect: (next?: boolean) => void;
  onDealComplete?: () => void;
  /** Opponent card landing positions so dealing fans out across the whole table */
  opponentCardPositions?: Array<[number, number, number]>;
}

type CardStage = 'IDLE_HIDDEN' | 'SLIDE_IN' | 'FLOAT_FLIP' | 'HOLD_REVEAL' | 'SETTLED_PEEK';

// Exact keyframe coordinates from technical specification:
const POS_CENTER_DECK = new THREE.Vector3(0, 0.82, 0);
const POS_SLIDE_FRONT = new THREE.Vector3(0, 0.82, 1.8);
const POS_EYE_FLOAT = new THREE.Vector3(0, 1.15, 1.9);
const POS_TABLE_PEEK = new THREE.Vector3(-0.38, 0.834, 1.5);

function easeOutCubic(x: number): number {
  const t = THREE.MathUtils.clamp(x, 0, 1);
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(x: number): number {
  const t = THREE.MathUtils.clamp(x, 0, 1);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export const AnimatedRoleCard: React.FC<AnimatedRoleCardProps> = ({
  role,
  dealTrigger,
  isInspecting,
  onToggleInspect,
  onDealComplete,
  opponentCardPositions = [],
}) => {
  const [hovered, setHovered] = useState(false);
  const [isDealingOpponents, setIsDealingOpponents] = useState(false);

  const stageRef = useRef<CardStage>(dealTrigger > 0 ? 'SLIDE_IN' : 'IDLE_HIDDEN');
  const elapsedRef = useRef(0);
  const playedFlipSoundRef = useRef(false);
  const notifiedCompleteRef = useRef(false);

  const holderRef = useRef<THREE.Group>(null);
  const flipGroupRef = useRef<THREE.Group>(null);
  const glowMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const glowLightRef = useRef<THREE.PointLight>(null);
  const opponentCardsRef = useRef<Array<THREE.Mesh | null>>([]);

  const frontTex = useMemo(() => getGothicTarotFrontTexture(role), [role]);
  const backTex = useMemo(() => getGothicTarotBackTexture(), []);
  const glowTex = useMemo(() => getGoldenGlowTexture(), []);

  useCursor(hovered && stageRef.current !== 'IDLE_HIDDEN', 'pointer', 'auto');

  // Restart 4-stage cinematic card sequence whenever dealTrigger increments
  useEffect(() => {
    if (dealTrigger <= 0) return;

    stageRef.current = 'SLIDE_IN';
    elapsedRef.current = 0;
    playedFlipSoundRef.current = false;
    notifiedCompleteRef.current = false;
    setIsDealingOpponents(true);

    if (holderRef.current && flipGroupRef.current) {
      holderRef.current.position.copy(POS_CENTER_DECK);
      holderRef.current.rotation.set(-Math.PI / 2, 0, 0);
      flipGroupRef.current.rotation.set(0, Math.PI, 0);
    }

    werewolfAudio.playCardDeal();

    const oppTimer = setTimeout(() => {
      setIsDealingOpponents(false);
    }, 1100);

    return () => clearTimeout(oppTimer);
  }, [dealTrigger]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const holder = holderRef.current;
    const flipGroup = flipGroupRef.current;
    if (!holder || !flipGroup) return;

    if (stageRef.current === 'IDLE_HIDDEN') {
      holder.visible = false;
      return;
    }
    holder.visible = true;

    elapsedRef.current += dt;
    const t = elapsedRef.current;
    const clockT = state.clock.elapsedTime;

    // Animate opponent cards fanning out from center deck [0, 0.82, 0]
    if (isDealingOpponents && opponentCardPositions.length > 0) {
      opponentCardPositions.forEach((targetPos, idx) => {
        const mesh = opponentCardsRef.current[idx];
        if (!mesh) return;
        const stagger = idx * 0.06;
        const progress = easeOutCubic((t - stagger) / 0.65);
        mesh.visible = t >= stagger && progress < 0.995;
        mesh.position.set(
          THREE.MathUtils.lerp(0, targetPos[0], progress),
          THREE.MathUtils.lerp(0.822, targetPos[1], progress) + Math.sin(progress * Math.PI) * 0.06,
          THREE.MathUtils.lerp(0, targetPos[2], progress)
        );
        mesh.rotation.z = progress * Math.PI * 2;
      });
    }

    //Timeline:
    // 0.00s - 0.80s : 1. SLIDE IN ([0, 0.82, 0] -> [0, 0.82, 1.8])
    // 0.80s - 1.75s : 2. FLOAT & FLIP ([0, 0.82, 1.8] -> [0, 1.15, 1.9] + 180 deg flip + Golden Glow)
    // 1.75s - 5.75s : 3. HOLD REVEAL (4 full seconds reading Gothic Tarot face)
    // 5.75s+        : 4. SETTLED PEEK (Gently lowers to front-left corner in peeked state, clickable anytime)

    let targetPos = POS_TABLE_PEEK;
    let targetPitch = -1.16;
    let targetYaw = 0.22;
    let targetRoll = -0.08;
    let targetFlipY = 0.16; // Slightly peeked open on the table corner
    let targetGlow = 0.18;
    let targetScale = 1.0;

    if (t < 0.8) {
      stageRef.current = 'SLIDE_IN';
      const u = easeOutCubic(t / 0.8);
      holder.position.lerpVectors(POS_CENTER_DECK, POS_SLIDE_FRONT, u);
      holder.rotation.set(-Math.PI / 2, 0, (1 - u) * 0.25);
      flipGroup.rotation.y = Math.PI;
      if (glowMatRef.current) glowMatRef.current.opacity = 0;
      if (glowLightRef.current) glowLightRef.current.intensity = 0;
      return;
    } else if (t < 1.75) {
      stageRef.current = 'FLOAT_FLIP';
      if (!playedFlipSoundRef.current && t > 1.02) {
        playedFlipSoundRef.current = true;
        werewolfAudio.playCardDeal();
      }
      const u = easeInOutCubic((t - 0.8) / 0.95);
      holder.position.lerpVectors(POS_SLIDE_FRONT, POS_EYE_FLOAT, u);
      holder.rotation.set(THREE.MathUtils.lerp(-Math.PI / 2, -0.34, u), 0, 0);
      // 180-degree flip around vertical Y-axis (Math.PI -> 0) to reveal Gothic Tarot front
      flipGroup.rotation.y = THREE.MathUtils.lerp(Math.PI, 0, easeInOutCubic((t - 0.92) / 0.8));

      const glowStrength = easeOutCubic((t - 1.0) / 0.75);
      if (glowMatRef.current) glowMatRef.current.opacity = glowStrength * 0.82;
      if (glowLightRef.current) glowLightRef.current.intensity = glowStrength * 1.1;
      return;
    } else if (t < 5.75 && stageRef.current !== 'SETTLED_PEEK') {
      stageRef.current = 'HOLD_REVEAL';
      targetPos = POS_EYE_FLOAT;
      targetPitch = -0.34;
      targetYaw = Math.sin(clockT * 1.3) * 0.04;
      targetRoll = 0;
      targetFlipY = 0;
      targetGlow = 0.78 + Math.sin(clockT * 2.8) * 0.1;
      targetScale = 1.05;
    } else {
      if (stageRef.current !== 'SETTLED_PEEK') {
        stageRef.current = 'SETTLED_PEEK';
        if (!notifiedCompleteRef.current) {
          notifiedCompleteRef.current = true;
          onDealComplete?.();
        }
      }

      if (isInspecting) {
        // Player clicked the peeked card (or pressed [C]) to lift and re-read it at eye level
        targetPos = POS_EYE_FLOAT;
        targetPitch = -0.34;
        targetYaw = Math.sin(clockT * 1.3) * 0.035;
        targetRoll = 0;
        targetFlipY = 0;
        targetGlow = 0.82 + Math.sin(clockT * 2.8) * 0.08;
        targetScale = 1.05;
      } else {
        // Resting at front table corner in peeked ("hé mở") state
        targetPos = POS_TABLE_PEEK;
        targetPitch = hovered ? -0.96 : -1.18; // Tilts up slightly more on hover ("hé mở")
        targetYaw = 0.24;
        targetRoll = -0.07;
        targetFlipY = hovered ? 0.05 : 0.22;
        targetGlow = hovered ? 0.42 : 0.16;
        targetScale = hovered ? 0.96 : 0.9;
      }
    }

    const lerpAlpha = 1 - Math.exp(-6.2 * dt);

    holder.position.x = THREE.MathUtils.lerp(holder.position.x, targetPos.x, lerpAlpha);
    holder.position.y = THREE.MathUtils.lerp(
      holder.position.y,
      targetPos.y + (targetPos === POS_EYE_FLOAT ? Math.sin(clockT * 2.1) * 0.006 : hovered ? 0.018 : 0),
      lerpAlpha
    );
    holder.position.z = THREE.MathUtils.lerp(holder.position.z, targetPos.z, lerpAlpha);

    holder.rotation.x = THREE.MathUtils.lerp(holder.rotation.x, targetPitch, lerpAlpha);
    holder.rotation.y = THREE.MathUtils.lerp(holder.rotation.y, targetYaw, lerpAlpha);
    holder.rotation.z = THREE.MathUtils.lerp(holder.rotation.z, targetRoll, lerpAlpha);

    const nextScale = THREE.MathUtils.lerp(holder.scale.x, targetScale, lerpAlpha);
    holder.scale.setScalar(nextScale);

    flipGroup.rotation.y = THREE.MathUtils.lerp(flipGroup.rotation.y, targetFlipY, lerpAlpha);

    if (glowMatRef.current) {
      glowMatRef.current.opacity = THREE.MathUtils.lerp(glowMatRef.current.opacity, targetGlow, lerpAlpha);
    }
    if (glowLightRef.current) {
      glowLightRef.current.intensity = THREE.MathUtils.lerp(
        glowLightRef.current.intensity,
        targetGlow * 1.25,
        lerpAlpha
      );
    }
  });

  const handleCardClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (stageRef.current === 'IDLE_HIDDEN') return;

    werewolfAudio.playCardDeal();

    // If still in automatic 4s reveal hold, clicking settles it early to the table
    if (stageRef.current === 'HOLD_REVEAL') {
      stageRef.current = 'SETTLED_PEEK';
      elapsedRef.current = 6.0;
      onToggleInspect(false);
      if (!notifiedCompleteRef.current) {
        notifiedCompleteRef.current = true;
        onDealComplete?.();
      }
      return;
    }

    onToggleInspect(!isInspecting);
  };

  return (
    <group>
      {/* CENTER TAROT DECK STACK ON TABLE */}
      <group position={[0, TABLE_SURFACE_Y + 0.009, -0.06]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.13, 0.018, 0.2]} />
          <meshStandardMaterial color="#1a1216" roughness={0.55} metalness={0.35} />
        </mesh>
        {backTex && (
          <mesh position={[0, 0.0095, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.128, 0.198]} />
            <meshStandardMaterial map={backTex} roughness={0.52} metalness={0.2} />
          </mesh>
        )}
      </group>

      {/* TRANSIENT DEALING CARDS FLYING TO OPPONENTS */}
      {isDealingOpponents &&
        backTex &&
        opponentCardPositions.map((_, idx) => (
          <mesh
            key={idx}
            ref={(el) => {
              opponentCardsRef.current[idx] = el;
            }}
            rotation={[-Math.PI / 2, 0, 0]}
            visible={false}
          >
            <planeGeometry args={[0.115, 0.18]} />
            <meshStandardMaterial map={backTex} roughness={0.55} metalness={0.2} />
          </mesh>
        ))}

      {/* SUBTLE BRASS CARD PROP STAND AT FRONT-LEFT CORNER SO PEEKED CARD SITS NATURALLY */}
      <mesh position={[-0.38, TABLE_SURFACE_Y + 0.006, 1.53]} rotation={[0, 0.24, 0]} receiveShadow>
        <boxGeometry args={[0.13, 0.012, 0.024]} />
        <meshStandardMaterial color="#6e5223" roughness={0.45} metalness={0.72} />
      </mesh>

      {/* LOCAL PLAYER'S ANIMATED GOTHIC TAROT ROLE CARD */}
      <group
        ref={holderRef}
        position={[0, 0.82, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        onClick={handleCardClick}
      >
        {/* Soft Golden Glow Aura Behind Card */}
        {glowTex && (
          <mesh position={[0, 0, -0.016]}>
            <planeGeometry args={[0.44, 0.62]} />
            <meshBasicMaterial
              ref={glowMatRef}
              map={glowTex}
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        )}

        <pointLight
          ref={glowLightRef}
          position={[0, 0, -0.06]}
          color="#ffd166"
          intensity={0}
          distance={1.25}
          decay={2}
        />

        {/* Inner 180-Degree Flip Axis Group */}
        <group ref={flipGroupRef}>
          {/* Metallic Gold Tarot Edge Rim */}
          <mesh castShadow>
            <boxGeometry args={[0.194, 0.304, 0.0028]} />
            <meshStandardMaterial color="#c99b3b" roughness={0.35} metalness={0.78} />
          </mesh>

          {/* Front Face: Gothic Tarot Role Name (Gold), Faction & Skill Summary */}
          {frontTex && (
            <mesh position={[0, 0, 0.0017]}>
              <planeGeometry args={[0.19, 0.3]} />
              <meshStandardMaterial
                map={frontTex}
                roughness={0.42}
                metalness={0.14}
                emissive="#3b2808"
                emissiveIntensity={0.22}
              />
            </mesh>
          )}

          {/* Back Face: Ornate Gothic Tarot Back */}
          {backTex && (
            <mesh position={[0, 0, -0.0017]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[0.19, 0.3]} />
              <meshStandardMaterial map={backTex} roughness={0.48} metalness={0.2} />
            </mesh>
          )}
        </group>
      </group>
    </group>
  );
};

export default AnimatedRoleCard;
