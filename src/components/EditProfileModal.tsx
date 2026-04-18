import React, { useState } from "react";
import { X, User, Camera, Loader2, Save, Type, FileText, Image as ImageIcon } from "lucide-react";
import { useToastStore } from "../store/toastStore";
import { motion, AnimatePresence } from "motion/react";
import clsx from "clsx";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    id: string;
    display_name: string;
    bio: string;
    avatar_url: string;
    banner_url: string;
  };
  onSuccess: () => void;
}

export function EditProfileModal({ isOpen, onClose, profile, onSuccess }: Props) {
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [bio, setBio] = useState(profile.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
  const [bannerUrl, setBannerUrl] = useState(profile.banner_url || "");
  const [loading, setLoading] = useState(false);
  const { addToast } = useToastStore();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${profile.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          bio: bio,
          avatar_url: avatarUrl,
          banner_url: bannerUrl
        })
      });
      const data = await res.json();
      if (data.success) {
        addToast("Đã cập nhật hồ sơ thành công! ✨", "success");
        onSuccess();
        onClose();
      } else {
        addToast(data.error || "Lỗi khi cập nhật", "error");
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
        className="w-full max-w-2xl bg-[#121212] rounded-[32px] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-[#1ed760]">
                <User size={20} />
              </div>
              <h2 className="text-xl font-black tracking-tight text-white">Chỉnh sửa hồ sơ</h2>
           </div>
           <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center">
              <X size={20} />
           </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10">
           {/* Visual Identity Section */}
           <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                 <div className="w-1 h-5 bg-[#1ed760] rounded-full" />
                 <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">Hình ảnh định danh</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">Ảnh đại diện (URL)</label>
                    <div className="relative group">
                       <input 
                        type="text" 
                        value={avatarUrl}
                        onChange={e => setAvatarUrl(e.target.value)}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-[#1ed760]/40 transition-all text-sm"
                        placeholder="https://..."
                       />
                       <div className="mt-4 w-24 h-24 rounded-2xl bg-zinc-900 border border-white/5 overflow-hidden shadow-xl">
                          <img src={avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg"} className="w-full h-full object-cover" alt="" />
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">Ảnh bìa (URL)</label>
                    <div className="relative group">
                       <input 
                        type="text" 
                        value={bannerUrl}
                        onChange={e => setBannerUrl(e.target.value)}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-[#1ed760]/40 transition-all text-sm"
                        placeholder="https://..."
                       />
                       <div className="mt-4 w-full h-24 rounded-2xl bg-zinc-900 border border-white/5 overflow-hidden shadow-xl">
                          <img src={bannerUrl || `https://picsum.photos/seed/${profile.id}/800/200`} className="w-full h-full object-cover opacity-60" alt="" />
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Information Section */}
           <div className="space-y-8">
              <div className="flex items-center gap-3 mb-2">
                 <div className="w-1 h-5 bg-[#1ed760] rounded-full" />
                 <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">Thông tin cơ bản</h3>
              </div>

              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">Tên hiển thị</label>
                 <div className="relative">
                    <Type className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                    <input 
                      type="text" 
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl py-4.5 pl-14 pr-6 text-white font-bold focus:outline-none focus:border-[#1ed760]/40 transition-all"
                      required
                    />
                 </div>
              </div>

              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">Tiểu sử (Bio)</label>
                 <div className="relative">
                    <FileText className="absolute left-5 top-6 text-zinc-600" size={18} />
                    <textarea 
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 rounded-3xl py-5 pl-14 pr-6 text-white font-medium text-sm h-32 focus:outline-none focus:border-[#1ed760]/40 transition-all resize-none scrollbar-hide"
                      placeholder="Kể về sở thích âm nhạc của bạn..."
                    />
                 </div>
              </div>
           </div>
        </form>

        <div className="p-8 border-t border-white/5 flex justify-end gap-4 bg-black/20">
            <button 
              onClick={onClose} 
              className="px-8 py-3 rounded-full font-bold text-sm text-zinc-500 hover:text-white transition-all uppercase tracking-widest"
            >
               Hủy bỏ
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={loading}
              className="bg-[#1ed760] text-black px-10 py-3 rounded-full font-black text-sm uppercase tracking-[0.2em] shadow-[0_10px_20px_rgba(30,215,96,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:grayscale"
            >
               {loading ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Lưu thay đổi</>}
            </button>
        </div>
      </motion.div>
    </div>
  );
}
