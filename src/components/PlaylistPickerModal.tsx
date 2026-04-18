import React, { useEffect, useState } from "react";
import { Plus, ListMusic, Loader2, Disc, X, Check, PlusCircle } from "lucide-react";
import { useToastStore } from "../store/toastStore";
import { useLibraryStore } from "../store/libraryStore";
import { motion, AnimatePresence } from "motion/react";
import clsx from "clsx";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  trackId: string;
  userId: string;
}

export function PlaylistPickerModal({ isOpen, onClose, trackId, userId }: Props) {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const { addToast } = useToastStore();
  const { addPlaylist } = useLibraryStore();

  const fetchPlaylists = async () => {
    try {
      const res = await fetch(`/api/playlists/user/${userId}`);
      const data = await res.json();
      if (data.success) {
        setPlaylists(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      fetchPlaylists();
    }
  }, [isOpen, userId]);

  const handleAddToPlaylist = async (playlistId: string, playlistName: string) => {
    setAddingId(playlistId);
    try {
      const res = await fetch(`/api/playlists/${playlistId}/tracks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId })
      });
      const data = await res.json();
      if (data.success) {
        addToast(`Đã lưu vào "${playlistName}"! 💿`, "success");
        onClose();
      } else {
        addToast(data.error || "Lỗi khi lưu bài hát", "error");
      }
    } catch (err) {
      addToast("Kết nối thất bại.", "error");
    } finally {
      setAddingId(null);
    }
  };

  const handleCreateNew = async () => {
    const name = window.prompt("Nhập tên danh sách phát mới:");
    if (!name) return;

    setLoading(true);
    try {
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, cover_url: `https://picsum.photos/seed/${name}/400/400` })
      });
      const data = await res.json();
      if (data.success) {
        addToast(`Đã tạo "${name}"!`, "success");
        addPlaylist(data.data); // Sync globally
        handleAddToPlaylist(data.data.id, name);
      }
    } catch (err) {
       addToast("Lỗi khi tạo mới.", "error");
    } finally {
       setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-[#121212] rounded-[32px] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col max-h-[70vh]"
      >
        
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                <ListMusic className="text-[#1ed760]" size={20} />
              </div>
              <h2 className="text-xl font-black tracking-tight text-white">Lưu vào danh sách phát</h2>
           </div>
           <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center">
              <X size={20} />
           </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
           {loading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
                <Loader2 className="animate-spin text-[#1ed760]" size={32} />
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Đang tải...</span>
             </div>
           ) : (
             <div className="flex flex-col gap-1">
                <button 
                  onClick={handleCreateNew}
                  className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all group border border-dashed border-white/10 hover:border-[#1ed760]/30"
                >
                   <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center group-hover:bg-[#1ed760] group-hover:text-black transition-all">
                      <PlusCircle size={20} />
                   </div>
                   <span className="font-bold text-sm text-[#1ed760]">Tạo danh sách phát mới</span>
                </button>

                <div className="w-full h-px bg-white/5 my-3" />

                {playlists.length > 0 ? playlists.map((playlist) => (
                  <button 
                    key={playlist.id} 
                    onClick={() => handleAddToPlaylist(playlist.id, playlist.name)}
                    disabled={addingId === playlist.id}
                    className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-all group border border-transparent hover:border-white/5 text-left"
                  >
                     <div className="w-12 h-12 bg-zinc-800 rounded-xl overflow-hidden shrink-0 shadow-lg">
                       <img 
                        src={playlist.cover_url || `https://picsum.photos/seed/${playlist.id}/100/100`} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                        alt="" 
                       />
                     </div>
                     <div className="flex-1 flex flex-col min-w-0">
                        <span className="font-bold text-sm text-white truncate group-hover:text-[#1ed760] transition-colors">{playlist.name}</span>
                        <span className="text-xs text-zinc-500 font-medium">{playlist.track_count || 0} bài hát</span>
                     </div>
                     {addingId === playlist.id && <Loader2 size={16} className="animate-spin text-[#1ed760]" />}
                  </button>
                )) : (
                  <div className="py-12 text-center opacity-30">
                    <p className="text-xs font-bold text-zinc-500 mb-2 uppercase tracking-widest">Không có danh sách phát nào khác</p>
                  </div>
                )}
             </div>
           )}
        </div>

        <div className="p-6 border-t border-white/5 flex justify-center bg-black/20">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600">MusicEVE Management</span>
        </div>
      </motion.div>
    </div>
  );
}
