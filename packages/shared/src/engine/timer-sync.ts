/**
 * TimerSync — Quản lý đồng bộ thời gian NTP-style giữa Server và Client,
 * cùng cơ chế quản lý Timer phân tán qua Redis Sorted Set (ZSET).
 */

export interface PingPayload {
  t0: number; // Client epoch timestamp khi bắt đầu gửi ping
}

export interface PongPayload {
  t0: number;
  serverNow: number; // Server epoch timestamp khi nhận ping
}

export interface ClockSyncState {
  offset: number; // serverTime - clientTime
  roundTripTime: number; // ms
  synced: boolean;
}

export class ClockSync {
  private offset = 0;
  private roundTripTime = 0;
  private synced = false;

  /**
   * Tính toán Offset phía Client theo thuật toán NTP đơn giản hóa:
   * RTT = t2 - t0
   * serverEstimated = serverNow + RTT / 2
   * offset = serverEstimated - t2
   */
  public handlePong(pong: PongPayload, t2: number = Date.now()): ClockSyncState {
    const { t0, serverNow } = pong;
    this.roundTripTime = Math.max(0, t2 - t0);
    const estimatedServerTimeAtT2 = serverNow + this.roundTripTime / 2;
    this.offset = Math.round(estimatedServerTimeAtT2 - t2);
    this.synced = true;

    return this.getState();
  }

  public getEstimatedServerTime(clientNow: number = Date.now()): number {
    return clientNow + this.offset;
  }

  /**
   * Tính số mili-giây còn lại đến khi phaseEndsAt kết thúc.
   * Đảm bảo không âm và đồng bộ chính xác với đồng hồ Server.
   */
  public getRemainingMs(phaseEndsAt: number | null, clientNow: number = Date.now()): number {
    if (!phaseEndsAt) return 0;
    const currentServerTime = this.getEstimatedServerTime(clientNow);
    return Math.max(0, phaseEndsAt - currentServerTime);
  }

  public getState(): ClockSyncState {
    return {
      offset: this.offset,
      roundTripTime: this.roundTripTime,
      synced: this.synced,
    };
  }
}

/**
 * Cấu trúc Payload lưu trong Redis ZSET để quản lý timer chuyển pha phân tán:
 * Key: `ww:timers`
 * Score: `phaseEndsAt` (Epoch ms)
 * Member: `${roomId}:${stateVersion}:${targetPhase}`
 */
export interface DistributedTimerMember {
  roomId: string;
  stateVersion: number;
  expectedPhase: string;
}

export class TimerSchedulerHelper {
  public static serializeMember(member: DistributedTimerMember): string {
    return `${member.roomId}:${member.stateVersion}:${member.expectedPhase}`;
  }

  public static deserializeMember(raw: string): DistributedTimerMember | null {
    const parts = raw.split(':');
    if (parts.length < 3) return null;
    return {
      roomId: parts[0],
      stateVersion: parseInt(parts[1], 10),
      expectedPhase: parts.slice(2).join(':'),
    };
  }
}
