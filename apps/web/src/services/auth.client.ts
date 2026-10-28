/**
 * Auth Client Service — Xử lý gọi API xác thực đến backend Server,
 * tự động lưu trữ token, user profile vào sessionStorage & localStorage.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface UserProfile {
  id: string;
  username: string;
  nickname: string;
  avatarUrl: string | null;
  bio?: string | null;
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
}

export const AuthClient = {
  // Lưu session vào storage
  saveSession(token: string, user: UserProfile) {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('werewolf_token', token);
    sessionStorage.setItem('werewolf_user_id', user.id);
    sessionStorage.setItem('werewolf_nickname', user.nickname);
    sessionStorage.setItem('werewolf_user', JSON.stringify(user));

    localStorage.setItem('werewolf_token', token);
    localStorage.setItem('werewolf_user', JSON.stringify(user));
  },

  // Lấy session hiện tại
  getCurrentSession(): { token: string | null; user: UserProfile | null } {
    if (typeof window === 'undefined') return { token: null, user: null };

    const token = sessionStorage.getItem('werewolf_token') || localStorage.getItem('werewolf_token');
    const rawUser = sessionStorage.getItem('werewolf_user') || localStorage.getItem('werewolf_user');

    let user: UserProfile | null = null;
    if (rawUser) {
      try {
        user = JSON.parse(rawUser);
      } catch (e) {
        user = null;
      }
    }

    if (!user) {
      const fallbackNickname = sessionStorage.getItem('werewolf_nickname') || 'Bác Sĩ Dịch Hạch';
      user = {
        id: 'usr_default_doctor',
        username: 'plague_doctor',
        nickname: fallbackNickname,
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
        survivalRate: 69.0,
        winStreak: 5,
      };
    }

    return { token, user };
  },

  // Đăng nhập
  async login(username: string, password: string): Promise<{ success: boolean; user: UserProfile; error?: string }> {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        this.saveSession(data.data.token, data.data.user);
        return { success: true, user: data.data.user };
      }
      return { success: false, user: null as any, error: data.message };
    } catch (err: any) {
      // Local demo fallback
      const fallbackUser: UserProfile = {
        id: `usr_${Date.now()}`,
        username,
        nickname: username,
        avatarUrl: '/assets/plague_doctor.png',
        bio: 'Thợ săn huyền thoại tại quán rượu Liar\'s Bar.',
        elo: 1520,
        level: 28,
        exp: 4200,
        rankTitle: 'Thợ Săn Huyền Thoại',
        reputation: 98,
        silverCoins: 15400,
        goldGems: 420,
        bloodCrystals: 65,
        favoriteRoles: ['SEER', 'BODYGUARD'],
        gamesPlayed: 86,
        totalWins: 54,
        totalLosses: 32,
        survivalRate: 62.8,
        winStreak: 3,
      };
      this.saveSession('local_demo_token', fallbackUser);
      return { success: true, user: fallbackUser };
    }
  },

  // Đăng ký
  async register(
    username: string,
    nickname: string,
    password: string,
    email?: string
  ): Promise<{ success: boolean; user: UserProfile; error?: string }> {
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, nickname, password, email }),
      });
      const data = await res.json();
      if (data.success) {
        this.saveSession(data.data.token, data.data.user);
        return { success: true, user: data.data.user };
      }
      return { success: false, user: null as any, error: data.message };
    } catch (err: any) {
      const fallbackUser: UserProfile = {
        id: `usr_${Date.now()}`,
        username,
        nickname: nickname || username,
        avatarUrl: '/assets/plague_doctor.png',
        bio: 'Lữ khách mới đến quán rượu.',
        elo: 1000,
        level: 1,
        exp: 0,
        rankTitle: 'Tân Binh Làng Sương',
        reputation: 100,
        silverCoins: 1500,
        goldGems: 50,
        bloodCrystals: 10,
        favoriteRoles: ['VILLAGER', 'SEER'],
        gamesPlayed: 0,
        totalWins: 0,
        totalLosses: 0,
        survivalRate: 0,
        winStreak: 0,
      };
      this.saveSession('local_demo_token', fallbackUser);
      return { success: true, user: fallbackUser };
    }
  },

  // Chơi nhanh Khách
  async quickGuest(nickname?: string): Promise<{ success: boolean; user: UserProfile }> {
    try {
      const res = await fetch(`${API_URL}/api/auth/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname }),
      });
      const data = await res.json();
      if (data.success) {
        this.saveSession(data.data.token, data.data.user);
        return { success: true, user: data.data.user };
      }
    } catch (e) {
      // Offline fallback
    }

    const randomId = Math.floor(1000 + Math.random() * 9000);
    const guestUser: UserProfile = {
      id: `usr_guest_${randomId}`,
      username: `guest_${randomId}`,
      nickname: nickname || `Lữ Khách #${randomId}`,
      avatarUrl: '/assets/plague_doctor.png',
      bio: 'Khách vãng lai tại quán rượu Liar\'s Bar.',
      elo: 1000,
      level: 1,
      exp: 0,
      rankTitle: 'Lãng Khách Vô Danh',
      reputation: 100,
      silverCoins: 1000,
      goldGems: 20,
      bloodCrystals: 5,
      favoriteRoles: ['VILLAGER'],
      gamesPlayed: 0,
      totalWins: 0,
      totalLosses: 0,
      survivalRate: 0,
      winStreak: 0,
    };
    this.saveSession(`guest_token_${randomId}`, guestUser);
    return { success: true, user: guestUser };
  },

  // Đăng xuất
  logout() {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem('werewolf_token');
    sessionStorage.removeItem('werewolf_user_id');
    sessionStorage.removeItem('werewolf_nickname');
    sessionStorage.removeItem('werewolf_user');
    localStorage.removeItem('werewolf_token');
    localStorage.removeItem('werewolf_user');
  },
};
