/**
 * Authentication Service — Xử lý Đăng ký, Đăng nhập, Tạo tài khoản Khách, và ký JWT.
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { DatabaseService, UserRecord } from '../db/db.service';

const JWT_SECRET = process.env.JWT_SECRET || 'werewolf_secret_key_tavern_2026';
const JWT_EXPIRES_IN = '7d';

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    nickname: string;
    avatarUrl: string | null;
    bio: string | null;
    elo: number;
    level: number;
    exp: number;
    rankTitle: string;
    reputation: number;
    silverCoins: number;
    goldGems: number;
    bloodCrystals: number;
    favoriteRoles: string[];
    gamesPlayed: number;
    totalWins: number;
    totalLosses: number;
    survivalRate: number;
    winStreak: number;
  };
}

export class AuthService {
  private db = DatabaseService.getInstance();

  /**
   * Đăng ký tài khoản mới
   */
  public async register(payload: {
    username: string;
    password: string;
    nickname: string;
    email?: string;
  }): Promise<AuthResponse> {
    const username = payload.username.trim().toLowerCase();
    const nickname = payload.nickname.trim();

    if (!username || username.length < 3) {
      throw new Error('Tên đăng nhập phải có ít nhất 3 ký tự');
    }
    if (!payload.password || payload.password.length < 6) {
      throw new Error('Mật khẩu phải có ít nhất 6 ký tự');
    }
    if (!nickname) {
      throw new Error('Biệt danh không được để trống');
    }

    const existing = await this.db.findUserByUsername(username);
    if (existing) {
      throw new Error('Tên đăng nhập đã tồn tại trong quán rượu');
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const user = await this.db.createUser({
      username,
      passwordHash,
      nickname,
      email: payload.email?.trim().toLowerCase(),
      avatarUrl: '/assets/plague_doctor.png',
      rankTitle: 'Tân Binh Làng Sương',
      silverCoins: 1500, // Thưởng chào mừng
      goldGems: 50,
      bloodCrystals: 10,
    });

    return this.createAuthResponse(user);
  }

  /**
   * Đăng nhập tài khoản
   */
  public async login(payload: { username: string; password: string }): Promise<AuthResponse> {
    const username = payload.username.trim().toLowerCase();
    const user = await this.db.findUserByUsername(username);

    if (!user || !user.passwordHash) {
      throw new Error('Tài khoản hoặc mật khẩu không chính xác');
    }

    const isValid = await bcrypt.compare(payload.password, user.passwordHash);
    if (!isValid) {
      throw new Error('Tài khoản hoặc mật khẩu không chính xác');
    }

    return this.createAuthResponse(user);
  }

  /**
   * Tạo phiên chơi Khách (Guest) tức thì không cần mật khẩu
   */
  public async createGuestSession(nickname?: string): Promise<AuthResponse> {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const guestUsername = `guest_${Date.now().toString(36)}_${randomSuffix}`;
    const guestNickname = nickname?.trim() || `Lữ Khách #${randomSuffix}`;

    const user = await this.db.createUser({
      username: guestUsername,
      nickname: guestNickname,
      avatarUrl: '/assets/plague_doctor.png',
      rankTitle: 'Lãng Khách Vô Danh',
      silverCoins: 1000,
      goldGems: 20,
      bloodCrystals: 5,
    });

    return this.createAuthResponse(user);
  }

  /**
   * Xác thực và giải mã JWT token
   */
  public verifyToken(token: string): { userId: string; username: string } {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string };
      return decoded;
    } catch (err) {
      throw new Error('Token không hợp lệ hoặc đã hết hạn');
    }
  }

  /**
   * Lấy thông tin user từ token
   */
  public async getProfileFromToken(token: string): Promise<UserRecord | null> {
    const { userId } = this.verifyToken(token);
    return this.db.findUserById(userId);
  }

  private createAuthResponse(user: UserRecord): AuthResponse {
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        nickname: user.nickname,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        elo: user.elo,
        level: user.level,
        exp: user.exp,
        rankTitle: user.rankTitle,
        reputation: user.reputation,
        silverCoins: user.silverCoins,
        goldGems: user.goldGems,
        bloodCrystals: user.bloodCrystals,
        favoriteRoles: (user.favoriteRoles as string[]) || ['VILLAGER', 'SEER'],
        gamesPlayed: user.gamesPlayed,
        totalWins: user.totalWins,
        totalLosses: user.totalLosses,
        survivalRate: user.survivalRate,
        winStreak: user.winStreak,
      },
    };
  }
}
