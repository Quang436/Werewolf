import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NightResolver } from '../night-resolver';
import { WinChecker } from '../win-checker';
import { PlayerState, RoomSettings } from '../../index';

function createMockPlayer(id: string, role: any, team: any, overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id,
    seat: 1,
    nickname: `Player_${id}`,
    avatarUrl: null,
    isAlive: true,
    connection: 'ONLINE',
    disconnectedAt: null,
    ready: true,
    role,
    team,
    loverId: null,
    deathInfo: null,
    roleState: {
      lastProtectedId: null,
      hasHealPotion: true,
      hasPoisonPotion: true,
      seerResults: [],
      hasShot: false,
    },
    ...overrides,
  };
}

const mockSettings = RoomSettings.parse({
  roleConfig: {
    WEREWOLF: 2,
    SEER: 1,
    BODYGUARD: 1,
    WITCH: 1,
    HUNTER: 1,
    CUPID: 1,
    VILLAGER: 3,
  },
});

describe('NightResolver Unit Tests', () => {
  it('Scenario 1: Sói cắn dân làng thường (không được bảo vệ, không được cứu) -> Dân làng chết', () => {
    const p1 = createMockPlayer('p1', 'WEREWOLF', 'WEREWOLF');
    const p2 = createMockPlayer('p2', 'WEREWOLF', 'WEREWOLF');
    const victim = createMockPlayer('victim', 'VILLAGER', 'VILLAGE');

    const result = NightResolver.resolve({
      round: 1,
      players: [p1, p2, victim],
      night: {
        bodyguardTarget: null,
        wolfVotes: { p1: 'victim', p2: 'victim' },
        wolfTarget: 'victim',
        witchSave: false,
        witchPoisonTarget: null,
        seerTarget: null,
      },
      settings: mockSettings,
      lovers: null,
    });

    assert.equal(result.deaths.length, 1);
    assert.equal(result.deaths[0].playerId, 'victim');
    assert.equal(result.deaths[0].cause, 'WOLF');
    assert.equal(result.resolutionLog.guarded, false);
    assert.equal(result.resolutionLog.witchSaved, false);
  });

  it('Scenario 2: Sói cắn nhưng Bảo Vệ chọn đúng người -> Đòn cắn bị chặn (Đêm bình yên)', () => {
    const wolf = createMockPlayer('wolf', 'WEREWOLF', 'WEREWOLF');
    const bg = createMockPlayer('bg', 'BODYGUARD', 'VILLAGE');
    const target = createMockPlayer('target', 'VILLAGER', 'VILLAGE');

    const result = NightResolver.resolve({
      round: 1,
      players: [wolf, bg, target],
      night: {
        bodyguardTarget: 'target',
        wolfVotes: { wolf: 'target' },
        wolfTarget: 'target',
        witchSave: false,
        witchPoisonTarget: null,
        seerTarget: null,
      },
      settings: mockSettings,
      lovers: null,
    });

    assert.equal(result.deaths.length, 0);
    assert.equal(result.resolutionLog.guarded, true);
  });

  it('Scenario 3: Sói cắn nhưng Phù Thủy dùng bình cứu -> Nạn nhân sống sót', () => {
    const wolf = createMockPlayer('wolf', 'WEREWOLF', 'WEREWOLF');
    const witch = createMockPlayer('witch', 'WITCH', 'VILLAGE');
    const victim = createMockPlayer('victim', 'VILLAGER', 'VILLAGE');

    const result = NightResolver.resolve({
      round: 1,
      players: [wolf, witch, victim],
      night: {
        bodyguardTarget: null,
        wolfVotes: { wolf: 'victim' },
        wolfTarget: 'victim',
        witchSave: true,
        witchPoisonTarget: null,
        seerTarget: null,
      },
      settings: mockSettings,
      lovers: null,
    });

    assert.equal(result.deaths.length, 0);
    assert.equal(result.resolutionLog.witchSaved, true);
  });

  it('Scenario 4: Phù Thủy quăng bình độc vào người được Bảo Vệ che chắn -> Độc xuyên giáp, nạn nhân chết!', () => {
    const bg = createMockPlayer('bg', 'BODYGUARD', 'VILLAGE');
    const witch = createMockPlayer('witch', 'WITCH', 'VILLAGE');
    const target = createMockPlayer('target', 'VILLAGER', 'VILLAGE');

    const result = NightResolver.resolve({
      round: 1,
      players: [bg, witch, target],
      night: {
        bodyguardTarget: 'target',
        wolfVotes: {},
        wolfTarget: null,
        witchSave: false,
        witchPoisonTarget: 'target',
        seerTarget: null,
      },
      settings: mockSettings,
      lovers: null,
    });

    assert.equal(result.deaths.length, 1);
    assert.equal(result.deaths[0].playerId, 'target');
    assert.equal(result.deaths[0].cause, 'POISON');
  });

  it('Scenario 5: Chuỗi chết lây lan (Cupid Lovers): Người yêu A chết vì Sói -> Người yêu B chết theo vì HEARTBREAK', () => {
    const wolf = createMockPlayer('wolf', 'WEREWOLF', 'WEREWOLF');
    const loverA = createMockPlayer('loverA', 'VILLAGER', 'VILLAGE');
    const loverB = createMockPlayer('loverB', 'VILLAGER', 'VILLAGE');

    const result = NightResolver.resolve({
      round: 1,
      players: [wolf, loverA, loverB],
      night: {
        bodyguardTarget: null,
        wolfVotes: { wolf: 'loverA' },
        wolfTarget: 'loverA',
        witchSave: false,
        witchPoisonTarget: null,
        seerTarget: null,
      },
      settings: mockSettings,
      lovers: ['loverA', 'loverB'],
    });

    assert.equal(result.deaths.length, 2);
    const deadIds = result.deaths.map((d) => d.playerId);
    assert.ok(deadIds.includes('loverA'));
    assert.ok(deadIds.includes('loverB'));

    const heartbreakDeath = result.deaths.find((d) => d.cause === 'HEARTBREAK');
    assert.ok(heartbreakDeath);
    assert.equal(heartbreakDeath?.playerId, 'loverB');
  });

  it('Scenario 6: Thợ Săn (Hunter) chết vì Sói cắn -> Kích hoạt pending trigger HUNTER_SHOT', () => {
    const wolf = createMockPlayer('wolf', 'WEREWOLF', 'WEREWOLF');
    const hunter = createMockPlayer('hunter', 'HUNTER', 'VILLAGE');

    const result = NightResolver.resolve({
      round: 1,
      players: [wolf, hunter],
      night: {
        bodyguardTarget: null,
        wolfVotes: { wolf: 'hunter' },
        wolfTarget: 'hunter',
        witchSave: false,
        witchPoisonTarget: null,
        seerTarget: null,
      },
      settings: mockSettings,
      lovers: null,
    });

    assert.equal(result.deaths.length, 1);
    assert.equal(result.pendingTriggers.length, 1);
    assert.equal(result.pendingTriggers[0].kind, 'HUNTER_SHOT');
    assert.equal(result.pendingTriggers[0].playerId, 'hunter');
  });
});

