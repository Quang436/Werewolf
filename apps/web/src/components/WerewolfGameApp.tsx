'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ALL_ROLES_FROM_PDF,
  ChatChannel,
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
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [micActive, setMicActive] = useState(false);

  useEffect(() => {
    return store.subscribe((newState) => {
      setState({ ...newState });
    });
  }, [store]);

  // Bộ đếm thời gian countdown mỗi 250ms
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'var(--surface)' }}>
        <div className="glass-panel" style={{ padding: '36px 48px', textAlign: 'center', border: '1px solid var(--outline-variant)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🐺</div>
          <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: 20 }}>Đang kết nối tới Quán Rượu Vực Thẳm...</h2>
        </div>
      </div>
    );
  }

  const formatTimer = (ms: number) => {
    const totalSec = Math.max(0, Math.ceil(ms / 1000));
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Tính toán vị trí lượng giác của từng ghế trên bàn tròn Liar's Bar
  const playerSeats = useMemo(() => {
    const total = Math.max(1, room.players.length);
    const radiusX = 260; // Bán kính elip ngang
    const radiusY = 200; // Bán kính elip dọc theo góc nhìn Liar's Bar POV
    const centerX = 300;
    const centerY = 260;

    return room.players.map((p, idx) => {
      // Góc chia đều quanh vòng tròn (bắt đầu từ góc 90 độ phía dưới)
      const angle = (idx / total) * 2 * Math.PI + Math.PI / 2;
      const x = centerX + radiusX * Math.cos(angle) - 45;
      const y = centerY + radiusY * Math.sin(angle) - 55;
      return { player: p, x, y };
    });
  }, [room.players]);

  const me = room.me;
  const isNight = room.phase.includes('NIGHT') || room.phase.includes('TURN');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#030303', color: 'var(--on-surface)', display: 'flex', flexDirection: 'column' }}>
      {/* 1. TOP CINEMATIC HUD (Liar's Bar / Gothic HUD) */}
      <header
        className="hud-glass"
        style={{
          height: 68,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-label)', color: 'var(--text-dim)', textTransform: 'uppercase' }}>PHÒNG:</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 900, color: 'var(--village-blue)', letterSpacing: 2 }}>
              {room.code}
            </span>
          </div>
          <div style={{ width: 1, height: 20, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}></div>
          <div style={{ fontFamily: 'var(--font-label)', fontSize: 13, color: 'var(--text-muted)' }}>
            Vòng: <strong style={{ color: '#fff' }}>Đêm / Ngày {room.round}</strong>
          </div>
        </div>

        {/* Center Alert / Phase Status */}
        <div style={{ textAlign: 'center' }}>
          <div className={`phase-title ${isNight ? 'night' : 'day'}`}>
            {room.phase.replace(/_/g, ' ')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-label)' }}>
            {isNight ? 'Trời tối, cả làng nhắm mắt...' : 'Trời sáng, thảo luận tìm Sói!'}
          </div>
        </div>

        {/* Right Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setMicActive(!micActive)}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: micActive ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: micActive ? '1px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.1)',
              color: micActive ? 'var(--primary)' : 'var(--text-dim)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              fontFamily: 'var(--font-label)',
              fontSize: 11,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{micActive ? 'mic' : 'mic_off'}</span>
            <span>{micActive ? 'Đang Nói' : 'Tắt Mic'}</span>
          </button>
          <button
            onClick={() => setShowRoleModal(true)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--surface-container-high)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: 'var(--amber-glow)',
              cursor: 'pointer',
              fontFamily: 'var(--font-label)',
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>visibility</span>
            Thẻ Của Tôi
          </button>
        </div>
      </header>

      {/* 2. MAIN BATTLEGROUND (Liar's Bar 3D Table + Chat) */}
      <div style={{ flex: 1, display: 'flex', gap: 20, padding: '16px 24px', maxWidth: 1560, margin: '0 auto', width: '100%' }}>
        {/* Left Column: Player Live Status */}
        <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="glass-panel" style={{ padding: 16, height: '100%' }}>
            <h4 style={{ fontFamily: 'var(--font-label)', fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 12 }}>
              DANH SÁCH GHẾ ({room.players.filter((p) => p.isAlive).length}/{room.players.length} SỐNG)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
              {room.players.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedTargetId(p.id)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: selectedTargetId === p.id ? 'rgba(239, 68, 68, 0.2)' : 'var(--surface-container-low)',
                    border: selectedTargetId === p.id ? '1px solid var(--wolf-red)' : '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    opacity: p.isAlive ? 1 : 0.45,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{p.revealedRole ? ROLE_EMOJIS[p.revealedRole] : '👤'}</span>
                    <span style={{ fontFamily: 'var(--font-label)', fontSize: 12, color: p.id === me.id ? 'var(--primary)' : 'inherit' }}>
                      {p.nickname} {p.id === me.id ? '(Bạn)' : ''}
                    </span>
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-label)' }}>
                    #{p.seat}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: 3D Perspective Table */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="table-viewport-container">
            {/* Background Image of Liar's Bar */}
            <img
              src="/assets/liars_bar_bg.png"
              alt="Liar's Bar Table"
              className="table-background-image"
              onError={(e) => {
                // Fallback nếu ảnh tải chậm
                (e.target as HTMLElement).style.display = 'none';
              }}
            />

            {/* Circular Table Seats */}
            <div className="circular-table">
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
                      outline: isSelected ? '2px solid var(--blood-red)' : isMe ? '2px solid var(--village-blue)' : 'none',
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

              {/* Table Center HUD: Phase & Countdown Clock */}
              <div className="table-center-hud">
                <div className={`countdown-timer ${state.remainingMs < 10000 ? 'urgent' : ''}`}>
                  {formatTimer(state.remainingMs)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, fontFamily: 'var(--font-label)' }}>
                  THỜI GIAN CÒN LẠI
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Hand Tarot Deck (Liar's Bar Card Fan) */}
          <div className="werewolf-card-fan">
            {/* 1. Thẻ bài Thân Phận (Secret Role Card) */}
            <div
              className="werewolf-tarot-card"
              onClick={() => setShowRoleModal(true)}
              style={{
                border: me.team === 'WEREWOLF' ? '1px solid var(--blood-red)' : '1px solid var(--village-blue)',
              }}
            >
              <div style={{ fontSize: 9, fontFamily: 'var(--font-label)', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                THÂN PHẬN
              </div>
              <div style={{ fontSize: 36 }}>{me.role ? ROLE_EMOJIS[me.role] : '❓'}</div>
              <div style={{ fontFamily: 'var(--font-headline)', fontSize: 11, fontWeight: 700, color: me.team === 'WEREWOLF' ? 'var(--error)' : 'var(--primary)' }}>
                {me.role ? ROLE_NAMES[me.role] : 'ẨN DANH'}
              </div>
            </div>

            {/* 2. Thẻ Kỹ Năng / Hành Động (Action Card) */}
            <div
              className="werewolf-tarot-card"
              onClick={() => {
                if (selectedTargetId) {
                  onEmitAction('night:bodyguardProtect', { targetId: selectedTargetId });
                }
              }}
              style={{
                border: selectedTargetId ? '1px solid var(--amber-glow)' : '1px solid var(--outline-variant)',
                cursor: selectedTargetId ? 'pointer' : 'default',
              }}
            >
              <div style={{ fontSize: 9, fontFamily: 'var(--font-label)', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                HÀNH ĐỘNG
              </div>
              <div style={{ fontSize: 32 }}>⚡</div>
              <button
                disabled={!selectedTargetId}
                style={{
                  background: selectedTargetId ? 'var(--blood-red)' : 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: 4,
                  padding: '4px 8px',
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: selectedTargetId ? 'pointer' : 'not-allowed',
                }}
              >
                {selectedTargetId ? 'XÁC NHẬN' : 'CHỌN MỤC TIÊU'}
              </button>
            </div>

            {/* 3. Thẻ Bỏ Qua / Tha Tội (Skip Card) */}
            <div
              className="werewolf-tarot-card"
              onClick={() => onEmitAction('day:vote', { targetId: 'SKIP' })}
            >
              <div style={{ fontSize: 9, fontFamily: 'var(--font-label)', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                BỎ QUA
              </div>
              <div style={{ fontSize: 32 }}>🕊️</div>
              <div style={{ fontFamily: 'var(--font-headline)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
                BỎ PHIẾU TRẮNG
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: 4-Channel Multi-Stream Chat */}
        <div style={{ width: 360, display: 'flex', flexDirection: 'column' }}>
          <div className="glass-panel chat-container" style={{ height: '100%', minHeight: 640 }}>
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
                    ? '💘 Cặp Đôi'
                    : '☠️ Người Chết'}
                </button>
              ))}
            </div>

            {/* Messages Stream */}
            <div className="chat-messages">
              {(state.chatMessages[state.activeChatChannel] || []).map((msg) => {
                const isMine = msg.senderId === me.id;
                return (
                  <div key={msg.id} className={`chat-bubble ${isMine ? 'mine' : ''}`}>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 2 }}>
                      {isMine ? 'Bạn' : msg.senderNickname || msg.senderId}
                    </div>
                    <div>{msg.text}</div>
                  </div>
                );
              })}
            </div>

            {/* Input Form */}
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
                placeholder={`Chat vào kênh [${state.activeChatChannel}]...`}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button type="submit" className="chat-send-btn">
                GỬI
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 3. SECRET ROLE PEEK MODAL */}
      {showRoleModal && me.role && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: 440,
              padding: 28,
              textAlign: 'center',
              border: me.team === 'WEREWOLF' ? '2px solid var(--blood-red)' : '2px solid var(--village-blue)',
            }}
          >
            <div style={{ fontSize: 56, marginBottom: 8 }}>{ROLE_EMOJIS[me.role]}</div>
            <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: 24, fontWeight: 800, color: me.team === 'WEREWOLF' ? 'var(--error)' : 'var(--primary)' }}>
              {ROLE_NAMES[me.role]}
            </h2>
            <div style={{ fontFamily: 'var(--font-label)', fontSize: 12, color: 'var(--text-dim)', marginBottom: 12 }}>
              {ALL_ROLES_FROM_PDF[me.role]?.nameEn}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>
                Phe: {me.team}
              </span>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>
                Nhóm: {ALL_ROLES_FROM_PDF[me.role]?.category}
              </span>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
              {ALL_ROLES_FROM_PDF[me.role]?.description || 'Sử dụng kỹ năng để mang lại chiến thắng cho phe của bạn.'}
            </p>

            <button
              onClick={() => setShowRoleModal(false)}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--surface-container-high)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                fontFamily: 'var(--font-headline)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ĐÓNG THẺ BÀI
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
