/**
 * @werewolf/shared — Hợp đồng dữ liệu dùng chung giữa Server và Client.
 * Mọi payload Socket đều được validate bằng Zod ở cả 2 đầu.
 */
import { z } from 'zod';
export * from './types/roles';
import { DBRoleData } from './types/roles';

/* ============================== ENUMS ============================== */

export const Role = z.enum([
  // 1. Phe Dân Làng (22 vai trò)
  'VILLAGER',
  'SEER',
  'APPRENTICE_SEER',
  'AURA_SEER',
  'BODYGUARD',
  'CUPID',
  'DISEASED',
  'GHOST',
  'HUNTER',
  'IDIOT',
  'LYCAN',
  'MASON',
  'MAYOR',
  'OLD_HAG',
  'PACIFIST',
  'PI',
  'PRIEST',
  'PRINCE',
  'SPELLCASTER',
  'TOUGH_GUY',
  'TROUBLE_MAKER',
  'WITCH',
  // 2. Phe Ma Sói (10 vai trò)
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
  // 3. Phe Đổi Phe & Biệt Lập (8 vai trò)
  'CURSED',
  'DOPPELGANGER',
  'DRUNK',
  'CULT_LEADER',
  'HOODLUM',
  'TANNER',
  'VAMPIRE',
  'VIRGINIA_WOOLF',
]);
export type Role = z.infer<typeof Role>;

export const Team = z.enum([
  'WEREWOLF',
  'VILLAGE',
  'LOVERS',
  'VAMPIRE',
  'TANNER',
  'CULT_LEADER',
  'HOODLUM',
  'LONE_WOLF',
]);
export type Team = z.infer<typeof Team>;

/** Phe gốc của vai trò (LOVERS chỉ xuất hiện khi Cupid ghép đôi khác phe). */
export const ROLE_TEAM: Record<Role, Exclude<Team, 'LOVERS'>> = {
  // 1. Dân làng
  VILLAGER: 'VILLAGE',
  SEER: 'VILLAGE',
  APPRENTICE_SEER: 'VILLAGE',
  AURA_SEER: 'VILLAGE',
  BODYGUARD: 'VILLAGE',
  CUPID: 'VILLAGE',
  DISEASED: 'VILLAGE',
  GHOST: 'VILLAGE',
  HUNTER: 'VILLAGE',
  IDIOT: 'VILLAGE',
  LYCAN: 'VILLAGE',
  MASON: 'VILLAGE',
  MAYOR: 'VILLAGE',
  OLD_HAG: 'VILLAGE',
  PACIFIST: 'VILLAGE',
  PI: 'VILLAGE',
  PRIEST: 'VILLAGE',
  PRINCE: 'VILLAGE',
  SPELLCASTER: 'VILLAGE',
  TOUGH_GUY: 'VILLAGE',
  TROUBLE_MAKER: 'VILLAGE',
  WITCH: 'VILLAGE',
  // 2. Ma Sói
  WEREWOLF: 'WEREWOLF',
  MINION: 'WEREWOLF',
  SORCERESS: 'WEREWOLF',
  LONE_WOLF: 'WEREWOLF',
  WOLF_CUB: 'WEREWOLF',
  BIG_BAD_WOLF: 'WEREWOLF',
  DIRE_WOLF: 'WEREWOLF',
  FRUIT_BRUTE: 'WEREWOLF',
  FRUIT_WOLF: 'WEREWOLF',
  FANG_FACE: 'WEREWOLF',
  WOLVERINE: 'WEREWOLF',
  // 3. Đổi phe & Biệt lập
  CURSED: 'VILLAGE',
  DOPPELGANGER: 'VILLAGE',
  DRUNK: 'VILLAGE',
  CULT_LEADER: 'CULT_LEADER',
  HOODLUM: 'HOODLUM',
  TANNER: 'TANNER',
  VAMPIRE: 'VAMPIRE',
  VIRGINIA_WOOLF: 'VILLAGE',
};

