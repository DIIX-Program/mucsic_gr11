import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useProfile, useUserTracks, TrackItem } from "../hooks/useUser";
import { useAuthStore } from "../store/authStore";
import { usePlayerStore } from "../store/playerStore";
import { useToastStore } from "../store/toastStore";
import { useLibraryStore, PlaylistItem } from "../store/libraryStore";
import { useLibrarySync } from "../hooks/useLibrarySync";
import { motion, AnimatePresence } from "motion/react";
import {
  User, Music, Heart, Clock, ListMusic, Play, Plus,
  Edit2, Check, Loader2, BarChart3, Zap, Star, Disc, Users, Trash2
} from "lucide-react";
import clsx from "clsx";

type Tab = "tracks" | "playlists" | "liked" | "history";

// ── Skeleton component ────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string; key?: React.Key }) {
  return (
    <div className={clsx("bg-white/5 rounded-lg animate-pulse", className)} />
  );
}

// ── Track row ─────────────────────────────────────────────────────────────────
function TrackRow({
  track,
  isActive,
  onPlay,
  meta,
}: {
  track: TrackItem;
  isActive: boolean;
  onPlay: () => void;
  meta?: string;
  key?: React.Key;
}) {
  return (
    <div
      onClick={onPlay}
      className="flex items-center gap-4 p-2 rounded-xl hover:bg-white/5 transition cursor-pointer group"
    >
      <div className="w-11 h-11 bg-zinc-800 rounded-lg overflow-hidden shrink-0 relative">
        <img
          src={track.cover_url || `https://picsum.photos/seed/${track.id}/80/80`}
          className="w-full h-full object-cover"
          alt={track.title}
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
          <Play size={14} className="fill-white text-white" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className={clsx("text-sm font-semibold truncate", isActive ? "text-[#1ed760]" : "text-white")}>
          {track.title}
        </p>
        <p className="text-xs text-zinc-500 truncate">{track.main_artist}</p>
      </div>
      {meta && <span className="text-xs text-zinc-600 shrink-0">{meta}</span>}
    </div>
  );
}

// ── Playlist card ─────────────────────────────────────────────────────────────
function PlaylistCard({ p, onClick }: { p: PlaylistItem; onClick: () => void | Promise<void>; key?: React.Key }) {
  return (
    <div
      onClick={onClick}
      className="bg-zinc-900/60 p-4 rounded-2xl hover:bg-zinc-800/80 cursor-pointer group transition"
    >
      <div className="aspect-square bg-zinc-800 rounded-xl overflow-hidden relative mb-3">
        <img
          src={p.cover_url || `https://picsum.photos/seed/${p.id}/200/200`}
          className="w-full h-full object-cover group-hover:scale-105 transition"
          alt={p.name}
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
          <Play size={24} className="fill-white text-white" />
        </div>
        {p.visibility === "PRIVATE" && (
          <span className="absolute top-2 right-2 bg-black/60 text-[10px] font-bold text-zinc-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
            Riêng tư
          </span>
        )}
      </div>
      <p className="text-sm font-bold text-white truncate">{p.name}</p>
      <p className="text-xs text-zinc-500 mt-0.5">{p.track_count} bài hát</p>
    </div>
  );
}

