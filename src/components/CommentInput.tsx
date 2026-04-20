import React, { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { useToastStore } from "../store/toastStore";
import { useAuthStore } from "../store/authStore";

interface CommentInputProps {
  trackId: string;
  onCommentAdded?: (comment: any) => void;
}

export function CommentInput({ trackId, onCommentAdded }: CommentInputProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const { addToast } = useToastStore();
  const { userId } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      addToast("Vui lòng đăng nhập để bình luận", "info");
      return;
    }
    if (!content.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/comments/${trackId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setContent("");
        addToast("Bình luận của bạn đã được gửi và đang chờ duyệt!", "success");
        if (onCommentAdded) onCommentAdded(data.data);
      } else {
        addToast(data.error || "Không thể gửi bình luận", "error");
      }
    } catch (err) {
      addToast("Lỗi kết nối", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative group">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Viết cảm nghĩ của bạn..."
        className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-6 pr-14 text-sm text-white focus:outline-none focus:border-[#1ed760]/40 focus:bg-white/[0.08] transition-all placeholder:text-zinc-600"
      />
      <button
        type="submit"
        disabled={loading || !content.trim()}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#1ed760] rounded-xl flex items-center justify-center text-black shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
      </button>
    </form>
  );
}