/** Kết quả khi Tiên tri soi — tách khỏi phe để hỗ trợ Lycan/Minion/Cursed ở V1.1. */
export const SeerAppearance = z.enum(['WEREWOLF', 'NOT_WEREWOLF']);
export type SeerAppearance = z.infer<typeof SeerAppearance>;

export const Phase = z.enum([
  'LOBBY',
  'ASSIGN_ROLES',
  'READING_CARDS',
  'NIGHT_START',
  'NIGHT_FALL',
  // Đêm đầu
  'DOPPELGANGER_TURN',
  'CUPID_TURN',
  'LOVERS_TURN',
  'VIRGINIA_WOOLF_TURN',
  'HOODLUM_TURN',
  'DIRE_WOLF_TURN',
  'MASON_TURN',
  // Các đêm tiếp theo
  'BODYGUARD_TURN',
  'NIGHT_BODYGUARD',
  'PRIEST_TURN',
  'SPELLCASTER_TURN',
  'OLD_HAG_TURN',
  'WEREWOLF_TURN',
  'NIGHT_WEREWOLF',
  'WITCH_TURN',
  'SEER_TURN',
  'NIGHT_SEER',
  'SORCERESS_TURN',
  'PI_TURN',
  'CULT_LEADER_TURN',
  'VAMPIRE_TURN',
  'DRUNK_TURN',
  // Giải quyết đêm & Ban ngày
  'NIGHT_RESOLVE',
  'DAY_ANNOUNCEMENT',
  'DAY_ANNOUNCE',
  'DEATH_TRIGGERS',
  'CHECK_WIN',
  'CHECK_WIN_CONDITION',
  'DAY_DISCUSSION',
  'DAY_VOTING',
  'DAY_REVOTE',
  'VOTE_RESOLVE',
  'DAY_DEFENSE',
  'DAY_JUDGMENT',
  'DAY_EXECUTION',
  'GAME_OVER',
]);
export type Phase = z.infer<typeof Phase>;

export const FIRST_NIGHT_TURNS = ['CUPID_TURN', 'LOVERS_TURN'] as const;
export const NIGHT_TURNS = ['BODYGUARD_TURN', 'WEREWOLF_TURN', 'WITCH_TURN', 'SEER_TURN'] as const;

export const ConnectionStatus = z.enum(['ONLINE', 'DISCONNECTED', 'LEFT']);
export const DeathCause = z.enum(['WOLF', 'POISON', 'EXECUTION', 'HUNTER', 'HEARTBREAK', 'LEFT']);
export type DeathCause = z.infer<typeof DeathCause>;
export const ChatChannel = z.enum(['public', 'wolves', 'lovers', 'dead']);
export type ChatChannel = z.infer<typeof ChatChannel>;
export const Verdict = z.enum(['GUILTY', 'INNOCENT']);
export const SKIP = 'SKIP' as const;

export const ErrorCode = z.enum([
  'UNAUTHORIZED',
  'NOT_ALLOWED', // dùng chung cho mọi trường hợp sai vai/sai phase → chống dò vai
  'INVALID_PAYLOAD',
  'ROOM_NOT_FOUND',
  'ROOM_FULL',
  'GAME_IN_PROGRESS',
  'RATE_LIMITED',
  'CONFLICT',
]);
export type ErrorCode = z.infer<typeof ErrorCode>;

/* ============================== SETTINGS ============================== */

export const RoleConfig = z.record(Role, z.number().int().min(0).max(18));

