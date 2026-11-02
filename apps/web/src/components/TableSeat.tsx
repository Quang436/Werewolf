'use client';

import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Billboard, RoundedBox, useCursor } from '@react-three/drei';
import {
  CameraPerspective,
  ComputedSeat,
  TABLE_SURFACE_Y,
  getDarkLeatherTexture,
  getFloatingVoteCountTexture,
  getGothicTarotBackTexture,
  getRetroNameplateTexture,
} from './scene3d.helpers';

export interface TableSeatProps {
  seat: ComputedSeat;
  cameraPerspective: CameraPerspective;
  isNight: boolean;
  canVote: boolean;
  isSelected: boolean;
  isCondemned: boolean;
  isLeadingVote?: boolean;
  hasDealtCards: boolean;
  isSleeping?: boolean;
  isWolfAwake?: boolean;
  isWolfTarget?: boolean;
  seerPeekResult?: { targetId: string; isWerewolf: boolean } | null;
  isSpeaking?: boolean;
  isKilledTonight?: boolean;
  moodLighting?: string;
  onSelectSeat: (playerId: string) => void;
}

const NOIR_COAT_PALETTE = [
  '#171a21', // Midnight charcoal
  '#1d1518', // Dark oxblood noir
  '#141c1e', // Deep petrol slate
  '#1e1a16', // Espresso tweed
  '#161520', // Shadow indigo
  '#1c1c1c', // Obsidian coat
];

