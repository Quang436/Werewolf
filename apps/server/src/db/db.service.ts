/**
 * Database Service — Tích hợp Prisma Client với PostgreSQL.
 * Tự động dự phòng sang In-Memory Store nếu môi trường local chưa bật PostgreSQL,
 * giúp hệ thống luôn hoạt động ổn định và kiểm thử liền mạch.
 */

import { PrismaClient } from '@prisma/client';

export interface UserRecord {
  id: string;
  email?: string | null;
  username: string;
  passwordHash?: string | null;
  nickname: string;
  avatarUrl?: string | null;
  bio?: string | null;
  elo: number;
  level: number;
  exp: number;
  rankTitle: string;
  reputation: number;
  silverCoins: number;
  goldGems: number;
  bloodCrystals: number;
  favoriteRoles?: string[] | null;
  gamesPlayed: number;
  totalWins: number;
  totalLosses: number;
  wolfWins: number;
  villageWins: number;
  loversWins: number;
  thirdPartyWins: number;
  survivalRate: number;
  winStreak: number;
  bestWinStreak: number;
  createdAt: Date;
  updatedAt: Date;
}

export class DatabaseService {
  private static instance: DatabaseService;
  public prisma: PrismaClient | null = null;
  public isConnectedToPostgres = false;

  // In-memory fallback cache
  private memoryUsers = new Map<string, UserRecord>();
  private memoryMatches: any[] = [];

