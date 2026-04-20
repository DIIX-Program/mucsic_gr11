import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { usePlayerStore, Track } from "../store/playerStore";
import { Play, Heart, Users, MessageCircle, MoreHorizontal, CheckCircle2, Star, Share2 } from "lucide-react";
import { CommentInput } from "../components/CommentInput";
import { useToastStore } from "../store/toastStore";
import { useAuthStore } from "../store/authStore";
import { motion, AnimatePresence } from "motion/react";
import clsx from "clsx";

interface Artist {
  id: string;
  artist_name: string;
  bio: string;
  avatar_url: string;
  banner_url: string;
  followers_count: number;
  tracks: Track[];
  comments: any[];
  track_count: number;
  comment_count: number;
}

export function Artist() {
  const { id } = useParams();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const { setQueue, currentTrack, isPlaying, setPlaying, likedTrackIds, toggleLike } = usePlayerStore();
  const { addToast } = useToastStore();
  const { userId } = useAuthStore();

  useEffect(() => {
    fetch(`/api/artists/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setArtist(data.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handlePlayAll = () => {
    if (artist?.tracks.length) {
      setQueue(artist.tracks, 0);
      setPlaying(true);
      addToast(`Đang phát tất cả bài hát của ${artist.artist_name}`, "success");
    }
  };

  const handlePlayTrack = (index: number) => {
    if (artist) {
      setQueue(artist.tracks, index);
      setPlaying(true);
    }
  };

  const handleFollow = () => {
    if (!userId) {
      addToast("Vui lòng đăng nhập để theo dõi nghệ sĩ", "info");
      return;
    }
    fetch(`/api/users/${id}/follow`, { method: "POST" })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          addToast(`Đã theo dõi ${artist?.artist_name}`, "success");
          setArtist(prev => prev ? { ...prev, followers_count: prev.followers_count + 1 } : null);
        }
      });
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="w-12 h-12 border-4 border-[#1ed760] border-t-transparent rounded-full" />
      <span className="text-zinc-500 font-black uppercase tracking-[0.3em] text-[10px]">Đang tải hồ sơ nghệ sĩ...</span>
    </div>
  );
  
  if (!artist) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-6 text-center">
      <Star size={64} className="text-zinc-800" />
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-white/40">Không tìm thấy nghệ sĩ</h2>
        <p className="text-zinc-600 max-w-xs mx-auto">Vui lòng kiểm tra lại đường dẫn hoặc thử tìm kiếm tên nghệ sĩ khác.</p>
      </div>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col -mt-6 pb-20"
    >
      {/* Hero Banner */}
      <section className="h-[450px] w-full relative group overflow-hidden">
         <img 
          src={artist.banner_url || `https://picsum.photos/seed/${artist.id}/1600/600`} 
          alt="" 
          className="w-full h-full object-cover transition-transform duration-[4s] group-hover:scale-110" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12 flex flex-col items-start gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 backdrop-blur-md rounded-full border border-blue-500/20 text-[10px] font-black uppercase tracking-widest text-blue-400"
          >
            <CheckCircle2 size={14} className="fill-blue-500 text-blue-500" />
            Nghệ sĩ xác minh
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-9xl font-black tracking-tighter text-white leading-none drop-shadow-2xl"
          >
            {artist.artist_name}
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 mt-4"
          >
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
              <Users size={14} className="text-[#1ed760]" />
            </div>
            <p className="text-white font-bold text-lg">{artist.followers_count.toLocaleString()} người nghe hàng tháng</p>
          </motion.div>
        </div>
      </section>

      {/* Control Bar */}
      <section className="px-12 py-8 flex items-center gap-8 sticky top-16 z-30 bg-[#121212]/80 backdrop-blur-xl border-b border-white/5">
        <button 
          onClick={handlePlayAll}
          className="w-16 h-16 bg-[#1ed760] rounded-full flex items-center justify-center shadow-[0_20px_40px_rgba(30,215,96,0.3)] hover:scale-110 transition active:scale-95 text-black"
        >
          <Play size={32} className="fill-current ml-1" />
        </button>
        
        <button 
          onClick={handleFollow}
          className="px-10 py-3.5 rounded-full border-2 border-white/10 font-black text-xs tracking-[0.2em] uppercase hover:border-[#1ed760] hover:text-[#1ed760] transition-all"
        >
          Theo dõi
        </button>
        
        <button className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:border-white transition-all">
          <Share2 size={20} />
        </button>
        
        <button className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:border-white transition-all">
          <MoreHorizontal size={20} />
        </button>
      </section>

      {/* Content Layout */}
      <div className="px-12 grid grid-cols-1 lg:grid-cols-3 gap-20 py-12">
        {/* Track List */}
        <div className="lg:col-span-2 space-y-10">
          <div className="flex items-center gap-4">
             <div className="w-1.5 h-8 bg-[#1ed760] rounded-full shadow-[0_0_15px_rgba(30,215,96,0.5)]" />
             <h2 className="text-3xl font-black tracking-tight">Bài hát phổ biến nhất</h2>
          </div>
          
          <div className="flex flex-col gap-2">
            {artist.tracks.map((track, i) => (
              <motion.div 
                key={track.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="grid grid-cols-[48px_1fr_120px_48px] gap-6 px-6 py-4 items-center rounded-[24px] hover:bg-white/[0.03] group cursor-pointer border border-transparent hover:border-white/5 transition-all"
                onClick={() => handlePlayTrack(i)}
              >
                <span className="text-zinc-600 font-black group-hover:text-[#1ed760] transition-colors text-right tabular-nums">{i + 1}</span>
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-900 shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                    <img src={track.cover_url || `https://picsum.photos/seed/${track.id}/100/100`} alt="" className="w-full h-full object-cover" />
                  </div>
                  <span className={clsx("font-bold truncate text-lg transition-colors", currentTrack?.id === track.id ? "text-[#1ed760]" : "text-white group-hover:text-white")}>
                    {track.title}
                  </span>
                </div>
                <div className="text-right tabular-nums text-zinc-500 font-bold group-hover:text-zinc-300 transition-colors">
                  {track.plays_count?.toLocaleString()}
                </div>
                <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                     onClick={(e) => {
                       e.stopPropagation();
                       if(!userId) return addToast("Bạn cần đăng nhập để yêu thích nhạc!", "info");
                       toggleLike(track.id);
                     }}
                     className={clsx("transition-colors active:scale-75", likedTrackIds.has(track.id) ? "text-[#1ed760]" : "text-zinc-500 hover:text-white")}
                   >
                     <Heart size={18} className={likedTrackIds.has(track.id) ? "fill-current" : ""} />
                   </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Artist Interaction / Info */}
        <div className="space-y-16">
          <section>
            <h2 className="text-2xl font-black tracking-tight mb-8">Về nghệ sĩ</h2>
            <div className="bg-[#1a1a1a] rounded-[32px] p-8 relative overflow-hidden group border border-white/5 shadow-2xl min-h-[300px] flex flex-col justify-end">
              <img src={artist.avatar_url || `https://picsum.photos/seed/${artist.id}face/400/400`} className="absolute inset-0 w-full h-full object-cover opacity-20 filter grayscale group-hover:scale-110 group-hover:grayscale-0 transition-all duration-1000" alt="" />
              <div className="relative z-10 space-y-4">
                <p className="font-bold text-white leading-relaxed line-clamp-6 opacity-90">{artist.bio}</p>
                <button className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[#1ed760] hover:text-white transition-colors">
                  Xem thêm về nghệ sĩ
                </button>
              </div>
            </div>
          </section>

          <section>
             <div className="flex items-center justify-between mb-8">
               <h2 className="text-2xl font-black tracking-tight">Bình luận mới nhất</h2>
               <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-zinc-500">
                  <MessageCircle size={18} />
               </div>
             </div>

             {userId && artist.tracks.length > 0 && (
               <div className="mb-8">
                 <CommentInput 
                   trackId={artist.tracks[0].id} 
                   onCommentAdded={(newComment) => {
                     setArtist(prev => prev ? { ...prev, comments: [newComment, ...(prev.comments || [])] } : null);
                   }} 
                 />
               </div>
             )}

             <div className="space-y-4">
               {artist.comments && artist.comments.length > 0 ? artist.comments.map((comment) => (
                 <motion.div 
                   key={comment.id} 
                   whileHover={{ x: 5 }}
                   className="bg-white/[0.02] p-5 rounded-[24px] border border-white/5 hover:border-white/10 transition-all"
                 >
                   <div className="flex items-center gap-3 mb-3">
                     <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center font-black text-[10px] text-white">
                        {comment.user_name?.substring(0, 2).toUpperCase() || "ME"}
                     </div>
                     <div className="flex flex-col">
                        <span className="font-bold text-xs text-white">{comment.user_name || "Thành viên"}</span>
                        <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{new Date(comment.created_at).toLocaleDateString("vi-VN")}</span>
                     </div>
                   </div>
                   <p className="text-sm text-zinc-400 font-medium leading-relaxed italic">"{comment.content}"</p>
                 </motion.div>
               )) : (
                 <div className="py-12 px-8 rounded-[32px] bg-white/[0.01] border border-dashed border-white/5 text-center flex flex-col items-center gap-3">
                    <MessageCircle size={32} className="text-zinc-800" />
                    <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Chưa có bình luận nào</p>
                 </div>
               )}
             </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
}
