import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useLibraryStore } from "../store/libraryStore";
import { useLibrarySync } from "../hooks/useLibrarySync";
import { useAuthStore } from "../store/authStore";
import { usePlayerStore } from "../store/playerStore";
import { useToastStore } from "../store/toastStore";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart, Clock, ListMusic, Play, Plus, Music,
  Library as LibraryIcon, Loader2, LogIn, Trash2, Edit2
} from "lucide-react";
import clsx from "clsx";

type Tab = "playlists" | "liked" | "history";

// ── Skeleton ─────────────────────────────────────────────────────────────────
const Sk = ({ className }: { className?: string; key?: React.Key }) => (
  <div className={clsx("bg-white/5 rounded-xl animate-pulse", className)} />
);

// ── Empty state ───────────────────────────────────────────────────────────────
function Empty({ icon: Icon, t, d }: { icon: any; t: string; d: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 opacity-50 select-none">
      <Icon size={52} className="text-zinc-700 mb-5" />
      <p className="text-lg font-black text-white mb-1">{t}</p>
      <p className="text-sm text-zinc-500 text-center max-w-xs">{d}</p>
    </div>
  );
}

// ── Track row ─────────────────────────────────────────────────────────────────
function TrackRow({ track, isActive, onPlay, sub }: { track: TrackItem; isActive: boolean; onPlay: () => void; sub?: string; key?: React.Key }) {
  return (
    <div
      onClick={onPlay}
      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 cursor-pointer group transition"
    >
      <div className="w-10 h-10 rounded-lg bg-zinc-800 overflow-hidden shrink-0 relative">
        <img
          src={track.cover_url || `https://picsum.photos/seed/${track.id}/80/80`}
          className="w-full h-full object-cover"
          alt={track.title}
        />
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
          <Play size={14} className="fill-white text-white" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className={clsx("text-sm font-bold truncate", isActive ? "text-[#1ed760]" : "text-white")}>
          {track.title}
        </p>
        <p className="text-xs text-zinc-500 truncate">{track.main_artist}</p>
      </div>
      {sub && <span className="text-xs text-zinc-600 shrink-0 hidden sm:block">{sub}</span>}
    </div>
  );
}

// ── Playlist card ─────────────────────────────────────────────────────────────
function PlaylistCard({ p, onClick }: { p: PlaylistItem; onClick: () => void | Promise<void>; key?: React.Key }) {
  return (
    <div onClick={onClick} className="bg-zinc-900/60 hover:bg-zinc-800/70 p-4 rounded-2xl cursor-pointer group transition">
      <div className="aspect-square rounded-xl overflow-hidden bg-zinc-800 mb-3 relative shadow-md">
        <img
          src={p.cover_url || `https://picsum.photos/seed/${p.id}/200/200`}
          className="w-full h-full object-cover group-hover:scale-105 transition"
          alt={p.name}
        />
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
          <Play size={24} className="fill-white text-white" />
        </div>
        {p.visibility === "PRIVATE" && (
          <span className="absolute top-2 left-2 bg-black/60 text-[9px] font-black text-zinc-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
            Riêng tư
          </span>
        )}
      </div>
      <p className="text-sm font-bold text-white truncate">{p.name}</p>
      <p className="text-xs text-zinc-500 mt-0.5">{p.track_count ?? 0} bài hát</p>
    </div>
  );
}

