import React, { useState } from "react";
import { X, Music, Disc, Loader2, Sparkles, PlusCircle } from "lucide-react";
import { useToastStore } from "../store/toastStore";
import { motion, AnimatePresence } from "motion/react";
import clsx from "clsx";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (playlist: any) => void;
}

export function CreatePlaylistModal({ isOpen, onClose, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const { addToast } = useToastStore();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return addToast("Vui lòng nhập tên danh sách phát.", "error");

    setLoading(true);
    try {
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, cover_url: coverUrl || `https://picsum.photos/seed/${name}/400/400` })
      });
      const data = await res.json();
      if (data.success) {
        addToast("Đã tạo danh sách phát mới! ", "success");
        onSuccess(data.data);
        onClose();
        setName("");
        setCoverUrl("");
      } else {
        addToast(data.error || "Lỗi khi tạo danh sách", "error");
      }
    } catch (err) {
      addToast("Lỗi kết nối máy chủ.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-[#121212] rounded-[32px] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none rotate-12">
          <Disc size={200} />
        </div>

        <div className="p-10 relative z-10 flex flex-col items-center text-center gap-8">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-[#1ed760]/10 rounded-2xl flex items-center justify-center border border-[#1ed760]/20">
              <PlusCircle className="text-[#1ed760]" size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter mb-6">Tạo danh sách phát mới</h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
            <div className="space-y-4 mb-8">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2 block px-1">Tên danh sách</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Giai điệu của tôi..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white placeholder:text-zinc-700 focus:outline-none focus:border-[#1ed760]/40 transition shadow-inner"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 text-left">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">LINK ẢNH BÌA (TÙY CHỌN)</label>
              <input
                type="text"
                placeholder="https://images.unsplash.com/..."
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-[#1ed760]/50 focus:bg-white/10 transition-all placeholder:text-zinc-700"
              />
            </div>

            <div className="flex items-center gap-4 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-white/5 text-zinc-400 border border-white/5 py-4 rounded-2xl font-bold text-sm tracking-wide hover:bg-white/10 hover:text-white transition-all"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] bg-[#1ed760] text-black py-4 rounded-2xl font-black text-sm tracking-widest uppercase shadow-[0_15px_30px_rgba(30,215,96,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <><Music size={18} /> Tạo ngay</>}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
