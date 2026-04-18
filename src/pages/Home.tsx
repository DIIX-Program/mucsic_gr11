import React, { useState } from "react";
import { usePlayerStore, Track } from "../store/playerStore";
import { useLibraryStore } from "../store/libraryStore";
import { useQuery } from "@tanstack/react-query";
import { Play, Heart, TrendingUp, Music, Zap, Star, Sparkles, Clock3, Pause, Radio, ListPlus } from "lucide-react";
import { PlaylistPickerModal } from "../components/PlaylistPickerModal";
import { useToastStore } from "../store/toastStore";
import { useAuthStore } from "../store/authStore";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import clsx from "clsx";

// ── Local Track Card (Showcase card for @nhac collection) ────────────────────
function LocalTrackCard({ track, index, onPlay, isCurrentlyPlaying, onAddToPlaylist }: {
  track: Track; index: number; onPlay: () => void; isCurrentlyPlaying: boolean; onAddToPlaylist: (e: React.MouseEvent) => void;
}) {
  const colors = [
    { from: "#1ed760", to: "#0ea5e9", glow: "rgba(30,215,96,0.3)" },
    { from: "#a855f7", to: "#ec4899", glow: "rgba(168,85,247,0.3)" },
    { from: "#f59e0b", to: "#ef4444", glow: "rgba(245,158,11,0.3)" },
  ];
  const color = colors[index % colors.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15, duration: 0.5, ease: "easeOut" }}
      onClick={onPlay}
      className="group relative cursor-pointer rounded-[32px] overflow-hidden border border-white/5 hover:border-white/10 transition-all duration-700"
      style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.3) 100%)" }}
    >
      {/* Gradient glow background */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        style={{ background: `radial-gradient(circle at 30% 50%, ${color.glow}, transparent 60%)` }}
      />

      <div className="relative flex items-center gap-6 p-7">
        {/* Cover art */}
        <div className="relative shrink-0 w-24 h-24 rounded-2xl overflow-hidden shadow-2xl group-hover:scale-105 transition-transform duration-500">
          <img
            src={track.cover_url || `https://picsum.photos/seed/${track.id + "local"}/300/300`}
            className="w-full h-full object-cover"
            alt={track.title}
          />
          {/* Play overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {isCurrentlyPlaying ? (
              <Pause size={32} className="text-white fill-white" />
            ) : (
              <Play size={32} className="text-white fill-white ml-1" />
            )}
          </div>
          {/* Playing indicator */}
          {isCurrentlyPlaying && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex gap-[3px] items-end h-8">
                {[1, 2, 3, 4].map(bar => (
                  <motion.div
                    key={bar}
                    className="w-1 rounded-full"
                    style={{ background: `linear-gradient(to top, ${color.from}, ${color.to})` }}
                    animate={{ height: ["40%", "100%", "60%", "80%", "40%"] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: bar * 0.1 }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-[9px] font-black uppercase tracking-[0.3em] px-2 py-1 rounded-lg"
              style={{ background: `linear-gradient(135deg, ${color.from}22, ${color.to}22)`, color: color.from }}
            >
              Local Audio
            </span>
            {isCurrentlyPlaying && (
              <span className="text-[9px] font-black uppercase tracking-widest text-[#1ed760] animate-pulse">
                ▶ Đang phát
              </span>
            )}
          </div>
          <h4 className="text-xl font-black text-white truncate mb-1 group-hover:text-[#1ed760] transition-colors duration-300">
            {track.title}
          </h4>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest truncate">
            {track.main_artist}
          </p>

          {/* Fake waveform */}
          <div className="flex gap-[2px] items-end h-6 mt-4 opacity-20 group-hover:opacity-60 transition-opacity duration-500">
            {Array.from({ length: 32 }, (_, i) => (
              <div
                key={i}
                className="w-[3px] rounded-full"
                style={{
                  height: `${20 + Math.sin(i * 0.8 + index) * 15 + Math.random() * 10}%`,
                  background: `linear-gradient(to top, ${color.from}, ${color.to})`,
                  minHeight: "20%"
                }}
              />
            ))}
          </div>
        </div>

        {/* Add to Playlist button */}
        <button 
          onClick={onAddToPlaylist}
          className="shrink-0 w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-[#1ed760]/50 group-hover:bg-[#1ed760]/10 transition-all duration-500 text-zinc-600 group-hover:text-[#1ed760]"
          title="Thêm vào danh sách phát"
        >
          <ListPlus size={18} />
        </button>

        {/* Play Icon */}
        <div className="shrink-0 w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-[#1ed760]/50 group-hover:bg-[#1ed760]/10 transition-all duration-500">
          <Play size={16} className="text-zinc-600 group-hover:text-[#1ed760] fill-current transition-colors ml-0.5" />
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Home Page ────────────────────────────────────────────────────────────
export function Home() {
  const { setQueue, setPlaying, toggleLike, currentTrack, isPlaying } = usePlayerStore();
  const { likedSongs, toggleLikeOptimistic } = useLibraryStore();
  const { addToast } = useToastStore();
  const { userId } = useAuthStore();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["home-data", userId],
    queryFn: async () => {
      const res = await fetch("/api/home");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as {
        trending: Track[];
        newReleases: Track[];
        localNhac: Track[];
        recentlyPlayed: Track[];
        recommended: Track[];
      };
    },
    staleTime: 1000 * 60, 
    retry: 2,
  });

  const likedTrackIds = new Set(likedSongs.map(s => s.id));

  const handlePlayHero = () => {
    const allTracks = [...(data?.localNhac || []), ...(data?.trending || [])];
    if (allTracks.length > 0) {
      setQueue(allTracks, 0);
      setPlaying(true);
      addToast("Bắt đầu trải nghiệm âm nhạc! 🎶", "success");
    }
  };

  const handlePlayTrack = (trackList: Track[], index: number) => {
    setQueue(trackList, index);
    setPlaying(true);
  };

  const handleToggleLike = (track: Track, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) return addToast("Vui lòng đăng nhập để yêu thích nhạc!", "info");
    const isLiked = likedTrackIds.has(track.id);
    toggleLike(track.id);
    toggleLikeOptimistic(track as any, !isLiked);
  };

  const handleAddToPlaylist = (trackId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) return addToast("Vui lòng đăng nhập để lưu nhạc!", "info");
    setSelectedTrackId(trackId);
    setPickerOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-12 p-8 animate-pulse">
        <div className="h-[520px] bg-zinc-900/60 rounded-[48px]" />
        <div className="h-[200px] bg-zinc-900/40 rounded-[32px]" />
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-6">
          {[...Array(6)].map((_, i) => <div key={i} className="aspect-square bg-zinc-900/60 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (error || !data || (data.trending.length === 0 && data.localNhac.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-6 text-center">
        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center">
          <Music size={48} className="text-zinc-700" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white">Úp! Có lỗi xảy ra.</h2>
          <p className="text-zinc-400 max-w-sm">Chúng tôi không thể tải được dữ liệu âm nhạc lúc này. Vui lòng thử lại sau.</p>
        </div>
        <button 
          onClick={() => refetch()}
          className="bg-[#1ed760] text-black px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition shadow-lg"
        >
          Tải lại trang chủ
        </button>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24, scale: 0.97 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" } }
  };

  return (
    <div className="flex flex-col gap-20 pb-32">

      {/* ══════════════════════════════════════════════════════════════
          1. HERO SECTION - CINEMATIC BANNER
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative h-[560px] rounded-[48px] overflow-hidden group shadow-[0_40px_120px_rgba(0,0,0,0.8)] border border-white/5">
        {/* Background Image */}
        <img
          src="https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80&w=2000"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[8s] group-hover:scale-110 brightness-[0.35]"
          alt="Music Hero"
        />

        {/* Layered overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-transparent to-transparent" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_15%_85%,_rgba(30,215,96,0.12),_transparent_50%)]" />
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_85%_15%,_rgba(139,92,246,0.08),_transparent_50%)]" />

        {/* Content */}
        <div className="absolute inset-0 p-16 flex flex-col justify-between items-start">
          {/* Top badge */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 bg-white/5 backdrop-blur-2xl px-5 py-2.5 rounded-full border border-white/10"
          >
            <Radio size={14} className="text-[#1ed760] animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/70">MusicEVE Platform</span>
            <div className="w-1.5 h-1.5 bg-[#1ed760] rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1ed760]">Live</span>
          </motion.div>

          {/* Main content */}
          <div className="space-y-6">
            <motion.div
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-3 mb-4"
            >
              <Star size={14} className="text-yellow-400 fill-yellow-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Highlight của tuần</span>
            </motion.div>

            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-[7rem] xl:text-[9rem] font-black tracking-tighter text-white leading-[0.85] drop-shadow-[0_0_60px_rgba(255,255,255,0.15)]"
            >
              ÂM<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1ed760] via-white to-[#1ed760]">
                NHẠC
              </span>
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-zinc-400 font-bold text-lg max-w-xl leading-relaxed"
            >
              Trải nghiệm âm nhạc đỉnh cao – nơi mỗi giai điệu là một hành trình mới lạ chỉ dành riêng cho bạn.
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-5 pt-4"
            >
              <button
                onClick={handlePlayHero}
                className="group/btn bg-[#1ed760] text-black px-12 py-5 rounded-full font-black text-sm uppercase tracking-[0.3em] shadow-[0_20px_60px_rgba(30,215,96,0.4)] hover:bg-white hover:shadow-[0_20px_60px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
              >
                <Play size={22} fill="currentColor" />
                Phát ngay
              </button>
              <Link
                to="/search"
                className="bg-white/5 backdrop-blur-3xl text-white border border-white/10 px-12 py-5 rounded-full font-black text-sm uppercase tracking-[0.3em] hover:bg-white/10 transition-all hover:border-white/20"
              >
                Khám phá
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Stats bar at bottom right */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="absolute bottom-12 right-16 flex gap-8 text-right"
        >
          {[
            { n: (data?.trending.length || 0) + (data?.newReleases.length || 0), label: "Bài hát" },
            { n: data?.recommended?.length || 0, label: "Đề xuất" },
            { n: data?.localNhac?.length || 0, label: "Bộ sưu tập" },
          ].map(({ n, label }) => (
            <div key={label} className="flex flex-col">
              <span className="text-2xl font-black text-white">{n}+</span>
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">{label}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          2. LOCAL COLLECTION (@nhac) - FEATURED SHOWCASE
      ══════════════════════════════════════════════════════════════ */}
      {data?.localNhac && data.localNhac.length > 0 && (
        <section className="space-y-10">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-[#1ed760] to-[#0ea5e9] rounded-2xl flex items-center justify-center shadow-[0_10px_30px_rgba(30,215,96,0.4)]">
                  <Music size={22} className="text-black" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#1ed760] rounded-full border-2 border-[#0a0a0a] animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#1ed760]">Bộ sưu tập cục bộ</span>
                </div>
                <h2 className="text-4xl font-black tracking-tighter flex items-center gap-3">
                  @nhac
                  <span className="text-sm font-black bg-[#1ed760]/10 text-[#1ed760] px-3 py-1 rounded-full border border-[#1ed760]/20 uppercase tracking-widest">
                    {data.localNhac.length} bài
                  </span>
                </h2>
              </div>
            </div>
            <button
              onClick={() => handlePlayTrack(data.localNhac, 0)}
              className="flex items-center gap-3 bg-[#1ed760]/10 hover:bg-[#1ed760]/20 text-[#1ed760] border border-[#1ed760]/20 px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all hover:scale-105"
            >
              <Play size={14} className="fill-current" /> Phát tất cả
            </button>
          </motion.div>

          {/* Track Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.localNhac.map((track, i) => (
              <LocalTrackCard
                key={track.id}
                track={track}
                index={i}
                onPlay={() => handlePlayTrack(data.localNhac, i)}
                isCurrentlyPlaying={currentTrack?.id === track.id && isPlaying}
                onAddToPlaylist={(e) => handleAddToPlaylist(track.id, e)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          3. TRENDING
      ══════════════════════════════════════════════════════════════ */}
      {data?.trending && data.trending.length > 0 && (
        <section className="space-y-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <TrendingUp className="text-[#1ed760]" size={32} />
              <h2 className="text-4xl font-black tracking-tighter">Thịnh hành</h2>
            </div>
            <Link to="/search" className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 hover:text-white transition">
              Khám phá →
            </Link>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5"
          >
            {data.trending.slice(0, 12).map((track, i) => (
              <motion.div
                variants={itemVariants}
                key={track.id}
                className="group relative flex flex-col gap-3 p-3 rounded-[24px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:border-[#1ed760]/30 transition-all duration-300 cursor-pointer hover:shadow-[0_15px_30px_rgba(30,215,96,0.1)] hover:-translate-y-2 overflow-hidden"
              >
                <div className="aspect-square rounded-2xl overflow-hidden relative shadow-md" onClick={() => handlePlayTrack(data.trending, i)}>
                  <img
                    src={track.cover_url || `https://picsum.photos/seed/${track.id}/400/400`}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    alt={track.title}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                    <div className="w-12 h-12 bg-[#1ed760] rounded-full flex items-center justify-center shadow-[0_10px_20px_rgba(30,215,96,0.6)] transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <Play size={22} className="fill-black text-black ml-1" />
                    </div>
                  </div>
                  {/* Rank badge */}
                  <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/80 flex items-center justify-center">
                    <span className="text-[9px] font-black text-zinc-400">{i + 1}</span>
                  </div>
                </div>
                <div className="px-1" onClick={() => handlePlayTrack(data.trending, i)}>
                  <h3 className={clsx(
                    "font-black text-sm text-white truncate mb-0.5 transition-colors",
                    currentTrack?.id === track.id ? "text-[#1ed760]" : "group-hover:text-[#1ed760]"
                  )}>
                    {track.title}
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-bold tracking-wider truncate">{track.main_artist}</p>
                </div>
                <div className="absolute top-5 right-5 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
                  <button
                    onClick={(e) => handleAddToPlaylist(track.id, e)}
                    className="p-2 rounded-full bg-black/40 text-white border border-white/10 hover:bg-white/10 backdrop-blur-md active:scale-75 transition-all"
                    title="Thêm vào danh sách phát"
                  >
                    <ListPlus size={14} />
                  </button>
                  <button
                    onClick={(e) => handleToggleLike(track, e)}
                    className={clsx(
                      "p-2 rounded-full backdrop-blur-md transition-all active:scale-75 border shadow-2xl",
                      likedTrackIds.has(track.id)
                        ? "bg-[#1ed760] text-black border-transparent"
                        : "bg-black/40 text-white border-white/10 hover:bg-white/10"
                    )}
                  >
                    <Heart size={14} className={likedTrackIds.has(track.id) ? "fill-current" : ""} />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          4. RECOMMENDED
      ══════════════════════════════════════════════════════════════ */}
      {data?.recommended && data.recommended.length > 0 && (
        <section className="space-y-10">
          <div className="flex items-center gap-4">
            <Star className="text-yellow-400 fill-yellow-400/30" size={30} />
            <h2 className="text-4xl font-black tracking-tighter">Dành cho bạn</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {data.recommended.slice(0, 12).map((track, i) => (
              <div
                key={track.id}
                onClick={() => handlePlayTrack(data.recommended, i)}
                className="group relative flex flex-col gap-3 p-3 rounded-[24px] bg-white/[0.01] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 cursor-pointer hover:-translate-y-1"
              >
                <div className="aspect-square rounded-2xl overflow-hidden relative">
                  <img
                    src={track.cover_url || `https://picsum.photos/seed/${track.id}/400/400`}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    alt={track.title}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <Play size={24} className="fill-white text-white" />
                  </div>
                </div>
                <div className="px-1">
                  <h3 className="font-bold text-sm text-white truncate group-hover:text-[#1ed760] transition">{track.title}</h3>
                  <p className="text-[10px] text-zinc-500">{track.main_artist}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          5. NEW RELEASES
      ══════════════════════════════════════════════════════════════ */}
      {data?.newReleases && data.newReleases.length > 0 && (
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Zap className="text-[#1ed760]" size={30} />
              <h2 className="text-4xl font-black tracking-tighter">Mới ra mắt</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.newReleases.map((track, i) => (
              <div
                key={track.id}
                onClick={() => handlePlayTrack(data.newReleases, i)}
                className="group flex items-center gap-4 p-4 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition cursor-pointer hover:-translate-y-0.5"
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 relative">
                  <img src={track.cover_url || `https://picsum.photos/seed/${track.id}/100/100`} className="w-full h-full object-cover" alt={track.title} />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <Play size={18} className="fill-[#1ed760] text-[#1ed760]" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={clsx(
                    "font-bold text-base truncate transition",
                    currentTrack?.id === track.id ? "text-[#1ed760]" : "text-white group-hover:text-[#1ed760]"
                  )}>
                    {track.title}
                  </h4>
                  <p className="text-xs text-zinc-500">{track.main_artist}</p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition shrink-0">
                  <Play size={18} className="fill-[#1ed760] text-[#1ed760]" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          6. RECENTLY PLAYED
      ══════════════════════════════════════════════════════════════ */}
      {data?.recentlyPlayed && data.recentlyPlayed.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <Clock3 className="text-zinc-500" size={24} />
            <h2 className="text-2xl font-black tracking-tighter text-zinc-200">Nghe gần đây</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {data.recentlyPlayed.map((track, i) => (
              <div
                key={track.id + i}
                onClick={() => handlePlayTrack(data.recentlyPlayed, i)}
                className="w-32 shrink-0 group cursor-pointer"
              >
                <div className="aspect-square rounded-2xl overflow-hidden mb-2 relative">
                  <img
                    src={track.cover_url || `https://picsum.photos/seed/${track.id}/200/200`}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    alt={track.title}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <Play size={20} className="fill-[#1ed760] text-[#1ed760]" />
                  </div>
                </div>
                <p className="text-xs font-bold text-zinc-300 truncate group-hover:text-white">{track.title}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          7. PROMO SECTION
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden rounded-[48px] border border-white/5">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1ed760]/10 via-[#0ea5e9]/5 to-[#a855f7]/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_50%,_rgba(30,215,96,0.15),_transparent_50%)]" />
        <div className="absolute top-0 right-0 p-12 opacity-[0.04]">
          <Sparkles size={320} />
        </div>

        <div className="relative z-10 p-16 space-y-6">
          <div className="flex items-center gap-3 text-[#1ed760]">
            <Sparkles size={18} />
            <span className="font-black uppercase tracking-[0.4em] text-[10px]">Cá nhân hóa cho bạn</span>
          </div>
          <h2 className="text-5xl xl:text-6xl font-black tracking-tighter leading-none max-w-2xl">
            Âm nhạc phản ánh<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1ed760] to-[#0ea5e9]">tâm hồn bạn.</span>
          </h2>
          <p className="text-zinc-400 font-bold leading-relaxed max-w-md text-base">
            Kết hợp hoàn hảo giữa những gì bạn yêu thích và những khám phá mới lạ chỉ dành riêng cho bạn.
          </p>
          <div className="flex gap-4 pt-4">
            <Link
              to="/search"
              className="bg-[#1ed760] text-black px-10 py-4 rounded-full font-black text-sm uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-[0_10px_30px_rgba(30,215,96,0.3)]"
            >
              Khám phá ngay
            </Link>
            {!userId && (
              <Link
                to="/auth"
                className="bg-white/5 border border-white/10 text-white px-10 py-4 rounded-full font-black text-sm uppercase tracking-[0.2em] hover:bg-white/10 transition-all"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Playlist Picker Modal */}
      {userId && selectedTrackId && (
        <PlaylistPickerModal
          isOpen={pickerOpen}
          onClose={() => { setPickerOpen(false); setSelectedTrackId(null); }}
          trackId={selectedTrackId}
          userId={userId}
        />
      )}
    </div>
  );
}