// ── Main Library page ────────────────────────────────────────────────────────
export function Library() {
  const navigate = useNavigate();
  const { userId } = useAuthStore();
  const { setQueue, setPlaying, currentTrack } = usePlayerStore();
  const { addToast } = useToastStore();

  // SSOT Store
  const { likedSongs, playlists, history, isInitialized, addPlaylist, removePlaylist, updatePlaylist } = useLibraryStore();

  // Sync logic (handles fetch if not already in store)
  const { isSyncing } = useLibrarySync();
  const queryClient = useQueryClient();

  // Sync tab with URL
  const queryParams = new URLSearchParams(window.location.search);
  const initialTab = (queryParams.get("tab") as Tab) || "playlists";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  React.useEffect(() => {
    const tab = queryParams.get("tab") as Tab;
    if (tab && tab !== activeTab) setActiveTab(tab);
  }, [window.location.search]);

  const play = (list: TrackItem[], idx: number) => {
    setQueue(list as any[], idx);
    setPlaying(true);
  };

  const createPlaylist = async () => {
    const name = window.prompt("Tên danh sách phát mới:");
    if (!name?.trim()) return;
    try {
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const json = await res.json();
      if (res.ok) {
        addToast("Đã tạo danh sách phát 💿", "success");
        // Optimistic update
        addPlaylist({
          id: json.data.id,
          name: name.trim(),
          track_count: 0,
          visibility: "PRIVATE"
        });
        queryClient.invalidateQueries({ queryKey: ['me', 'library'] });
        navigate(`/playlist/${json.data?.id || ""}`);
      } else {
        addToast(json.error || "Tạo thất bại", "error");
      }
    } catch (err) {
      addToast("Lỗi kết nối server", "error");
    }
  };

  const handleDeletePlaylist = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (!window.confirm(`Xóa danh sách phát "${name}"?`)) return;
    try {
      const res = await fetch(`/api/playlists/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok) {
        removePlaylist(id);
        queryClient.invalidateQueries({ queryKey: ['me', 'library'] });
        addToast("Đã xóa danh sách phát", "success");
      } else {
        addToast(json.error || "Xóa thất bại", "error");
      }
    } catch {
      addToast("Lỗi kết nối", "error");
    }
  };

  const handleRenamePlaylist = async (e: React.MouseEvent, id: string, currentName: string) => {
    e.stopPropagation();
    const newName = window.prompt("Tên mới cho danh sách phát:", currentName);
    if (!newName?.trim() || newName.trim() === currentName) return;
    try {
      const res = await fetch(`/api/playlists/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() })
      });
      const json = await res.json();
      if (res.ok) {
        updatePlaylist(id, { name: newName.trim() });
        queryClient.invalidateQueries({ queryKey: ['me', 'library'] });
        addToast("Đã đổi tên danh sách phát", "success");
      } else {
        addToast(json.error || "Đổi tên thất bại", "error");
      }
    } catch {
      addToast("Lỗi kết nối", "error");
    }
  };


  // Not logged in
  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center h-[65vh] gap-6 text-center animate-in fade-in">
        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center">
          <LibraryIcon size={48} className="text-zinc-500" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white mb-2">Thư viện của bạn</h2>
          <p className="text-zinc-400 text-sm">Đăng nhập để xem playlist, bài đã thích và lịch sử nghe.</p>
        </div>
        <button
          onClick={() => navigate("/auth")}
          className="flex items-center gap-2 bg-[#1ed760] text-black px-8 py-3 rounded-full font-black text-sm hover:scale-105 transition"
        >
          <LogIn size={16} /> Đăng nhập
        </button>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: any; count: number }[] = [
    { id: "playlists", label: "Danh sách phát", icon: ListMusic, count: playlists.length },
    { id: "liked", label: "Bài đã thích", icon: Heart, count: likedSongs.length },
    { id: "history", label: "Lịch sử", icon: Clock, count: history.length },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-32">
      {/* Header */}
      <div className="flex items-center gap-5 mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-[#1ed760] to-[#1db954] rounded-2xl flex items-center justify-center shadow-[0_10px_30px_rgba(30,215,96,0.3)] shrink-0">
          <Music size={28} className="text-black" />
        </div>
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-white">Thư viện</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            {playlists.length} danh sách phát · {likedSongs.length} bài đã thích
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/5 pb-px mb-6">
        {tabs.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "relative flex items-center gap-2 px-5 py-3 text-sm font-bold transition rounded-t-lg",
                active ? "text-white" : "text-zinc-500 hover:text-white"
              )}
            >
              <tab.icon size={15} />
              {tab.label}
              {tab.count > 0 && (
                <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded-full font-black">
                  {tab.count}
                </span>
              )}
              {active && (
                <motion.div
                  layoutId="lib-tab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1ed760]"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {/* PLAYLISTS */}
        {activeTab === "playlists" && (
          <motion.div key="pl" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {!isInitialized && isSyncing ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Sk className="aspect-square" />
                    <Sk className="h-4 w-3/4" />
                    <Sk className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : playlists.length === 0 ? (
              <Empty icon={ListMusic} t="Chưa có danh sách phát" d="Tạo danh sách phát đầu tiên để lưu những bài hát yêu thích." />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {playlists.map(p => (
                  <div
                    key={p.id}
                    className="group relative bg-zinc-900/60 hover:bg-zinc-800/70 p-4 rounded-2xl cursor-pointer transition"
                    onClick={() => navigate(`/playlist/${p.id}`)}
                  >
                    <div className="aspect-square rounded-xl overflow-hidden bg-zinc-800 mb-3 relative shadow-md">
                      <img
                        src={p.cover_url || `https://picsum.photos/seed/${p.id}/200/200`}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                        alt={p.name}
                      />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <Play size={24} className="fill-white text-white" />
                      </div>
                      {p.visibility === "PRIVATE" && (
                        <span className="absolute top-2 left-2 bg-black/60 text-[9px] font-black text-zinc-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Riêng tư
                        </span>
                      )}
                      {/* Edit & Delete overlay */}
                      <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition duration-300">
                        <button
                          onClick={(e) => handleRenamePlaylist(e, p.id, p.name)}
                          className="w-8 h-8 rounded-full bg-black/80 backdrop-blur-md flex items-center justify-center text-zinc-300 hover:text-white hover:bg-[#1ed760]/20 transition-all border border-white/10"
                          title="Đổi tên"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={(e) => handleDeletePlaylist(e, p.id, p.name)}
                          className="w-8 h-8 rounded-full bg-black/80 backdrop-blur-md flex items-center justify-center text-zinc-300 hover:text-rose-500 hover:bg-rose-500/20 transition-all border border-white/10"
                          title="Xóa danh sách phát"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-white truncate">{p.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{p.track_count ?? 0} bài hát</p>
                  </div>
                ))}
                {/* Create new card */}
                <div
                  onClick={createPlaylist}
                  className="aspect-square flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/10 hover:border-[#1ed760]/40 cursor-pointer transition group"
                >
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#1ed760]/10 transition">
                    <Plus size={22} className="text-zinc-500 group-hover:text-[#1ed760] transition" />
                  </div>
                  <span className="text-xs font-bold text-zinc-500 group-hover:text-white transition">Tạo mới</span>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* LIKED */}
        {activeTab === "liked" && (
          <motion.div key="lk" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {!isInitialized && isSyncing ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => <Sk key={i} className="h-14" />)}
              </div>
            ) : likedSongs.length === 0 ? (
              <Empty icon={Heart} t="Chưa có bài hát yêu thích" d="Nhấn tim vào bài hát để lưu ở đây." />
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-zinc-400">{likedSongs.length} bài hát</span>
                  <button
                    onClick={() => { play(likedSongs, 0); addToast("Đang phát Bài đã thích 💖", "success"); }}
                    className="flex items-center gap-2 bg-[#1ed760] text-black px-5 py-2 rounded-full font-black text-xs hover:scale-105 transition"
                  >
                    <Play size={13} className="fill-black" /> Phát tất cả
                  </button>
                </div>
                <div className="space-y-1">
                  {likedSongs.map((t, i) => (
                    <TrackRow
                      key={t.id}
                      track={t}
                      isActive={currentTrack?.id === t.id}
                      onPlay={() => play(likedSongs, i)}
                      sub={`${(t.plays_count || 0).toLocaleString()} lượt`}
                    />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* HISTORY */}
        {activeTab === "history" && (
          <motion.div key="hi" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {!isInitialized && isSyncing ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => <Sk key={i} className="h-14" />)}
              </div>
            ) : history.length === 0 ? (
              <Empty icon={Clock} t="Chưa có lịch sử" d="Bắt đầu nghe nhạc để thấy lịch sử ở đây." />
            ) : (
              <div>
                <p className="text-sm text-zinc-400 mb-4">{history.length} bài gần đây</p>
                <div className="space-y-1">
                  {history.map((t, i) => (
                    <TrackRow
                      key={`${t.id}-${i}`}
                      track={t}
                      isActive={currentTrack?.id === t.id}
                      onPlay={() => play(history, i)}
                      sub={t.played_at ? new Date(t.played_at).toLocaleDateString("vi-VN") : undefined}
                    />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
