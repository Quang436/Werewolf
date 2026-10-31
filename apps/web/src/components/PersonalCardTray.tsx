'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, useCursor } from '@react-three/drei';
import { Role } from '@werewolf/shared';
import {
  CameraPerspective,
  TABLE_SURFACE_Y,
  getBrassIdentityPlaqueTexture,
  getDarkOakTrayTexture,
  getGoldenGlowTexture,
  getGothicTarotBackTexture,
  getGothicTarotFrontTexture,
  werewolfAudio,
} from './scene3d.helpers';

export interface PersonalCardTrayProps {
  seatNumber: number;
  playerName: string;
  isAlive: boolean;
  role: Role | string;
  perspective: CameraPerspective;
  /** Incrementing trigger whenever DEALING_CARDS starts */
  dealTrigger: number;
  /** Whether the Tarot card is currently raised & flipped face-up at [0, 1.05, 1.8] */
  isInspecting: boolean;
  onToggleInspect: (next?: boolean) => void;
  onDealComplete?: () => void;
  /** Opponent card positions on felt for fan-out dealing effect */
  opponentCardPositions?: Array<[number, number, number]>;
}

type TrayCardStage = 'HIDDEN' | 'SLIDE_IN' | 'FLOAT_FLIP' | 'HOLD_REVEAL' | 'REST_OR_INSPECT';

// Exact world positions per specification:
// - Wooden tray near player's table edge: ~ [0, 0.77, 1.6]
// - Recessed groove rest position (tilted 18 degrees leaning against back rim): [0, 0.818, 1.575]
// - Eye-level inspect position facing camera: [0, 1.05, 1.8]
const TRAY_WORLD_POS: [number, number, number] = [0, 0.768, 1.58];
const POS_CENTER_DECK = new THREE.Vector3(0, TABLE_SURFACE_Y + 0.016, 0);
const POS_SLIDE_APPROACH = new THREE.Vector3(0, TABLE_SURFACE_Y + 0.05, 1.56);
const POS_EYE_INSPECT = new THREE.Vector3(0, 1.05, 1.8);
const POS_TRAY_GROOVE = new THREE.Vector3(0, 0.818, 1.575);

// 18-degree lean angle (within 15-20 deg spec) resting against the back wall of the dark oak tray
const GROOVE_TILT_PITCH = -Math.PI / 2 + THREE.MathUtils.degToRad(18);

