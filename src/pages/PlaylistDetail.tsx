import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePlayerStore, Track } from "../store/playerStore";
import { Play, Heart, MoreHorizontal, Clock, Plus, Disc, Music, Trash2, ArrowLeft, Loader2, Sparkles, Share2, Shuffle, ListPlus, Edit2 } from "lucide-react";
import { useToastStore } from "../store/toastStore";
import { useAuthStore } from "../store/authStore";
import { useLibraryStore } from "../store/libraryStore";
import { AddSongModal } from "../components/AddSongModal";
import { motion, AnimatePresence } from "motion/react";
import clsx from "clsx";
import { CommentSection } from "../components/CommentSection";

interface PlaylistData {
  id: string;
  name: string;
  user_id: string;
  cover_url: string;
  tracks: Track[];
}

export function PlaylistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const [playlist, setPlaylist] = useState<PlaylistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const { setQueue, setPlaying, currentTrack, isPlaying, likedTrackIds, toggleLike } = usePlayerStore();
  const { userId } = useAuthStore();
  const { removePlaylist, updatePlaylist } = useLibraryStore();
  
  const isOwner = playlist?.user_id === userId;

  const fetchPlaylist = async () => {
    try {
      const res = await fetch(`/api/playlists/${id}`);
      const data = await res.json();
      if (data.success) {
        setPlaylist(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylist();
  }, [id]);

  const handlePlayPlaylist = () => {
    if (playlist?.tracks.length) {
      setQueue(playlist.tracks, 0);
      setPlaying(true);
      addToast(`Đang phát danh sách: ${playlist.name}`, "success");
    }
  };

  const handleShufflePlaylist = () => {
    if (playlist?.tracks.length) {
      const shuffled = [...playlist.tracks].sort(() => Math.random() - 0.5);
      setQueue(shuffled, 0);
      setPlaying(true);
      addToast(`Đang phát ngẫu nhiên: ${playlist.name}`, "success");
    }
  };

  const handlePlayTrack = (index: number) => {
    if (playlist) {
      setQueue(playlist.tracks, index);
      setPlaying(true);
    }
  };

  const handleRemoveTrack = async (trackId: string) => {
    if (!isOwner) return;
    try {
      const res = await fetch(`/api/playlists/${id}/tracks/${trackId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        addToast("Đã xóa bài hát khỏi danh sách.", "success");
        fetchPlaylist(); 
      }
    } catch (err) {
      addToast("Không thể xóa bài hát.", "error");
    }
  };

  const handleDeletePlaylist = async () => {
    if (!isOwner) return;
    if (!confirm(`Bạn có chắc muốn xóa danh sách "${playlist?.name}"? Thao tác này không thể hoàn tác.`)) return;
    
    try {
      const res = await fetch(`/api/playlists/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        removePlaylist(id!); // Sync store
        addToast("Đã xóa danh sách phát.", "success");
        navigate("/library");
      } else {
        addToast(data.error || "Không thể xóa danh sách phát.", "error");
      }
    } catch (err) {
      addToast("Không thể xóa danh sách phát.", "error");
    }
  };

  const handleRenamePlaylist = async () => {
    if (!isOwner || !playlist) return;
    const newName = window.prompt("Tên mới cho danh sách phát:", playlist.name);
    if (!newName?.trim() || newName.trim() === playlist.name) return;
    try {
      const res = await fetch(`/api/playlists/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setPlaylist(prev => prev ? { ...prev, name: newName.trim() } : prev);
        updatePlaylist(id!, { name: newName.trim() }); // Sync store
        addToast("Đã đổi tên danh sách phát.", "success");
      } else {
        addToast(data.error || "Đổi tên thất bại.", "error");
      }
    } catch {
      addToast("Lỗi kết nối.", "error");
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="w-12 h-12 border-4 border-[#1ed760] border-t-transparent rounded-full" />
      <span className="text-zinc-500 font-black uppercase tracking-[0.3em] text-[10px]">Đang tải...</span>
    </div>
  );

  if (!playlist) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-6 text-center">
      <Disc size={64} className="text-zinc-800" />
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-white/40">Không tìm thấy danh sách</h2>
        <button onClick={() => navigate("/playlists")} className="text-[#1ed760] font-bold text-sm uppercase tracking-widest hover:text-white transition-colors">Trở về thư viện</button>
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-10 pb-32">
      {/* 1. Header Section */}
      <section className="relative p-12 rounded-[48px] bg-gradient-to-b from-white/[0.05] to-transparent overflow-hidden flex flex-col md:flex-row items-center md:items-end gap-12 group">
         <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none rotate-12">
            <Sparkles size={300} />
         </div>
         
         <div className="w-64 h-64 rounded-[32px] shadow-[0_40px_80px_rgba(0,0,0,0.6)] overflow-hidden shrink-0 relative group-hover:scale-105 transition-transform duration-700 border border-white/5">
            <img src={playlist.cover_url || `https://picsum.photos/seed/${playlist.id}/600/600`} className="w-full h-full object-cover" alt={playlist.name} />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="w-16 h-16 bg-[#1ed760] rounded-full flex items-center justify-center shadow-2xl">
                 <Play size={32} className="fill-black text-black ml-1" />
              </div>
            </div>
         </div>

         <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left gap-6 mt-auto relative z-10">
            <div className="flex items-center gap-2 px-3 py-1 bg-[#1ed760]/10 rounded-full border border-[#1ed760]/20">
               <Music size={14} className="text-[#1ed760]" />
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-3 block">Danh sách phát</span>
            </div>
            <h1 className="text-7xl lg:text-8xl font-black tracking-tighter text-white drop-shadow-2xl">{playlist.name}</h1>
            <div className="flex items-center gap-3 text-zinc-400 font-bold text-sm uppercase tracking-widest">
               <span className="text-white bg-white/10 px-3 py-1 rounded-lg tabular-nums">{playlist.tracks.length}</span>
               <span>bài hát</span>
               <div className="w-1.5 h-1.5 bg-zinc-800 rounded-full" />
               <span className="text-zinc-600">tổng cộng {playlist.tracks.length * 3 + 12} phút</span>
            </div>
         </div>
      </section>

      {/* 2. Action Bar */}
      <section className="sticky top-16 z-30 bg-[#121212]/80 backdrop-blur-xl py-6 px-12 border-b border-white/5 flex items-center justify-between mx-[-32px] px-[64px]">
         <div className="flex items-center gap-8">
            <button 
              onClick={handlePlayPlaylist}
              className="w-16 h-16 bg-[#1ed760] text-black rounded-full shadow-[0_20px_40px_rgba(30,215,96,0.3)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
            >
               <Play size={32} className="fill-black ml-1" />
            </button>
            <button 
              onClick={handleShufflePlaylist}
              className="bg-zinc-800/80 hover:bg-zinc-700 p-4 rounded-full text-white transition transform active:scale-95 shadow-xl"
              title="Phát ngẫu nhiên danh sách"
            >
              <Shuffle size={24} />
            </button>
            <div className="w-px h-8 bg-white/5" />
            <button className="text-zinc-500 hover:text-[#1ed760] transition-colors"><Heart size={28} /></button>
            <button className="text-zinc-500 hover:text-white transition-colors"><Share2 size={24} /></button>
            {isOwner && (
              <button 
                onClick={handleDeletePlaylist}
                className="text-zinc-500 hover:text-rose-500 transition-colors"
                title="Xóa danh sách phát"
              >
                <Trash2 size={24} />
              </button>
            )}
            {isOwner && (
              <button 
                onClick={handleRenamePlaylist}
                className="text-zinc-500 hover:text-[#1ed760] transition-colors"
                title="Đổi tên danh sách phát"
              >
                <Edit2 size={24} />
              </button>
            )}
            <button className="text-zinc-500 hover:text-white transition-colors"><MoreHorizontal size={24} /></button>
         </div>
         
         {isOwner && (
           <button 
              onClick={() => setIsAddModalOpen(true)}
              className="group flex items-center gap-4 bg-white/5 hover:bg-[#1ed760] text-zinc-400 hover:text-black px-8 py-3.5 rounded-full font-black text-xs tracking-widest uppercase transition-all shadow-xl hover:scale-105 active:scale-95 border border-white/10 hover:border-[#1ed760]"
            >
               <ListPlus size={18} /> Tìm thêm bài hát
            </button>
         )}
      </section>

      {/* 3. Track List Section */}
      <section className="px-12">
         <div className="grid grid-cols-[48px_1fr_120px_48px] gap-6 px-8 py-4 border-b border-white/5 text-zinc-600 font-black text-[10px] uppercase tracking-[0.2em] mb-4">
            <span className="text-right">#</span>
            <span>Tiêu đề</span>
            <div className="flex justify-end pr-8"><Clock size={14} /></div>
            <span className="text-right pr-4"></span>
         </div>

         <div className="flex flex-col gap-2">
            {playlist.tracks.length > 0 ? (
               <AnimatePresence mode="popLayout">
                  {playlist.tracks.map((track, i) => (
                     <motion.div 
                        key={track.id} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="group grid grid-cols-[48px_1fr_120px_96px] gap-6 px-8 py-4 rounded-[24px] hover:bg-white/[0.03] transition-all cursor-pointer items-center border border-transparent hover:border-white/5"
                        onClick={() => handlePlayTrack(i)}
                     >
                        <div className="flex justify-end font-black tabular-nums group-hover:text-[#1ed760] transition-colors text-zinc-700">
                           {i + 1}
                        </div>
                        
                        <div className="flex items-center gap-5 min-w-0">
                           <div className="w-12 h-12 bg-zinc-900 rounded-xl overflow-hidden shadow-lg group-hover:scale-110 transition-transform">
                              <img src={track.cover_url || `https://picsum.photos/seed/${track.id}/100/100`} className="w-full h-full object-cover" alt="" />
                           </div>
                           <div className="flex flex-col truncate">
                              <h4 className={clsx(
                                 "text-lg font-bold truncate transition-colors",
                                 currentTrack?.id === track.id ? "text-[#1ed760]" : "text-white group-hover:text-white"
                              )}>{track.title}</h4>
                              <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{track.main_artist}</span>
                           </div>
                        </div>

                        <div className="flex justify-end pr-8 tabular-nums text-zinc-500 font-bold text-sm">
                           03:42
                        </div>

                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button 
                              onClick={(e) => {
                                 e.stopPropagation();
                                 if(!userId) return addToast("Bạn cần đăng nhập để yêu thích nhạc!", "info");
                                 toggleLike(track.id);
                              }}
                              className={clsx("w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-all active:scale-75", likedTrackIds.has(track.id) ? "text-[#1ed760]" : "text-zinc-600 hover:text-white")}
                           >
                              <Heart size={16} className={likedTrackIds.has(track.id) ? "fill-current" : ""} />
                           </button>
                           {isOwner && (
                             <button 
                                onClick={(e) => {
                                   e.stopPropagation();
                                   handleRemoveTrack(track.id);
                                }}
                                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-rose-500/10 text-zinc-600 hover:text-rose-500 transition-all"
                                title="Gỡ bài hát"
                             >
                                <Trash2 size={16} />
                             </button>
                           )}
                        </div>
                     </motion.div>
                  ))}
               </AnimatePresence>
            ) : (
               <div className="py-32 flex flex-col items-center justify-center bg-white/[0.01] rounded-[60px] border border-dashed border-white/5 text-center px-20">
                  <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8">
                     <Disc size={48} className="text-zinc-800 animate-spin-slow" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Danh sách phát đang trống</h3>
                  <p className="text-zinc-600 font-bold text-sm uppercase tracking-widest leading-relaxed mb-10">Curation Registry trống. Hãy tìm kiếm và nạp thêm các tần số âm thanh yêu thích của bạn.</p>
                  <button 
                     onClick={() => setIsAddModalOpen(true)}
                     className="bg-[#1ed760] text-black px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:scale-110 active:scale-95 transition-all shadow-[0_20px_40px_rgba(30,215,96,0.3)]"
                  >
                     Tìm bài hát mới
                  </button>
               </div>
            )}
         </div>
      </section>

      <section className="px-12 pt-20">
         <button onClick={() => navigate("/library")} className="flex items-center gap-3 text-zinc-600 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest group">
            <ArrowLeft size={16} className="group-hover:-translate-x-2 transition-transform" /> 
            Quay về Thư viện danh sách
         </button>
      </section>

      {/* NEW: Comment System integration */}
      {playlist.tracks.length > 0 && (
        <section className="px-12 pt-16 mt-16 border-t border-white/5 max-w-4xl">
           <CommentSection trackId={playlist.tracks[0].id} />
           <p className="mt-4 text-[10px] font-black uppercase text-zinc-700 tracking-[0.2em] italic">
             * Hiện tại bạn đang bình luận cho bài hát đầu tiên trong danh sách phát này.
           </p>
        </section>
      )}

      <AddSongModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        playlistId={playlist.id} 
        onSuccess={fetchPlaylist} 
      />
    </motion.div>
  );
}