// ── Edit Profile Modal ─────────────────────────────────────────────────────────
function EditProfileModal({
  current,
  onClose,
  onSaved,
}: {
  current: { display_name: string; bio: string };
  onClose: () => void;
  onSaved: () => void;
}) {
  const [displayName, setDisplayName] = useState(current.display_name || "");
  const [bio, setBio] = useState(current.bio || "");
  const [saving, setSaving] = useState(false);
  const { addToast } = useToastStore();

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: displayName, bio }),
      });
      const json = await res.json();
      if (res.ok) {
        addToast("Đã cập nhật hồ sơ ✅", "success");
        onSaved();
        onClose();
      } else {
        addToast(json.error || "Cập nhật thất bại", "error");
      }
    } catch {
      addToast("Lỗi kết nối", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        className="bg-zinc-900 border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl"
      >
        <h2 className="text-2xl font-black text-white mb-6">Chỉnh sửa hồ sơ</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">
              Tên hiển thị
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#1ed760]/50 transition"
              placeholder="Tên của bạn..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#1ed760]/50 transition resize-none"
              placeholder="Vài dòng về bạn..."
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-white/10 text-zinc-400 text-sm font-bold hover:bg-white/5 transition"
          >
            Hủy
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-[#1ed760] text-black text-sm font-black hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Lưu
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyState({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 opacity-50">
      <Icon size={48} className="text-zinc-600 mb-4" />
      <p className="text-lg font-bold text-white mb-1">{title}</p>
      <p className="text-sm text-zinc-400">{desc}</p>
    </div>
  );
}

// ── Main ProfilePage ───────────────────────────────────────────────────────────
export function Profile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userId: currentUserId } = useAuthStore();
  const { addToast } = useToastStore();
  const { setQueue, setPlaying, currentTrack } = usePlayerStore();

  const isOwnProfile = currentUserId === id;
  const [activeTab, setActiveTab] = useState<Tab>("tracks");
  const [editOpen, setEditOpen] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const { data: profile, isLoading: profileLoading, error: profileError } = useProfile(id);
  
  // SSOT: Use libraryStore if viewing own profile
  const { likedSongs, playlists: myPlaylists, history: myHistory, isInitialized, addPlaylist, removePlaylist, updatePlaylist } = useLibraryStore();
  const { isSyncing: libraryLoading } = useLibrarySync();
  
  const playlists = isOwnProfile ? myPlaylists : [];
  const liked     = isOwnProfile ? likedSongs : [];
  const history   = isOwnProfile ? myHistory : [];
  
  const { data: userTracks = [], isLoading: userTracksLoading } = useUserTracks(id);

  const handleDeletePlaylist = async (e: React.MouseEvent, pid: string, pname: string) => {
    e.stopPropagation();
    if (!window.confirm(`Xóa danh sách phát "${pname}"?`)) return;
    try {
      const res = await fetch(`/api/playlists/${pid}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok) {
        removePlaylist(pid);
        addToast("Đã xóa danh sách phát", "success");
      } else {
        addToast(json.error || "Xóa thất bại", "error");
      }
    } catch {
      addToast("Lỗi kết nối", "error");
    }
  };

  const handleRenamePlaylist = async (e: React.MouseEvent, pid: string, currentName: string) => {
    e.stopPropagation();
    const newName = window.prompt("Tên mới cho danh sách phát:", currentName);
    if (!newName?.trim() || newName.trim() === currentName) return;
    try {
      const res = await fetch(`/api/playlists/${pid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() })
      });
      const json = await res.json();
      if (res.ok) {
        updatePlaylist(pid, { name: newName.trim() });
        addToast("Đã đổi tên danh sách phát", "success");
      } else {
        addToast(json.error || "Đổi tên thất bại", "error");
      }
    } catch {
      addToast("Lỗi kết nối", "error");
    }
  };

  const handleFollow = async () => {
    if (!currentUserId) return navigate("/auth");
    setFollowLoading(true);
    try {
      const endpoint = profile?.isFollowing ? "unfollow" : "follow";
      const res = await fetch(`/api/users/${id}/${endpoint}`, { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["profile", id] });
        addToast(profile?.isFollowing ? "Đã bỏ theo dõi" : "Đã theo dõi 🎵", "success");
      } else {
        addToast(json.error || "Lỗi", "error");
      }
    } catch {
      addToast("Lỗi kết nối", "error");
    } finally {
      setFollowLoading(false);
    }
  };

  const playTrack = (track: TrackItem) => {
    setQueue([track as any], 0);
    setPlaying(true);
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "tracks", label: "Bài hát", icon: Music },
    { id: "playlists", label: "Danh sách phát", icon: ListMusic },
    { id: "liked", label: "Đã thích", icon: Heart },
    { id: "history", label: "Lịch sử", icon: Clock },
  ];

  // ── Loading ──
  if (profileLoading) {
    return (
      <div className="max-w-6xl mx-auto pb-24 pt-4 space-y-6 px-4">
        <div className="relative h-64 rounded-3xl overflow-hidden">
          <Skeleton className="w-full h-full rounded-3xl" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="w-32 h-32 rounded-full shrink-0" />
          <div className="flex-1 space-y-3 pt-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-80" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <p className="text-2xl font-black text-white opacity-30">Không tìm thấy người dùng.</p>
      </div>
    );
  }

  const bgCover = profile.banner_url || `https://picsum.photos/seed/${profile.id}/1200/400`;

  return (
    <>
      <AnimatePresence>
        {editOpen && (
          <EditProfileModal
            current={{ display_name: profile.display_name, bio: profile.bio }}
            onClose={() => setEditOpen(false)}
            onSaved={() => queryClient.invalidateQueries({ queryKey: ["profile", id] })}
          />
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto pb-32">
        {/* ── HEADER ── */}
        <div className="relative h-72 md:h-80 rounded-b-[40px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center brightness-50"
            style={{ backgroundImage: `url(${bgCover})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />

          <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
              {/* Avatar */}
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-zinc-800 border-4 border-[#1ed760]/20 overflow-hidden shrink-0 shadow-2xl">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} className="w-full h-full object-cover" alt={profile.display_name} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User size={50} className="text-zinc-600" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex items-center gap-1.5 bg-[#1ed760] px-2.5 py-0.5 rounded-full">
                    <Check size={10} strokeWidth={3} />
                    <span className="text-[9px] font-black uppercase tracking-widest text-black">Đã xác minh</span>
                  </div>
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none mb-2">
                  {profile.display_name || profile.username}
                </h1>
                {profile.bio && (
                  <p className="text-zinc-300 text-sm max-w-xl mb-3 line-clamp-2">{profile.bio}</p>
                )}
                {/* Stats */}
                <div className="flex gap-6 text-sm">
                  {[
                    { n: profile.followers_count, label: "Người theo dõi" },
                    { n: profile.following_count, label: "Đang theo dõi" },
                    { n: profile.total_tracks,    label: "Bài hát" },
                    { n: profile.total_playlists, label: "Danh sách phát" },
                  ].map(({ n, label }) => (
                    <div key={label}>
                      <span className="font-black text-white text-base">{(n ?? 0).toLocaleString()}</span>
                      <span className="text-zinc-400 ml-1.5">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action button */}
              <div className="ml-auto">
                {isOwnProfile ? (
                  <button
                    onClick={() => setEditOpen(true)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-white/20 text-white text-sm font-bold bg-white/10 backdrop-blur hover:bg-white/20 transition"
                  >
                    <Edit2 size={14} />
                    Chỉnh sửa
                  </button>
                ) : (
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={clsx(
                      "px-7 py-2.5 rounded-full font-bold text-sm transition",
                      profile.isFollowing
                        ? "border border-white/20 text-white hover:border-white/50"
                        : "bg-[#1ed760] text-black hover:scale-105"
                    )}
                  >
                    {followLoading ? <Loader2 size={14} className="animate-spin" /> :
                      profile.isFollowing ? "Đang theo dõi" : "Theo dõi"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="flex gap-1 px-6 md:px-12 mt-8 border-b border-white/5 pb-px">
          {tabs.map((tab) => {
            // Only show own-data tabs if own profile
            if ((tab.id === "liked" || tab.id === "history" || tab.id === "playlists") && !isOwnProfile) return null;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "relative flex items-center gap-2 px-5 py-3 text-sm font-bold transition rounded-t-lg",
                  isActive ? "text-white" : "text-zinc-500 hover:text-white"
                )}
              >
                <tab.icon size={15} />
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1ed760]"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* ── TAB CONTENT ── */}
        <div className="px-6 md:px-12 mt-6">
          <AnimatePresence mode="wait">
            {/* TRACKS */}
            {activeTab === "tracks" && (
              <motion.div key="tracks" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {userTracksLoading ? (
                   <div className="space-y-2">
                     {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
                   </div>
                ) : userTracks.length === 0 ? (
                  <EmptyState icon={Music} title="Chưa có bài hát" desc="Người dùng này chưa tải lên bài hát nào." />
                ) : (
                  <div className="space-y-1">
                    <p className="text-zinc-500 text-sm pb-4 uppercase font-black tracking-widest">
                       BÀI HÁT TẢI LÊN ({userTracks.length})
                    </p>
                    {userTracks.map((track) => (
                      <TrackRow
                        key={track.id}
                        track={track}
                        isActive={currentTrack?.id === track.id}
                        onPlay={() => playTrack(track)}
                        meta={track.plays_count?.toLocaleString() + " lượt nghe"}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* PLAYLISTS */}
            {activeTab === "playlists" && isOwnProfile && (
              <motion.div key="playlists" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {!isInitialized && libraryLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="aspect-square rounded-xl" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : playlists.length === 0 ? (
                  <EmptyState icon={ListMusic} title="Chưa có danh sách phát" desc="Tạo danh sách phát đầu tiên để lưu nhạc yêu thích." />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {playlists.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => navigate(`/playlist/${p.id}`)}
                        className="group relative bg-zinc-900/60 p-4 rounded-2xl hover:bg-zinc-800/80 cursor-pointer transition"
                      >
                        <div className="aspect-square bg-zinc-800 rounded-xl overflow-hidden relative mb-3">
                          <img
                            src={p.cover_url || `https://picsum.photos/seed/${p.id}/200/200`}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                            alt={p.name}
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                            <Play size={24} className="fill-white text-white" />
                          </div>
                          {p.visibility === "PRIVATE" && (
                            <span className="absolute top-2 right-2 bg-black/60 text-[10px] font-bold text-zinc-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Riêng tư
                            </span>
                          )}
                          {/* Edit & Delete overlay for own profile */}
                          <div className="absolute top-2 left-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition">
                            <button
                              onClick={(e) => handleRenamePlaylist(e, p.id, p.name)}
                              className="w-7 h-7 rounded-full bg-black/70 backdrop-blur flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/20 transition"
                              title="Đổi tên"
                            >
                              <Edit2 size={11} />
                            </button>
                            <button
                              onClick={(e) => handleDeletePlaylist(e, p.id, p.name)}
                              className="w-7 h-7 rounded-full bg-black/70 backdrop-blur flex items-center justify-center text-zinc-300 hover:text-rose-500 hover:bg-rose-500/20 transition"
                              title="Xóa"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm font-bold text-white truncate">{p.name}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{p.track_count} bài hát</p>
                      </div>
                    ))}
                    <div
                      onClick={async () => {
                        const name = window.prompt("Tên danh sách phát mới:");
                        if (!name) return;
                        const res = await fetch("/api/playlists", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ name }),
                        });
                        const json = await res.json();
                        if (res.ok) {
                          addToast("Đã tạo danh sách phát 💿", "success");
                          addPlaylist({
                            id: json.data.id,
                            name: name.trim(),
                            track_count: 0,
                            visibility: "PRIVATE"
                          });
                        }
                      }}
                      className="aspect-square flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 hover:border-[#1ed760]/40 cursor-pointer transition group"
                    >
                      <Plus size={24} className="text-zinc-500 group-hover:text-[#1ed760] transition mb-2" />
                      <span className="text-xs text-zinc-500 font-bold group-hover:text-white transition">Tạo mới</span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* LIKED */}
            {activeTab === "liked" && isOwnProfile && (
              <motion.div key="liked" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {!isInitialized && libraryLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
                  </div>
                ) : liked.length === 0 ? (
                  <EmptyState icon={Heart} title="Chưa có bài hát yêu thích" desc="Thả tim vào bài hát bạn nghe để lưu lại ở đây." />
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between py-2 mb-2">
                      <span className="text-sm text-zinc-400 font-medium">{liked.length} bài hát</span>
                      <button
                        onClick={() => { setQueue(liked as any[], 0); setPlaying(true); }}
                        className="flex items-center gap-2 bg-[#1ed760] text-black px-4 py-2 rounded-full text-xs font-bold hover:scale-105 transition"
                      >
                        <Play size={12} className="fill-black" /> Phát tất cả
                      </button>
                    </div>
                    {liked.map((track) => (
                      <TrackRow
                        key={track.id}
                        track={track}
                        isActive={currentTrack?.id === track.id}
                        onPlay={() => playTrack(track)}
                        meta={track.plays_count?.toLocaleString() + " lượt nghe"}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* HISTORY */}
            {activeTab === "history" && isOwnProfile && (
              <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {!isInitialized && libraryLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
                  </div>
                ) : history.length === 0 ? (
                  <EmptyState icon={Clock} title="Chưa có lịch sử" desc="Bắt đầu nghe nhạc để xem lịch sử của bạn." />
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm text-zinc-400 pb-2">{history.length} bài gần đây</p>
                    {history.map((track, i) => (
                      <TrackRow
                        key={`${track.id}-${i}`}
                        track={track}
                        isActive={currentTrack?.id === track.id}
                        onPlay={() => playTrack(track)}
                        meta={track.played_at ? new Date(track.played_at).toLocaleDateString("vi-VN") : undefined}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
