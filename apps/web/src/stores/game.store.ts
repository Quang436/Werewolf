/**
 * GameStore (Zustand) — Quản lý State Realtime của Client.
 *
 * Tính năng:
 * 1. Lưu trữ ClientRoomView (đã mask an toàn từ server).
 * 2. Tích hợp ClockSync (NTP) để tính chính xác countdown timer từng mili-giây.
 * 3. Quản lý tin nhắn chat theo 4 tab kênh: 'public', 'wolves', 'lovers', 'dead'.
 * 4. Quản lý trạng thái tương tác của người chơi (Pending Action dialog).
 */

import {
  ActionRequest,
  ChatChannel,
  ClientRoomView,
  ClockSync,
  PongPayload,
  Role,
  ServerPacket,
  Team,
} from '@werewolf/shared';

export interface ChatMessage {
  id: string;
  channel: ChatChannel;
  senderId: string;
  senderNickname?: string;
  text: string;
  ts: number;
}

export interface GameState {
  room: ClientRoomView | null;
  clockSync: ClockSync;
  clockOffset: number;
  remainingMs: number;
  activeChatChannel: ChatChannel;
  chatMessages: Record<ChatChannel, ChatMessage[]>;
  pendingAction: ActionRequest | null;
  seerResultModal: { targetId: string; result: string } | null;
  winnerAnnouncement: Team | null;

  // Actions
  setRoomSnapshot: (snapshot: ClientRoomView) => void;
  updatePhase: (phase: ClientRoomView['phase'], phaseEndsAt: number | null) => void;
  handleTimePong: (pong: PongPayload) => void;
  updateRemainingTime: () => void;
  addChatMessage: (msg: ChatMessage) => void;
  setActiveChatChannel: (channel: ChatChannel) => void;
  setPendingAction: (action: ActionRequest | null) => void;
  setSeerResult: (res: { targetId: string; result: string } | null) => void;
  resetGame: () => void;
}

export function createInitialGameState(): Omit<
  GameState,
  | 'setRoomSnapshot'
  | 'updatePhase'
  | 'handleTimePong'
  | 'updateRemainingTime'
  | 'addChatMessage'
  | 'setActiveChatChannel'
  | 'setPendingAction'
  | 'setSeerResult'
  | 'resetGame'
> {
  return {
    room: null,
    clockSync: new ClockSync(),
    clockOffset: 0,
    remainingMs: 0,
    activeChatChannel: 'public',
    chatMessages: {
      public: [],
      wolves: [],
      lovers: [],
      dead: [],
    },
    pendingAction: null,
    seerResultModal: null,
    winnerAnnouncement: null,
  };
}

export class GameStateManager {
  private state: GameState;
  private listeners = new Set<(state: GameState) => void>();

  constructor() {
    const initial = createInitialGameState();
    this.state = {
      ...initial,
      setRoomSnapshot: (snapshot) => this.setRoomSnapshot(snapshot),
      updatePhase: (phase, phaseEndsAt) => this.updatePhase(phase, phaseEndsAt),
      handleTimePong: (pong) => this.handleTimePong(pong),
      updateRemainingTime: () => this.updateRemainingTime(),
      addChatMessage: (msg) => this.addChatMessage(msg),
      setActiveChatChannel: (channel) => this.setActiveChatChannel(channel),
      setPendingAction: (action) => this.setPendingAction(action),
      setSeerResult: (res) => this.setSeerResult(res),
      resetGame: () => this.resetGame(),
    };
  }

  public getState(): GameState {
    return this.state;
  }

  public subscribe(listener: (state: GameState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  public setRoomSnapshot(snapshot: ClientRoomView): void {
    this.state.room = snapshot;
    this.state.pendingAction = snapshot.pendingAction || null;
    if (snapshot.winner) {
      this.state.winnerAnnouncement = snapshot.winner;
    }
    this.updateRemainingTime();
    this.notify();
  }

  public updatePhase(phase: ClientRoomView['phase'], phaseEndsAt: number | null): void {
    if (this.state.room) {
      this.state.room.phase = phase;
      this.state.room.phaseEndsAt = phaseEndsAt;
      this.updateRemainingTime();
      this.notify();
    }
  }

  public handleTimePong(pong: PongPayload): void {
    const syncState = this.state.clockSync.handlePong(pong);
    this.state.clockOffset = syncState.offset;
    this.updateRemainingTime();
    this.notify();
  }

  public updateRemainingTime(): void {
    if (this.state.room && this.state.room.phaseEndsAt) {
      this.state.remainingMs = this.state.clockSync.getRemainingMs(this.state.room.phaseEndsAt);
    } else {
      this.state.remainingMs = 0;
    }
  }

  public addChatMessage(msg: ChatMessage): void {
    const list = this.state.chatMessages[msg.channel] || [];
    this.state.chatMessages[msg.channel] = [...list, msg];
    this.notify();
  }

  public setActiveChatChannel(channel: ChatChannel): void {
    this.state.activeChatChannel = channel;
    this.notify();
  }

  public setPendingAction(action: ActionRequest | null): void {
    this.state.pendingAction = action;
    this.notify();
  }

  public setSeerResult(res: { targetId: string; result: string } | null): void {
    this.state.seerResultModal = res;
    this.notify();
  }

  public resetGame(): void {
    const initial = createInitialGameState();
    Object.assign(this.state, initial);
    this.notify();
  }
}
