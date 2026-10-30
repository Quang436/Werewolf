'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthClient, UserProfile } from '../services/auth.client';
import { CreateRoomModal } from '../components/CreateRoomModal';
import { RoomSettings } from '@werewolf/shared';

export default function HomePage() {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<'ranked' | 'casual' | 'custom'>('ranked');
  const [chatChannel, setChatChannel] = useState<'world' | 'friends'>('world');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { id: 1, user: 'ThầyBói_HàĐông', time: '19:42', text: 'Cần tìm 2 pro vào bàn xếp hạng đánh nghiêm túc, mic rõ không vang nhé!', color: 'text-purple-400' },
    { id: 2, user: 'CHIÊU MỘ QUÂN ĐOÀN', time: '19:43', text: "Bang 'Huyết Sát Tộc' tuyển thành viên elo 2000+. Thưởng quà tuần!", isSystem: true },
    { id: 3, user: 'SóiGiàCôĐơn', time: '19:44', text: 'Ván vừa rồi Tiên Tri đỉnh thật, soi 2 đêm ra 2 sói luôn haha!', color: 'text-sky-400' },
  ]);
  const [roomFilter, setRoomFilter] = useState<'all' | 'ranked' | 'casual' | 'locked'>('all');
  const [quickCodeInput, setQuickCodeInput] = useState('');
  const [nickname, setNickname] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const session = AuthClient.getCurrentSession();
    if (session.user) {
      setUserProfile(session.user);
      setNickname(session.user.nickname);
    }
  }, []);

  const roomsList = [
    { code: 'ROOM-1', name: 'Làng Ma Sói #1842', mode: 'Xếp Hạng', players: '6/8', host: 'Dạ Thần', ping: '18ms', type: 'ranked' },
    { code: 'ROOM-2', name: 'Rừng Sương Mù #1843', mode: 'Giải Trí', players: '9/12', host: 'Sói Đỏ', ping: '24ms', type: 'casual' },
    { code: 'ROOM-3', name: 'Bàn Cược Liar\'s Bar #1844', mode: 'Xếp Hạng Cực Căng', players: '4/8', host: 'LordVader', ping: '22ms', type: 'ranked' },
    { code: 'ROOM-4', name: 'Hội Đồng Tối Mật #1845', mode: 'Có Mật Khẩu', players: '7/10', host: 'Xemesis', ping: '31ms', type: 'locked' },
  ];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const nick = sessionStorage.getItem('werewolf_nickname') || 'Thợ Săn Bạn';
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        user: nick,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        text: chatInput.trim(),
        color: 'text-emerald-400',
      },
    ]);
    setChatInput('');
  };

  const handleJoinRoom = (roomCode: string) => {
    const finalNick = nickname.trim() || sessionStorage.getItem('werewolf_nickname') || 'Thợ Săn Mới';
    sessionStorage.setItem('werewolf_nickname', finalNick);
    router.push(`/game/${roomCode}`);
  };

  const handleCustomRoomCreated = (settings: Partial<RoomSettings>, hostNickname: string) => {
    sessionStorage.setItem('werewolf_nickname', hostNickname);
    sessionStorage.setItem('werewolf_pending_create_settings', JSON.stringify(settings));
    setShowCreateModal(false);
    router.push('/game/NEW');
  };

  const filteredRooms = roomsList.filter((r) => {
    if (roomFilter === 'all') return true;
    return r.type === roomFilter;
  });

  return (
    <div className="bg-[#0f131d] text-[#dfe2f1] font-geist antialiased selection:bg-red-900 selection:text-white min-h-screen">
      {/* 1. FIXED TOP COCKPIT HEADER */}
      <header className="fixed top-0 w-full z-50 bg-[#060910]/85 backdrop-blur-xl border-b border-[#334155]/40 shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
        <div className="h-16 w-full px-6 flex items-center justify-between gap-4">
          {/* Logo Brand */}
          <div className="flex items-center gap-6 shrink-0">
            <div onClick={() => router.push('/')} className="flex items-center gap-3 cursor-pointer">
              <div className="w-9 h-9 rounded bg-red-950/60 border border-red-500/40 flex items-center justify-center text-red-400 shadow-[0_0_16px_rgba(147,0,10,0.5)]">
                <span className="material-symbols-outlined text-[24px]">nightlight</span>
              </div>
              <div className="flex flex-col">
                <span className="font-syne font-bold text-base uppercase tracking-wider text-white">MA SÓI</span>
                <span className="font-space text-[10px] uppercase tracking-widest text-red-400 -mt-1 font-semibold">
                  Huyết Nguyệt
                </span>
              </div>
            </div>

            <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded bg-[#262a35]/60 border border-[#334155]/30">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="font-space text-[11px] uppercase text-slate-300">Máy Chủ: Vực Thẳm I</span>
            </div>
          </div>

          {/* Center Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 px-1.5 py-1 rounded bg-[#171b26]/90 border border-[#334155]/30">
            <button
              onClick={() => router.push('/')}
              className="px-4 py-1.5 uppercase tracking-wider transition-all bg-[#262a35] text-primary font-space font-bold text-xs rounded shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]"
            >
              Sảnh Chờ
            </button>
            <button
              onClick={() => router.push('/cards')}
              className="px-4 py-1.5 rounded font-space text-xs uppercase tracking-wider text-slate-300 hover:text-white hover:bg-[#1c1f2a] transition-all"
            >
              Bách Khoa Thẻ Bài (40 Lá)
            </button>
            <button
              onClick={() => router.push('/auth')}
              className="px-4 py-1.5 rounded font-space text-xs uppercase tracking-wider text-slate-300 hover:text-white hover:bg-[#1c1f2a] transition-all"
            >
              Quán Rượu (Đăng Nhập)
            </button>
            <button
              onClick={() => router.push('/game/ROOM-1')}
              className="px-4 py-1.5 rounded font-space text-xs uppercase tracking-wider text-slate-300 hover:text-white hover:bg-[#1c1f2a] transition-all"
            >
              Bàn Chơi 3D POV
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-1.5 rounded font-space text-xs uppercase tracking-wider text-amber-300 bg-amber-950/60 border border-amber-500/40 hover:bg-amber-900/80 transition-all flex items-center gap-1.5 font-bold shadow-[0_0_12px_rgba(245,158,11,0.3)]"
            >
              <span className="material-symbols-outlined text-[15px]">add_circle</span>
              <span>Tạo Phòng Tùy Chỉnh</span>
            </button>
          </nav>

          {/* Right Metrics & Profile */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Currencies */}
            <div className="hidden 2xl:flex items-center gap-3 px-3 py-1 rounded bg-[#171b26] border border-[#334155]/30">
              <div className="flex items-center gap-1.5" title="Bạc">
                <span className="material-symbols-outlined text-[18px] text-slate-400">monetization_on</span>
                <span className="font-space text-xs text-white">
                  {(userProfile?.silverCoins ?? 24500).toLocaleString('vi-VN')}
                </span>
              </div>
              <div className="w-px h-3.5 bg-slate-600/40" />
              <div className="flex items-center gap-1.5" title="Vàng">
                <span className="material-symbols-outlined text-[18px] text-amber-400">stars</span>
                <span className="font-space text-xs text-white">
                  {(userProfile?.goldGems ?? 850).toLocaleString('vi-VN')}
                </span>
              </div>
              <div className="w-px h-3.5 bg-slate-600/40" />
              <div className="flex items-center gap-1.5" title="Huyết Tinh">
                <span className="material-symbols-outlined text-[18px] text-red-500 animate-pulse">bloodtype</span>
                <span className="font-space text-xs text-red-400 font-bold">
                  {(userProfile?.bloodCrystals ?? 120).toLocaleString('vi-VN')}
                </span>
              </div>
            </div>

            {/* Profile Avatar */}
            <div className="flex items-center gap-3 pl-1">
              <div className="hidden md:flex flex-col text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <span className="px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 font-space text-[10px] font-bold">
                    CẤP {userProfile?.level ?? 42}
                  </span>
                  <span className="font-space text-xs text-white tracking-wide font-bold">
                    {userProfile?.nickname ?? 'Huyết Ảnh'}
                  </span>
                </div>
                <span className="font-geist text-[11px] text-slate-400">
                  {userProfile?.rankTitle ?? 'Thợ Săn Huyền Thoại'}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[#00354a] font-bold shadow">
                <span className="material-symbols-outlined text-[18px]">person</span>
              </div>
              <button
                onClick={() => {
                  AuthClient.logout();
                  router.push('/auth');
                }}
                className="w-8 h-8 rounded bg-[#262a35] hover:bg-[#353944] flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                title="Đổi Tài Khoản / Đăng Xuất"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. MAIN COCKPIT VIEWPORT */}
      <main className="w-full pt-20 px-6 max-w-[1680px] mx-auto min-h-screen flex flex-col gap-6">
        {/* SUB-HEADER BAR: SERVER METRICS & LIVE TICKER */}
        <section className="w-full mt-2 flex flex-wrap items-center justify-between gap-4 bg-[#0a0e18]/80 backdrop-blur-md px-4 py-2.5 rounded-xl border border-[#334155]/30 shadow-lg">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              <span className="font-space text-[11px] uppercase tracking-wider text-slate-400">Trực Tuyến:</span>
              <span className="font-space text-xs text-red-400 font-bold">14,820 Thợ Săn</span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-slate-300">
              <span className="material-symbols-outlined text-[16px] text-primary">timer</span>
              <span className="font-geist text-xs text-slate-400">Ước tính tìm trận:</span>
              <span className="font-space text-xs text-primary font-bold">~14s</span>
            </div>

            <div className="hidden md:flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#262a35] text-slate-300 border border-[#334155]/30">
              <span className="material-symbols-outlined text-[14px] text-red-400">shield_moon</span>
              <span className="font-space text-[10px] uppercase font-bold text-red-300">Mùa 4: Trăng Máu Trỗi Dậy</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#1c1f2a] border border-[#334155]/30">
              <span className="material-symbols-outlined text-[16px] text-primary animate-pulse">mic</span>
              <span className="font-space text-[11px] text-white">Micro: Khử Ồn AI</span>
              <div className="flex items-center gap-0.5 ml-1">
                <span className="w-0.5 h-2.5 bg-primary rounded-full" />
                <span className="w-0.5 h-3 bg-primary rounded-full" />
                <span className="w-0.5 h-1.5 bg-primary/40 rounded-full" />
              </div>
            </div>

            <button
              onClick={() => router.push('/cards')}
              className="px-3 py-1 rounded bg-[#262a35] hover:bg-[#353944] text-white font-space text-[11px] uppercase font-bold tracking-wider transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">style</span>
              <span>Xem 40 Lá Bài</span>
            </button>
          </div>
        </section>

        {/* 3. PRIMARY COMMAND GRID (3 COLUMNS: MATCHMAKER | CHARACTER SUITE | COMMS HUB) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT WING: TÌM TRẬN NHANH & CHỌN CHẾ ĐỘ (5 COLS) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="relative bg-[#171b26]/90 backdrop-blur-xl p-6 rounded-2xl border border-[#334155]/40 shadow-xl flex flex-col justify-between overflow-hidden">
              <div className="absolute -right-12 -top-12 w-48 h-48 bg-red-950/40 rounded-full blur-3xl pointer-events-none" />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-space text-[10px] uppercase tracking-widest text-red-400 font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">local_fire_department</span>
                    Sảnh Tử Quyết
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#1c1f2a] text-slate-400 font-space text-[10px] uppercase font-bold">
                    Bàn Cược Ngầm
                  </span>
                </div>
                <h2 className="font-syne font-extrabold text-2xl text-white tracking-wide uppercase">
                  TÌM TRẬN TỨC THÌ
                </h2>
                <p className="font-geist text-xs text-slate-300 mt-1 leading-relaxed">
                  Bước vào bàn cược tử thần của Quán Rượu Vực Thẳm. Đeo mặt nạ, che giấu thân phận và tố giác kẻ nói dối trước khi bình minh ló rạng.
                </p>
              </div>

              {/* Mode Selector Cards */}
              <div className="grid grid-cols-1 gap-2.5 my-5">
                {/* Mode 1: Ranked */}
                <div
                  onClick={() => setSelectedMode('ranked')}
                  className={`relative flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all ${
                    selectedMode === 'ranked'
                      ? 'bg-[#262a35] border border-red-500/50 shadow-lg shadow-red-950/40'
                      : 'bg-[#1c1f2a]/60 hover:bg-[#262a35] border border-[#334155]/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-red-950/60 flex items-center justify-center text-red-400 border border-red-500/30">
                      <span className="material-symbols-outlined text-[24px]">swords</span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-space font-bold text-sm text-white">Đấu Xếp Hạng Huyết Nguyệt</span>
                        <span className="px-1.5 py-0.2 rounded bg-red-950/80 text-red-400 font-space text-[10px] uppercase font-bold">
                          Cực Căng
                        </span>
                      </div>
                      <span className="font-geist text-[11px] text-slate-400">
                        8 - 12 Người Chơi • Voice Chat Cưỡng Chế • Thăng Hạng
                      </span>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${selectedMode === 'ranked' ? 'bg-primary text-[#00354a]' : 'border border-slate-600'}`}>
                    {selectedMode === 'ranked' && <span className="material-symbols-outlined text-[14px]">check</span>}
                  </div>
                </div>

                {/* Mode 2: Casual */}
                <div
                  onClick={() => setSelectedMode('casual')}
                  className={`relative flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all ${
                    selectedMode === 'casual'
                      ? 'bg-[#262a35] border border-primary/50 shadow-lg'
                      : 'bg-[#1c1f2a]/60 hover:bg-[#262a35] border border-[#334155]/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-[#313540] flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[22px]">casino</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-space font-bold text-sm text-white">Phòng Thường Giải Trí</span>
                      <span className="font-geist text-[11px] text-slate-400">
                        6 - 10 Người Chơi • Không tính điểm Elo • Thoải mái
                      </span>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${selectedMode === 'casual' ? 'bg-primary text-[#00354a]' : 'border border-slate-600'}`}>
                    {selectedMode === 'casual' && <span className="material-symbols-outlined text-[14px]">check</span>}
                  </div>
                </div>

                {/* Mode 3: Custom */}
                <div
                  onClick={() => setShowCreateModal(true)}
                  className="relative flex items-center justify-between p-3.5 rounded-xl bg-[#1c1f2a]/60 hover:bg-[#262a35] border border-amber-500/30 hover:border-amber-500/60 cursor-pointer transition-all shadow-md group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-[22px]">tune</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-space font-bold text-sm text-white group-hover:text-amber-300 transition-colors">
                        Tùy Chỉnh & Tạo Bàn Mới
                      </span>
                      <span className="font-geist text-[11px] text-slate-400">
                        Chọn số người, thời gian thảo luận & cơ cấu các vai trò
                      </span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-amber-400 text-[20px]">add_circle</span>
                </div>
              </div>

              {/* Match CTA Buttons */}
              <div className="flex flex-col gap-2">
                <div className="flex gap-2.5">
                  <button
                    onClick={() => handleJoinRoom('ROOM-1')}
                    className="flex-1 relative group overflow-hidden py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-800 via-red-600 to-red-800 text-white font-space font-bold text-xs uppercase tracking-wider shadow-[0_0_28px_rgba(147,0,10,0.7)] hover:shadow-[0_0_36px_rgba(239,68,68,0.85)] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full duration-700 transition-transform" />
                    <span className="material-symbols-outlined text-[20px]">travel_explore</span>
                    <span>VÀO BÀN CƯỢC</span>
                  </button>

                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-500 text-white font-space font-black text-xs uppercase tracking-wider shadow-[0_0_24px_rgba(217,119,6,0.5)] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[20px]">tune</span>
                    <span>TẠO BÀN TÙY CHỈNH</span>
                  </button>
                </div>
                <div className="flex items-center justify-between text-slate-400 font-space text-[11px] px-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Ping: 24ms (Hà Nội)
                  </span>
                  <span>Khóa ghép: ±120 Điểm Danh Vọng</span>
                </div>
              </div>
            </div>

            {/* Tavern Event Banner */}
            <div className="bg-[#171b26] p-4 rounded-xl border border-[#334155]/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-purple-950/60 border border-purple-500/40 flex items-center justify-center text-purple-300">
                  <span className="material-symbols-outlined text-[20px]">liquor</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-space font-bold text-xs text-white">Đêm Ma Quái: x2 Huyết Tinh</span>
                  <span className="font-geist text-[11px] text-slate-400">Còn lại: 03 giờ 42 phút</span>
                </div>
              </div>
              <button
                onClick={() => router.push('/auth')}
                className="px-3 py-1 rounded bg-[#262a35] hover:bg-[#353944] text-primary font-space text-[11px] font-bold uppercase transition-colors"
              >
                Nhận Quà
              </button>
            </div>
          </div>

          {/* CENTER WING: 3D CHARACTER SPOTLIGHT IN GOTHIC TAVERN (4 COLS) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="relative bg-[#171b26]/90 backdrop-blur-xl rounded-2xl p-6 border border-[#334155]/40 shadow-xl flex flex-col justify-between overflow-hidden">
              {/* Header Info */}
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-primary/20 text-primary font-space text-[10px] font-bold uppercase tracking-wider border border-primary/30">
                    Huyền Thoại Bậc III
                  </span>
                  <span className="font-space text-[11px] text-slate-400">Top 0.8%</span>
                </div>
                <button
                  onClick={() => router.push('/game/ROOM-1')}
                  className="w-8 h-8 rounded bg-[#1c1f2a] hover:bg-[#262a35] flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                  title="Vào Bàn Chơi 3D"
                >
                  <span className="material-symbols-outlined text-[18px]">fullscreen</span>
                </button>
              </div>

              {/* 3D Gritty Tavern Character Scene Card */}
              <div className="relative w-full h-72 my-4 rounded-xl overflow-hidden flex items-end justify-center bg-[#0a0e18] border border-[#334155]/30">
                <img
                  src="/assets/plague_doctor.png"
                  alt="Bác Sĩ Mỏ Quạ • Huyết Ảnh"
                  className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.9] contrast-[1.1] scale-105 hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e18] via-[#0a0e18]/40 to-transparent pointer-events-none" />
                <div className="relative z-10 text-center mb-3 px-4 py-1 rounded-full bg-[#0a0e18]/90 backdrop-blur-md border border-[#334155]/40 shadow-lg">
                  <span className="font-syne font-bold text-sm text-white tracking-wide uppercase">
                    Bác Sĩ Mỏ Quạ • Huyết Ảnh
                  </span>
                </div>
              </div>

              {/* Battle Records & Statistics */}
              <div className="grid grid-cols-3 gap-2 py-1 text-center z-10">
                <div className="p-2.5 rounded-lg bg-[#1c1f2a] border border-[#334155]/20">
                  <span className="font-space text-[10px] uppercase text-slate-400 block font-semibold">Trận Đấu</span>
                  <span className="font-syne text-lg text-white font-bold">
                    {userProfile?.gamesPlayed ?? 142}
                  </span>
                  <span className="font-geist text-[10px] text-primary block mt-0.5 font-medium">
                    {userProfile?.totalWins ?? 98} Thắng
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#1c1f2a] border border-[#334155]/20">
                  <span className="font-space text-[10px] uppercase text-slate-400 block font-semibold">Tỉ Lệ Thắng</span>
                  <span className="font-syne text-lg text-red-400 font-bold">
                    {(userProfile?.survivalRate ?? 69.0).toFixed(1)}%
                  </span>
                  <span className="font-geist text-[10px] text-red-300 block mt-0.5 font-medium">
                    {userProfile?.winStreak ? `Chuỗi ${userProfile.winStreak}W` : 'Cực Chuẩn'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#1c1f2a] border border-[#334155]/20">
                  <span className="font-space text-[10px] uppercase text-slate-400 block font-semibold">Tín Nhiệm</span>
                  <span className="font-syne text-lg text-white font-bold">
                    {userProfile?.reputation ?? 100}
                  </span>
                  <span className="font-geist text-[10px] text-emerald-400 block mt-0.5 font-medium">Tuyệt Đối</span>
                </div>
              </div>

              {/* Signature Roles Badges */}
              <div className="z-10 mt-2 pt-2 border-t border-[#334155]/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-space text-[10px] uppercase text-slate-400 font-bold">Vai Trò Ưa Thích:</span>
                  <span className="font-space text-[10px] text-primary">Tỉ Lệ Thắng</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#1c1f2a] flex items-center justify-between border border-[#334155]/20">
                    <span className="text-xs text-white">🔮 Tiên Tri</span>
                    <span className="font-space text-xs font-bold text-primary">82%</span>
                  </div>
                  <div className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#1c1f2a] flex items-center justify-between border border-[#334155]/20">
                    <span className="text-xs text-white">🐺 Ma Sói</span>
                    <span className="font-space text-xs font-bold text-red-400">74%</span>
                  </div>
                  <div className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#1c1f2a] flex items-center justify-between border border-[#334155]/20">
                    <span className="text-xs text-white">🏹 Thợ Săn</span>
                    <span className="font-space text-xs font-bold text-purple-400">68%</span>
                  </div>
                </div>
              </div>

              {/* Customization Actions */}
              <div className="mt-4 flex gap-2 z-10">
                <button
                  onClick={() => router.push('/cards')}
                  className="flex-1 py-2 px-3 rounded-lg bg-[#262a35] hover:bg-[#353944] text-white font-space font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors border border-[#334155]/30"
                >
                  <span className="material-symbols-outlined text-[18px] text-purple-400">style</span>
                  Bách Khoa 40 Thẻ Bài
                </button>
                <button
                  onClick={() => router.push('/game/ROOM-1')}
                  className="py-2 px-4 rounded-lg bg-red-950/70 hover:bg-red-900 border border-red-500/40 text-red-300 font-space font-bold text-xs uppercase transition-colors"
                >
                  POV Bàn Đấu
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT WING: GLOBAL CHAT & ONLINE FRIENDS (3 COLS) */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <div className="bg-[#171b26]/90 backdrop-blur-xl rounded-2xl p-5 border border-[#334155]/40 shadow-xl flex flex-col h-full justify-between">
              <div>
                {/* Comms Channel Tabs */}
                <div className="flex items-center gap-1 bg-[#1c1f2a] p-1 rounded-lg mb-3 border border-[#334155]/30">
                  <button
                    type="button"
                    onClick={() => setChatChannel('world')}
                    className={`flex-1 py-1 rounded text-xs font-space uppercase font-bold transition-colors ${
                      chatChannel === 'world' ? 'bg-[#262a35] text-primary shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Kênh Chung
                  </button>
                  <button
                    type="button"
                    onClick={() => setChatChannel('friends')}
                    className={`flex-1 py-1 rounded text-xs font-space uppercase font-bold transition-colors ${
                      chatChannel === 'friends' ? 'bg-[#262a35] text-primary shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Bạn Bè (5/18)
                  </button>
                </div>

                {/* Message Stream */}
                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {chatMessages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-2.5 rounded-lg border transition-colors ${
                        m.isSystem
                          ? 'bg-red-950/30 border-red-500/30'
                          : 'bg-[#1c1f2a]/70 hover:bg-[#1c1f2a] border-[#334155]/20'
                      }`}
                    >
                      <div className="flex items-center justify-between font-space text-[10px]">
                        <span className={`font-bold ${m.color || 'text-red-400'}`}>{m.user}</span>
                        <span className="text-slate-400">{m.time}</span>
                      </div>
                      <p className="font-geist text-xs text-slate-200 mt-1 leading-snug">{m.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="mt-3 pt-2 border-t border-[#334155]/30">
                <div className="flex items-center gap-2 bg-[#1c1f2a] rounded-lg px-3 py-1.5 border border-[#334155]/40 focus-within:border-primary/60 transition-colors">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Gõ tin nhắn lên kênh thế giới..."
                    className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none font-geist"
                  />
                  <button type="submit" className="text-primary hover:text-white transition-colors" title="Gửi tin">
                    <span className="material-symbols-outlined text-[18px]">send</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* 4. PUBLIC ROOM BROWSER / DANH SÁCH BÀN CHƠI TRỰC TIẾP */}
        <section className="w-full bg-[#171b26]/90 backdrop-blur-xl rounded-2xl p-6 border border-[#334155]/40 shadow-xl mb-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#334155]/30">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">meeting_room</span>
                <h3 className="font-syne font-bold text-lg uppercase text-white tracking-wide">
                  Danh Sách Bàn Chơi Quán Rượu
                </h3>
              </div>
              <span className="font-geist text-xs text-slate-400 mt-0.5">
                Chọn phòng trực tiếp hoặc tự lập bàn riêng cùng đồng minh
              </span>
            </div>

            {/* Filters & Actions */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center bg-[#1c1f2a] rounded-lg p-1 border border-[#334155]/30">
                <button
                  type="button"
                  onClick={() => setRoomFilter('all')}
                  className={`px-3 py-1 rounded text-xs font-space uppercase font-bold transition-all ${
                    roomFilter === 'all' ? 'bg-[#262a35] text-primary' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tất Cả
                </button>
                <button
                  type="button"
                  onClick={() => setRoomFilter('ranked')}
                  className={`px-3 py-1 rounded text-xs font-space uppercase font-bold transition-all ${
                    roomFilter === 'ranked' ? 'bg-[#262a35] text-primary' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Xếp Hạng
                </button>
                <button
                  type="button"
                  onClick={() => setRoomFilter('casual')}
                  className={`px-3 py-1 rounded text-xs font-space uppercase font-bold transition-all ${
                    roomFilter === 'casual' ? 'bg-[#262a35] text-primary' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Giải Trí
                </button>
                <button
                  type="button"
                  onClick={() => setRoomFilter('locked')}
                  className={`px-3 py-1 rounded text-xs font-space uppercase font-bold transition-all ${
                    roomFilter === 'locked' ? 'bg-[#262a35] text-primary' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Có Mật Khẩu
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white font-space font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-950/40 flex items-center gap-1.5 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                Tạo Bàn Mới
              </button>
            </div>
          </div>

          {/* Rooms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredRooms.map((room) => (
              <div
                key={room.code}
                className="bg-[#111622] hover:bg-[#181f2f] border border-[#334155]/40 hover:border-primary/50 p-4 rounded-xl transition-all shadow-md flex flex-col justify-between gap-3 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-space text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {room.code}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded font-space text-[10px] font-bold uppercase ${
                      room.type === 'ranked'
                        ? 'bg-red-950 text-red-400 border border-red-500/30'
                        : room.type === 'locked'
                        ? 'bg-purple-950 text-purple-400 border border-purple-500/30'
                        : 'bg-sky-950 text-sky-400 border border-sky-500/30'
                    }`}
                  >
                    {room.mode}
                  </span>
                </div>

                <div>
                  <h4 className="font-syne font-bold text-sm text-white group-hover:text-primary transition-colors">
                    {room.name}
                  </h4>
                  <div className="flex items-center justify-between text-xs text-slate-400 font-space mt-2">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">person</span>
                      {room.players}
                    </span>
                    <span className="text-emerald-400 font-bold">{room.ping}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleJoinRoom(room.code)}
                  className="w-full py-2 rounded-lg bg-[#262a35] group-hover:bg-primary group-hover:text-[#00354a] text-white font-space font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1"
                >
                  <span>Tham Gia Bàn</span>
                  <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* QUICK JOIN / CREATE MODAL */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#111622] border border-red-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowJoinModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="font-syne font-bold text-lg text-white uppercase tracking-wide mb-1">
              Vào Bàn Chơi / Tạo Bàn Mới
            </h3>
            <p className="font-geist text-xs text-slate-400 mb-4">
              Nhập mã phòng 6 ký tự hoặc tên nhân vật của bạn để bắt đầu.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block font-space text-[11px] uppercase text-slate-300 mb-1">
                  Biệt Danh Của Bạn
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Ví dụ: Dạ Thần 07..."
                  className="w-full bg-[#181f2f] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary font-geist"
                />
              </div>

              <div>
                <label className="block font-space text-[11px] uppercase text-slate-300 mb-1">
                  Mã Phòng (Nếu tham gia bàn riêng)
                </label>
                <input
                  type="text"
                  value={quickCodeInput}
                  onChange={(e) => setQuickCodeInput(e.target.value.toUpperCase())}
                  placeholder="Ví dụ: ROOM-1..."
                  className="w-full bg-[#181f2f] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary font-space font-bold uppercase"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleJoinRoom(quickCodeInput || 'ROOM-1')}
                  className="flex-1 py-2.5 rounded-lg bg-primary text-[#00354a] font-space font-bold text-xs uppercase tracking-wider"
                >
                  Vào Phòng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowJoinModal(false);
                    setShowCreateModal(true);
                  }}
                  className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white font-space font-bold text-xs uppercase tracking-wider transition-all"
                >
                  Cấu Hình & Tạo Bàn Mới
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. COMPREHENSIVE CREATE ROOM MODAL */}
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateRoom={handleCustomRoomCreated}
        initialNickname={nickname || userProfile?.nickname || 'Thợ Săn Bạn'}
      />
    </div>
  );
}