export const TableSeat: React.FC<TableSeatProps> = ({
  seat,
  cameraPerspective,
  isNight,
  canVote,
  isSelected,
  isCondemned,
  isLeadingVote = false,
  hasDealtCards,
  isSleeping = false,
  isWolfAwake = false,
  isWolfTarget = false,
  seerPeekResult = null,
  isSpeaking = false,
  isKilledTonight = false,
  moodLighting = 'day_pub',
  onSelectSeat,
}) => {
  const [hovered, setHovered] = useState(false);

  const isAlive = seat.player.isAlive && !isKilledTonight;
  const interactive = !seat.isLocal && isAlive && canVote;
  useCursor(hovered && interactive, 'pointer', 'auto');

  const leatherTex = useMemo(() => getDarkLeatherTexture(), []);
  const tarotBackTex = useMemo(() => getGothicTarotBackTexture(), []);

  const nameplateTex = useMemo(
    () =>
      getRetroNameplateTexture(
        seat.player.seat,
        seat.isLocal ? `${seat.player.nickname} (Bạn)` : seat.player.nickname,
        isAlive,
        hovered && interactive,
        isSelected,
        isCondemned
      ),
    [seat.player.seat, seat.player.nickname, seat.isLocal, isAlive, hovered, interactive, isSelected, isCondemned]
  );

  const voteCounterTex = useMemo(
    () => (seat.voteCount > 0 ? getFloatingVoteCountTexture(seat.voteCount, isLeadingVote) : null),
    [seat.voteCount, isLeadingVote]
  );

  // Articulated rig refs for smooth procedural seated posture, sleep, and hanging slump
  const torsoRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftUpperArmRef = useRef<THREE.Group>(null);
  const rightUpperArmRef = useRef<THREE.Group>(null);
  const leftForearmRef = useRef<THREE.Group>(null);
  const rightForearmRef = useRef<THREE.Group>(null);
  const voteFloatRef = useRef<THREE.Group>(null);

  const coatColor = NOIR_COAT_PALETTE[seat.archetypeIndex % NOIR_COAT_PALETTE.length];
  const phaseSeed = seat.player.seat * 1.37;

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const alpha = 1 - Math.exp(-5.5 * dt);
    const t = state.clock.elapsedTime;

    if (voteFloatRef.current) {
      voteFloatRef.current.position.y =
        seat.voteSpotPosition[1] + 0.125 + Math.sin(t * 2.5 + phaseSeed) * 0.008;
    }

    if (!torsoRef.current || !headRef.current) return;

    let targetTorsoX = 0.15 + Math.sin(t * 1.6 + phaseSeed) * 0.015;
    let targetHeadX = -0.08 + Math.sin(t * 1.1 + phaseSeed) * 0.025;
    let targetHeadY = Math.sin(t * 0.55 + phaseSeed) * 0.11;
    let targetHeadZ = 0;

    // Default seated arm posture: upper arms forward/down, forearms resting toward table edge
    let targetUpperArmX = -0.58;
    let targetUpperArmZOut = 0.18;
    let targetForearmX = -0.82;
    let targetForearmYIn = 0.34;

    if (!isAlive) {
      // Condemned / Dead pose: slumped forward limp, head dropped, both arms hanging limply
      targetTorsoX = 0.62;
      targetHeadX = 0.68;
      targetHeadY = 0.12;
      targetHeadZ = seat.player.seat % 2 === 0 ? 0.28 : -0.28;

      targetUpperArmX = -0.92;
      targetUpperArmZOut = 0.08;
      targetForearmX = -0.14;
      targetForearmYIn = 0.05;
    } else if (isCondemned) {
      // Trembling slightly under the red spotlight right before execution completes
      targetTorsoX = 0.06;
      targetHeadX = -0.16 + Math.sin(t * 18) * 0.015;
      targetHeadY = Math.sin(t * 14) * 0.03;
    } else if (isSleeping || (isNight && !isWolfAwake)) {
      // Night sleep pose: whole village bows heads down toward table
      targetTorsoX = 0.44;
      targetHeadX = 0.48;
      targetHeadY = 0;
      targetForearmX = -0.95;
      targetForearmYIn = 0.52;
    } else if (isSpeaking) {
      // Speaking rhythm during discussion
      targetTorsoX = 0.08 + Math.sin(t * 4.5) * 0.03;
      targetHeadX = -0.04 + Math.sin(t * 6.2) * 0.04;
      targetHeadY = Math.sin(t * 2.8) * 0.14;
    }

    torsoRef.current.rotation.x = THREE.MathUtils.lerp(torsoRef.current.rotation.x, targetTorsoX, alpha);
    headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, targetHeadX, alpha);
    headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, targetHeadY, alpha);
    headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, targetHeadZ, alpha);

    if (leftUpperArmRef.current && rightUpperArmRef.current && leftForearmRef.current && rightForearmRef.current) {
      leftUpperArmRef.current.rotation.x = THREE.MathUtils.lerp(
        leftUpperArmRef.current.rotation.x,
        targetUpperArmX,
        alpha
      );
      leftUpperArmRef.current.rotation.z = THREE.MathUtils.lerp(
        leftUpperArmRef.current.rotation.z,
        targetUpperArmZOut,
        alpha
      );

      rightUpperArmRef.current.rotation.x = THREE.MathUtils.lerp(
        rightUpperArmRef.current.rotation.x,
        targetUpperArmX,
        alpha
      );
      rightUpperArmRef.current.rotation.z = THREE.MathUtils.lerp(
        rightUpperArmRef.current.rotation.z,
        -targetUpperArmZOut,
        alpha
      );

      leftForearmRef.current.rotation.x = THREE.MathUtils.lerp(
        leftForearmRef.current.rotation.x,
        targetForearmX,
        alpha
      );
      leftForearmRef.current.rotation.y = THREE.MathUtils.lerp(
        leftForearmRef.current.rotation.y,
        -targetForearmYIn,
        alpha
      );

      rightForearmRef.current.rotation.x = THREE.MathUtils.lerp(
        rightForearmRef.current.rotation.x,
        targetForearmX,
        alpha
      );
      rightForearmRef.current.rotation.y = THREE.MathUtils.lerp(
        rightForearmRef.current.rotation.y,
        targetForearmYIn,
        alpha
      );
    }
  });

  // Hide local player's body in 1ST POV so camera at [0, 1.35, 2.3] is completely unobstructed;
  // render local player's dark silhouette in 2ND tactical observer POV!
  const showCharacterMesh = !seat.isLocal || cameraPerspective === '2ND';

  const handleSeatClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (!seat.isLocal && isAlive) {
      onSelectSeat(seat.player.id);
    }
  };

  const rimEmissive =
    hovered && interactive
      ? '#4a2508'
      : isCondemned
      ? '#45060c'
      : isSelected && !seat.isLocal
      ? '#2b1407'
      : '#000000';

  return (
    <group>
      {/* MAIN CHAIR + SEATED NOIR CHARACTER ORIENTED INWARD TOWARD TABLE CENTER */}
      <group
        position={seat.position}
        rotation={[0, seat.rotationY, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (!seat.isLocal) setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        onClick={handleSeatClick}
      >
        {/* ================================================================
            1. CLASSIC TUFTED DARK LEATHER WINGBACK ARMCHAIR
           ================================================================ */}
        <group>
          {/* 4 Carved Mahogany Chair Legs */}
          {[
            [-0.23, 0.21, -0.22],
            [0.23, 0.21, -0.22],
            [-0.23, 0.21, 0.22],
            [0.23, 0.21, 0.22],
          ].map(([lx, ly, lz], idx) => (
            <group key={idx} position={[lx, ly, lz]}>
              <mesh castShadow receiveShadow>
                <cylinderGeometry args={[0.028, 0.019, 0.42, 10]} />
                <meshStandardMaterial color="#1f120b" roughness={0.78} metalness={0.08} />
              </mesh>
              {/* Brass foot ferrule */}
              <mesh position={[0, -0.19, 0]}>
                <cylinderGeometry args={[0.021, 0.02, 0.04, 10]} />
                <meshStandardMaterial color="#9a7432" roughness={0.42} metalness={0.72} />
              </mesh>
            </group>
          ))}

          {/* Wooden Under-Seat Frame */}
          <RoundedBox args={[0.58, 0.07, 0.56]} radius={0.015} smoothness={3} position={[0, 0.41, 0]} castShadow receiveShadow>
            <meshStandardMaterial color="#1b0f0a" roughness={0.8} metalness={0.08} />
          </RoundedBox>

          {/* Plush Tufted Leather Seat Cushion */}
          <RoundedBox args={[0.55, 0.1, 0.53]} radius={0.035} smoothness={4} position={[0, 0.47, 0.01]} castShadow receiveShadow>
            <meshStandardMaterial
              color="#22120f"
              map={leatherTex ?? undefined}
              roughness={0.64}
              metalness={0.08}
            />
          </RoundedBox>

          {/* High Wingback Tufted Leather Backrest */}
          <group position={[0, 0.87, -0.23]} rotation={[-0.11, 0, 0]}>
            <RoundedBox args={[0.56, 0.78, 0.11]} radius={0.04} smoothness={4} castShadow receiveShadow>
              <meshStandardMaterial
                color="#20100d"
                map={leatherTex ?? undefined}
                roughness={0.62}
                metalness={0.09}
              />
            </RoundedBox>

            {/* Wingback Side Ears / Bolsters */}
            <RoundedBox
              args={[0.08, 0.46, 0.18]}
              radius={0.03}
              smoothness={3}
              position={[-0.27, 0.12, 0.07]}
              rotation={[0, 0.18, 0]}
              castShadow
            >
              <meshStandardMaterial color="#1b0d0b" roughness={0.65} metalness={0.08} />
            </RoundedBox>
            <RoundedBox
              args={[0.08, 0.46, 0.18]}
              radius={0.03}
              smoothness={3}
              position={[0.27, 0.12, 0.07]}
              rotation={[0, -0.18, 0]}
              castShadow
            >
              <meshStandardMaterial color="#1b0d0b" roughness={0.65} metalness={0.08} />
            </RoundedBox>

            {/* Carved Mahogany Crown Trim */}
            <RoundedBox args={[0.58, 0.06, 0.12]} radius={0.02} smoothness={3} position={[0, 0.4, 0]}>
              <meshStandardMaterial color="#1a0e09" roughness={0.75} metalness={0.12} />
            </RoundedBox>

            {/* Brass Tufting Buttons */}
            {[
              [-0.12, 0.18, 0.058],
              [0.12, 0.18, 0.058],
              [0, 0.04, 0.058],
              [-0.12, -0.1, 0.058],
              [0.12, -0.1, 0.058],
            ].map(([bx, by, bz], bIdx) => (
              <mesh key={bIdx} position={[bx, by, bz]}>
                <sphereGeometry args={[0.012, 8, 8]} />
                <meshStandardMaterial color="#8f6b2e" roughness={0.4} metalness={0.7} />
              </mesh>
            ))}
          </group>

          {/* Left & Right Rolled Leather Armrests */}
          {[-0.28, 0.28].map((ax, aIdx) => (
            <group key={aIdx} position={[ax, 0.63, 0.02]}>
              <RoundedBox args={[0.09, 0.08, 0.48]} radius={0.035} smoothness={3} castShadow>
                <meshStandardMaterial
                  color="#23120e"
                  map={leatherTex ?? undefined}
                  roughness={0.6}
                  metalness={0.09}
                />
              </RoundedBox>
              <mesh position={[0, -0.09, 0.16]} castShadow>
                <cylinderGeometry args={[0.024, 0.02, 0.15, 8]} />
                <meshStandardMaterial color="#1b0f0a" roughness={0.78} metalness={0.1} />
              </mesh>
            </group>
          ))}
        </group>

        {/* ================================================================
            2. LOW-POLY NOIR SEATED HUMANOID / SILHOUETTE
           ================================================================ */}
        {showCharacterMesh && (
          <group>
            {/* Seated Pelvis / Coat Tails */}
            <RoundedBox args={[0.34, 0.13, 0.3]} radius={0.04} smoothness={3} position={[0, 0.55, 0.02]} castShadow>
              <meshStandardMaterial color="#121318" roughness={0.82} metalness={0.08} />
            </RoundedBox>

            {/* Left & Right Seated Legs (Thighs extending forward + Bent Knees + Shins + Noir Boots) */}
            {[-0.11, 0.11].map((lx, legIdx) => (
              <group key={legIdx}>
                {/* Thigh */}
                <mesh position={[lx, 0.54, 0.2]} rotation={[Math.PI / 2 + 0.06, 0, 0]} castShadow>
                  <capsuleGeometry args={[0.068, 0.24, 6, 10]} />
                  <meshStandardMaterial color="#111217" roughness={0.84} metalness={0.06} />
                </mesh>
                {/* Lower Leg / Shin */}
                <mesh position={[lx, 0.29, 0.35]} rotation={[0.08, 0, 0]} castShadow>
                  <capsuleGeometry args={[0.056, 0.3, 6, 10]} />
                  <meshStandardMaterial color="#0f1014" roughness={0.85} metalness={0.06} />
                </mesh>
                {/* Dark Leather Dress Boot */}
                <RoundedBox args={[0.1, 0.08, 0.2]} radius={0.025} smoothness={3} position={[lx, 0.05, 0.4]} castShadow>
                  <meshStandardMaterial color="#0b0909" roughness={0.55} metalness={0.18} />
                </RoundedBox>
              </group>
            ))}

            {/* Articulated Waist Pivot -> Upper Torso, Arms & Noir Head */}
            <group ref={torsoRef} position={[0, 0.58, 0.01]}>
              {/* Tailored Noir Trenchcoat / Waistcoat Torso */}
              <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.19, 0.15, 0.46, 10]} />
                <meshStandardMaterial
                  color={coatColor}
                  emissive={rimEmissive}
                  roughness={0.74}
                  metalness={0.12}
                />
              </mesh>

              {/* Broad Coat Shoulders */}
              <RoundedBox
                args={[0.45, 0.12, 0.23]}
                radius={0.05}
                smoothness={3}
                position={[0, 0.42, 0]}
                castShadow
              >
                <meshStandardMaterial
                  color={coatColor}
                  emissive={rimEmissive}
                  roughness={0.72}
                  metalness={0.14}
                />
              </RoundedBox>

              {/* Noir Shirt V-Collar & Crimson/Brass Tie */}
              <mesh position={[0, 0.37, 0.138]} rotation={[0.12, 0, 0]}>
                <boxGeometry args={[0.11, 0.15, 0.03]} />
                <meshStandardMaterial color="#cfc8bc" roughness={0.8} metalness={0.05} />
              </mesh>
              <mesh position={[0, 0.34, 0.152]} rotation={[0.12, 0, 0]}>
                <boxGeometry args={[0.036, 0.17, 0.02]} />
                <meshStandardMaterial
                  color={seat.archetypeIndex % 2 === 0 ? '#5c1319' : '#6e5223'}
                  roughness={0.68}
                />
              </mesh>

              {/* Coat Lapels */}
              <mesh position={[-0.075, 0.34, 0.146]} rotation={[0.1, 0, -0.24]}>
                <boxGeometry args={[0.055, 0.22, 0.025]} />
                <meshStandardMaterial color="#0e1015" roughness={0.7} metalness={0.15} />
              </mesh>
              <mesh position={[0.075, 0.34, 0.146]} rotation={[0.1, 0, 0.24]}>
                <boxGeometry args={[0.055, 0.22, 0.025]} />
                <meshStandardMaterial color="#0e1015" roughness={0.7} metalness={0.15} />
              </mesh>

              {/* LEFT ARTICULATED ARM */}
              <group ref={leftUpperArmRef} position={[-0.23, 0.41, 0.02]}>
                <mesh position={[0, -0.14, 0]} castShadow>
                  <capsuleGeometry args={[0.054, 0.21, 6, 10]} />
                  <meshStandardMaterial color={coatColor} roughness={0.75} metalness={0.12} />
                </mesh>
                <group ref={leftForearmRef} position={[0, -0.27, 0]}>
                  <mesh position={[0, -0.13, 0]} castShadow>
                    <capsuleGeometry args={[0.046, 0.2, 6, 10]} />
                    <meshStandardMaterial color={coatColor} roughness={0.75} metalness={0.12} />
                  </mesh>
                  {/* Gloved Noir Hand */}
                  <RoundedBox args={[0.068, 0.085, 0.045]} radius={0.018} position={[0, -0.26, 0]} castShadow>
                    <meshStandardMaterial color="#1a1716" roughness={0.65} metalness={0.1} />
                  </RoundedBox>
                </group>
              </group>

              {/* RIGHT ARTICULATED ARM */}
              <group ref={rightUpperArmRef} position={[0.23, 0.41, 0.02]}>
                <mesh position={[0, -0.14, 0]} castShadow>
                  <capsuleGeometry args={[0.054, 0.21, 6, 10]} />
                  <meshStandardMaterial color={coatColor} roughness={0.75} metalness={0.12} />
                </mesh>
                <group ref={rightForearmRef} position={[0, -0.27, 0]}>
                  <mesh position={[0, -0.13, 0]} castShadow>
                    <capsuleGeometry args={[0.046, 0.2, 6, 10]} />
                    <meshStandardMaterial color={coatColor} roughness={0.75} metalness={0.12} />
                  </mesh>
                  {/* Gloved Noir Hand */}
                  <RoundedBox args={[0.068, 0.085, 0.045]} radius={0.018} position={[0, -0.26, 0]} castShadow>
                    <meshStandardMaterial color="#1a1716" roughness={0.65} metalness={0.1} />
                  </RoundedBox>
                </group>
              </group>

              {/* NECK & ARTICULATED NOIR HEAD + ARCHETYPE SILHOUETTE */}
              <mesh position={[0, 0.5, 0.01]} castShadow>
                <cylinderGeometry args={[0.055, 0.065, 0.1, 10]} />
                <meshStandardMaterial color="#2a221e" roughness={0.82} />
              </mesh>

              <group ref={headRef} position={[0, 0.59, 0.02]}>
                {/* Sculpted Low-Poly Noir Head */}
                <RoundedBox args={[0.175, 0.21, 0.19]} radius={0.065} smoothness={4} castShadow>
                  <meshStandardMaterial color="#2e2420" roughness={0.8} metalness={0.06} />
                </RoundedBox>

                {/* Noir Silhouette Sculpted Face - Không dùng các viên bi mắt ma trôi nổi */}
                <mesh position={[0, -0.02, 0.098]}>
                  <boxGeometry args={[0.08, 0.04, 0.015]} />
                  <meshStandardMaterial color="#221b18" roughness={0.9} />
                </mesh>

                {/* Diegetic Audio Waveform / Speaking Indicator above Head */}
                {isSpeaking && isAlive && (
                  <Billboard position={[0, 0.35, 0]}>
                    <group>
                      {[-0.06, -0.03, 0, 0.03, 0.06].map((bx, bIdx) => (
                        <mesh key={bIdx} position={[bx, 0, 0]}>
                          <boxGeometry args={[0.012, 0.04 + (bIdx % 2 === 0 ? 0.025 : 0.01), 0.008]} />
                          <meshBasicMaterial color="#38bdf8" />
                        </mesh>
                      ))}
                    </group>
                  </Billboard>
                )}

                {/* 6 DISTINCT DARK NOIR HEADGEAR ARCHETYPES */}
                {seat.archetypeIndex === 0 && (
                  /* 0: Detective Fedora */
                  <group position={[0, 0.095, 0.01]} rotation={[0.06, 0, 0]}>
                    <mesh castShadow>
                      <cylinderGeometry args={[0.19, 0.2, 0.016, 18]} />
                      <meshStandardMaterial color="#121216" roughness={0.72} metalness={0.12} />
                    </mesh>
                    <mesh position={[0, 0.055, 0]} castShadow>
                      <cylinderGeometry args={[0.092, 0.112, 0.11, 14]} />
                      <meshStandardMaterial color="#15151a" roughness={0.7} />
                    </mesh>
                    <mesh position={[0, 0.016, 0]}>
                      <cylinderGeometry args={[0.114, 0.114, 0.02, 14]} />
                      <meshStandardMaterial color="#5e191e" roughness={0.6} />
                    </mesh>
                  </group>
                )}

                {seat.archetypeIndex === 1 && (
                  /* 1: Plague Doctor Mask & Wide Hat */
                  <group>
                    <mesh position={[0, -0.01, 0.17]} rotation={[Math.PI / 2 + 0.18, 0, 0]} castShadow>
                      <coneGeometry args={[0.058, 0.19, 8]} />
                      <meshStandardMaterial color="#181514" roughness={0.55} metalness={0.22} />
                    </mesh>
                    <group position={[0, 0.098, 0]}>
                      <mesh castShadow>
                        <cylinderGeometry args={[0.21, 0.21, 0.014, 18]} />
                        <meshStandardMaterial color="#100f12" roughness={0.7} />
                      </mesh>
                      <mesh position={[0, 0.048, 0]} castShadow>
                        <cylinderGeometry args={[0.105, 0.11, 0.09, 14]} />
                        <meshStandardMaterial color="#141317" roughness={0.7} />
                      </mesh>
                    </group>
                  </group>
                )}

                {seat.archetypeIndex === 2 && (
                  /* 2: Victorian Undertaker Top Hat */
                  <group position={[0, 0.095, 0]}>
                    <mesh castShadow>
                      <cylinderGeometry args={[0.17, 0.175, 0.016, 18]} />
                      <meshStandardMaterial color="#101014" roughness={0.62} metalness={0.18} />
                    </mesh>
                    <mesh position={[0, 0.095, 0]} castShadow>
                      <cylinderGeometry args={[0.112, 0.104, 0.18, 16]} />
                      <meshStandardMaterial color="#141419" roughness={0.6} metalness={0.18} />
                    </mesh>
                    <mesh position={[0, 0.02, 0]}>
                      <cylinderGeometry args={[0.107, 0.107, 0.024, 16]} />
                      <meshStandardMaterial color="#785926" roughness={0.5} metalness={0.45} />
                    </mesh>
                  </group>
                )}

                {seat.archetypeIndex === 3 && (
                  /* 3: Outlaw Gambler Wide Hat */
                  <group position={[0, 0.092, 0.01]} rotation={[0.09, 0, 0]}>
                    <mesh castShadow>
                      <cylinderGeometry args={[0.23, 0.235, 0.015, 18]} />
                      <meshStandardMaterial color="#211610" roughness={0.78} />
                    </mesh>
                    <mesh position={[0, 0.055, 0]} castShadow>
                      <cylinderGeometry args={[0.095, 0.118, 0.105, 14]} />
                      <meshStandardMaterial color="#261912" roughness={0.76} />
                    </mesh>
                  </group>
                )}

                {seat.archetypeIndex === 4 && (
                  /* 4: Gothic Occultist Cowl / Hood */
                  <group position={[0, 0.03, -0.01]}>
                    <mesh castShadow>
                      <sphereGeometry args={[0.132, 12, 12]} />
                      <meshStandardMaterial color="#14111a" roughness={0.86} />
                    </mesh>
                    <mesh position={[0, 0.1, -0.04]} rotation={[-0.35, 0, 0]} castShadow>
                      <coneGeometry args={[0.11, 0.16, 10]} />
                      <meshStandardMaterial color="#14111a" roughness={0.86} />
                    </mesh>
                  </group>
                )}

                {seat.archetypeIndex === 5 && (
                  /* 5: 1920s Speakeasy Flat Cap */
                  <group position={[0, 0.088, 0.015]}>
                    <mesh scale={[1, 0.45, 1.18]} castShadow>
                      <sphereGeometry args={[0.118, 12, 10]} />
                      <meshStandardMaterial color="#23201d" roughness={0.84} />
                    </mesh>
                    <mesh position={[0, -0.015, 0.1]} rotation={[0.12, 0, 0]} castShadow>
                      <cylinderGeometry args={[0.09, 0.095, 0.012, 12]} />
                      <meshStandardMaterial color="#171513" roughness={0.75} />
                    </mesh>
                  </group>
                )}
              </group>
            </group>
          </group>
        )}

        {/* ================================================================
            3. DIEGETIC TABLE-RIM NAMEPLATE (CỐ ĐỊNH Ở MÉP BÀN TRƯỚC MỖI GHẾ)
           ================================================================ */}
        {(!seat.isLocal || cameraPerspective === '2ND') && nameplateTex && (
          <group
            position={[0, TABLE_SURFACE_Y + 0.018, -0.68]}
            rotation={[-0.42, 0, 0]}
            onPointerOver={(e) => {
              e.stopPropagation();
              if (!seat.isLocal) setHovered(true);
            }}
            onPointerOut={() => setHovered(false)}
            onClick={handleSeatClick}
          >
            {/* Khối đế kim loại đồng thau vát mép sang trọng */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.28, 0.075, 0.014]} />
              <meshStandardMaterial
                color={isAlive ? (hovered ? '#42280d' : '#23180f') : '#18181c'}
                roughness={0.4}
                metalness={0.7}
                emissive={hovered && interactive ? '#78350f' : isCondemned ? '#7f1d1d' : '#000000'}
                emissiveIntensity={hovered || isCondemned ? 0.6 : 0}
              />
            </mesh>

            {/* Mặt biển tên kim loại khắc số ghế và tên người chơi (#04 Xemesis) */}
            <mesh position={[0, 0, 0.008]}>
              <planeGeometry args={[0.27, 0.068]} />
              <meshBasicMaterial
                map={nameplateTex}
                transparent
                depthWrite={false}
              />
            </mesh>

            {/* Đèn chỉ báo trạng thái nhỏ ở góc biển tên (Xanh khi sống, đỏ khi bị treo/chết) */}
            <mesh position={[0.125, 0, 0.009]}>
              <circleGeometry args={[0.005, 12]} />
              <meshBasicMaterial color={isAlive ? '#22c55e' : '#ef4444'} />
            </mesh>
          </group>
        )}
      </group>

      {/* ================================================================
          4. OPPONENT'S FACE-DOWN TAROT CARD, HOVER RING & "[ 3 Phiếu ]" BADGE
         ================================================================ */}
      {!seat.isLocal && hasDealtCards && isAlive && tarotBackTex && (
        <mesh
          position={seat.cardRestPosition}
          rotation={[-Math.PI / 2, 0, seat.rotationY]}
          receiveShadow
          castShadow
        >
          <planeGeometry args={[0.115, 0.18]} />
          <meshStandardMaterial
            map={tarotBackTex}
            roughness={0.55}
            metalness={0.18}
          />
        </mesh>
      )}

      {/* Red Claw Mark on Wolf Target Chair */}
      {isWolfTarget && (
        <group
          position={[seat.voteSpotPosition[0], TABLE_SURFACE_Y + 0.006, seat.voteSpotPosition[2]]}
          rotation={[-Math.PI / 2, 0, seat.rotationY]}
        >
          {[-0.045, 0, 0.045].map((cx, cIdx) => (
            <mesh key={cIdx} position={[cx, cIdx === 1 ? 0.015 : -0.01, 0]} rotation={[0, 0, (cIdx - 1) * 0.18]}>
              <planeGeometry args={[0.016, 0.14]} />
              <meshBasicMaterial color="#ff1133" transparent opacity={0.92} />
            </mesh>
          ))}
          <pointLight color="#ff1133" intensity={1.6} distance={0.6} />
        </group>
      )}

      {/* Seer Peek Glowing Reveal Card over Target Seat */}
      {seerPeekResult && seerPeekResult.targetId === seat.player.id && (
        <Billboard
          position={[seat.cardRestPosition[0], TABLE_SURFACE_Y + 0.28, seat.cardRestPosition[2]]}
          follow
        >
          <group>
            {/* Mystic Glow Backing */}
            <mesh position={[0, 0, -0.005]}>
              <planeGeometry args={[0.34, 0.14]} />
              <meshBasicMaterial
                color={seerPeekResult.isWerewolf ? '#7f1d1d' : '#064e3b'}
                transparent
                opacity={0.88}
              />
            </mesh>
            {/* Border */}
            <mesh position={[0, 0, -0.003]}>
              <planeGeometry args={[0.36, 0.16]} />
              <meshBasicMaterial
                color={seerPeekResult.isWerewolf ? '#ef4444' : '#10b981'}
                transparent
                opacity={0.5}
                wireframe
              />
            </mesh>
            <pointLight
              color={seerPeekResult.isWerewolf ? '#ff1744' : '#10b981'}
              intensity={2.0}
              distance={0.8}
            />
          </group>
        </Billboard>
      )}

      {/* Casualty Spotlight on Night Victim Chair during Daybreak */}
      {isKilledTonight && (
        <spotLight
          position={[seat.position[0], 3.8, seat.position[2]]}
          target-position={[seat.position[0], 0.6, seat.position[2]]}
          color="#ff1744"
          intensity={12}
          distance={5.5}
          angle={0.35}
          penumbra={0.5}
        />
      )}

      {/* Bodyguard Cyan Targeting Ring when Hovered */}
      {!seat.isLocal && isAlive && hovered && canVote && moodLighting === 'bodyguard_cyan' && (
        <mesh
          position={[seat.voteSpotPosition[0], seat.voteSpotPosition[1] - 0.003, seat.voteSpotPosition[2]]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.12, 0.155, 32]} />
          <meshBasicMaterial color="#00e5ff" transparent opacity={0.85} side={THREE.DoubleSide} />
        </mesh>
      )}

      {!seat.isLocal && isAlive && (hovered || isSelected) && canVote && moodLighting !== 'bodyguard_cyan' && (
        <mesh
          position={[seat.voteSpotPosition[0], seat.voteSpotPosition[1] - 0.004, seat.voteSpotPosition[2]]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.1, 0.128, 28]} />
          <meshBasicMaterial
            color={hovered ? '#fbbf24' : '#ef4444'}
            transparent
            opacity={hovered ? 0.88 : 0.6}
          />
        </mesh>
      )}

      {/* Floating Vote Counter in front of voted opponent's seat (e.g., "[ 3 Phiếu ]") */}
      {isAlive && seat.voteCount > 0 && voteCounterTex && (
        <group
          ref={voteFloatRef}
          position={[
            seat.voteSpotPosition[0],
            seat.voteSpotPosition[1] + 0.125,
            seat.voteSpotPosition[2],
          ]}
        >
          {/* Subtle Crimson/Gold Vote Marker Disc on Felt */}
          <mesh position={[0, -0.121, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.055, 0.075, 24]} />
            <meshBasicMaterial
              color={isLeadingVote ? '#ff1744' : '#d4af5f'}
              transparent
              opacity={0.75}
            />
          </mesh>

          <Billboard follow>
            <mesh onClick={handleSeatClick}>
              <planeGeometry args={[0.42, 0.12]} />
              <meshBasicMaterial map={voteCounterTex} transparent depthWrite={false} />
            </mesh>
          </Billboard>
        </group>
      )}
    </group>
  );
};

export default TableSeat;
