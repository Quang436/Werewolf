'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Billboard, RoundedBox, useCursor } from '@react-three/drei';
import {
  ComputedSeat,
  TABLE_SURFACE_Y,
  getFloatingVoteCountTexture,
  getVoteTokenTexture,
  werewolfAudio,
} from './scene3d.helpers';

export interface VotingTokenTrayProps {
  seats: ComputedSeat[];
  voteTally: Record<string, number>;
  myVotedTargetId: string | null;
  canVote: boolean;
  onCastVote: (targetId: string) => void;
}

const TRAY_POSITION: [number, number, number] = [0.05, TABLE_SURFACE_Y + 0.008, 1.48];
const TRAY_ORIGIN_VEC = new THREE.Vector3(TRAY_POSITION[0], TABLE_SURFACE_Y + 0.018, TRAY_POSITION[2] - 0.02);

interface TraySlotButtonProps {
  label: string;
  targetId: string;
  slotPos: [number, number, number];
  radius: number;
  isSkip?: boolean;
  isActive: boolean;
  disabled: boolean;
  onSelect: (targetId: string) => void;
}

const TrayTokenButton: React.FC<TraySlotButtonProps> = ({
  label,
  targetId,
  slotPos,
  radius,
  isSkip = false,
  isActive,
  disabled,
  onSelect,
}) => {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered && !disabled, 'pointer', 'auto');

  const tex = useMemo(() => getVoteTokenTexture(label, isSkip, isActive), [label, isSkip, isActive]);

  // If this token has slid out onto the table toward the suspect, show recessed wooden socket in tray
  if (isActive && !isSkip) {
    return (
      <mesh position={[slotPos[0], 0.006, slotPos[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius * 0.92, 20]} />
        <meshStandardMaterial color="#120a06" roughness={0.95} />
      </mesh>
    );
  }

  return (
    <group
      position={[slotPos[0], hovered && !disabled ? 0.019 : 0.013, slotPos[2]]}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (!disabled) setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) {
          onSelect(targetId);
        }
      }}
    >
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius * 1.03, 0.01, 22]} />
        <meshStandardMaterial
          color={disabled ? '#26201c' : isSkip ? '#2f2c2a' : '#4a2e19'}
          roughness={0.62}
          metalness={0.22}
          emissive={hovered && !disabled ? '#5c380e' : '#000000'}
        />
      </mesh>
      {tex && (
        <mesh position={[0, 0.0055, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[radius * 0.96, 22]} />
          <meshStandardMaterial
            map={tex}
            roughness={0.5}
            metalness={0.28}
            transparent
            opacity={disabled ? 0.45 : 1}
          />
        </mesh>
      )}
    </group>
  );
};

interface VotePileOnTableProps {
  seat: ComputedSeat;
  count: number;
  isLeading: boolean;
  excludeSlidingLocalToken: boolean;
}

const VotePileOnTable: React.FC<VotePileOnTableProps> = ({
  seat,
  count,
  isLeading,
  excludeSlidingLocalToken,
}) => {
  const floatRef = useRef<THREE.Group>(null);
  const badgeLabel = String(seat.player.seat).padStart(2, '0');

  const tokenTex = useMemo(() => getVoteTokenTexture(badgeLabel, false, isLeading), [badgeLabel, isLeading]);
  const counterTex = useMemo(() => getFloatingVoteCountTexture(count, isLeading), [count, isLeading]);

  useFrame((state) => {
    if (floatRef.current) {
      floatRef.current.position.y =
        seat.voteSpotPosition[1] + 0.14 + Math.sin(state.clock.elapsedTime * 2.6 + seat.player.seat) * 0.01;
    }
  });

  const staticTokenCount = Math.max(0, excludeSlidingLocalToken ? count - 1 : count);
  const visibleTokens = Math.min(staticTokenCount, 6);

  return (
    <group>
      {/* Fanned / Stacked Wooden Vote Tokens resting in front of the suspect */}
      {Array.from({ length: visibleTokens }).map((_, idx) => {
        const offsetAngle = idx * 1.15;
        const spread = idx === 0 ? 0 : 0.024 + (idx % 3) * 0.012;
        const tx = seat.voteSpotPosition[0] + Math.cos(offsetAngle) * spread;
        const tz = seat.voteSpotPosition[2] + Math.sin(offsetAngle) * spread;
        const ty = TABLE_SURFACE_Y + 0.007 + Math.floor(idx / 3) * 0.011;

        return (
          <group key={idx} position={[tx, ty, tz]}>
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[0.036, 0.037, 0.01, 20]} />
              <meshStandardMaterial color="#4a2c18" roughness={0.62} metalness={0.24} />
            </mesh>
            {tokenTex && (
              <mesh position={[0, 0.0054, 0]} rotation={[-Math.PI / 2, 0, idx * 0.4]}>
                <circleGeometry args={[0.034, 20]} />
                <meshStandardMaterial map={tokenTex} roughness={0.48} metalness={0.3} />
              </mesh>
            )}
          </group>
        );
      })}

      {/* Floating Diegetic Vote Total ("3 Phiếu") above the suspect's spot */}
      {count > 0 && counterTex && (
        <group
          ref={floatRef}
          position={[seat.voteSpotPosition[0], seat.voteSpotPosition[1] + 0.14, seat.voteSpotPosition[2]]}
        >
          <Billboard follow>
            <mesh>
              <planeGeometry args={[0.34, 0.11]} />
              <meshBasicMaterial map={counterTex} transparent depthWrite={false} />
            </mesh>
          </Billboard>
        </group>
      )}
    </group>
  );
};