export const RoomSettings = z.object({
  minPlayers: z.number().int().min(4).default(4),
  maxPlayers: z.number().int().min(4).max(18).default(12),
  roleConfig: RoleConfig,
  seerRevealMode: z.enum(['WOLF_OR_NOT', 'EXACT_ROLE']).default('WOLF_OR_NOT'),
  revealRoleOnDeath: z.boolean().default(false),
  deadCanSeeRoles: z.boolean().default(false),
  wolfTieBreak: z.enum(['RANDOM', 'NO_KILL']).default('RANDOM'),
  bodyguardCanSelfProtect: z.boolean().default(true),
  witchInfoMode: z.enum(['AFTER_PROTECTION', 'RAW_TARGET']).default('AFTER_PROTECTION'),
  witchCanSelfSave: z.enum(['NEVER', 'ALWAYS', 'FIRST_NIGHT_ONLY']).default('FIRST_NIGHT_ONLY'),
  hunterTriggers: z.array(DeathCause).default(['WOLF', 'EXECUTION']),
  cupidTimeoutMode: z.enum(['RANDOM', 'NONE']).default('RANDOM'),
  hideVoteTargetsUntilResolved: z.boolean().default(false),
  durations: z.object({
    assignRoles: z.number().int().default(8),
    readingCards: z.number().int().default(20),
    nightStart: z.number().int().default(3),
    nightFall: z.number().int().default(3),
    cupid: z.number().int().default(20),
    lovers: z.number().int().default(8),
    bodyguard: z.number().int().default(15),
    werewolf: z.number().int().default(20),
    witch: z.number().int().default(20),
    seer: z.number().int().default(15),
    nightResolve: z.number().int().default(2),
    announcement: z.number().int().default(5),
    dayAnnounce: z.number().int().default(5),
    deathTriggers: z.number().int().default(20),
    discussion: z.number().int().min(15).max(600).default(45),
    voting: z.number().int().default(20),
    revote: z.number().int().default(20),
    defense: z.number().int().default(30),
    judgment: z.number().int().default(15),
    execution: z.number().int().default(8),
    reconnectGrace: z.number().int().default(60),
  }).default({}),
});
export type RoomSettings = z.infer<typeof RoomSettings>;

/* ============================== SERVER-ONLY STATE ============================== */
/* ⚠️ Các type dưới đây CHỨA BÍ MẬT — chỉ dùng trong server, không bao giờ emit trực tiếp. */

export interface RoleState {
  lastProtectedId: string | null; // Bodyguard
  hasHealPotion: boolean; // Witch
  hasPoisonPotion: boolean; // Witch
  seerResults: { round: number; targetId: string; result: SeerAppearance | Role }[];
  hasShot: boolean; // Hunter
}

export interface PlayerState {
  id: string;
  seat: number;
  nickname: string;
  avatarUrl: string | null;
  isAlive: boolean;
  connection: z.infer<typeof ConnectionStatus>;
  disconnectedAt: number | null;
  ready: boolean;
  role: Role | null;
  team: Team | null;
  roleState: RoleState;
  loverId: string | null;
  deathInfo: { round: number; cause: DeathCause } | null;
}

export type PendingTrigger = { kind: 'HUNTER_SHOT'; playerId: string };

export interface NightState {
  bodyguardTarget: string | null;
  wolfVotes: Record<string, string>;
  wolfTarget: string | null;
  witchSave: boolean;
  witchPoisonTarget: string | null;
  seerTarget: string | null;
}

export interface DayState {
  votes: Record<string, string>; // voterId -> targetId | 'SKIP'
  revoteCandidates: string[] | null;
  revoteCount: number;
  readyToVote: string[];
  accusedId: string | null;
  judgment: Record<string, z.infer<typeof Verdict>>;
}

export type HistoryEntry =
  | { round: number; type: 'NIGHT_RESULT'; night: NightState; deaths: { playerId: string; cause: string }[] }
  | { round: number; type: 'EXECUTION'; executedId: string | null; votes: Record<string, string> };

export interface RoomState {
  id: string;
  code: string;
  hostId: string;
  phase: Phase;
  stateVersion: number;
  round: number;
  phaseStartedAt: number;
  phaseEndsAt: number | null;
  settings: RoomSettings;
  players: PlayerState[];
  night: NightState;
  day: DayState;
  lovers: [string, string] | null;
  pendingTriggers: PendingTrigger[];
  afterCheckWin: 'DAY' | 'NIGHT';
  history: HistoryEntry[];
  winner: Team | null;
  createdAt: number;
}

/* ============================== CLIENT VIEWS (đã mask) ============================== */

