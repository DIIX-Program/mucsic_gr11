import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  User, Plus, ShieldCheck, Upload, ChevronRight,
  Clock3, Heart, Compass, Home, Library, LogOut, LogIn, ListMusic
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { usePlayerStore } from "../store/playerStore";
import { CreatePlaylistModal } from "./CreatePlaylistModal";
import clsx from "clsx";
import { useLocation } from "react-router-dom";
import { useLibrarySync } from "../hooks/useLibrarySync";
import { useLibraryStore } from "../store/libraryStore";

export function Sidebar() {
  const { userId, isAdmin } = useAuthStore();
  const { setPlaying } = usePlayerStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { data: libraryData, isSyncing } = useLibrarySync();
  const { playlists, likedSongs, history } = useLibraryStore();
  
  const handleLogout = async () => {
    setPlaying(false);
    await fetch("/api/auth/logout", { method: "POST" });
    useAuthStore.getState().setAuth(null, false);
    navigate("/auth");
  };

  const NavItem = ({ to, icon: Icon, label, badge, indent }: { to: string; icon: any; label: string; badge?: number, indent?: boolean }) => {
    const active = location.pathname === to || (to !== "/" && location.pathname.startsWith(to) && !to.includes("tab="));
    // Specialized check for tabbed links
    const isTabActive = location.search.includes(to.split("?")[1] || "___") || (to === "/library" && !location.search.includes("tab"));
    
    const isActive = to.includes("tab=") ? isTabActive : active;

    return (
      <Link
        to={to}
        className={clsx(
          "flex items-center gap-3 py-2 rounded-xl font-bold text-sm transition-all group",
          indent ? "pl-8 pr-3" : "px-3",
          isActive ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white hover:bg-white/5"
        )}
      >
        <Icon size={indent ? 16 : 18} className={clsx("shrink-0 transition-transform group-hover:scale-110", isActive && "text-[#1ed760]")} />
        <span className="truncate">{label}</span>
        {badge ? (
          <span className="ml-auto bg-[#1ed760] text-black text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
            {badge}
          </span>
        ) : null}
      </Link>
    );
  };

  return (
    <div className="bg-black h-full flex flex-col w-64 shrink-0 border-r border-white/5">
      {/* Logo */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-xl font-black tracking-tighter text-white">MusicEVE</h1>
        <p className="text-[#1ed760] text-[9px] font-black uppercase tracking-[0.25em] mt-0.5 opacity-70">
          Music Streaming
        </p>
      </div>

      {/* Main Nav */}
      <nav className="px-3 space-y-0.5">
        <NavItem to="/"        icon={Home}       label="Trang chủ" />
        <NavItem to="/search"  icon={Compass}    label="Khám phá" />
        <NavItem to="/library" icon={Library}    label="Thư viện" />
        
        {userId && (
          <div className="space-y-0.5 mt-1 animate-in slide-in-from-left duration-300">
            <NavItem to="/library?tab=playlists" icon={ListMusic} label="Danh sách phát" indent badge={playlists.length} />
            <NavItem to="/library?tab=liked"     icon={Heart}     label="Bài đã thích"   indent badge={likedSongs.length} />
            <NavItem to="/library?tab=history"   icon={Clock3}    label="Lịch sử"        indent />
          </div>
        )}

        {userId && <NavItem to="/upload" icon={Upload} label="Tải lên" />}
        {isAdmin && (
          <NavItem to="/admin" icon={ShieldCheck} label="Quản trị" />
        )}
      </nav>

      {/* Divider */}
      <div className="mx-3 my-4 border-t border-white/5" />

      {/* Playlists section */}
      <div className="px-3 flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">
            Playlists của tôi
          </span>
          {userId && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-6 h-6 bg-zinc-800 hover:bg-[#1ed760] hover:text-black text-zinc-400 rounded-md flex items-center justify-center transition-all"
              title="Tạo playlist mới"
            >
              <Plus size={13} strokeWidth={3} />
            </button>
          )}
        </div>

        {userId ? (
          <div className="space-y-0.5 overflow-y-auto scrollbar-hide flex-1">
            {playlists.length === 0 ? (
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-zinc-600 hover:text-zinc-300 hover:bg-white/5 transition text-sm font-medium border border-dashed border-white/10"
              >
                <Plus size={16} />
                <span>Tạo danh sách phát</span>
              </button>
            ) : (
              <>
                {playlists.map(p => (
                  <Link
                    key={p.id}
                    to={`/playlist/${p.id}`}
                    className={clsx(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-all group",
                      location.pathname === `/playlist/${p.id}`
                        ? "bg-white/10 text-white"
                        : "text-zinc-500 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                      <img
                        src={p.cover_url || `https://picsum.photos/seed/${p.id}/80/80`}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition"
                        alt={p.name}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{p.name}</p>
                      <p className="text-[10px] text-zinc-600 truncate">{p.track_count ?? 0} bài</p>
                    </div>
                  </Link>
                ))}
                <Link
                  to="/library"
                  className="flex items-center gap-2 px-3 py-2 text-zinc-600 hover:text-zinc-300 text-xs font-bold transition"
                >
                  <span>Xem tất cả</span>
                  <ChevronRight size={12} />
                </Link>
              </>
            )}
          </div>
        ) : (
          <p className="text-xs text-zinc-600 px-3">Đăng nhập để xem playlist</p>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 pb-4 mt-auto pt-4 border-t border-white/5 space-y-1">
        {userId ? (
          <>
            <Link
              to={`/profile/${userId}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 font-bold text-sm transition group"
            >
              <User size={18} className="shrink-0 transition-transform group-hover:scale-110" />
              <span>Hồ sơ</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 font-bold text-sm transition group"
            >
              <LogOut size={18} className="shrink-0 transition-transform group-hover:scale-110" />
              <span>Đăng xuất</span>
            </button>
          </>
        ) : (
          <Link to="/auth" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#1ed760] hover:bg-[#1ed760]/10 font-bold text-sm transition">
            <LogIn size={18} />
            <span>Đăng nhập</span>
          </Link>
        )}
      </div>

      <CreatePlaylistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(p) => {
          // Store will update via refetch in useLibrarySync if I invalidate it, 
          // or I can manually add it to store for instant feedback.
          // Since useLibrarySync uses react-query, I should invalidate the query.
          navigate(`/playlist/${p.id}`);
        }}
      />
    </div>

  );
}
