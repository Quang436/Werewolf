'use client';

import React, { useMemo } from 'react';
import {
  DBRoleData,
  getDBRoleData,
  Role,
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

  const backTex = useMemo(() => getGothicTarotBackTexture(), []);
  const frontTex = useMemo(
    () => getGothicTarotFrontTexture(roleCode, resolvedRole),
    [roleCode, resolvedRole]
  );

  const isFaceVisible = Boolean(isInspecting || alwaysFaceUp);

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        if (onToggleInspect) {
          onToggleInspect(!isInspecting);
        }
      }}
    >
      {/* Đèn phụ rọi trực diện lá bài: Điều khiển intensity mượt mà, không gây re-mount */}
      <pointLight
        position={[0, 0.15, 0.18]}
        intensity={isFaceVisible ? 4.5 : 0}
        color="#ffe8cc"
        distance={1.4}
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

      {/* 3. Mặt trước 3D lá bài: Hiển thị hình ảnh chân dung vai trò thật chuẩn nét và thông số chi tiết */}
      <mesh position={[0, 0, 0.0018]}>
        <planeGeometry args={[0.176, 0.276]} />
        {frontTex ? (
          <meshBasicMaterial map={frontTex} toneMapped={false} />
        ) : (
          <meshBasicMaterial color="#1e1518" toneMapped={false} />
        )}
      </mesh>
    </group>
  );
};

export default RoleCard3D;
