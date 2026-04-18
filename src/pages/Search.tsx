import React, { useState, useEffect } from "react";
import { usePlayerStore, Track } from "../store/playerStore";
import { useAuthStore } from "../store/authStore";
import { Play, Search as SearchIcon, Loader2, Music, Disc, Heart, ListPlus } from "lucide-react";
import { PlaylistPickerModal } from "../components/PlaylistPickerModal";
import { useToastStore } from "../store/toastStore";
import { motion, AnimatePresence } from "motion/react";
import clsx from "clsx";

export function Search() {
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("Tất cả");
  const { setQueue, likedTrackIds, toggleLike } = usePlayerStore();
  const { addToast } = useToastStore();
  const { userId } = useAuthStore();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  useEffect(() => {
    if (!query) {
      setTracks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      fetch(`/api/tracks/search?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setTracks(data.data || []);
          } else {
            addToast(data.error || "Lỗi tìm kiếm", "error");
          }
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handlePlay = (index: number) => {
    setQueue(tracks, index);
  };

  const categories = [
    { title: "Thịnh hành", color: "bg-gradient-to-br from-[#1ed760] to-[#1db954]" },
    { title: "Chill", color: "bg-gradient-to-br from-[#5038a0] to-[#2e1d75]" },
    { title: "Tập trung", color: "bg-gradient-to-br from-[#477d95] to-[#2d4e5e]" },
    { title: "Lái xe", color: "bg-gradient-to-br from-[#ba5d07] to-[#8a4405]" },
    { title: "Electronic", color: "bg-gradient-to-br from-[#e8115b] to-[#a30b40]" },
    { title: "Lofi Beats", color: "bg-gradient-to-br from-[#509bf5] to-[#2176d8]" },
  ];

  const filterChips = ["Tất cả", "Bài hát", "Nghệ sĩ", "Pop", "Hip-Hop", "Rock", "Indie", "Electronic", "Lofi"];

  const filteredTracks = tracks.filter(track => {
    if (filterType === "Tất cả") return true;
    if (filterType === "Bài hát") return true;
    if (filterType === "Nghệ sĩ") return track.main_artist.toLowerCase().includes(query.toLowerCase());
    
    // Genre filtering
    return track.genre === filterType;
  });

  return (
    <div className="flex flex-col gap-12 max-w-7xl mx-auto py-8">
      <div className="flex flex-col gap-8">
         <div className="max-w-2xl">
           <div className="relative group">
             <SearchIcon 
               className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${loading ? 'text-[#1ed760]' : 'text-zinc-500 group-focus-within:text-white'}`} 
               size={24} 
             />
             <input 
               type="text" 
               placeholder="Bạn muốn nghe gì hôm nay?" 
               value={query}
               onChange={(e) => setQuery(e.target.value)}
               className="w-full bg-[#1a1a1a] hover:bg-[#242424] text-white rounded-full py-5 pl-14 pr-12 focus:outline-none focus:ring-2 focus:ring-[#1ed760]/30 transition-all font-black text-lg shadow-2xl border border-white/5 placeholder:text-zinc-600"
             />
             {loading && (
               <div className="absolute right-6 top-1/2 -translate-y-1/2">
                 <Loader2 size={24} className="animate-spin text-[#1ed760]" />
               </div>
             )}
           </div>
         </div>

         {/* FILTER CHIPS */}
         {query && (
           <div className="flex flex-wrap gap-3 animate-in fade-in slide-in-from-left-4 duration-500">
             {filterChips.map(tag => (
               <button 
                 key={tag}
                 onClick={() => setFilterType(tag)} 
                 className={`px-5 py-1.5 rounded-full border text-[12px] font-bold transition-all shadow-md ${
                   filterType === tag 
                     ? "bg-[#1ed760] text-black border-[#1ed760]" 
                     : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                 }`}
               >
                 {tag}
               </button>
             ))}
           </div>
         )}
      </div>

      {query ? (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="flex items-center gap-3 mb-6">
             <div className="w-1 h-6 bg-[#1ed760] rounded-full shadow-[0_0_15px_rgba(30,215,96,0.5)]" />
             <h2 className="text-2xl font-black tracking-tighter text-white">Kết quả tìm kiếm</h2>
          </div>

          {filteredTracks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {filteredTracks.map((track, index) => (
                <div 
                  key={track.id} 
                  className="bg-zinc-900/40 p-4 rounded-2xl hover:bg-zinc-800/60 transition-all flex flex-col gap-4 group cursor-pointer shadow-lg hover:shadow-xl relative overflow-hidden"
                >
                  <div className="aspect-square bg-zinc-900 rounded-xl relative shadow-md overflow-hidden shrink-0" onClick={() => handlePlay(index)}>
                    <img src={track.cover_url || `https://picsum.photos/seed/${track.id}/400/400`} alt="Cover" className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                        <div className="w-12 h-12 bg-[#1ed760] rounded-full flex items-center justify-center shadow-[0_10px_20px_rgba(30,215,96,0.6)] transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                           <Play size={24} className="fill-black text-black ml-1" />
                        </div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden" onClick={() => handlePlay(index)}>
                    <h3 className="text-white font-bold text-sm truncate group-hover:text-[#1ed760] transition-colors">{track.title}</h3>
                    <p className="text-zinc-500 text-[11px] font-medium mt-1 truncate">{track.main_artist}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if(!userId) return addToast("Bạn cần đăng nhập để lưu nhạc!", "info");
                        setSelectedTrackId(track.id);
                        setPickerOpen(true);
                      }}
                      className="p-2 rounded-full bg-black/40 text-white border border-white/10 hover:bg-white/10 backdrop-blur-md active:scale-75 transition-all"
                      title="Thêm vào danh sách phát"
                    >
                      <ListPlus size={12} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if(!userId) return addToast("Bạn cần đăng nhập để yêu thích nhạc!", "info");
                        toggleLike(track.id);
                      }}
                      className={clsx(
                        "p-2 rounded-full backdrop-blur-md transition-all active:scale-75 shadow-2xl border",
                        likedTrackIds.has(track.id) ? "bg-[#1ed760] text-black border-transparent" : "bg-black/40 text-white border-white/10 hover:bg-white/10"
                      )}
                    >
                      <Heart size={12} className={likedTrackIds.has(track.id) ? "fill-current" : ""} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : !loading && (
            <div className="text-center py-24 bg-white/[0.01] rounded-[32px] border border-dashed border-white/5">
               <div className="flex justify-center mb-6">
                 <Disc size={48} className="text-zinc-800 animate-spin-slow" />
               </div>
               <p className="text-xl font-black text-white/40 tracking-tight mb-2">Không tìm thấy kết quả nào cho "{query}"</p>
               <p className="text-zinc-600 text-sm font-medium">Hãy thử tìm bằng từ khóa khác hoặc tên nghệ sĩ.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="animate-in fade-in duration-1000">
           <div className="flex items-center gap-3 mb-6">
             <div className="w-1 h-6 bg-white/20 rounded-full" />
             <h2 className="text-2xl font-black tracking-tighter text-white">Khám phá các thể loại</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <div 
                key={index} 
                onClick={() => setQuery(category.title)}
                className={`${category.color} rounded-[24px] p-6 h-48 relative overflow-hidden cursor-pointer hover:scale-[1.02] active:scale-95 transition-all shadow-xl group`}
              >
                <h3 className="text-white font-black text-2xl leading-none tracking-tighter drop-shadow-md">{category.title}</h3>
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-[20px] rotate-[25deg] group-hover:rotate-[15deg] transition-all duration-500 flex items-center justify-center backdrop-blur-md">
                   <Music size={36} className="text-white opacity-40" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