describe('WinChecker Unit Tests', () => {
  it('Tất cả Sói bị tiêu diệt -> Dân Làng thắng', () => {
    const v1 = createMockPlayer('v1', 'VILLAGER', 'VILLAGE');
    const v2 = createMockPlayer('v2', 'SEER', 'VILLAGE');
    const deadWolf = createMockPlayer('w1', 'WEREWOLF', 'WEREWOLF', { isAlive: false });

    const win = WinChecker.check({
      players: [v1, v2, deadWolf],
      lovers: null,
    });

    assert.equal(win.winner, 'VILLAGE');
  });

  it('Số lượng Sói >= Số lượng Dân làng còn sống -> Sói thắng', () => {
    const w1 = createMockPlayer('w1', 'WEREWOLF', 'WEREWOLF');
    const v1 = createMockPlayer('v1', 'VILLAGER', 'VILLAGE');

    const win = WinChecker.check({
      players: [w1, v1],
      lovers: null,
    });

    assert.equal(win.winner, 'WEREWOLF');
  });

  it('Cặp đôi khác phe (1 Sói, 1 Dân) sống sót cuối cùng -> Cặp Đôi (LOVERS) thắng', () => {
    const loverWolf = createMockPlayer('loverWolf', 'WEREWOLF', 'WEREWOLF');
    const loverVillager = createMockPlayer('loverVillager', 'VILLAGER', 'VILLAGE');
    const deadVillager = createMockPlayer('v_dead', 'VILLAGER', 'VILLAGE', { isAlive: false });

    const win = WinChecker.check({
      players: [loverWolf, loverVillager, deadVillager],
      lovers: ['loverWolf', 'loverVillager'],
    });

    assert.equal(win.winner, 'LOVERS');
  });
});
