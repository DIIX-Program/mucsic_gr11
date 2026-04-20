import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const isEmailValid = email.includes("@") && email.includes(".");
  const isPasswordValid = password.length >= 6;
  const isUsernameValid = username.length >= 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && (!isEmailValid || !isPasswordValid || !isUsernameValid)) return;
    if (isLogin && !password) return; // Note: for login they can use email or username so we don't strictly enforce "@"

    setError("");
    setLoading(true);

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const body = isLogin ? { email, password } : { username, email, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        setAuth(data.user.id, data.user.isAdmin || false, data.user.isArtist || false);
        navigate("/");
      } else {
        setError(data.error || "Xác thực thất bại");
      }
    } catch (err) {
      setError("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setError("");
    setIsLogin(!isLogin);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] relative overflow-hidden px-4 py-8">
      {/* Background aesthetics */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#1ed760]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#450af5]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="mb-8 text-center z-10">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#1ed760] to-[#1db954] rounded-2xl flex items-center justify-center shadow-[0_10px_30px_rgba(30,215,96,0.3)] hover:scale-105 transition-transform cursor-pointer">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-black">
              <path d="M4 19V6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 19V4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 19V8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 19V11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20 19V14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tighter">MusicEVE</h1>
      </div>

      <div className="w-full max-w-[440px] z-10 perspective-1000">
        <AnimatePresence mode="wait">
          <motion.div
            key={isLogin ? "login" : "register"}
            initial={{ opacity: 0, rotateY: 90, scale: 0.9 }}
            animate={{ opacity: 1, rotateY: 0, scale: 1 }}
            exit={{ opacity: 0, rotateY: -90, scale: 0.9 }}
            transition={{ duration: 0.4, ease: "anticipate" }}
            className="bg-[#121212]/90 backdrop-blur-xl p-10 rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-white/10"
          >
            <h2 className="text-3xl font-black text-white mb-2 text-center tracking-tight">
              {isLogin ? "Chào mừng trở lại" : "Tạo tài khoản"}
            </h2>
            <p className="text-zinc-400 text-sm font-medium text-center mb-8">
              {isLogin ? "Đăng nhập để vào thư viện của bạn" : "Đăng ký miễn phí để bắt đầu trải nghiệm"}
            </p>

            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 bg-red-500/10 text-red-400 text-sm p-3 rounded-xl mb-6 border border-red-500/20">
                <AlertCircle size={18} />
                <span className="font-bold">{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {!isLogin && (
                <div className="relative">
                  <label className="block text-[11px] font-black text-zinc-400 mb-2 tracking-[0.2em]">TÊN ĐĂNG NHẬP</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 pr-12 text-white font-medium focus:outline-none focus:border-[#1ed760]/50 focus:bg-white/10 transition-all placeholder:text-zinc-600"
                    placeholder="Chữ thường không dấu"
                    required
                  />
                  {username.length > 0 && (
                    <div className="absolute right-4 top-[38px]">
                      {isUsernameValid ? <CheckCircle2 size={18} className="text-[#1ed760]" /> : <AlertCircle size={18} className="text-zinc-500" />}
                    </div>
                  )}
                </div>
              )}

              <div className="relative">
                <label className="block text-[11px] font-black text-zinc-400 mb-2 tracking-[0.2em] uppercase">
                  {isLogin ? "Email hoặc Tên đăng nhập" : "Email"}
                </label>
                <input 
                  type={isLogin ? "text" : "email"}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 pr-12 text-white font-medium focus:outline-none focus:border-[#1ed760]/50 focus:bg-white/10 transition-all placeholder:text-zinc-600"
                  required
                />
                {!isLogin && email.length > 0 && (
                  <div className="absolute right-4 top-[38px]">
                    {isEmailValid ? <CheckCircle2 size={18} className="text-[#1ed760]" /> : <AlertCircle size={18} className="text-zinc-500" />}
                  </div>
                )}
              </div>

              <div className="relative">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[11px] font-black text-zinc-400 tracking-[0.2em]">MẬT KHẨU</label>
                  {isLogin && <a href="#" className="text-[11px] font-black text-[#1ed760] hover:underline hover:text-[#1db954] transition-colors tracking-widest">QUÊN MK?</a>}
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 pr-12 text-white font-medium focus:outline-none focus:border-[#1ed760]/50 focus:bg-white/10 transition-all placeholder:text-zinc-600"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-[38px] text-zinc-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                {!isLogin && password.length > 0 && (
                  <div className="absolute right-12 top-[38px]">
                    {isPasswordValid ? <CheckCircle2 size={18} className="text-[#1ed760]" /> : <AlertCircle size={18} className="text-zinc-500" />}
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                disabled={loading || (!isLogin && (!isEmailValid || !isPasswordValid || !isUsernameValid))}
                className="bg-[#1ed760] disabled:bg-[#1ed760]/50 text-black font-black text-sm uppercase tracking-widest py-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all w-full mt-4 shadow-[0_10px_30px_rgba(30,215,96,0.2)] disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {isLogin ? "Đăng nhập" : "Tạo tài khoản"}
              </button>
            </form>

            <div className="mt-8 text-center flex items-center justify-center gap-4">
              <div className="flex-1 h-px bg-white/10"></div>
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Hoặc</span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            <div className="mt-8 text-center text-zinc-400 text-sm font-medium">
              {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}
              <button 
                onClick={toggleMode}
                className="text-white hover:text-[#1ed760] ml-2 font-black transition-colors"
              >
                {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute bottom-8 flex gap-8 border-t border-white/5 pt-6 w-full max-w-lg justify-center text-[10px] font-black text-zinc-600 tracking-[0.2em] uppercase z-10">
        <a href="#" className="hover:text-white transition-colors">Bảo mật</a>
        <a href="#" className="hover:text-white transition-colors">Điều khoản</a>
        <a href="#" className="hover:text-white transition-colors">Hỗ trợ</a>
      </div>
    </div>
  );
}