export const VotingTokenTray: React.FC<VotingTokenTrayProps> = ({
  seats,
  voteTally,
  myVotedTargetId,
  canVote,
  onCastVote,
}) => {
  const slidingGroupRef = useRef<THREE.Group>(null);
  const slideStartPosRef = useRef(new THREE.Vector3().copy(TRAY_ORIGIN_VEC));
  const slideTargetPosRef = useRef(new THREE.Vector3().copy(TRAY_ORIGIN_VEC));
  const slideProgressRef = useRef(1);
  const prevTargetIdRef = useRef<string | null>(null);

  const opponentSeats = useMemo(() => seats.filter((s) => !s.isLocal), [seats]);

  const targetSeat = useMemo(
    () => (myVotedTargetId && myVotedTargetId !== 'SKIP' ? seats.find((s) => s.player.id === myVotedTargetId) || null : null),
    [myVotedTargetId, seats]
  );

  const activeSlideTex = useMemo(() => {
    const label = targetSeat ? String(targetSeat.player.seat).padStart(2, '0') : '00';
    return getVoteTokenTexture(label, false, true);
  }, [targetSeat]);

  // Trigger smooth felt-sliding animation whenever local player clicks an opponent seat or tray badge
  useEffect(() => {
    if (!targetSeat) {
      prevTargetIdRef.current = myVotedTargetId;
      return;
    }

    if (prevTargetIdRef.current !== targetSeat.player.id) {
      slideStartPosRef.current.copy(TRAY_ORIGIN_VEC);
      slideTargetPosRef.current.set(
        targetSeat.voteSpotPosition[0],
        TABLE_SURFACE_Y + 0.008,
        targetSeat.voteSpotPosition[2]
      );
      slideProgressRef.current = 0;
      prevTargetIdRef.current = targetSeat.player.id;

      werewolfAudio.playTokenSlide();
    }
  }, [myVotedTargetId, targetSeat]);

  useFrame((_, delta) => {
    if (!slidingGroupRef.current || !targetSeat) return;

    if (slideProgressRef.current < 1) {
      const prev = slideProgressRef.current;
      slideProgressRef.current = Math.min(1, slideProgressRef.current + Math.min(delta, 0.1) * 2.35);
      const t = slideProgressRef.current;
      const eased = 1 - Math.pow(1 - t, 3);

      slidingGroupRef.current.position.lerpVectors(
        slideStartPosRef.current,
        slideTargetPosRef.current,
        eased
      );
      // Slight realistic slide skim & spin across felt
      slidingGroupRef.current.position.y += Math.sin(t * Math.PI) * 0.012;
      slidingGroupRef.current.rotation.y = (1 - eased) * Math.PI * 1.2;

      if (prev < 1 && slideProgressRef.current >= 1) {
        werewolfAudio.playVoteStamp();
      }
    } else {
      slidingGroupRef.current.position.copy(slideTargetPosRef.current);
    }
  });

  // Determine highest vote count for leading highlight
  const maxVotes = useMemo(() => {
    let max = 0;
    for (const s of seats) {
      if (!s.player.isAlive) continue;
      const c = voteTally[s.player.id] || 0;
      if (c > max) max = c;
    }
    return max;
  }, [seats, voteTally]);

  // Arrange engraved seat tokens neatly inside the dark walnut tray (1 or 2 rows)
  const traySlots = useMemo(() => {
    const items = [
      ...opponentSeats.map((s) => ({
        targetId: s.player.id,
        label: String(s.player.seat).padStart(2, '0'),
        disabled: !canVote || !s.player.isAlive,
        isSkip: false,
      })),
      {
        targetId: 'SKIP',
        label: 'BỎ',
        disabled: !canVote,
        isSkip: true,
      },
    ];

    const total = items.length;
    const rows = total > 8 ? 2 : 1;
    const cols = Math.ceil(total / rows);
    const tokenRadius = rows === 2 ? 0.023 : 0.028;
    const spacingX = Math.min(0.062, 0.41 / Math.max(cols, 1));
    const spacingZ = 0.056;

    return items.map((item, idx) => {
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      const colsInThisRow = row === rows - 1 ? total - row * cols : cols;
      const x = (col - (colsInThisRow - 1) / 2) * spacingX;
      const z = rows === 1 ? 0 : (row - 0.5) * spacingZ;
      return {
        ...item,
        slotPos: [x, 0, z] as [number, number, number],
        radius: tokenRadius,
      };
    });
  }, [opponentSeats, canVote]);

  return (
    <group>
      {/* ================================================================
          1. CARVED WOODEN VOTING TOKEN TRAY IN FRONT OF LOCAL PLAYER
         ================================================================ */}
      <group position={TRAY_POSITION}>
        {/* Recessed Walnut Tray Base */}
        <RoundedBox args={[0.48, 0.016, 0.165]} radius={0.014} smoothness={3} castShadow receiveShadow>
          <meshStandardMaterial color="#23140b" roughness={0.82} metalness={0.08} />
        </RoundedBox>

        {/* Velvet / Dark Felt Inner Tray Liner */}
        <mesh position={[0, 0.0085, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[0.44, 0.13]} />
          <meshStandardMaterial color="#120c09" roughness={0.92} metalness={0.04} />
        </mesh>

        {/* Raised Wooden Tray Rails */}
        <RoundedBox args={[0.484, 0.026, 0.014]} radius={0.004} position={[0, 0.006, -0.076]} castShadow>
          <meshStandardMaterial color="#2d1a0e" roughness={0.76} metalness={0.1} />
        </RoundedBox>
        <RoundedBox args={[0.484, 0.026, 0.014]} radius={0.004} position={[0, 0.006, 0.076]} castShadow>
          <meshStandardMaterial color="#2d1a0e" roughness={0.76} metalness={0.1} />
        </RoundedBox>
        <RoundedBox args={[0.014, 0.026, 0.165]} radius={0.004} position={[-0.235, 0.006, 0]} castShadow>
          <meshStandardMaterial color="#2d1a0e" roughness={0.76} metalness={0.1} />
        </RoundedBox>
        <RoundedBox args={[0.014, 0.026, 0.165]} radius={0.004} position={[0.235, 0.006, 0]} castShadow>
          <meshStandardMaterial color="#2d1a0e" roughness={0.76} metalness={0.1} />
        </RoundedBox>

        {/* Tarnished Brass Corner Rivets */}
        {[
          [-0.228, 0.02, -0.074],
          [0.228, 0.02, -0.074],
          [-0.228, 0.02, 0.074],
          [0.228, 0.02, 0.074],
        ].map(([rx, ry, rz], rIdx) => (
          <mesh key={rIdx} position={[rx, ry, rz]}>
            <cylinderGeometry args={[0.006, 0.006, 0.003, 10]} />
            <meshStandardMaterial color="#b0883e" roughness={0.4} metalness={0.75} />
          </mesh>
        ))}

        {/* Engraved Seat-Number Voting Badges inside Tray */}
        {traySlots.map((slot) => (
          <TrayTokenButton
            key={slot.targetId}
            label={slot.label}
            targetId={slot.targetId}
            slotPos={slot.slotPos}
            radius={slot.radius}
            isSkip={slot.isSkip}
            isActive={myVotedTargetId === slot.targetId}
            disabled={slot.disabled}
            onSelect={onCastVote}
          />
        ))}
      </group>

      {/* ================================================================
          2. LOCAL PLAYER'S SLIDING VOTE TOKEN ACROSS THE TABLE FELT
         ================================================================ */}
      {targetSeat && (
        <group ref={slidingGroupRef} position={[TRAY_ORIGIN_VEC.x, TRAY_ORIGIN_VEC.y, TRAY_ORIGIN_VEC.z]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.038, 0.039, 0.011, 22]} />
            <meshStandardMaterial
              color="#632018"
              roughness={0.55}
              metalness={0.28}
              emissive="#3b0c0c"
              emissiveIntensity={0.45}
            />
          </mesh>
          {activeSlideTex && (
            <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.036, 22]} />
              <meshStandardMaterial map={activeSlideTex} roughness={0.45} metalness={0.32} />
            </mesh>
          )}
        </group>
      )}

      {/* ================================================================
          3. STACKED TOKENS & FLOATING VOTE COUNTERS ("3 Phiếu") ON TABLE
         ================================================================ */}
      {seats.map((seat) => {
        const count = voteTally[seat.player.id] || 0;
        if (count <= 0 || !seat.player.isAlive) return null;
        return (
          <VotePileOnTable
            key={seat.player.id}
            seat={seat}
            count={count}
            isLeading={maxVotes > 0 && count === maxVotes}
            excludeSlidingLocalToken={targetSeat?.player.id === seat.player.id}
          />
        );
      })}
    </group>
  );
};

export default VotingTokenTray;
