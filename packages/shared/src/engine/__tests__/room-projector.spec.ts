import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RoomProjector } from '../room-projector';
import { RoomSettings, RoomState } from '../../index';

describe('RoomProjector Data Masking Unit Tests', () => {
  function createTestRoom(): RoomState {
    return {
      id: 'rm_mask_1',
      code: 'WOLF99',
      hostId: 'wolf_1',
      phase: 'WEREWOLF_TURN',
      stateVersion: 1,
      round: 1,
      phaseStartedAt: Date.now(),
      phaseEndsAt: Date.now() + 30000,
      settings: RoomSettings.parse({
        roleConfig: { WEREWOLF: 2, VILLAGER: 1, SEER: 1 },
      }),
      players: [
        {
          id: 'villager_1',
          seat: 1,
          nickname: 'Dân Làng Ngoan',
          avatarUrl: null,
          isAlive: true,
          connection: 'ONLINE',
          disconnectedAt: null,
          ready: true,
          role: 'VILLAGER',
          team: 'VILLAGE',
          loverId: null,
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
          id: 'wolf_1',
          seat: 2,
          nickname: 'Sói Trùm',
          avatarUrl: null,
          isAlive: true,
          connection: 'ONLINE',
          disconnectedAt: null,
          ready: true,
          role: 'WEREWOLF',
          team: 'WEREWOLF',
          loverId: null,
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
          id: 'wolf_2',
          seat: 3,
          nickname: 'Sói Đệ',
          avatarUrl: null,
          isAlive: true,
          connection: 'ONLINE',
          disconnectedAt: null,
          ready: true,
          role: 'WEREWOLF',
          team: 'WEREWOLF',
          loverId: null,
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
          id: 'seer_1',
          seat: 4,
          nickname: 'Tiên Tri Ẩn',
          avatarUrl: null,
          isAlive: true,
          connection: 'ONLINE',
          disconnectedAt: null,
          ready: true,
          role: 'SEER',
          team: 'VILLAGE',
          loverId: null,
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
        wolfVotes: { wolf_1: 'villager_1' },
        wolfTarget: 'villager_1',
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
      lovers: null,
      pendingTriggers: [],
      afterCheckWin: 'DAY',
      history: [],
      winner: null,
      createdAt: Date.now(),
    };
  }

  it('Anti-Hack: Dân làng KHÔNG THỂ nhìn thấy role của bất kỳ ai khác (kể cả sói hay tiên tri)', () => {
    const room = createTestRoom();
    const villagerView = RoomProjector.projectFor('villager_1', room);

    // Dân làng chỉ thấy role của chính mình
    assert.equal(villagerView.me.role, 'VILLAGER');

    // Các người chơi khác KHÔNG có trường revealedRole
    const otherPlayers = villagerView.players.filter((p) => p.id !== 'villager_1');
    for (const other of otherPlayers) {
      assert.equal(other.revealedRole, undefined, `Player ${other.id} leaked role to Villager!`);
    }

    // Dân làng không có wolfPack
    assert.equal(villagerView.wolfPack, undefined);

    // Kiểm tra cấu trúc players trong payload: tuyệt đối không có role hay revealedRole của người khác
    for (const p of villagerView.players) {
      assert.equal((p as any).role, undefined, `Object player ${p.id} leaked raw role field!`);
      if (p.id !== 'villager_1') {
        assert.equal(p.revealedRole, undefined, `Object player ${p.id} leaked revealedRole!`);
      }
    }
  });

  it('Sói nhìn thấy đồng đội Sói và phiếu bầu bầy sói', () => {
    const room = createTestRoom();
    const wolfView = RoomProjector.projectFor('wolf_1', room);

    assert.equal(wolfView.me.role, 'WEREWOLF');

    // Thấy vai của đồng đội wolf_2
    const fellowWolf = wolfView.players.find((p) => p.id === 'wolf_2');
    assert.equal(fellowWolf?.revealedRole, 'WEREWOLF');

    // Nhưng KHÔNG thấy vai của Tiên tri hay Dân làng
    const seer = wolfView.players.find((p) => p.id === 'seer_1');
    assert.equal(seer?.revealedRole, undefined);

    // Có wolfPack
    assert.ok(wolfView.wolfPack);
    assert.deepEqual(wolfView.wolfPack?.teammates, ['wolf_1', 'wolf_2']);
    assert.deepEqual(wolfView.wolfPack?.votes, { wolf_1: 'villager_1' });
  });

  it('GAME_OVER: Giải mã toàn bộ vai trò của tất cả người chơi', () => {
    const room = createTestRoom();
    room.phase = 'GAME_OVER';
    room.winner = 'VILLAGE';

    const endView = RoomProjector.projectFor('villager_1', room);

    for (const p of endView.players) {
      assert.ok(p.revealedRole !== undefined, `Role for ${p.id} was not revealed on GAME_OVER`);
    }
    assert.equal(endView.winner, 'VILLAGE');
  });
});
