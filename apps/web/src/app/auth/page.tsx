'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthClient } from '../../services/auth.client';

export default function AuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [isAtmosphericOn, setIsAtmosphericOn] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitBtnText, setSubmitBtnText] = useState('BƯỚC VÀO QUÁN RƯỢU');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [loginIdentity, setLoginIdentity] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Parallax mouse effect
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isAtmosphericOn) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 16;
      const y = (e.clientY / window.innerHeight - 0.5) * 16;
      setParallaxOffset({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isAtmosphericOn]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentity.trim()) return;
    setErrorMessage(null);
    setIsSubmitting(true);
    setSubmitBtnText('ĐANG XÁC THỰC LINH HỒN...');

    const res = await AuthClient.login(loginIdentity.trim(), loginPassword);
    if (res.success) {
      setSubmitBtnText('CHÀO MỪNG THỢ SĂN!');
      setTimeout(() => {
        router.push('/');
      }, 500);
    } else {
      setIsSubmitting(false);
      setErrorMessage(res.error || 'Đăng nhập không thành công');
      setSubmitBtnText('BƯỚC VÀO QUÁN RƯỢU');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regPassword.trim()) return;
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Mật khẩu nhập lại không khớp!');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    setSubmitBtnText('ĐANG KHỞI TẠO DANH PHẬN...');

    const res = await AuthClient.register(regName.trim(), regName.trim(), regPassword, regEmail.trim());
    if (res.success) {
      setSubmitBtnText('GIA NHẬP THÀNH CÔNG!');
      setTimeout(() => {
        router.push('/');
      }, 500);
    } else {
      setIsSubmitting(false);
      setErrorMessage(res.error || 'Khởi tạo tài khoản thất bại');
      setSubmitBtnText('TẠO TÀI KHOẢN');
    }
  };

  const triggerSocialFeedback = async (e: React.MouseEvent<HTMLButtonElement>, name: string) => {
    const btn = e.currentTarget;
    const oldText = btn.innerHTML;
    btn.innerHTML = `<span class="material-symbols-outlined text-[16px] animate-spin">refresh</span><span>Đang nối...</span>`;
    await AuthClient.quickGuest(`Thợ Săn ${name}`);
    setTimeout(() => {
      btn.innerHTML = oldText;
      router.push('/');
    }, 400);
  };

  return (
    <div className="bg-[#0f131d] text-[#dfe2f1] font-geist antialiased selection:bg-error selection:text-white min-h-screen flex flex-col justify-between overflow-x-hidden relative">
      {/* 1. CINEMATIC WEREWOLF TABLE 3D CUTSCENE BACKGROUND LAYER */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden bg-[#07090e]">
        {/* Main Werewolf Table Character Scene (3D Parallax & Slow Pan Zoom) */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            transform: isAtmosphericOn
              ? `translate3d(${parallaxOffset.x}px, ${parallaxOffset.y}px, 0px)`
              : 'none',
            transition: 'transform 0.4s ease-out',
          }}
        >
          <img
            alt="Bàn cược Ma Sói thời gian thực với Thợ Săn, Quạ Bác Sĩ, Chó Săn và Ma Sói"
            className={`w-full h-full object-cover object-center ${
              isAtmosphericOn ? 'cinematic-bg-anim' : ''
            } filter brightness-[0.88] contrast-[1.12]`}
            src="/assets/auth_bg.png"
          />
        </div>

        {/* Ambient Warm Lantern & Hearth Light Source Over Table */}
        <div className="absolute top-[8%] left-1/2 -translate-x-1/2 w-[620px] h-[620px] rounded-full bg-amber-500/20 blur-[130px] lantern-glow-anim pointer-events-none mix-blend-screen" />

        {/* Flickering Crimson Werewolf / Blood Moon Occult Aura */}
        <div className="absolute top-1/3 right-1/4 w-[520px] h-[520px] rounded-full bg-red-950/25 blur-[160px] pointer-events-none mix-blend-color-dodge" />
        <div className="absolute bottom-16 left-1/4 w-[600px] h-[350px] rounded-full bg-purple-950/20 blur-[140px] pointer-events-none" />

        {/* Volumetric Fog / Pipe Smoke Layers */}
        {isAtmosphericOn && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40 mix-blend-screen">
            <div className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_50%_60%,rgba(240,225,200,0.18),transparent_65%)] smoke-layer-1" />
            <div className="absolute -top-1/3 -right-1/4 w-[160%] h-[160%] bg-[radial-gradient(ellipse_at_60%_45%,rgba(180,210,255,0.12),transparent_60%)] smoke-layer-2" />
          </div>
        )}

        {/* Floating Tavern Embers & Ash Particles */}
        {isAtmosphericOn && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
            <div className="absolute bottom-24 left-[18%] w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b] ember-p1" />
            <div className="absolute bottom-36 left-[34%] w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444] ember-p2" />
            <div className="absolute bottom-16 left-[52%] w-1 h-1 rounded-full bg-red-300 shadow-[0_0_6px_#ff938c] ember-p3" />
            <div className="absolute bottom-28 right-[28%] w-2 h-2 rounded-full bg-amber-300 shadow-[0_0_9px_#fde047] ember-p4" />
            <div className="absolute bottom-40 right-[14%] w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] ember-p5" />
            <div className="absolute top-1/2 left-[42%] w-1.5 h-1.5 rounded-full bg-amber-200/70 shadow-[0_0_6px_#fde68a] animate-pulse" />
          </div>
        )}

        {/* Deep Cinematic Vignette & Edge Shadows to keep UI readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060910] via-[#060910]/40 to-[#060910]/80 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#060910]/90 via-[#060910]/30 to-[#060910]/90 pointer-events-none" />
      </div>

      {/* 2. MINIMALIST TOP NAVIGATION HEADER */}
      <header className="fixed top-0 w-full z-50 bg-[#060910]/80 backdrop-blur-xl border-b border-[#334155]/40">
        <div className="h-14 w-full px-6 flex items-center justify-between">
          <div onClick={() => router.push('/')} className="flex items-center gap-2.5 cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-red-950 flex items-center justify-center shadow-lg shadow-red-950/40 border border-red-500/30">
              <span className="material-symbols-outlined text-red-400 text-[20px]">nights_stay</span>
            </div>
            <div className="flex flex-col">
              <span className="font-syne text-[17px] leading-tight uppercase text-white tracking-wider font-bold">
                Ma Sói
              </span>
              <span className="font-space text-[10px] tracking-widest uppercase text-red-300 font-semibold">
                Huyết Nguyệt
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[#111622]/90 border border-[#334155]/40 px-3 py-1 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="font-space text-[11px] uppercase text-slate-300 hidden sm:inline">
                Máy Chủ: Ánh Trăng
              </span>
              <span className="font-space text-[11px] text-primary font-bold">24ms</span>
            </div>

            <div className="flex items-center bg-[#111622] border border-[#334155]/40 rounded p-0.5 font-space text-[11px] uppercase">
              <button className="px-2.5 py-0.5 rounded bg-primary text-[#082f49] font-bold">VIE</button>
              <button className="px-2.5 py-0.5 text-slate-400 hover:text-white transition-colors">ENG</button>
            </div>

            <button
              onClick={() => router.push('/cards')}
              className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#181f2f] hover:bg-[#222a3d] border border-[#334155]/40 text-xs font-space text-slate-200 hover:text-white transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">menu_book</span>
              Bách Khoa Thẻ Bài
            </button>
          </div>
        </div>
      </header>

      {/* 3. CENTERED CINEMATIC AUTHENTICATION MODAL (Gothic Glassmorphism) */}
      <main className="w-full flex-1 relative flex items-center justify-center pt-20 pb-16 overflow-hidden z-10">
        <div className="relative z-10 w-full max-w-[440px] mx-auto px-4">
          <div className="relative bg-[#060910]/90 backdrop-blur-2xl rounded-2xl p-6 sm:p-8 border border-red-900/40 shadow-[0_0_60px_rgba(147,0,10,0.45)] overflow-hidden">
            {/* Ornate Crimson Glow Crest Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent" />

            {/* Top Tavern Sigil Icon */}
            <div className="flex flex-col items-center text-center space-y-1 pb-4">
              <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-[#111622] border border-red-500/30 shadow-inner mb-1">
                <div className="absolute inset-0 rounded-full bg-red-950/50 blur-md lantern-glow-anim" />
                <span
                  className="material-symbols-outlined text-red-500 text-[30px] relative z-10"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  pets
                </span>
              </div>

              {/* Exact Horror Title with Cinzel Decorative & Nosifer */}
              <h2
                className="text-[28px] sm:text-[32px] uppercase font-bold tracking-[0.18em] text-transparent bg-clip-text bg-gradient-to-b from-[#ffdad6] via-[#ff5449] to-[#8d0012] select-none"
                style={{
                  fontFamily: '"Cinzel Decorative", Nosifer, serif',
                  textShadow:
                    'rgba(255, 50, 50, 0.8) 0px 0px 10px, rgba(147, 0, 10, 0.9) 0px 0px 25px, rgb(0, 0, 0) 2px 2px 4px',
                }}
              >
                QUÁN RƯỢU VỰC THẲM
              </h2>
              <p className="font-geist text-xs text-slate-300">
                Bàn cược sinh tử ma sói đang diễn ra
              </p>
            </div>

            {/* Segmented Tab Switcher: ĐĂNG NHẬP / ĐĂNG KÝ */}
            <div className="grid grid-cols-2 p-1 bg-[#111622]/90 rounded-lg border border-[#334155]/40 mb-5">
              <button
                type="button"
                onClick={() => setTab('login')}
                className={`py-2 text-center font-space text-xs uppercase tracking-wider rounded transition-all font-bold ${
                  tab === 'login'
                    ? 'bg-[#991b1b] text-white shadow-md shadow-red-900/50'
                    : 'text-slate-400 hover:text-white hover:bg-[#181f2f]/60'
                }`}
              >
                Đăng Nhập
              </button>
              <button
                type="button"
                onClick={() => setTab('register')}
                className={`py-2 text-center font-space text-xs uppercase tracking-wider rounded transition-all font-bold ${
                  tab === 'register'
                    ? 'bg-[#991b1b] text-white shadow-md shadow-red-900/50'
                    : 'text-slate-400 hover:text-white hover:bg-[#181f2f]/60'
                }`}
              >
                Đăng Ký
              </button>
            </div>

            {/* FORM 1: ĐĂNG NHẬP */}
            {tab === 'login' && (
              <form className="space-y-4" onSubmit={handleLoginSubmit}>
                {/* Identity */}
                <div className="space-y-1">
                  <label className="block font-space text-[11px] uppercase tracking-wider text-slate-300">
                    Danh Tính Thợ Săn / Email
                  </label>
                  <div className="relative flex items-center bg-[#111622] border border-[#334155]/40 rounded-lg focus-within:border-primary/60 focus-within:bg-[#181f2f] transition-all">
                    <span className="material-symbols-outlined absolute left-3 text-slate-400 text-[18px]">
                      theater_comedy
                    </span>
                    <input
                      type="text"
                      required
                      value={loginIdentity}
                      onChange={(e) => setLoginIdentity(e.target.value)}
                      placeholder="Tên thợ săn hoặc Email..."
                      className="w-full bg-transparent pl-10 pr-3 py-2.5 font-geist text-sm text-white placeholder:text-slate-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="font-space text-[11px] uppercase tracking-wider text-slate-300">
                      Mật Mã Bí Mật
                    </label>
                    <a href="#" className="font-space text-[10px] uppercase text-primary hover:underline">
                      Quên mật khẩu?
                    </a>
                  </div>
                  <div className="relative flex items-center bg-[#111622] border border-[#334155]/40 rounded-lg focus-within:border-primary/60 focus-within:bg-[#181f2f] transition-all">
                    <span className="material-symbols-outlined absolute left-3 text-slate-400 text-[18px]">
                      key
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Nhập mật mã của bạn..."
                      className="w-full bg-transparent pl-10 pr-10 py-2.5 font-geist text-sm text-white placeholder:text-slate-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-slate-400 hover:text-red-400 transition-colors p-0.5 flex items-center justify-center"
                      title="Hiện/Ẩn mật mã"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showPassword ? 'visibility' : 'visibility_off'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 rounded bg-[#181f2f] border-[#334155] text-red-600 accent-red-600 cursor-pointer"
                    />
                    <span className="font-geist text-xs text-slate-300 group-hover:text-white transition-colors">
                      Ghi nhớ phiên đăng nhập
                    </span>
                  </label>
                  <span className="font-space text-[10px] uppercase text-slate-400">v1.4.2-b</span>
                </div>

                {errorMessage && (
                  <div className="p-2.5 rounded bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2 animate-pulse">
                    <span className="material-symbols-outlined text-[18px] text-red-400">error</span>
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Main Submit CTA */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="relative w-full py-3 px-4 rounded-lg bg-gradient-to-r from-red-800 via-red-600 to-red-800 text-white font-space font-bold text-xs uppercase tracking-wider overflow-hidden group shadow-lg shadow-red-900/50 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full duration-700 transition-transform" />
                  <span className="material-symbols-outlined text-[20px]">login</span>
                  <span>{submitBtnText}</span>
                  <span className="text-xs opacity-75 font-mono ml-1">[ENTER]</span>
                </button>

                {/* Ornate Separator */}
                <div className="relative my-4 flex items-center justify-center">
                  <div className="w-full h-px bg-[#222a3d]" />
                  <span className="absolute bg-[#060910] px-2 font-space text-[10px] uppercase tracking-wider text-slate-400">
                    Hoặc liên kết nhanh
                  </span>
                </div>

                {/* Social Third-party Auth */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={(e) => triggerSocialFeedback(e, 'Discord')}
                    className="flex items-center justify-center gap-1.5 py-2 bg-[#111622] hover:bg-[#181f2f] border border-[#334155]/40 rounded-lg text-white font-space text-xs transition-all group"
                  >
                    <span className="material-symbols-outlined text-[17px] text-purple-400 group-hover:scale-110 transition-transform">
                      forum
                    </span>
                    <span>Discord</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => triggerSocialFeedback(e, 'Steam')}
                    className="flex items-center justify-center gap-1.5 py-2 bg-[#111622] hover:bg-[#181f2f] border border-[#334155]/40 rounded-lg text-white font-space text-xs transition-all group"
                  >
                    <span className="material-symbols-outlined text-[17px] text-primary group-hover:scale-110 transition-transform">
                      sports_esports
                    </span>
                    <span>Steam</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => triggerSocialFeedback(e, 'Google')}
                    className="flex items-center justify-center gap-1.5 py-2 bg-[#111622] hover:bg-[#181f2f] border border-[#334155]/40 rounded-lg text-white font-space text-xs transition-all group"
                  >
                    <span className="material-symbols-outlined text-[17px] text-red-400 group-hover:scale-110 transition-transform">
                      account_circle
                    </span>
                    <span>Google</span>
                  </button>
                </div>

                <div className="text-center pt-2">
                  <p className="font-geist text-xs text-slate-300">
                    Chưa có danh phận thợ săn?{' '}
                    <button
                      type="button"
                      onClick={() => setTab('register')}
                      className="text-red-400 hover:text-red-300 font-space font-bold uppercase ml-1 underline transition-colors"
                    >
                      Đăng ký ngay
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* FORM 2: ĐĂNG KÝ */}
            {tab === 'register' && (
              <form className="space-y-3.5" onSubmit={handleRegisterSubmit}>
                {/* Nickname */}
                <div className="space-y-1">
                  <label className="block font-space text-[11px] uppercase tracking-wider text-slate-300">
                    Tên Thợ Săn (Biệt Hiệu Nhân Vật)
                  </label>
                  <div className="relative flex items-center bg-[#111622] border border-[#334155]/40 rounded-lg focus-within:border-red-500/60 focus-within:bg-[#181f2f] transition-all">
                    <span className="material-symbols-outlined absolute left-3 text-slate-400 text-[18px]">
                      badge
                    </span>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Ví dụ: Dạ Thần 07..."
                      className="w-full bg-transparent pl-10 pr-3 py-2 font-geist text-sm text-white placeholder:text-slate-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="block font-space text-[11px] uppercase tracking-wider text-slate-300">
                    Email Khởi Tạo Hồn Phách
                  </label>
                  <div className="relative flex items-center bg-[#111622] border border-[#334155]/40 rounded-lg focus-within:border-red-500/60 focus-within:bg-[#181f2f] transition-all">
                    <span className="material-symbols-outlined absolute left-3 text-slate-400 text-[18px]">
                      mail
                    </span>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="hunter@vuctham.net..."
                      className="w-full bg-transparent pl-10 pr-3 py-2 font-geist text-sm text-white placeholder:text-slate-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="block font-space text-[11px] uppercase tracking-wider text-slate-300">
                    Mật Mã Bí Mật
                  </label>
                  <div className="relative flex items-center bg-[#111622] border border-[#334155]/40 rounded-lg focus-within:border-red-500/60 focus-within:bg-[#181f2f] transition-all">
                    <span className="material-symbols-outlined absolute left-3 text-slate-400 text-[18px]">
                      key
                    </span>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Tối thiểu 6 ký tự..."
                      className="w-full bg-transparent pl-10 pr-10 py-2 font-geist text-sm text-white placeholder:text-slate-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 text-slate-400 hover:text-red-400 transition-colors p-0.5 flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showRegPassword ? 'visibility' : 'visibility_off'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <label className="block font-space text-[11px] uppercase tracking-wider text-slate-300">
                    Xác Nhận Mật Mã
                  </label>
                  <div className="relative flex items-center bg-[#111622] border border-[#334155]/40 rounded-lg focus-within:border-red-500/60 focus-within:bg-[#181f2f] transition-all">
                    <span className="material-symbols-outlined absolute left-3 text-slate-400 text-[18px]">
                      lock_reset
                    </span>
                    <input
                      type="password"
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật mã..."
                      className="w-full bg-transparent pl-10 pr-3 py-2 font-geist text-sm text-white placeholder:text-slate-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Agreement Terms */}
                <div className="pt-1">
                  <label className="flex items-start gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      required
                      className="w-4 h-4 mt-0.5 rounded bg-[#181f2f] border-[#334155] text-red-600 accent-red-600 cursor-pointer"
                    />
                    <span className="font-geist text-[11px] leading-tight text-slate-300 group-hover:text-white transition-colors">
                      Tôi chấp thuận luật chơi Ma Sói Vực Thẳm và cam kết tuân thủ quy tắc sinh tử trong đêm.
                    </span>
                  </label>
                </div>

                {/* Main Register CTA */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="relative w-full py-3 px-4 rounded-lg bg-gradient-to-r from-purple-800 via-red-700 to-purple-800 text-white font-space font-bold text-xs uppercase tracking-wider overflow-hidden group shadow-lg shadow-purple-900/50 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full duration-700 transition-transform" />
                  <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
                  <span>{submitBtnText}</span>
                  <span className="text-xs opacity-75 font-mono ml-1">[TẠO TÀI KHOẢN]</span>
                </button>

                <div className="text-center pt-2">
                  <p className="font-geist text-xs text-slate-300">
                    Đã có danh phận thợ săn?{' '}
                    <button
                      type="button"
                      onClick={() => setTab('login')}
                      className="text-red-400 hover:text-red-300 font-space font-bold uppercase ml-1 underline transition-colors"
                    >
                      Đăng nhập ngay
                    </button>
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Floating Ambient Animation Control Button */}
        <div className="fixed bottom-12 right-4 z-40">
          <button
            type="button"
            onClick={() => setIsAtmosphericOn(!isAtmosphericOn)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#111622]/90 backdrop-blur-md border border-[#334155]/50 hover:border-primary/50 text-slate-300 hover:text-white shadow-lg transition-all group text-xs font-space uppercase tracking-wider"
            title="Bật/Tắt hiệu ứng chuyển động video nền"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isAtmosphericOn ? 'bg-primary animate-pulse' : 'bg-slate-500'
              }`}
            />
            <span className="material-symbols-outlined text-[16px] text-primary">videocam</span>
            <span>Hiệu ứng video nền: {isAtmosphericOn ? 'Bật' : 'Tắt'}</span>
          </button>
        </div>
      </main>

      {/* 4. MINIMALIST ATMOSPHERIC FOOTER */}
      <footer className="fixed bottom-0 w-full z-40 bg-[#060910]/85 backdrop-blur-md border-t border-[#334155]/30 py-2.5">
        <div className="w-full px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-space text-[11px] uppercase text-slate-400">Bàn Đấu: Vực Thẳm #1</span>
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <span className="font-space text-[11px] text-slate-300 hidden md:inline">
              Hệ Thống Chống Gian Lận: Hoạt Động
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-space text-[11px] uppercase text-slate-400">Huyết Nguyệt Core v1.4.2-b</span>
            <a href="#" className="font-space text-[11px] uppercase text-slate-400 hover:text-white transition-colors hidden sm:inline">
              Điều Khoản
            </a>
            <a href="#" className="font-space text-[11px] uppercase text-slate-400 hover:text-white transition-colors hidden sm:inline">
              Bảo Mật
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