  private constructor() {
    this.initDemoUsers();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private initDemoUsers() {
    const demoUser: UserRecord = {
      id: 'usr_plague_doc_01',
      username: 'bacsiochualang',
      email: 'doctor@werewolf.tavern',
      nickname: 'Bác Sĩ Dịch Hạch',
      avatarUrl: '/assets/plague_doctor.png',
      bio: 'Bậc thầy thẩm vấn Liar\'s Bar. Đừng nhìn thẳng vào mặt nạ.',
      elo: 1680,
      level: 42,
      exp: 8450,
      rankTitle: 'Thợ Săn Huyền Thoại',
      reputation: 99,
      silverCoins: 24500,
      goldGems: 850,
      bloodCrystals: 120,
      favoriteRoles: ['SEER', 'BODYGUARD', 'WEREWOLF'],
      gamesPlayed: 142,
      totalWins: 98,
      totalLosses: 44,
      wolfWins: 38,
      villageWins: 52,
      loversWins: 8,
      thirdPartyWins: 0,
      survivalRate: 69.0,
      winStreak: 5,
      bestWinStreak: 12,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.memoryUsers.set(demoUser.id, demoUser);
    this.memoryUsers.set(demoUser.username, demoUser);
  }

  public async connect(): Promise<void> {
    if (process.env.DATABASE_URL) {
      try {
        this.prisma = new PrismaClient();
        await this.prisma.$connect();
        this.isConnectedToPostgres = true;
        console.log('✅ Connected to PostgreSQL via Prisma successfully.');
      } catch (err: any) {
        console.warn('⚠️ Could not connect to PostgreSQL database. Falling back to High-Speed In-Memory DB:', err.message);
        this.isConnectedToPostgres = false;
        this.prisma = null;
      }
    } else {
      console.log('ℹ️ DATABASE_URL not set. Running in High-Speed In-Memory Database mode.');
    }
  }

  /* ==================== USER OPERATIONS ==================== */

  public async findUserByUsername(username: string): Promise<UserRecord | null> {
    if (this.isConnectedToPostgres && this.prisma) {
      try {
        const u = await this.prisma.user.findUnique({ where: { username } });
        return (u as any) || null;
      } catch (e) {
        // Fallback to memory
      }
    }
    return this.memoryUsers.get(username) || null;
  }

  public async findUserById(id: string): Promise<UserRecord | null> {
    if (this.isConnectedToPostgres && this.prisma) {
      try {
        const u = await this.prisma.user.findUnique({ where: { id } });
        return (u as any) || null;
      } catch (e) {
        // Fallback to memory
      }
    }
    return this.memoryUsers.get(id) || null;
  }

  public async createUser(data: Partial<UserRecord> & { username: string; nickname: string }): Promise<UserRecord> {
    const id = data.id || `usr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();

    const record: UserRecord = {
      id,
      email: data.email || null,
      username: data.username,
      passwordHash: data.passwordHash || null,
      nickname: data.nickname,
      avatarUrl: data.avatarUrl || '/assets/plague_doctor.png',
      bio: data.bio || 'Một vị khách bí ẩn tại quán rượu Liar\'s Bar.',
      elo: data.elo ?? 1000,
      level: data.level ?? 1,
      exp: data.exp ?? 0,
      rankTitle: data.rankTitle ?? 'Tân Binh Làng Sương',
      reputation: data.reputation ?? 100,
      silverCoins: data.silverCoins ?? 1000,
      goldGems: data.goldGems ?? 50,
      bloodCrystals: data.bloodCrystals ?? 10,
      favoriteRoles: data.favoriteRoles || ['VILLAGER', 'SEER'],
      gamesPlayed: 0,
      totalWins: 0,
      totalLosses: 0,
      wolfWins: 0,
      villageWins: 0,
      loversWins: 0,
      thirdPartyWins: 0,
      survivalRate: 0,
      winStreak: 0,
      bestWinStreak: 0,
      createdAt: now,
      updatedAt: now,
    };

    if (this.isConnectedToPostgres && this.prisma) {
      try {
        const created = await this.prisma.user.create({
          data: {
            ...record,
            favoriteRoles: record.favoriteRoles as any,
          },
        });
        return created as any;
      } catch (err) {
        console.warn('Prisma create failed, saving to in-memory store:', err);
      }
    }

    this.memoryUsers.set(record.id, record);
    this.memoryUsers.set(record.username, record);
    return record;
  }

  public async updateUserStats(
    userId: string,
    delta: {
      eloChange: number;
      isWin: boolean;
      team: string;
      silverReward: number;
      expReward: number;
    }
  ): Promise<UserRecord | null> {
    const user = await this.findUserById(userId);
    if (!user) return null;

    user.elo = Math.max(0, user.elo + delta.eloChange);
    user.gamesPlayed++;
    if (delta.isWin) {
      user.totalWins++;
      user.winStreak++;
      if (user.winStreak > user.bestWinStreak) user.bestWinStreak = user.winStreak;
      if (delta.team === 'WEREWOLF') user.wolfWins++;
      else if (delta.team === 'VILLAGE') user.villageWins++;
      else if (delta.team === 'LOVERS') user.loversWins++;
      else user.thirdPartyWins++;
    } else {
      user.totalLosses++;
      user.winStreak = 0;
    }

    user.survivalRate = user.gamesPlayed > 0 ? Math.round((user.totalWins / user.gamesPlayed) * 1000) / 10 : 0;
    user.silverCoins += delta.silverReward;
    user.exp += delta.expReward;

    // Check level up (100 exp per level)
    const newLevel = Math.floor(user.exp / 100) + 1;
    if (newLevel > user.level) {
      user.level = newLevel;
      if (user.level >= 50) user.rankTitle = 'Đại Tông Sư Quán Rượu';
      else if (user.level >= 30) user.rankTitle = 'Thợ Săn Huyền Thoại';
      else if (user.level >= 15) user.rankTitle = 'Thám Tử Đêm Sương';
      else if (user.level >= 5) user.rankTitle = 'Lãng Khách Quán Rượu';
    }
    user.updatedAt = new Date();

    if (this.isConnectedToPostgres && this.prisma) {
      try {
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            elo: user.elo,
            gamesPlayed: user.gamesPlayed,
            totalWins: user.totalWins,
            totalLosses: user.totalLosses,
            wolfWins: user.wolfWins,
            villageWins: user.villageWins,
            loversWins: user.loversWins,
            thirdPartyWins: user.thirdPartyWins,
            survivalRate: user.survivalRate,
            winStreak: user.winStreak,
            bestWinStreak: user.bestWinStreak,
            silverCoins: user.silverCoins,
            exp: user.exp,
            level: user.level,
            rankTitle: user.rankTitle,
          },
        });
      } catch (e) {
        // Fallback
      }
    }

    return user;
  }

  public async getLeaderboard(limit = 10): Promise<UserRecord[]> {
    if (this.isConnectedToPostgres && this.prisma) {
      try {
        const top = await this.prisma.user.findMany({
          orderBy: { elo: 'desc' },
          take: limit,
        });
        return top as any;
      } catch (e) {
        // Fallback
      }
    }

    const uniqueUsers = Array.from(new Set(Array.from(this.memoryUsers.values())));
    return uniqueUsers.sort((a, b) => b.elo - a.elo).slice(0, limit);
  }

  /* ==================== MATCH HISTORY ==================== */

  public async saveMatchHistory(match: {
    roomId: string;
    roomCode: string;
    mode: string;
    winnerTeam: string;
    playerCount: number;
    roundsCount: number;
    gameConfig: any;
    historyLog: any;
    playerReveals: any;
    playerStats: Array<{
      userId?: string;
      nickname: string;
      role: string;
      team: string;
      isAlive: boolean;
      deathCause?: string | null;
      deathRound?: number | null;
      eloChange: number;
      silverEarned: number;
      expEarned: number;
      scorePoints: number;
    }>;
  }): Promise<void> {
    const id = `match_${Date.now().toString(36)}`;
    const record = { ...match, id, startedAt: new Date(Date.now() - 600000), endedAt: new Date() };

    this.memoryMatches.push(record);

    // Update stats for all users in the match
    for (const p of match.playerStats) {
      if (p.userId) {
        await this.updateUserStats(p.userId, {
          eloChange: p.eloChange,
          isWin: p.team === match.winnerTeam,
          team: p.team,
          silverReward: p.silverEarned,
          expReward: p.expEarned,
        });
      }
    }

    if (this.isConnectedToPostgres && this.prisma) {
      try {
        await this.prisma.matchHistory.create({
          data: {
            roomId: match.roomId,
            roomCode: match.roomCode,
            mode: match.mode as any,
            winnerTeam: match.winnerTeam as any,
            roundsCount: match.roundsCount,
            playerCount: match.playerCount,
            gameConfig: match.gameConfig,
            historyLog: match.historyLog,
            playerReveals: match.playerReveals,
            startedAt: record.startedAt,
            endedAt: record.endedAt,
            playerStats: {
              create: match.playerStats.map((ps) => ({
                userId: ps.userId,
                nickname: ps.nickname,
                role: ps.role as any,
                team: ps.team as any,
                isAlive: ps.isAlive,
                deathCause: ps.deathCause as any,
                deathRound: ps.deathRound,
                eloChange: ps.eloChange,
                silverEarned: ps.silverEarned,
                expEarned: ps.expEarned,
                scorePoints: ps.scorePoints,
              })),
            },
          },
        });
      } catch (err) {
        console.warn('Prisma matchHistory save error:', err);
      }
    }
  }
}
