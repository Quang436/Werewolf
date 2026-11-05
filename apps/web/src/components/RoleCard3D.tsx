'use client';

import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import {
  DBRoleData,
  getDBRoleData,
  getRoleAssetImage,
  Role,
  roleAssetsMap,
  ROLE_CARD_IMAGES,
  ROLE_DISPLAY_NAMES_EN,
} from '@werewolf/shared';
import { getGothicTarotBackTexture, getGothicTarotFrontTexture } from './scene3d.helpers';

export interface RoleCard3DProps {
  /** Dữ liệu vai trò truy vấn trực tiếp từ Database (gửi qua socket ASSIGN_ROLE) */
  roleData?: DBRoleData | null;
  /** Mã role dự phòng nếu chỉ truyền tên role */
  role?: Role | string;
  /** Trạng thái đang giơ lá bài lên trước mắt [0, 1.05, 1.8] để đọc */
  isInspecting?: boolean;
  /** Luôn lật ngửa mặt trước (dùng khi lật bài phán quyết giữa bàn) */
  alwaysFaceUp?: boolean;
  /** Callback khi người chơi click vào thẻ bài để xem / cất về khay gỗ */
  onToggleInspect?: (next?: boolean) => void;
  /** Callback khi người chơi bấm nút "Đã hiểu" hoặc "Cất bài" trong pha READING_CARDS */
  onConfirmRead?: () => void;
  /** Hiển thị nút xác nhận "Đã hiểu" trong pha READING_CARDS */
  showConfirmButton?: boolean;
  isAlive?: boolean;
}