export const PublicPlayerView = z
  .object({
    id: z.string(),
    seat: z.number(),
    nickname: z.string(),
    avatarUrl: z.string().nullable(),
    isHost: z.boolean(),
    isAlive: z.boolean(),
    ready: z.boolean(),
    connection: ConnectionStatus,
    revealedRole: Role.optional(),
  })
  .strict();
export type PublicPlayerView = z.infer<typeof PublicPlayerView>;

export const ActionKind = z.enum([
  'CUPID_PAIR',
  'BODYGUARD_PROTECT',
  'WOLF_VOTE',
  'WITCH_ACT',
  'SEER_INSPECT',
  'HUNTER_SHOOT',
  'DAY_VOTE',
  'DAY_JUDGE',
]);
export type ActionKind = z.infer<typeof ActionKind>;

export const ActionRequest = z
  .object({
    kind: ActionKind,
    candidates: z.array(z.string()),
    witch: z
      .object({ wolfTargetId: z.string().nullable(), hasHeal: z.boolean(), hasPoison: z.boolean(), canSelfSave: z.boolean() })
      .strict()
      .optional(),
    submitted: z.boolean(),
  })
  .strict();
export type ActionRequest = z.infer<typeof ActionRequest>;

export const DBRoleDataSchema = z
  .object({
    roleId: z.string(),
    roleName: z.string(),
    faction: z.enum(['VILLAGER', 'WEREWOLF', 'SOLO', 'THIRD_PARTY']),
    description: z.string(),
    actionTime: z.string(),
    avatarUrl: z.string().optional(),
  })
  .strict();

export const SelfView = z
  .object({
    id: z.string(),
    role: Role.nullable(),
    team: Team.nullable(),
    roleData: DBRoleDataSchema.optional(),
    roleState: z
      .object({
        lastProtectedId: z.string().nullable().optional(),
        hasHealPotion: z.boolean().optional(),
        hasPoisonPotion: z.boolean().optional(),
        seerResults: z.array(z.object({ round: z.number(), targetId: z.string(), result: z.string() })).optional(),
        hasShot: z.boolean().optional(),
      })
      .strict(),
    lover: z.object({ partnerId: z.string(), partnerNickname: z.string(), partnerRole: Role.optional() }).strict().optional(),
  })
  .strict();

export const ClientRoomView = z
  .object({
    id: z.string(),
    code: z.string(),
    hostId: z.string(),
    phase: Phase,
    round: z.number(),
    stateVersion: z.number(),
    phaseEndsAt: z.number().nullable(),
    serverNow: z.number(),
    settings: RoomSettings,
    players: z.array(PublicPlayerView),
    me: SelfView,
    pendingAction: ActionRequest.optional(),
    wolfPack: z.object({ teammates: z.array(z.string()), votes: z.record(z.string()) }).strict().optional(),
    day: z
      .object({
        tally: z.record(z.number()),
        voted: z.array(z.string()),
        votes: z.record(z.string()).optional(),
        revoteCandidates: z.array(z.string()).nullable(),
        accusedId: z.string().nullable().optional(),
        judgment: z.object({ guilty: z.number(), innocent: z.number() }).strict().optional(),
      })
      .strict()
      .optional(),
    eliminatedTonight: z.array(z.string()).optional(),
    winner: Team.nullable().optional(),
  })
  .strict();
export type ClientRoomView = z.infer<typeof ClientRoomView>;

/* ============================== SOCKET EVENTS ============================== */

export type Ack<T = unknown> = { ok: true; data?: T } | { ok: false; error: { code: ErrorCode; message: string } };