function easeOutCubic(x: number): number {
  const t = THREE.MathUtils.clamp(x, 0, 1);
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(x: number): number {
  const t = THREE.MathUtils.clamp(x, 0, 1);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export const PersonalCardTray: React.FC<PersonalCardTrayProps> = ({
  seatNumber,
  playerName,
  isAlive,
  role,
  perspective,
  dealTrigger,
  isInspecting,
  onToggleInspect,
  onDealComplete,
  opponentCardPositions = [],
}) => {
  const [hovered, setHovered] = useState(false);
  const [isDealingOpponents, setIsDealingOpponents] = useState(false);

  const stageRef = useRef<TrayCardStage>(dealTrigger > 0 ? 'SLIDE_IN' : 'HIDDEN');
  const elapsedRef = useRef(0);
  const playedFlipSoundRef = useRef(false);
  const notifiedCompleteRef = useRef(false);

  const cardHolderRef = useRef<THREE.Group>(null);
  const cardFlipRef = useRef<THREE.Group>(null);
  const glowMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const frontReadLightRef = useRef<THREE.PointLight>(null);
  const lifeGemMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const lifeGemLightRef = useRef<THREE.PointLight>(null);
  const opponentCardsRef = useRef<Array<THREE.Mesh | null>>([]);

  useCursor(hovered, 'pointer', 'auto');

  const oakTex = useMemo(() => getDarkOakTrayTexture(), []);
  const plaqueTex = useMemo(
    () => getBrassIdentityPlaqueTexture(seatNumber, playerName, isAlive),
    [seatNumber, playerName, isAlive]
  );
  const frontTex = useMemo(() => getGothicTarotFrontTexture(role), [role]);
  const backTex = useMemo(() => getGothicTarotBackTexture(), []);
  const glowTex = useMemo(() => getGoldenGlowTexture(), []);

  // Trigger initial deal-and-flip sequence whenever dealTrigger increments
  useEffect(() => {
    if (dealTrigger <= 0) return;

    stageRef.current = 'SLIDE_IN';
    elapsedRef.current = 0;
    playedFlipSoundRef.current = false;
    notifiedCompleteRef.current = false;
    setIsDealingOpponents(true);

    if (cardHolderRef.current && cardFlipRef.current) {
      cardHolderRef.current.position.copy(POS_CENTER_DECK);
      cardHolderRef.current.rotation.set(-Math.PI / 2, 0, 0);
      cardFlipRef.current.rotation.set(0, Math.PI, 0);
    }

    werewolfAudio.playCardDeal();

    const timer = setTimeout(() => {
      setIsDealingOpponents(false);
    }, 1050);

    return () => clearTimeout(timer);
  }, [dealTrigger]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const clockT = state.clock.elapsedTime;

    // 1. Pulse the Corner Life-Status Gemstone when alive; extinguish completely when dead
    if (lifeGemMatRef.current) {
      if (isAlive) {
        lifeGemMatRef.current.emissiveIntensity = 1.65 + Math.sin(clockT * 2.8) * 0.45;
      } else {
        lifeGemMatRef.current.emissiveIntensity = 0;
      }
    }
    if (lifeGemLightRef.current) {
      lifeGemLightRef.current.intensity = isAlive ? 0.34 + Math.sin(clockT * 2.8) * 0.08 : 0;
    }

    // 2. Animate Tarot Card Lifecycle (Deal -> 180° Reveal -> Settle into 18° Groove -> Inspect at [0, 1.05, 1.8])
    const holder = cardHolderRef.current;
    const flipGroup = cardFlipRef.current;
    if (!holder || !flipGroup) return;

    if (stageRef.current === 'HIDDEN') {
      holder.visible = false;
      return;
    }
    holder.visible = true;

    elapsedRef.current += dt;
    const t = elapsedRef.current;

    // Fan-out dealing cards to opponent seats
    if (isDealingOpponents && opponentCardPositions.length > 0) {
      opponentCardPositions.forEach((targetPos, idx) => {
        const mesh = opponentCardsRef.current[idx];
        if (!mesh) return;
        const stagger = idx * 0.055;
        const progress = easeOutCubic((t - stagger) / 0.62);
        mesh.visible = t >= stagger && progress < 0.995;
        mesh.position.set(
          THREE.MathUtils.lerp(0, targetPos[0], progress),
          THREE.MathUtils.lerp(TABLE_SURFACE_Y + 0.018, targetPos[1], progress) +
            Math.sin(progress * Math.PI) * 0.055,
          THREE.MathUtils.lerp(0, targetPos[2], progress)
        );
        mesh.rotation.z = progress * Math.PI * 1.8;
      });
    }

    // Camera-facing pitch when inspecting at [0, 1.05, 1.8]
    const inspectPitch = perspective === '2ND' ? -0.58 : -0.42;

    if (t < 0.72 && stageRef.current !== 'REST_OR_INSPECT') {
      // Stage A: Slide from center deck toward the player's wooden tray
      stageRef.current = 'SLIDE_IN';
      const u = easeOutCubic(t / 0.72);
      holder.position.lerpVectors(POS_CENTER_DECK, POS_SLIDE_APPROACH, u);
      holder.rotation.set(-Math.PI / 2, 0, (1 - u) * 0.2);
      flipGroup.rotation.y = Math.PI;
      if (glowMatRef.current) glowMatRef.current.opacity = 0;
      if (frontReadLightRef.current) frontReadLightRef.current.intensity = 0;
      return;
    }

    if (t < 1.62 && stageRef.current !== 'REST_OR_INSPECT') {
      // Stage B: Float up to [0, 1.05, 1.8] & Flip 180 degrees face-up with Front Reading PointLight
      stageRef.current = 'FLOAT_FLIP';
      if (!playedFlipSoundRef.current && t > 0.95) {
        playedFlipSoundRef.current = true;
        werewolfAudio.playCardDeal();
      }
      const u = easeInOutCubic((t - 0.72) / 0.9);
      holder.position.lerpVectors(POS_SLIDE_APPROACH, POS_EYE_INSPECT, u);
      holder.rotation.set(THREE.MathUtils.lerp(-Math.PI / 2, inspectPitch, u), 0, 0);
      flipGroup.rotation.y = THREE.MathUtils.lerp(Math.PI, 0, easeInOutCubic((t - 0.82) / 0.78));

      const lightRamp = easeOutCubic((t - 0.9) / 0.7);
      if (glowMatRef.current) glowMatRef.current.opacity = lightRamp * 0.72;
      if (frontReadLightRef.current) frontReadLightRef.current.intensity = lightRamp * 2.4;
      return;
    }

    if (t < 5.3 && stageRef.current !== 'REST_OR_INSPECT') {
      // Stage C: Hold face-up for ~3.7s so player reads Role Name, Faction & Skill on deal
      stageRef.current = 'HOLD_REVEAL';
      holder.position.set(
        POS_EYE_INSPECT.x,
        POS_EYE_INSPECT.y + Math.sin(clockT * 2.1) * 0.005,
        POS_EYE_INSPECT.z
      );
      holder.rotation.set(inspectPitch, Math.sin(clockT * 1.2) * 0.03, 0);
      flipGroup.rotation.y = 0;
      if (glowMatRef.current) glowMatRef.current.opacity = 0.72 + Math.sin(clockT * 2.6) * 0.08;
      if (frontReadLightRef.current) frontReadLightRef.current.intensity = 2.4;
      return;
    }

    // Stage D: Settled inside the 18-degree wooden tray groove OR raised to [0, 1.05, 1.8] on Inspect
    if (stageRef.current !== 'REST_OR_INSPECT') {
      stageRef.current = 'REST_OR_INSPECT';
      if (!notifiedCompleteRef.current) {
        notifiedCompleteRef.current = true;
        onDealComplete?.();
      }
    }

    const alpha = 1 - Math.exp(-6.8 * dt);

    if (isInspecting) {
      // Smoothly lift to [0, 1.05, 1.8], flip 180 deg face-up facing camera, and illuminate front face
      holder.position.x = THREE.MathUtils.lerp(holder.position.x, POS_EYE_INSPECT.x, alpha);
      holder.position.y = THREE.MathUtils.lerp(
        holder.position.y,
        POS_EYE_INSPECT.y + Math.sin(clockT * 2.1) * 0.004,
        alpha
      );
      holder.position.z = THREE.MathUtils.lerp(holder.position.z, POS_EYE_INSPECT.z, alpha);

      holder.rotation.x = THREE.MathUtils.lerp(holder.rotation.x, inspectPitch, alpha);
      holder.rotation.y = THREE.MathUtils.lerp(holder.rotation.y, Math.sin(clockT * 1.2) * 0.025, alpha);
      holder.rotation.z = THREE.MathUtils.lerp(holder.rotation.z, 0, alpha);

      // 180° face-up toward camera (0 rad)
      flipGroup.rotation.y = THREE.MathUtils.lerp(flipGroup.rotation.y, 0, alpha);

      if (glowMatRef.current) {
        glowMatRef.current.opacity = THREE.MathUtils.lerp(glowMatRef.current.opacity, 0.74, alpha);
      }
      if (frontReadLightRef.current) {
        frontReadLightRef.current.intensity = THREE.MathUtils.lerp(
          frontReadLightRef.current.intensity,
          2.45,
          alpha
        );
      }
    } else {
      // Nestled neatly inside the recessed dark oak tray groove at 18° lean angle (face-down / subtle hover peek)
      const hoverLift = hovered ? 0.01 : 0;
      const hoverPitch = hovered ? GROOVE_TILT_PITCH + 0.08 : GROOVE_TILT_PITCH;

      holder.position.x = THREE.MathUtils.lerp(holder.position.x, POS_TRAY_GROOVE.x, alpha);
      holder.position.y = THREE.MathUtils.lerp(holder.position.y, POS_TRAY_GROOVE.y + hoverLift, alpha);
      holder.position.z = THREE.MathUtils.lerp(holder.position.z, POS_TRAY_GROOVE.z, alpha);

      holder.rotation.x = THREE.MathUtils.lerp(holder.rotation.x, hoverPitch, alpha);
      holder.rotation.y = THREE.MathUtils.lerp(holder.rotation.y, 0, alpha);
      holder.rotation.z = THREE.MathUtils.lerp(holder.rotation.z, 0, alpha);

      // Face-down (Math.PI) inside the tray groove to protect secret identity
      flipGroup.rotation.y = THREE.MathUtils.lerp(flipGroup.rotation.y, Math.PI, alpha);

      if (glowMatRef.current) {
        glowMatRef.current.opacity = THREE.MathUtils.lerp(
          glowMatRef.current.opacity,
          hovered ? 0.24 : 0.04,
          alpha
        );
      }
      if (frontReadLightRef.current) {
        frontReadLightRef.current.intensity = THREE.MathUtils.lerp(
          frontReadLightRef.current.intensity,
          0,
          alpha
        );
      }
    }
  });

  const handleTrayOrCardClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (stageRef.current === 'HIDDEN') return;

    werewolfAudio.playCardDeal();

    // If clicked while still in initial 3.7s deal reveal, settle into the wooden tray immediately
    if (stageRef.current === 'HOLD_REVEAL') {
      stageRef.current = 'REST_OR_INSPECT';
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
      {/* CENTER TAROT DECK ON FELT */}
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

      {/* TRANSIENT DEALING CARDS TO OPPONENTS */}
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

      {/* ====================================================================
          1. WOODEN PERSONAL CARD TRAY & IDENTITY PLAQUE (~ [0, 0.77, 1.6])
         ==================================================================== */}
      <group
        position={TRAY_WORLD_POS}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        onClick={handleTrayOrCardClick}
      >
        {/* Sunken Recessed Groove Base (Dark Oak Floor + Velvet Card Bed) */}
        <mesh position={[0, 0.004, -0.004]} castShadow receiveShadow>
          <boxGeometry args={[0.25, 0.008, 0.31]} />
          <meshStandardMaterial
            color="#22140c"
            map={oakTex ?? undefined}
            roughness={0.76}
            metalness={0.08}
          />
        </mesh>
        <mesh position={[0, 0.0086, -0.004]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[0.186, 0.268]} />
          <meshStandardMaterial color="#160a0d" roughness={0.94} metalness={0.04} />
        </mesh>

        {/* Left & Right Carved Dark Oak Side Walls Framing the Recessed Tarot Slot */}
        <RoundedBox
          args={[0.034, 0.028, 0.318]}
          radius={0.006}
          smoothness={3}
          position={[-0.11, 0.015, -0.002]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color="#28180e"
            map={oakTex ?? undefined}
            roughness={0.74}
            metalness={0.09}
            emissive={hovered ? '#2b1808' : '#000000'}
          />
        </RoundedBox>

        <RoundedBox
          args={[0.034, 0.028, 0.318]}
          radius={0.006}
          smoothness={3}
          position={[0.11, 0.015, -0.002]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color="#28180e"
            map={oakTex ?? undefined}
            roughness={0.74}
            metalness={0.09}
            emissive={hovered ? '#2b1808' : '#000000'}
          />
        </RoundedBox>

        {/* Raised Back Oak Rest Wall (Supports the Tarot Card at an 18° Lean Angle) */}
        <RoundedBox
          args={[0.254, 0.048, 0.028]}
          radius={0.006}
          smoothness={3}
          position={[0, 0.025, -0.148]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color="#24150c"
            map={oakTex ?? undefined}
            roughness={0.74}
            metalness={0.09}
            emissive={hovered ? '#2b1808' : '#000000'}
          />
        </RoundedBox>

        {/* Inner Angled Oak Support Ledge inside Groove */}
        <mesh position={[0, 0.022, -0.13]} rotation={[0.32, 0, 0]} receiveShadow>
          <boxGeometry args={[0.184, 0.022, 0.016]} />
          <meshStandardMaterial color="#1b1009" roughness={0.82} />
        </mesh>

        {/* Front Sloped Dark Oak Identity Rail (Gờ trước của khay gỗ) */}
        <RoundedBox
          args={[0.254, 0.03, 0.044]}
          radius={0.007}
          smoothness={3}
          position={[0, 0.016, 0.146]}
          rotation={[-0.22, 0, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color="#2a190f"
            map={oakTex ?? undefined}
            roughness={0.72}
            metalness={0.1}
            emissive={hovered ? '#2b1808' : '#000000'}
          />
        </RoundedBox>

        {/* Embossed Metallic Brass Identity Plaque: "${seatNumber} - ${playerName}" */}
        <group position={[-0.014, 0.025, 0.165]} rotation={[-0.68, 0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.192, 0.038, 0.004]} />
            <meshStandardMaterial
              color={isAlive ? '#b0863c' : '#4a4a50'}
              roughness={0.34}
              metalness={0.78}
            />
          </mesh>
          {plaqueTex && (
            <mesh position={[0, 0, 0.0024]}>
              <planeGeometry args={[0.188, 0.036]} />
              <meshStandardMaterial
                map={plaqueTex}
                roughness={0.36}
                metalness={0.62}
                emissive={isAlive ? '#332007' : '#000000'}
                emissiveIntensity={isAlive ? 0.28 : 0}
              />
            </mesh>
          )}
        </group>

        {/* Corner Life-Status Gemstone Lamp (Warm Glowing Amber when Alive, Dead Ash-Grey when Eliminated) */}
        <group position={[0.104, 0.032, 0.142]}>
          {/* Antique Brass Jewel Socket Bezel */}
          <mesh castShadow>
            <cylinderGeometry args={[0.016, 0.0185, 0.007, 18]} />
            <meshStandardMaterial color="#8c682b" roughness={0.38} metalness={0.78} />
          </mesh>

          {/* Faceted Life Gemstone */}
          <mesh position={[0, 0.007, 0]} castShadow>
            <octahedronGeometry args={[0.0115, 1]} />
            <meshStandardMaterial
              ref={lifeGemMatRef}
              color={isAlive ? '#ffd166' : '#4a4a52'}
              emissive={isAlive ? '#ff9e1b' : '#000000'}
              emissiveIntensity={isAlive ? 1.8 : 0}
              roughness={isAlive ? 0.18 : 0.8}
              metalness={isAlive ? 0.15 : 0.1}
            />
          </mesh>

          {/* Warm Micro PointLight Casting Golden Gleam on Corner when Alive */}
          <pointLight
            ref={lifeGemLightRef}
            position={[0, 0.025, 0]}
            color="#ffb833"
            intensity={isAlive ? 0.34 : 0}
            distance={0.34}
            decay={2}
          />
        </group>
      </group>

      {/* ====================================================================
          2. LOCAL PLAYER'S TAROT CARD (18° GROOVE REST <-> [0, 1.05, 1.8] INSPECT)
         ==================================================================== */}
      <group
        ref={cardHolderRef}
        position={[0, TABLE_SURFACE_Y + 0.016, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        onClick={handleTrayOrCardClick}
      >
        {/* Dedicated Local Point Light Illuminating the Front Face When Open (Prevents Any Dark Shadow on Text) */}
        <pointLight
          ref={frontReadLightRef}
          position={[0, 0.02, 0.28]}
          color="#fff4d6"
          intensity={0}
          distance={1.15}
          decay={1.35}
        />

        {/* Soft Golden Glow Behind Card */}
        {glowTex && (
          <mesh position={[0, 0, -0.014]}>
            <planeGeometry args={[0.38, 0.54]} />
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

        {/* 180-Degree Flip Group */}
        <group ref={cardFlipRef}>
          {/* Brushed Gold Tarot Card Core */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.174, 0.27, 0.0028]} />
            <meshStandardMaterial color="#c99b3b" roughness={0.34} metalness={0.76} />
          </mesh>

          {/* Front Face: Gothic Tarot Role Name, Faction & Skill Info */}
          {frontTex && (
            <mesh position={[0, 0, 0.0017]}>
              <planeGeometry args={[0.17, 0.266]} />
              <meshStandardMaterial
                map={frontTex}
                roughness={0.44}
                metalness={0.1}
                emissive="#2e1f08"
                emissiveIntensity={0.28}
              />
            </mesh>
          )}

          {/* Back Face: Ornate Gothic Tarot Back */}
          {backTex && (
            <mesh position={[0, 0, -0.0017]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[0.17, 0.266]} />
              <meshStandardMaterial map={backTex} roughness={0.48} metalness={0.2} />
            </mesh>
          )}
        </group>
      </group>
    </group>
  );
};

export default PersonalCardTray;