export const RoleCard3D: React.FC<RoleCard3DProps> = ({
  roleData,
  role,
  isInspecting = true,
  alwaysFaceUp = false,
  onToggleInspect,
  onConfirmRead,
  showConfirmButton = false,
}) => {
  // Chuẩn hóa dữ liệu roleData từ Database (fallback an toàn nếu chưa kịp đồng bộ)
  const resolvedRole: DBRoleData = useMemo(() => {
    if (roleData && roleData.roleName && roleData.description) {
      return roleData;
    }
    const fallbackCode = typeof role === 'string' && role ? role : roleData?.roleId || 'SEER';
    return getDBRoleData(fallbackCode);
  }, [roleData, role]);

  const roleCode = (resolvedRole.roleId || 'SEER').toUpperCase();
  const nameEn = ROLE_DISPLAY_NAMES_EN[roleCode] || roleCode;

  // Khắc phục triệt để lỗi map nhầm ảnh:
  // - WEREWOLF / MA SÓI: Trỏ đúng file ảnh Ma Sói đầu sói xám răng nanh (/images/roles/werewolf.png)
  // - DISEASED / NGƯỜI BỆNH: Trỏ đúng file ảnh cô gái tóc tím (/images/roles/diseased.png)
  const avatarSrc = useMemo(() => {
    const codeUpper = roleCode.toUpperCase();
    if (codeUpper === 'WEREWOLF') {
      return '/images/roles/werewolf.png';
    }
    if (codeUpper === 'DISEASED') {
      return '/images/roles/diseased.png';
    }
    return (
      getRoleAssetImage(codeUpper) ||
      resolvedRole.avatarUrl ||
      roleAssetsMap[codeUpper] ||
      ROLE_CARD_IMAGES[codeUpper] ||
      '/images/roles/villager.png'
    );
  }, [roleCode, resolvedRole.avatarUrl]);

  const backTex = useMemo(() => getGothicTarotBackTexture(), []);
  const frontTex = useMemo(() => getGothicTarotFrontTexture(roleCode), [roleCode]);

  // Xác định màu sắc Tag nhận diện theo đúng Phe phái từ Database
  const factionTag = useMemo(() => {
    switch (resolvedRole.faction) {
      case 'WEREWOLF':
        return {
          label: 'PHE MA SÓI',
          bg: 'rgba(185, 28, 28, 0.92)',
          border: '#f87171',
          text: '#fef2f2',
          glow: 'rgba(239, 68, 68, 0.35)',
        };
      case 'SOLO':
      case 'THIRD_PARTY':
        return {
          label: resolvedRole.faction === 'SOLO' ? 'PHE ĐỘC LẬP (SOLO)' : 'PHE THỨ 3 / ĐỔI PHE',
          bg: 'rgba(107, 33, 168, 0.92)',
          border: '#c084fc',
          text: '#faf5ff',
          glow: 'rgba(168, 85, 247, 0.35)',
        };
      case 'VILLAGER':
      default:
        return {
          label: 'PHE DÂN LÀNG',
          bg: 'rgba(3, 105, 161, 0.92)',
          border: '#38bdf8',
          text: '#f0f9ff',
          glow: 'rgba(56, 189, 248, 0.35)',
        };
    }
  }, [resolvedRole.faction]);

  const isFaceVisible = Boolean(isInspecting || alwaysFaceUp);

  const handleDismissCard = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onConfirmRead) {
      onConfirmRead();
    }
    if (onToggleInspect) {
      onToggleInspect(false);
    }
  };

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        if (onToggleInspect) {
          onToggleInspect(!isInspecting);
        }
      }}
    >
      {/* Đèn phụ rọi trực diện: Giữ cố định trong scene graph, điều khiển intensity để không gây re-mount */}
      <pointLight
        position={[0, 0.15, 0.15]}
        intensity={isFaceVisible ? 4 : 0}
        color="#ffe8cc"
        distance={1.2}
      />

      {/* 1. Khung viền kim loại đồng thau mạ vàng của thẻ Tarot */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.18, 0.28, 0.003]} />
        <meshStandardMaterial
          color="#d4a537"
          emissive="#3b2806"
          emissiveIntensity={0.35}
          roughness={0.32}
          metalness={0.74}
        />
      </mesh>

      {/* 2. Mặt sau lá bài: Hoa văn Gothic Tarot huyền bí */}
      {backTex && (
        <mesh position={[0, 0, -0.0018]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.176, 0.276]} />
          <meshStandardMaterial map={backTex} roughness={0.48} metalness={0.2} />
        </mesh>
      )}

      {/* 3. Mặt trước 3D nền lót (sử dụng BasicMaterial sáng rõ để không bao giờ bị đen kịt) */}
      <mesh position={[0, 0, 0.0018]}>
        <planeGeometry args={[0.176, 0.276]} />
        {frontTex ? (
          <meshBasicMaterial map={frontTex} toneMapped={false} />
        ) : (
          <meshBasicMaterial color="#1e1518" toneMapped={false} />
        )}
      </mesh>

      {/* 4. Lớp HTML Transform trực tiếp trên bề mặt trước lá bài:
          - SỬA LỖI RUNTIME CRASH: TUYỆT ĐỐI KHÔNG mount/unmount bằng {isFaceVisible && <Html>}!
          - Luôn giữ thẻ <Html> tồn tại cố định trong cây DOM của R3F.
          - Chỉ điều khiển ẩn/hiện hoặc độ mờ bằng CSS (opacity, visibility, pointerEvents).
          - occlude={false} để Three.js không bao giờ ẩn nhầm thẻ HTML.
          - Tọa độ nhô nhẹ position={[0, 0, 0.006]}. */}
      <Html
        transform
        occlude={false}
        distanceFactor={0.28}
        position={[0, 0, 0.006]}
        style={{
          width: '320px',
          height: '496px',
          userSelect: 'none',
          opacity: isFaceVisible ? 1 : 0,
          pointerEvents: isFaceVisible ? 'auto' : 'none',
          visibility: isFaceVisible ? 'visible' : 'hidden',
          transition: 'opacity 0.25s ease-in-out',
          cursor: isFaceVisible ? 'pointer' : 'default',
        }}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleInspect) {
              onToggleInspect(!isInspecting);
            }
          }}
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            borderRadius: '12px',
            border: '2.5px solid #facc15',
            background:
              'radial-gradient(circle at 50% 28%, #261b20 0%, #140e12 72%, #090608 100%)',
            boxShadow:
              'inset 0 0 22px rgba(0, 0, 0, 0.85), 0 0 18px rgba(250, 204, 21, 0.32)',
            fontFamily: "'Be Vietnam Pro', 'Inter', 'Segoe UI', sans-serif",
            color: '#f1f5f9',
            boxSizing: 'border-box',
          }}
        >
          {/* Header Huyền Bí & Nút Cất Bài Nhanh */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(250, 204, 21, 0.35)',
              paddingBottom: '5px',
            }}
          >
            <span
              style={{
                fontSize: '9.5px',
                fontWeight: 800,
                letterSpacing: '0.16em',
                color: '#fde047',
                textTransform: 'uppercase',
              }}
            >
              ✦ KHẾ ƯỚC ĐỊNH MỆNH ✦
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '999px',
                  background: 'rgba(250, 204, 21, 0.16)',
                  border: '1px solid rgba(250, 204, 21, 0.45)',
                  color: '#fef08a',
                }}
              >
                ⏱ {resolvedRole.actionTime}
              </span>

              {/* Nút CẤT BÀI ở góc phải lá bài */}
              <button
                type="button"
                onClick={handleDismissCard}
                title="Cất bài vào khay gỗ"
                style={{
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'rgba(239, 68, 68, 0.22)',
                  border: '1px solid rgba(248, 113, 113, 0.65)',
                  color: '#fecaca',
                  fontSize: '9px',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                ✕ CẤT BÀI
              </button>
            </div>
          </div>

          {/* Khung Minh Họa Chân Dung Vai Trò */}
          <div
            style={{
              position: 'relative',
              width: '132px',
              height: '132px',
              marginTop: '4px',
              marginBottom: '2px',
              borderRadius: '10px',
              overflow: 'hidden',
              border: '2px solid rgba(250, 204, 21, 0.65)',
              boxShadow: `0 0 16px ${factionTag.glow}`,
              backgroundColor: '#0f0a0c',
              flexShrink: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarSrc}
              alt={resolvedRole.roleName}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
              }}
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                if (roleCode === 'WEREWOLF') {
                  img.src = '/images/roles/werewolf.png';
                } else if (roleCode === 'DISEASED') {
                  img.src = '/images/roles/diseased.png';
                } else {
                  img.src = '/images/roles/villager.png';
                }
              }}
            />
          </div>

          {/* Tên Vai Trò: Chữ hoa màu vàng kim (#facc15), viền nét sang trọng */}
          <div
            style={{
              width: '100%',
              textAlign: 'center',
              marginTop: '2px',
            }}
          >
            <div
              style={{
                fontSize: '19px',
                fontWeight: 900,
                color: '#facc15',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                lineHeight: 1.2,
                textShadow:
                  '0 2px 6px rgba(0, 0, 0, 0.95), 0 0 10px rgba(250, 204, 21, 0.35)',
              }}
            >
              {resolvedRole.roleName}
            </div>
            <div
              style={{
                fontSize: '9.5px',
                fontWeight: 600,
                color: 'rgba(254, 240, 138, 0.68)',
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
                marginTop: '1px',
              }}
            >
              {nameEn}
            </div>
          </div>

          {/* Tag Phe Phái (Xanh cho Dân, Đỏ cho Sói, Tím cho Phe thứ 3 / Solo) */}
          <div
            style={{
              padding: '3px 12px',
              borderRadius: '999px',
              fontSize: '10px',
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              backgroundColor: factionTag.bg,
              border: `1.5px solid ${factionTag.border}`,
              color: factionTag.text,
              boxShadow: `0 2px 8px ${factionTag.glow}`,
            }}
          >
            {factionTag.label}
          </div>

          {/* Khung Mô Tả Kỹ Năng: Chữ trắng ngà (#f1f5f9) hiển thị đầy đủ roleData.description từ DB */}
          <div
            style={{
              width: '100%',
              backgroundColor: 'rgba(9, 7, 10, 0.82)',
              border: '1px solid rgba(250, 204, 21, 0.35)',
              borderRadius: '8px',
              padding: '8px 10px',
              textAlign: 'center',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                fontSize: '9.5px',
                fontWeight: 800,
                color: '#facc15',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '4px',
              }}
            >
              KỸ NĂNG & NHIỆM VỤ ĐÊM
            </div>
            <p
              style={{
                margin: 0,
                fontSize: '10.8px',
                lineHeight: 1.38,
                color: '#f1f5f9',
                fontWeight: 500,
              }}
            >
              {resolvedRole.description}
            </p>
          </div>

          {/* Nút hành động xác nhận / cất bài vào khay gỗ */}
          {showConfirmButton && onConfirmRead ? (
            <button
              type="button"
              onClick={handleDismissCard}
              style={{
                width: '100%',
                padding: '7px 12px',
                borderRadius: '6px',
                background: 'linear-gradient(180deg, #facc15 0%, #ca8a04 100%)',
                border: '1px solid #fef08a',
                color: '#090608',
                fontSize: '11px',
                fontWeight: 900,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(250, 204, 21, 0.4)',
              }}
            >
              ✓ ĐÃ HIỂU VAI TRÒ (CẤT BÀI)
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDismissCard}
              style={{
                width: '100%',
                padding: '5px 10px',
                borderRadius: '6px',
                background: 'rgba(250, 204, 21, 0.12)',
                border: '1px solid rgba(250, 204, 21, 0.35)',
                color: '#fef08a',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                cursor: 'pointer',
              }}
            >
              [NHẤN ĐỂ CẤT BÀI VÀO KHAY GỖ]
            </button>
          )}
        </div>
      </Html>
    </group>
  );
};

export default RoleCard3D;
