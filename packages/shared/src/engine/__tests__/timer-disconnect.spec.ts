import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ClockSync, TimerSchedulerHelper } from '../timer-sync';
import { DisconnectHandler } from '../disconnect-handler';
import { RoomSettings, RoomState } from '../../index';

describe('ClockSync & TimerScheduler Unit Tests', () => {
  it('NTP ClockSync: tính toán chính xác offset và remaining ms', () => {
    const clock = new ClockSync();
    const t0 = 1000;
    const serverNow = 1050; // Server đi trước 50ms
    const t2 = 1020; // RTT = 20ms

    // estimatedServerTime at t2 = 1050 + 10 = 1060 -> offset = 1060 - 1020 = +40ms
    const state = clock.handlePong({ t0, serverNow }, t2);

    assert.equal(state.synced, true);
    assert.equal(state.roundTripTime, 20);
    assert.equal(state.offset, 40);

    // Kiểm tra getRemainingMs
    const phaseEndsAt = 1200;
    // clientNow = 1100 -> serverEstimated = 1140 -> remaining = 1200 - 1140 = 60ms
    const remaining = clock.getRemainingMs(phaseEndsAt, 1100);
    assert.equal(remaining, 60);

    // Khi quá hạn, remaining không âm mà trả về 0
    assert.equal(clock.getRemainingMs(phaseEndsAt, 1200), 0);
  });

  it('TimerSchedulerHelper: serialize và deserialize member chính xác', () => {
    const serialized = TimerSchedulerHelper.serializeMember({
      roomId: 'room_123',
      stateVersion: 5,
      expectedPhase: 'DAY_VOTING',
    });

    assert.equal(serialized, 'room_123:5:DAY_VOTING');

    const deserialized = TimerSchedulerHelper.deserializeMember(serialized);
    assert.deepEqual(deserialized, {
      roomId: 'room_123',
      stateVersion: 5,
      expectedPhase: 'DAY_VOTING',
    });
  });
});

describe('DisconnectHandler Unit Tests', () => {
  function createTestRoom(): RoomState {
    return {
      id: 'rm_1',
      code: 'ABCDEF',
      hostId: 'p1',
      phase: 'DAY_VOTING',
      stateVersion: 1,
      round: 1,
      phaseStartedAt: Date.now(),
      phaseEndsAt: Date.now() + 30000,
      settings: RoomSettings.parse({
        roleConfig: { WEREWOLF: 1, VILLAGER: 2 },
      }),
      players: [
        {
          id: 'p1',
          seat: 1,
          nickname: 'P1',
          avatarUrl: null,
          isAlive: true,
          connection: 'ONLINE',
          disconnectedAt: null,
          ready: true,
          role: 'WEREWOLF',
          team: 'WEREWOLF',
          loverId: 'p2',
          deathInfo: null,
          roleState: {
            lastProtectedId: null,
            hasHealPotion: false,
            hasPoisonPotion: false,
            seerResults: [],
            hasShot: false,
          },
        },
        {
          id: 'p2',
          seat: 2,
          nickname: 'P2',
          avatarUrl: null,
          isAlive: true,
          connection: 'ONLINE',
          disconnectedAt: null,
          ready: true,
          role: 'VILLAGER',
          team: 'VILLAGE',
          loverId: 'p1',
          deathInfo: null,
          roleState: {
            lastProtectedId: null,
            hasHealPotion: false,
            hasPoisonPotion: false,
            seerResults: [],
            hasShot: false,
          },
        },
      ],
      night: {
        bodyguardTarget: null,
        wolfVotes: {},
        wolfTarget: null,
        witchSave: false,
        witchPoisonTarget: null,
        seerTarget: null,
      },
      day: {
        votes: {},
        revoteCandidates: null,
        revoteCount: 0,
        readyToVote: [],
        accusedId: null,
        judgment: {},
      },
      lovers: ['p1', 'p2'],
      pendingTriggers: [],
      afterCheckWin: 'DAY',
      history: [],
      winner: null,
      createdAt: Date.now(),
    };
  }

  it('Player rớt mạng -> connection: DISCONNECTED; Reconnect -> connection: ONLINE', () => {
    const room = createTestRoom();

    DisconnectHandler.markDisconnected(room, 'p1');
    assert.equal(room.players[0].connection, 'DISCONNECTED');
    assert.ok(room.players[0].disconnectedAt !== null);

    DisconnectHandler.markReconnected(room, 'p1');
    assert.equal(room.players[0].connection, 'ONLINE');
    assert.equal(room.players[0].disconnectedAt, null);
  });

  it('Hết Grace Period -> connection: LEFT, người chơi chết và người yêu chết chùm vì thất tình', () => {
    const room = createTestRoom();

    DisconnectHandler.markDisconnected(room, 'p1');
    const result = DisconnectHandler.handleGracePeriodExpired(room, 'p1');

    assert.ok(result);
    assert.equal(result.player.connection, 'LEFT');
    assert.equal(result.player.isAlive, false);
    assert.equal(result.player.deathInfo?.cause, 'LEFT');

    // Nguời yêu P2 cũng bị lây chết do HEARTBREAK
    assert.equal(room.players[1].isAlive, false);
    assert.equal(room.players[1].deathInfo?.cause, 'HEARTBREAK');
    assert.deepEqual(result.cascadeDeaths, ['p1', 'p2']);
  });

  it('Fallback timeout: Tự động vote SKIP khi hết giờ ban ngày', () => {
    const room = createTestRoom();
    const fallback = DisconnectHandler.resolveTimeoutAction(room, 'p1', 'DAY_VOTING');

    assert.equal(fallback.actionType, 'DAY_VOTE');
    assert.deepEqual(fallback.payload, { targetId: 'SKIP' });
  });

  it('Fallback timeout: Phù thủy hết giờ ban đêm -> không lãng phí bình thuốc', () => {
    const room = createTestRoom();
    const fallback = DisconnectHandler.resolveTimeoutAction(room, 'p1', 'WITCH_TURN');

    assert.equal(fallback.actionType, 'WITCH_ACT');
    assert.deepEqual(fallback.payload, { save: false, poisonTargetId: null });
  });
});
