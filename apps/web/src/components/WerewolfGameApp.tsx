/**
 * WerewolfGameApp — Giao diện chính của Bàn Chơi Ma Sói (Circular Table Layout).
 *
 * Tính năng:
 * 1. Bố trí bàn tròn 360 độ: Tính toán vị trí x, y từng ghế ngồi bằng hàm lượng giác.
 * 2. Trung tâm bàn: Hiển thị Pha hiện tại, Round, và Countdown Timer (mm:ss) đồng bộ NTP.
 * 3. Thẻ vai trò bí mật (Role Card): Có nút xem lật thẻ 3D bí mật.
 * 4. Bảng điều khiển hành động (Night Action / Day Vote): Cho phép chọn mục tiêu chỉ với 1 click.
 * 5. Hộp chat 4 kênh đa luồng (Public / Wolves / Lovers / Dead) với quyền kiểm soát thời gian thực.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ChatChannel,
  ClientRoomView,
  Phase,
  PublicPlayerView,
  Role,
} from '@werewolf/shared';
import { GameStateManager } from '../stores/game.store';

export interface WerewolfGameAppProps {
  store: GameStateManager;
  onEmitAction: (event: string, payload: unknown) => void;
  onSendChat: (channel: ChatChannel, text: string) => void;
}

import { ALL_ROLES_FROM_PDF } from '@werewolf/shared';

const ROLE_EMOJIS: Record<Role, string> = {
  // 1. Phe Dân Làng (21)
  VILLAGER: '🧑‍🌾',
  SEER: '🔮',
  APPRENTICE_SEER: '🔭',
  AURA_SEER: '✨',
  BODYGUARD: '🛡️',
  CUPID: '💘',
  DISEASED: '🤢',
  HUNTER: '🏹',
  IDIOT: '🤪',
  LYCAN: '🐺🐾',
  MASON: '👬',
  MAYOR: '🎖️',
  OLD_HAG: '👵',
  PACIFIST: '🕊️',
  PI: '🕵️',
  PRIEST: '✝️',
  PRINCE: '👑',
  SPELLCASTER: '🤐',
  TOUGH_GUY: '💪',
  TROUBLE_MAKER: '🧨',
  WITCH: '🧙‍♀️',
  // 2. Phe Ma Sói (5)
  WEREWOLF: '🐺',
  MINION: '😈',
  SORCERESS: '🔮🐺',
  LONE_WOLF: '🌑🐺',
  WOLF_CUB: '🐾',
  // 3. Đổi phe & Trung lập (3)
  CURSED: '💀',
  DOPPELGANGER: '🎭',
  DRUNK: '🍺',
  // 4. Phe Biệt Lập / Thứ Ba (4)
  CULT_LEADER: '🕯️',
  HOODLUM: '🗡️',
  TANNER: '🪢',
  VAMPIRE: '🧛',
  // 5. Bản Mở Rộng Wolfpack (6)
  BIG_BAD_WOLF: '👹🐺',
  DIRE_WOLF: '❄️🐺',
  FRUIT_WOLF: '🍏🐺',
  FANG_FACE: '🦷🐺',
  WOLVERINE: '⚔️🐺',
  VIRGINIA_WOOLF: '💃',
};

const ROLE_NAMES: Record<Role, string> = Object.fromEntries(
  Object.entries(ALL_ROLES_FROM_PDF).map(([id, info]) => [id, info.nameVi])
) as Record<Role, string>;

export const WerewolfGameApp: React.FC<WerewolfGameAppProps> = ({
  store,
  onEmitAction,
  onSendChat,
}) => {
  const [state, setState] = useState(store.getState());
  const [chatInput, setChatInput] = useState('');
  const [showRoleCard, setShowRoleCard] = useState(false);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);

  useEffect(() => {
    return store.subscribe((newState) => {
      setState({ ...newState });
    });
  }, [store]);

  // Bộ đếm thời gian countdown mỗi giây
  useEffect(() => {
    const timer = setInterval(() => {
      store.updateRemainingTime();
      setState({ ...store.getState() });
    }, 250);
    return () => clearInterval(timer);
  }, [store]);

  const room = state.room;
  if (!room) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="glass-panel" style={{ padding: '32px 48px', textAlign: 'center' }}>
          <h2>🐺 Đang kết nối tới phòng chơi...</h2>
        </div>
      </div>
    );
  }

  // Định dạng thời gian còn lại mm:ss
  const formatTimer = (ms: number): string => {
    const totalSec = Math.floor(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Tính toán vị trí lượng giác của từng ghế trên bàn tròn 360 độ
  const playerSeats = useMemo(() => {
    const total = room.players.length;
    const radius = 240; // bán kính px
    const centerX = 310;
    const centerY = 310;

    return room.players.map((p, idx) => {
      // Góc chia đều quanh vòng tròn (bắt đầu từ góc 90 độ phía dưới)
      const angle = (idx / total) * 2 * Math.PI + Math.PI / 2;
      const x = centerX + radius * Math.cos(angle) - 42;
      const y = centerY + radius * Math.sin(angle) - 52;
      return { player: p, x, y };
    });
  }, [room.players]);

  const me = room.me;
  const isNight = room.phase.includes('NIGHT') || room.phase.includes('TURN');

  return (
    <div style={{ display: 'flex', gap: 24, padding: 32, maxWidth: 1400, margin: '0 auto', minHeight: '100vh' }}>
      {/* Cột Trái & Giữa: Bàn chơi tròn (Circular Table) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Header Thông tin phòng */}
        <div
          className="glass-panel"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            padding: '14px 24px',
            marginBottom: 20,
          }}
        >
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>MÃ PHÒNG: </span>
            <strong style={{ fontSize: 20, letterSpacing: 2, color: 'var(--village-blue)' }}>{room.code}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>VÒNG: </span>
            <strong style={{ fontSize: 18 }}>Đêm / Ngày {room.round}</strong>
          </div>
          <button
            onClick={() => setShowRoleCard(!showRoleCard)}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {showRoleCard ? '🙈 Ẩn vai trò' : '👁️ Xem vai trò của bạn'}
          </button>
        </div>

        {/* Bàn tròn Ma Sói */}
        <div className="circular-table">
          {/* Ghế ngồi của từng người chơi xung quanh */}
          {playerSeats.map(({ player, x, y }) => {
            const isMe = player.id === me.id;
            const isSelected = selectedTargetId === player.id;

            return (
              <div
                key={player.id}
                className={`seat-node ${player.isAlive ? 'alive' : 'dead'}`}
                style={{
                  left: x,
                  top: y,
                  outline: isSelected ? '2px solid var(--wolf-red)' : isMe ? '2px solid var(--village-blue)' : 'none',
                  borderRadius: 12,
                }}
                onClick={() => setSelectedTargetId(player.id)}
              >
                <div className="seat-avatar">
                  {player.revealedRole ? ROLE_EMOJIS[player.revealedRole] : isMe && me.role ? ROLE_EMOJIS[me.role] : '👤'}
                </div>
                <div className="seat-nickname">{player.nickname}</div>
                <div className="seat-badge">Ghế {player.seat}</div>
              </div>
            );
          })}

          {/* Vòng tâm bàn: Pha hiện tại và Đồng hồ đếm ngược */}
          <div className="table-center">
            <div className={`phase-title ${isNight ? 'night' : 'day'}`}>{room.phase.replace(/_/g, ' ')}</div>
            <div className={`countdown-timer ${state.remainingMs < 10000 ? 'urgent' : ''}`}>
              {formatTimer(state.remainingMs)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
              {isNight ? 'Trời tối, cả làng đi ngủ...' : 'Trời sáng rồi, thảo luận tìm Sói!'}
            </div>
          </div>
        </div>

        {/* Bảng Hành động tương tác (Action Panel) */}
        {state.pendingAction && (
          <div
            className="glass-panel"
            style={{
              marginTop: 24,
              padding: 20,
              width: '100%',
              textAlign: 'center',
              border: '1px solid var(--border-focus)',
            }}
          >
            <h3 style={{ marginBottom: 12 }}>⚡ LƯỢT HÀNH ĐỘNG CỦA BẠN: {state.pendingAction.kind}</h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
              {selectedTargetId
                ? `Đã chọn mục tiêu: ${room.players.find((p) => p.id === selectedTargetId)?.nickname || selectedTargetId}`
                : 'Nhấp chọn một người chơi trên bàn tròn rồi xác nhận hành động'}
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                disabled={!selectedTargetId}
                onClick={() => {
                  if (selectedTargetId) {
                    onEmitAction('night:bodyguardProtect', { targetId: selectedTargetId });
                  }
                }}
                style={{
                  padding: '10px 24px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--wolf-red)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 700,
                  cursor: selectedTargetId ? 'pointer' : 'not-allowed',
                  opacity: selectedTargetId ? 1 : 0.5,
                }}
              >
                Xác nhận hành động
              </button>
              <button
                onClick={() => onEmitAction('day:vote', { targetId: 'SKIP' })}
                style={{
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'var(--text-main)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Bỏ qua (SKIP)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cột Phải: Hộp Chat Đa Kênh (Public / Wolves / Lovers / Dead) */}
      <div style={{ width: 380, display: 'flex', flexDirection: 'column' }}>
        <div className="glass-panel chat-container">
          {/* Tabs kênh chat */}
          <div className="chat-tabs">
            {(['public', 'wolves', 'lovers', 'dead'] as ChatChannel[]).map((ch) => (
              <button
                key={ch}
                className={`chat-tab-btn ${ch} ${state.activeChatChannel === ch ? 'active' : ''}`}
                onClick={() => store.setActiveChatChannel(ch)}
              >
                {ch === 'public'
                  ? 'Làng'
                  : ch === 'wolves'
                  ? '🐺 Sói'
                  : ch === 'lovers'
                  ? '💘 Cặp đôi'
                  : '☠️ Người chết'}
              </button>
            ))}
          </div>

          {/* Danh sách tin nhắn */}
          <div className="chat-messages">
            {(state.chatMessages[state.activeChatChannel] || []).map((msg) => {
              const isMine = msg.senderId === me.id;
              return (
                <div key={msg.id} className={`chat-bubble ${isMine ? 'mine' : ''}`}>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 2 }}>
                    {isMine ? 'Bạn' : msg.senderNickname || msg.senderId}
                  </div>
                  <div>{msg.text}</div>
                </div>
              );
            })}
          </div>

          {/* Thanh nhập chat */}
          <form
            className="chat-input-bar"
            onSubmit={(e) => {
              e.preventDefault();
              if (chatInput.trim()) {
                onSendChat(state.activeChatChannel, chatInput.trim());
                setChatInput('');
              }
            }}
          >
            <input
              type="text"
              className="chat-input-field"
              placeholder={`Chat vào kênh ${state.activeChatChannel}...`}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button type="submit" className="chat-send-btn">
              Gửi
            </button>
          </form>
        </div>

        {/* Thông tin vai trò cá nhân (Secret Role Peek) */}
        {showRoleCard && me.role && (
          <div
            className="glass-panel"
            style={{
              marginTop: 20,
              padding: 20,
              border: me.team === 'WEREWOLF' ? '1px solid var(--wolf-red)' : '1px solid var(--village-blue)',
            }}
          >
            <div style={{ fontSize: 40, textAlign: 'center' }}>{ROLE_EMOJIS[me.role]}</div>
            <h3 style={{ textAlign: 'center', marginTop: 6, color: me.team === 'WEREWOLF' ? 'var(--wolf-red)' : 'var(--village-blue)' }}>
              {ROLE_NAMES[me.role]} ({ALL_ROLES_FROM_PDF[me.role]?.nameEn})
            </h3>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 6 }}>
              <span className="badge" style={{ fontSize: 11, background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: 4 }}>
                Phe: {me.team}
              </span>
              <span className="badge" style={{ fontSize: 11, background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: 4 }}>
                Nhóm: {ALL_ROLES_FROM_PDF[me.role]?.category}
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 10, textAlign: 'center', lineHeight: 1.5 }}>
              {ALL_ROLES_FROM_PDF[me.role]?.description || 'Dùng suy luận để giành chiến thắng.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
