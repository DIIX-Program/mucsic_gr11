import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud, CheckCircle2, Globe, Lock, Clock, Info, Image as ImageIcon, Loader2, Music, Youtube, Play, X, FileAudio, Sparkles } from "lucide-react";
import { useToastStore } from "../store/toastStore";
import { useAuthStore } from "../store/authStore";
import { motion, AnimatePresence } from "motion/react";
import clsx from "clsx";

export function Upload() {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [album, setAlbum] = useState("");
  const [genre, setGenre] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("public");
  
  const [file, setFile] = useState<File | null>(null);
  const [artworkPreview, setArtworkPreview] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [generatingAI, setGeneratingAI] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const artworkInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const { userId, isArtist } = useAuthStore();
  const [requestSent, setRequestSent] = useState(false);

  const handleArtistRequest = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/artists/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artist_name: "Tên Nghệ Sĩ Mới" }), 
      });
      const data = await res.json();
      if (data.success) {
        addToast("Yêu cầu trở thành nghệ sĩ đã được gửi!", "success");
        setRequestSent(true);
      } else {
        addToast(data.error || "Không thể gửi yêu cầu", "error");
      }
    } catch {
      addToast("Lỗi kết nối", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isArtist) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center max-w-2xl mx-auto gap-8">
        <div className="w-24 h-24 bg-zinc-900 rounded-[32px] flex items-center justify-center border border-white/5 shadow-2xl">
           <Music size={48} className="text-zinc-700" />
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-black text-white tracking-tighter">Bạn chưa phải là Nghệ sĩ</h2>
          <p className="text-zinc-500 font-bold text-lg leading-relaxed">
            Chỉ những nghệ sĩ đã được xác minh mới có thể phát hành âm nhạc trên nền tảng. 
            Hãy gửi yêu cầu và bắt đầu hành trình âm nhạc của bạn!
          </p>
        </div>
        
        {requestSent ? (
          <div className="bg-[#1ed760]/10 border border-[#1ed760]/20 p-6 rounded-3xl flex items-center gap-4 text-[#1ed760]">
             <CheckCircle2 size={24} />
             <span className="font-black uppercase tracking-widest text-sm">Yêu cầu của bạn đang chờ phê duyệt</span>
          </div>
        ) : (
          <button 
            onClick={handleArtistRequest}
            disabled={loading}
            className="bg-[#1ed760] text-black font-black py-4 px-12 rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_rgba(30,215,96,0.3)] disabled:opacity-50"
          >
            {loading ? <Loader2 size={24} className="animate-spin" /> : "GỬI YÊU CẦU TRỞ THÀNH NGHỆ SĨ"}
          </button>
        )}
      </div>
    );
  }

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      simulateProgress();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      simulateProgress();
    }
  };

  const simulateProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 80);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !artist || !file) {
      addToast("Vui lòng điền đầy đủ các thông tin bắt buộc", "error");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("main_artist", artist);
      if (genre) formData.append("genre", genre);
      if (description) formData.append("description", description);
      formData.append("visibility", visibility);
      if (releaseDate) formData.append("releaseDate", releaseDate);
      if (album) formData.append("album", album);
      formData.append("audio", file);
      if (artworkInputRef.current?.files?.[0]) {
        formData.append("cover_image", artworkInputRef.current.files[0]);
      }

      const res = await fetch("/api/tracks", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      
      if (data.success) {
        addToast("Bài hát đã được phát hành thành công!", "success");
        setSuccess(true);
        setTimeout(() => {
          navigate("/");
        }, 2500);
      } else {
        setError(data.error || "Tải lên thất bại");
        addToast(data.error || "Tải lên thất bại", "error");
      }
    } catch (err) {
      setError("Mất kết nối máy chủ. Vui lòng thử lại.");
      addToast("Lỗi mạng", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!title || !artist) {
      addToast("Vui lòng nhập Tiêu đề và Nghệ sĩ trước khi tạo mô tả AI", "error");
      return;
    }
    setGeneratingAI(true);
    try {
      const res = await fetch("/api/tracks/ai-generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, artist }),
      });
      const data = await res.json();
      if (data.success) {
        setDescription(data.description);
        addToast("Đã tạo mô tả bằng AI! ✨", "success");
      } else {
        addToast(data.error || "Không thể tạo mô tả AI", "error");
      }
    } catch {
      addToast("Lỗi kết nối AI", "error");
    } finally {
      setGeneratingAI(false);
    }
  };

  const genresList = [
    { id: "genre_pop", name: "Pop" },
    { id: "genre_hiphop", name: "Hip-Hop" },
    { id: "genre_rock", name: "Rock" },
    { id: "genre_indie", name: "Indie" },
    { id: "genre_electronic", name: "Electronic" },
    { id: "genre_lofi", name: "Lofi" }
  ];

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] p-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-zinc-900/40 p-12 rounded-[48px] border border-[#1ed760]/20 flex flex-col items-center text-center max-w-lg w-full backdrop-blur-3xl shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none rotate-12">
            <Sparkles size={200} />
          </div>
          
          <div className="w-24 h-24 bg-[#1ed760]/20 rounded-[32px] flex items-center justify-center mb-8 shadow-inner border border-[#1ed760]/10">
            <CheckCircle2 size={48} className="text-[#1ed760]" />
          </div>
          <h2 className="text-4xl font-black text-white mb-4 tracking-tighter">Bài hát đã được phát hành!</h2>
          <p className="text-zinc-400 mb-10 font-bold text-lg leading-relaxed">Âm nhạc của bạn hiện đang trực tuyến trên mạng lưới MusicEVE.</p>
          
          <div className="w-full space-y-4">
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, ease: "easeInOut" }}
                className="h-full bg-[#1ed760] shadow-[0_0_20px_rgba(30,215,96,0.5)]" 
              />
            </div>
            <p className="text-zinc-600 text-[10px] uppercase font-black tracking-[0.4em]">Đang chuyển hướng về Trang chủ</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-8 flex flex-col gap-12 pb-32">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-[#1ed760]">
             <UploadCloud size={20} />
             <span className="text-[10px] font-black uppercase tracking-[0.4em]">Phòng thu âm nhạc</span>
          </div>
          <h1 className="text-6xl font-black text-white tracking-tighter">Chia sẻ giai điệu của bạn </h1>
        </div>
        <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-xl">
           <Info size={16} className="text-zinc-500" />
           <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Hỗ trợ: WAV, MP3, FLAC (Max 20MB)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
        {/* Left Col: Media Upload */}
        <div className="xl:col-span-5 space-y-8">
           <section className="bg-[#1a1a1a] rounded-[40px] p-8 border border-white/5 shadow-2xl space-y-8">
              <h3 className="text-xl font-black text-white flex items-center gap-3 underline decoration-[#1ed760] underline-offset-8">
                <FileAudio size={20} className="text-[#1ed760]" />
                Tệp âm thanh
              </h3>
              
              <div 
                className={clsx(
                  "aspect-[16/9] border-2 border-dashed rounded-[32px] flex flex-col items-center justify-center text-center transition-all duration-500 group cursor-pointer relative overflow-hidden",
                  file ? 'border-[#1ed760]/40 bg-[#1ed760]/5 shadow-[inset_0_0_40px_rgba(30,215,96,0.05)]' : 'border-white/5 hover:border-white/20 bg-white/[0.02]'
                )}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="audio/*" className="hidden" />
                
                <AnimatePresence mode="wait">
                  {file ? (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4">
                       <div className="w-16 h-16 bg-[#1ed760] rounded-full flex items-center justify-center shadow-2xl">
                          <CheckCircle2 size={28} className="text-black" />
                       </div>
                       <span className="text-white font-black text-sm uppercase tracking-widest truncate max-w-[250px]">{file.name}</span>
                       <div className="px-4 py-1.5 rounded-full bg-white/10 text-white font-black text-[9px] uppercase tracking-widest">Đã sẵn sàng</div>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 bg-white/5 rounded-[24px] flex items-center justify-center group-hover:bg-white/10 transition-all shadow-xl">
                        <UploadCloud size={36} className="text-zinc-500 group-hover:text-[#1ed760] transition-colors" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-white font-black text-sm uppercase tracking-widest">Kéo thả file âm thanh</p>
                        <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Hoặc nhấp để chọn từ thiết bị</p>
                      </div>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {file && (
                <div className="bg-white/5 rounded-3xl p-6 border border-white/5 space-y-4">
                  <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                    <span className="text-zinc-500">Mã hóa dữ liệu...</span>
                    <span className="text-[#1ed760]">{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-[#1ed760] shadow-[0_0_15px_rgba(30,215,96,0.3)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
           </section>

           <section className="bg-[#1a1a1a] rounded-[40px] p-8 border border-white/5 shadow-2xl space-y-8">
              <h3 className="text-xl font-black text-white flex items-center gap-3 underline decoration-[#1ed760] underline-offset-8">
                <ImageIcon size={20} className="text-[#1ed760]" />
                Ảnh bìa bài hát
              </h3>
              
              <div 
                className="aspect-square bg-white/[0.02] rounded-[32px] relative overflow-hidden group cursor-pointer border-2 border-dashed border-white/5 hover:border-white/20 transition-all flex items-center justify-center shadow-inner"
                onClick={() => artworkInputRef.current?.click()}
              >
                <input type="file" ref={artworkInputRef} onChange={(e) => e.target.files?.[0] && setArtworkPreview(URL.createObjectURL(e.target.files[0]))} accept="image/*" className="hidden" />
                
                {artworkPreview ? (
                  <img src={artworkPreview} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                  <div className="flex flex-col items-center gap-4 text-zinc-600 transition-colors group-hover:text-zinc-400">
                    <div className="w-20 h-20 rounded-full border-2 border-dashed border-zinc-800 flex items-center justify-center">
                       <ImageIcon size={32} strokeWidth={1} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest">Chọn ảnh nghệ thuật</span>
                  </div>
                )}
                
                {artworkPreview && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                     <div className="px-6 py-2 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl">Thay đổi ảnh</div>
                  </div>
                )}
              </div>
           </section>
        </div>

        {/* Right Col: Track Info Form */}
        <div className="xl:col-span-7">
           <form onSubmit={handleUpload} className="bg-[#1a1a1a] rounded-[48px] p-12 border border-white/5 shadow-2xl space-y-12 h-full flex flex-col">
              <div className="space-y-10 flex-1">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="md:col-span-2 space-y-3">
                       <label className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500 ml-1">Tiêu đề bài hát *</label>
                       <input 
                        type="text" 
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="VD: Giai Điệu Mùa Thu"
                        className="w-full bg-white/5 border border-white/5 rounded-2xl py-4.5 px-6 text-white font-bold text-lg focus:outline-none focus:border-[#1ed760]/40 focus:bg-white/[0.08] transition-all placeholder:text-zinc-700"
                        required
                       />
                    </div>

                    <div className="space-y-3">
                       <label className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500 ml-1">Nghệ sĩ trình bày *</label>
                       <input 
                        type="text" 
                        value={artist}
                        onChange={e => setArtist(e.target.value)}
                        placeholder="Tên của bạn hoặc nghệ sĩ"
                        className="w-full bg-white/5 border border-white/5 rounded-2xl py-4.5 px-6 text-white font-bold focus:outline-none focus:border-[#1ed760]/40 transition-all placeholder:text-zinc-700"
                        required
                       />
                    </div>

                    <div className="space-y-3">
                       <label className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500 ml-1">Thể loại</label>
                       <div className="relative">
                         <select 
                          value={genre}
                          onChange={e => setGenre(e.target.value)}
                          className="w-full bg-white/5 border border-white/5 rounded-2xl py-4.5 px-6 text-white font-bold focus:outline-none focus:border-[#1ed760]/40 appearance-none cursor-pointer"
                         >
                           <option value="" className="bg-[#1a1a1a]">Chọn thể loại</option>
                           {genresList.map(g => <option key={g.id} value={g.name} className="bg-[#1a1a1a]">{g.name}</option>)}
                         </select>
                         <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">▼</div>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500 ml-1">Mô tả bài hát (AI Support)</label>
                      <button 
                        type="button"
                        onClick={handleGenerateAI}
                        disabled={generatingAI}
                        className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[#1ed760] hover:text-white transition-colors bg-[#1ed760]/10 px-3 py-1 rounded-full border border-[#1ed760]/20 disabled:opacity-50"
                      >
                        {generatingAI ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                        Tạo bằng AI
                      </button>
                    </div>
                    <textarea 
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Viết một vài lời giới thiệu về tác phẩm này..."
                      className="w-full bg-white/5 border border-white/5 rounded-3xl p-6 text-white font-medium text-sm h-32 focus:outline-none focus:border-[#1ed760]/40 transition-all resize-none placeholder:text-zinc-700 scrollbar-hide"
                    />
                 </div>

                 <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500 ml-1">Lời bài hát (LRC Format)</label>
                    <textarea 
                      placeholder="[00:10.00] Lời bài hát đầu tiên..."
                      className="w-full bg-white/5 border border-white/5 rounded-3xl p-6 text-white font-medium text-sm h-32 focus:outline-none focus:border-[#1ed760]/40 transition-all resize-none placeholder:text-zinc-700 scrollbar-hide"
                    />
                 </div>

                 <div className="flex flex-wrap gap-4">
                    <button 
                      type="button" 
                      onClick={() => setVisibility(visibility === "public" ? "private" : "public")}
                      className={clsx(
                        "flex items-center gap-3 px-6 py-2.5 rounded-full text-xs font-black transition-all border",
                        visibility === 'public' ? 'bg-[#1ed760]/10 text-[#1ed760] border-[#1ed760]/20' : 'bg-white/5 text-zinc-400 border-white/5'
                      )}
                    >
                      {visibility === 'public' ? <Globe size={14} /> : <Lock size={14} />}
                      {visibility === 'public' ? "CÔNG KHAI" : "RIÊNG TƯ"}
                    </button>
                    <div className="flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/5 text-zinc-500 border border-white/5 text-xs font-black">
                       <Clock size={14} />
                       LỊCH PHÁT: NGAY LẬP TỨC
                    </div>
                 </div>
              </div>

              <div className="pt-10 border-t border-white/5 flex items-center justify-between">
                 <button 
                  type="button"
                  onClick={() => window.confirm("Bạn có chắc muốn hủy bản thảo này?") && navigate("/")}
                  className="px-8 py-4 text-xs font-black uppercase tracking-[0.3em] text-zinc-500 hover:text-white transition-colors"
                 >
                   Hủy bản thảo
                 </button>

                 <button 
                  type="submit"
                  disabled={loading || !file || !title || !artist}
                  className="group relative flex items-center gap-4 bg-[#1ed760] hover:bg-[#1db954] text-black font-black py-4.5 px-12 rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_rgba(30,215,96,0.3)] disabled:opacity-40 disabled:grayscale disabled:scale-100"
                 >
                   {loading ? <Loader2 size={24} className="animate-spin" /> : (
                     <>
                        PHÁT HÀNH NGAY 
                        <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center group-hover:bg-black group-hover:text-[#1ed760] transition-all">
                           <Play size={14} className="fill-current" />
                        </div>
                     </>
                   )}
                 </button>
              </div>
           </form>
        </div>
      </div>
    </div>
  );
}
