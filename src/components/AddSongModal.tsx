import React, { useState, useEffect } from "react";
import { Search, Plus, Music, Disc, Loader2, Sparkles, Check, X, SearchIcon } from "lucide-react";
import { useToastStore } from "../store/toastStore";
import { Track } from "../store/playerStore";
import { motion, AnimatePresence } from "motion/react";
import clsx from "clsx";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  playlistId: string;
  onSuccess: () => void;
}

export function AddSongModal({ isOpen, onClose, playlistId, onSuccess }: Props) {
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const { addToast } = useToastStore();

  useEffect(() => {
    if (!query) {
      setTracks([]);
      return;
    }

    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      fetch(`/api/tracks/search?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setTracks(data.data || []);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleAddTrack = async (track: Track) => {
    setAddingId(track.id);
    try {
      const res = await fetch(`/api/playlists/${playlistId}/tracks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId: track.id })
      });
      const data = await res.json();
      if (data.success) {
        addToast(`Đã thêm "${track.title}" vào danh sách phát! `, "success");
        onSuccess();
      } else {
        addToast(data.error || "Lỗi khi thêm bài hát", "error");
      }
    } catch (err) {
      addToast("Không thể kết nối máy chủ.", "error");
    } finally {
      setAddingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-[#121212] rounded-[32px] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative overflow-hidden h-[80vh] flex flex-col"
      >

        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#1ed760] to-[#1db954] rounded-xl flex items-center justify-center shadow-lg">
              <Music size={20} className="text-black" />
            </div>
            <h2 className="text-xl font-black tracking-tight">Thêm bài hát mới</h2>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 flex flex-col gap-6 flex-1 overflow-hidden">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#1ed760] transition-colors" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm bài hát hoặc nghệ sĩ..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pl-12 pr-6 text-white font-bold focus:outline-none focus:border-[#1ed760]/30 transition-all placeholder:text-zinc-600"
              autoFocus
            />
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {loading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-48 gap-4"
                >
                  <Loader2 size={32} className="animate-spin text-[#1ed760]" />
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Đang tìm kiếm...</span>
                </motion.div>
              ) : tracks.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {tracks.map((track, i) => (
                    <motion.div
                      key={track.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-all group border border-transparent hover:border-white/5"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 shrink-0 shadow-lg">
                        <img src={track.cover_url || `https://picsum.photos/seed/${track.id}/100/100`} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white truncate">{track.title}</h4>
                        <span className="text-xs text-zinc-500 font-medium">{track.main_artist}</span>
                      </div>
                      <button
                        onClick={() => handleAddTrack(track)}
                        disabled={addingId === track.id}
                        className={clsx(
                          "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                          addingId === track.id ? "bg-white/10 scale-90" : "bg-[#1ed760] text-black hover:scale-110 active:scale-95 shadow-lg"
                        )}
                      >
                        {addingId === track.id ? <Loader2 size={16} className="animate-spin" /> : <Plus size={20} />}
                      </button>
                    </motion.div>
                  ))}
                </div>
              ) : query ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-48 opacity-40"
                >
                  <Disc size={48} className="mb-4 animate-spin-slow text-zinc-600" />
                  <span className="text-sm font-bold text-white text-center">Không tìm thấy kết quả nào</span>
                  <p className="text-xs text-zinc-500 mt-1">Vui lòng thử từ khóa khác</p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-48 opacity-40 text-center px-12"
                >
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <SearchIcon size={24} className="text-zinc-600" />
                  </div>
                  <p className="text-sm font-bold text-white">Tìm cảm hứng âm nhạc</p>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">Tìm kiếm hàng ngàn bài hát trên MusicEVE để đưa vào danh sách phát của bạn.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="p-8 border-t border-white/5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full font-bold text-sm text-zinc-400 hover:text-white transition"
          >
            Hủy
          </button>
          <button
            onClick={onClose}
            className="px-8 py-2.5 bg-white text-black rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition shadow-lg"
          >
            Xong
          </button>
        </div>
      </motion.div>
    </div>
  );
}
