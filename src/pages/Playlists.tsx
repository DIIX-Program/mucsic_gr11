import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useToastStore } from "../store/toastStore";
import { useLibraryStore } from "../store/libraryStore";
import { Play, Plus, Music, Disc, Loader2, Sparkles, LayoutGrid, ListMusic, User, Trash2, Edit2 } from "lucide-react";
import { CreatePlaylistModal } from "../components/CreatePlaylistModal";
import clsx from "clsx";

export function Playlists() {
  const navigate = useNavigate();
  const { userId } = useAuthStore();
  const { addToast } = useToastStore();
  const { removePlaylist, updatePlaylist } = useLibraryStore();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPlaylists = async () => {
    if (!userId) return;
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
    fetchPlaylists();
  }, [userId]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Bạn có chắc chắn muốn xóa danh sách phát này?")) return;
    try {
      const res = await fetch(`/api/playlists/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok) {
        addToast("Đã xóa danh sách phát", "success");
        setPlaylists(prev => prev.filter(p => p.id !== id));
        removePlaylist(id); // Sync libraryStore
      } else {
        addToast(json.error || "Xóa thất bại", "error");
      }
    } catch {
      addToast("Lỗi kết nối", "error");
    }
  };

  const handleRename = async (e: React.MouseEvent, id: string, currentName: string) => {
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
        setPlaylists(prev => prev.map(p => p.id === id ? { ...p, name: newName.trim() } : p));
        updatePlaylist(id, { name: newName.trim() }); // Sync libraryStore
        addToast("Đã đổi tên danh sách phát", "success");
      } else {
        addToast(json.error || "Đổi tên thất bại", "error");
      }
    } catch {
      addToast("Lỗi kết nối", "error");
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <Loader2 className="animate-spin text-[#1ed760]" size={48} />
      <span className="text-zinc-500 font-black uppercase tracking-[0.4em] text-[10px]">Đang tải dữ liệu...</span>
    </div>
  );

  return (
    <div className="flex flex-col gap-16 max-w-7xl mx-auto py-12 px-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      
      {/* HEADER SECTION */}
      <div className="flex items-end justify-between border-b border-white/5 pb-12">
        <div className="flex items-center gap-10">
           <div className="w-24 h-24 bg-gradient-to-br from-[#1ed760] to-[#1db954] rounded-[32px] flex items-center justify-center shadow-[0_30px_60px_rgba(30,215,96,0.3)] transform -rotate-12 hover:rotate-0 transition-transform duration-500">
              <ListMusic className="text-black" size={48} />
           </div>
           <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 bg-[#1ed760] rounded-full animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Bộ sưu tập</span>
              </div>
              <h1 className="text-8xl font-black tracking-tighter bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">Danh sách phát</h1>
           </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-4 bg-[#1ed760] text-black px-12 py-5 rounded-full font-black text-sm uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition shadow-[0_20px_40px_rgba(30,215,96,0.3)]"
        >
           <Plus size={24} strokeWidth={3} /> Tạo mới
        </button>
      </div>

      {playlists.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-10">
           {playlists.map((playlist) => (
             <div 
               key={playlist.id} 
               onClick={() => navigate(`/playlist/${playlist.id}`)}
               className="group relative flex flex-col gap-6 p-6 rounded-[48px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:border-[#1ed760]/20 transition-all duration-500 cursor-pointer shadow-2xl hover:-translate-y-2"
             >
                <div className="aspect-square rounded-[36px] overflow-hidden relative shadow-2xl">
                   <img 
                    src={playlist.cover_url || `https://picsum.photos/seed/${playlist.id}/400/400`} 
                    className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" 
                    alt="" 
                   />
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                      <div className="w-16 h-16 bg-[#1ed760] rounded-full flex items-center justify-center shadow-[0_15px_30px_rgba(30,215,96,0.5)] transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                         <Play size={32} className="fill-black text-black ml-1" />
                      </div>
                   </div>
                </div>
                <div className="px-4 space-y-2">
                   <h3 className="font-black text-xl text-white truncate group-hover:text-[#1ed760] transition-colors">{playlist.name}</h3>
                   <div className="flex items-center gap-3">
                      <span className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.3em]">{playlist.track_count || 0} bài hát</span>
                      <div className="w-1 h-1 bg-zinc-800 rounded-full" />
                      <span className="text-[9px] text-zinc-700 font-bold uppercase tracking-widest transition-colors group-hover:text-zinc-500">MusicEVE Hub</span>
                   </div>
                </div>
                
                {/* TOOLBAR OVERLAY */}
                 <div className="absolute top-8 right-8 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                    <button 
                       onClick={(e) => handleRename(e, playlist.id, playlist.name)}
                       className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md text-zinc-400 hover:text-white transition hover:bg-white/10 flex items-center justify-center"
                     >
                       <Edit2 size={16} />
                     </button>
                    <button 
                      onClick={(e) => handleDelete(e, playlist.id)}
                      className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md text-zinc-400 hover:text-rose-500 transition hover:bg-rose-500/20 flex items-center justify-center"
                    >
                      <Trash2 size={16} />
                    </button>
                 </div>
             </div>
           ))}
        </div>
      ) : (
        <div className="py-40 flex flex-col items-center justify-center bg-white/[0.01] rounded-[64px] border border-dashed border-white/5 animate-in fade-in duration-1000">
           <Disc size={120} className="text-zinc-800 mb-10 animate-spin-slow opacity-20" />
           <p className="text-4xl font-black text-white/30 tracking-tighter mb-4">Chưa có danh sách phát nào</p>
           <p className="text-zinc-600 font-bold text-sm tracking-widest uppercase mb-12">Tạo danh sách phát đầu tiên để lưu giữ những bài hát yêu thích.</p>
           <button 
            onClick={() => setIsModalOpen(true)}
            className="group flex items-center gap-4 text-[#1ed760] font-black text-xs uppercase tracking-[0.4em] hover:text-white transition"
           >
              <div className="w-12 h-12 rounded-full border border-[#1ed760] flex items-center justify-center group-hover:bg-[#1ed760] group-hover:text-black transition-all">
                 <Plus size={20} />
              </div>
              Tạo mới
           </button>
        </div>
      )}

      <CreatePlaylistModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={(p) => setPlaylists([p, ...playlists])} 
      />
    </div>
  );
}