export const C2S = {
  'room:create': z.object({ settings: RoomSettings.partial().optional() }),
  'room:join': z.object({ code: z.string().length(6) }),
  'room:leave': z.object({}),
  'room:kick': z.object({ playerId: z.string() }),
  'room:updateSettings': z.object({ settings: RoomSettings.partial() }),
  'room:ready': z.object({ ready: z.boolean() }),
  'game:start': z.object({}),
  'game:rematch': z.object({}),
  'card:confirmRead': z.object({}).optional(),
  'night:cupidPair': z.object({ firstId: z.string(), secondId: z.string() }),
  'night:bodyguardProtect': z.object({ targetId: z.string() }),
  'night:wolfVote': z.object({ targetId: z.string() }), // player id hoặc 'SKIP'
  'night:witchAct': z.object({ save: z.boolean(), poisonTargetId: z.string().nullable() }),
  'night:seerInspect': z.object({ targetId: z.string() }),
  'trigger:hunterShoot': z.object({ targetId: z.string().nullable() }),
  'day:readyToVote': z.object({}),
  'day:vote': z.object({ targetId: z.string() }), // id hoặc 'SKIP'
  'day:judge': z.object({ verdict: Verdict }),
  'chat:send': z.object({ channel: ChatChannel, text: z.string().trim().min(1).max(300) }),
  'sync:request': z.object({}),
  'time:ping': z.object({ t0: z.number() }),
} as const;
export type C2SEvent = keyof typeof C2S;

export interface ServerPacket<T> {
  v: number;
  ts: number;
  data: T;
}

export interface S2CEvents {
  'state:snapshot': (p: ServerPacket<ClientRoomView>) => void;
  'phase:changed': (p: ServerPacket<{ phase: Phase; round: number; phaseEndsAt: number | null }>) => void;
  'PHASE_CHANGE': (p: { phase: Phase; round: number; phaseEndsAt: number | null; durationMs?: number }) => void;
  'room:playersUpdated': (p: ServerPacket<PublicPlayerView[]>) => void;
  'role:assigned': (p: ServerPacket<{ role: Role; team: Team; roleData?: DBRoleData; teammates?: { id: string; nickname: string }[] }>) => void;
  'ASSIGN_ROLE': (p: { role: DBRoleData; team?: Team; teammates?: { id: string; nickname: string }[] }) => void;
  'lovers:paired': (p: ServerPacket<{ partnerId: string; partnerNickname: string; partnerRole: Role }>) => void;
  'action:request': (p: ServerPacket<ActionRequest>) => void;
  'YOUR_TURN_ACTION': (p: ServerPacket<ActionRequest>) => void;
  'NIGHT_FALL': (p: ServerPacket<{ round: number; duration: number }>) => void;
  'action:accepted': (p: ServerPacket<{ kind: ActionKind }>) => void;
  'wolf:votesUpdated': (p: ServerPacket<{ votes: Record<string, string> }>) => void;
  'seer:result': (p: ServerPacket<{ targetId: string; result: SeerAppearance | Role }>) => void;
  'night:result': (p: ServerPacket<{ round: number; deaths: { playerId: string; role?: Role }[] }>) => void;
  'trigger:resolved': (p: ServerPacket<{ kind: 'HUNTER_SHOT' | 'HEARTBREAK'; victimId: string | null }>) => void;
  'day:votesUpdated': (p: ServerPacket<{ tally: Record<string, number>; voted: string[]; votes?: Record<string, string> }>) => void;
  'day:voteResult': (
    p: ServerPacket<{ accusedId: string | null; reason: 'MAJORITY' | 'TIE' | 'SKIP' | 'REVOTE'; tally: Record<string, number>; role?: Role }>,
  ) => void;
  'day:judgmentResult': (
    p: ServerPacket<{ accusedId: string; guilty: number; innocent: number; executed: boolean }>,
  ) => void;
  'chat:message': (p: ServerPacket<{ id: string; channel: z.infer<typeof ChatChannel>; senderId: string; text: string; ts: number }>) => void;
  'game:over': (
    p: ServerPacket<{
      winner: Team;
      players: { id: string; nickname: string; role: Role; team: Team; isAlive: boolean; deathInfo: PlayerState['deathInfo'] }[];
      history: HistoryEntry[];
    }>,
  ) => void;
  'time:pong': (p: { t0: number; serverNow: number }) => void;
  error: (p: { code: ErrorCode; message: string }) => void;
}

/* ============================== CORE ENGINE EXPORTS ============================== */
export * from './engine/night-resolver';
export * from './engine/win-checker';
export * from './engine/timer-sync';
export * from './engine/disconnect-handler';
export * from './engine/room-projector';
export * from './engine/role-registry';
