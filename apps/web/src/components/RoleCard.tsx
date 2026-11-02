'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { Role, ROLE_CARD_IMAGES, ROLE_DISPLAY_NAMES_EN, ROLE_DISPLAY_NAMES_VI } from '@werewolf/shared';
import { getGothicTarotBackTexture } from './scene3d.helpers';
import { ROLE_DETAILS_EXTRA } from '../constants/roles-data';

export interface RoleCardProps {
  role: Role | string;
  isInspecting: boolean;
  onToggleInspect: (next?: boolean) => void;
  isAlive?: boolean;
}

export const RoleCard: React.FC<RoleCardProps> = ({
  role,
  isInspecting,
  onToggleInspect,
  isAlive = true,
}) => {
  const roleCode = (typeof role === 'string' ? role : 'VILLAGER').toUpperCase();
  const nameVi = ROLE_DISPLAY_NAMES_VI[roleCode] || roleCode;
  const nameEn = ROLE_DISPLAY_NAMES_EN[roleCode] || roleCode;
  const cardImg = ROLE_CARD_IMAGES[roleCode] || '/assets/cards/card_14.png';
  const detail = ROLE_DETAILS_EXTRA[roleCode] || {
    abilityTitle: 'Kỹ Năng Vai Trò',
    abilityInstruction: 'Ngủ suốt đêm và dùng suy luận logic để tìm kiếm Ma Sói vào ban ngày.',
    lore: 'Một thành viên quan trọng trong ngôi làng u tối.',
  };

  const backTex = useMemo(() => getGothicTarotBackTexture(), []);

  // Xác định nhóm phe
  const isWerewolf = [
    'WEREWOLF',
    'MINION',
    'SORCERESS',
    'LONE_WOLF',
    'WOLF_CUB',
    'BIG_BAD_WOLF',
    'DIRE_WOLF',
    'FRUIT_BRUTE',
    'FRUIT_WOLF',
    'FANG_FACE',
    'WOLVERINE',
  ].includes(roleCode);

  const isThirdParty = [
    'CURSED',
    'DOPPELGANGER',
    'DRUNK',
    'CULT_LEADER',
    'HOODLUM',
    'TANNER',
    'VAMPIRE',
    'VIRGINIA_WOOLF',
  ].includes(roleCode);

  const factionBadge = isWerewolf
    ? { text: 'Phe Ma Sói', bg: 'rgba(153, 27, 27, 0.9)', border: '#f87171', color: '#fee2e2' }
    : isThirdParty
    ? { text: 'Phe Biệt Lập / Đổi Phe', bg: 'rgba(88, 28, 135, 0.9)', border: '#c084fc', color: '#f3e8ff' }
    : { text: 'Phe Dân Làng', bg: 'rgba(14, 116, 144, 0.9)', border: '#38bdf8', color: '#e0f2fe' };

  return (
    <group onClick={(e) => { e.stopPropagation(); onToggleInspect(!isInspecting); }}>
      {/* 1. Lõi thẻ bài Tarot mạ vàng đồng thau */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.18, 0.28, 0.003]} />
        <meshStandardMaterial color="#c99b3b" roughness={0.34} metalness={0.76} />
      </mesh>

      {/* 2. Mặt sau lá bài: Hoa văn Gothic Tarot huyền bí */}
      {backTex && (
        <mesh position={[0, 0, -0.0018]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.176, 0.276]} />
          <meshStandardMaterial map={backTex} roughness={0.48} metalness={0.2} />
        </mesh>
      )}

      {/* 3. Mặt trước lá bài: HTML TRANSFORM OCCLUDE — KHÔNG BAO GIỜ GÃY NÉT TIẾNG VIỆT */}
      <mesh position={[0, 0, 0.0018]}>
        <planeGeometry args={[0.176, 0.276]} />
        <meshStandardMaterial color="#0c090a" roughness={0.6} />

        <Html
          transform
          occlude
          distanceFactor={0.28}
          position={[0, 0, 0.001]}
          style={{
            width: '320px',
            height: '490px',
            userSelect: 'none',
            pointerEvents: 'auto',
            cursor: 'pointer',
          }}
        >
          <div
            className="w-full h-full flex flex-col items-center justify-between p-3.5 rounded-lg border-2 select-none"
            style={{
              background: 'radial-gradient(circle at center, #1c1417 0%, #0d090b 80%, #060405 100%)',
              borderColor: '#eab308',
              boxShadow: 'inset 0 0 16px rgba(0,0,0,0.85), 0 0 12px rgba(234, 179, 8, 0.25)',
              fontFamily: "'Be Vietnam Pro', sans-serif",
            }}
          >
            {/* Top Arcana Header */}
            <div className="w-full text-center border-b border-amber-600/40 pb-1">
              <span
                className="text-[10px] tracking-[0.25em] font-bold text-amber-300 uppercase"
                style={{ fontFamily: "'Cinzel Decorative', Georgia, serif" }}
              >
                ✦ ARCANA ĐỊNH MỆNH ✦
              </span>
            </div>

            {/* Role Card Center Image */}
            <div className="relative w-28 h-28 my-1 rounded-md overflow-hidden border border-amber-500/50 shadow-inner bg-black/60 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cardImg}
                alt={nameVi}
                className="w-full h-full object-cover object-center filter contrast-110"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/cards/card_14.png';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            </div>

            {/* Role Name (Font Be Vietnam Pro / Cinzel) - SẮC NÉT 100%, TUYỆT ĐỐI KHÔNG GÃY DẤU */}
            <div className="w-full text-center flex flex-col items-center justify-center">
              <h2
                className="text-[17px] font-black tracking-wide leading-tight uppercase"
                style={{
                  fontFamily: "'Cinzel Decorative', 'Be Vietnam Pro', serif",
                  background: 'linear-gradient(180deg, #fffbeb 0%, #fde047 50%, #ca8a04 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))',
                }}
              >
                {nameVi}
              </h2>
              <span className="text-[9px] font-medium text-amber-200/60 uppercase tracking-widest -mt-0.5">
                {nameEn}
              </span>
            </div>

            {/* Faction Badge */}
            <div
              className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border my-1"
              style={{
                backgroundColor: factionBadge.bg,
                borderColor: factionBadge.border,
                color: factionBadge.color,
              }}
            >
              {factionBadge.text}
            </div>

            {/* Ability Title & Summary */}
            <div className="w-full bg-black/50 rounded p-1.5 border border-amber-600/30 flex flex-col gap-0.5 text-center">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide">
                {detail.abilityTitle}
              </span>
              <p className="text-[9.5px] leading-[1.28] text-amber-100/90 font-medium line-clamp-3">
                {detail.abilityInstruction}
              </p>
            </div>

            {/* Bottom Inspect Hint */}
            <div className="w-full text-center text-[8.5px] font-semibold text-amber-400/70 pt-0.5">
              {isInspecting ? '[Click để cất về khay]' : '[Click để soi bài gần hơn]'}
            </div>
          </div>
        </Html>
      </mesh>
    </group>
  );
};

export default RoleCard;
