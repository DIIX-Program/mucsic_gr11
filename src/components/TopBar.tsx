import React, { useEffect, useState, useRef } from "react";
import { Bell, User, ChevronLeft, ChevronRight, Download, LogOut, CheckCheck, ShieldCheck } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useNavigate, Link } from "react-router-dom";
import { useToastStore } from "../store/toastStore";
import clsx from "clsx";

interface NotificationItem {
  id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function TopBar() {
  const { userId, isAdmin } = useAuthStore();
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userId) {
      const hasGreeted = sessionStorage.getItem("has_greeted");
      if (!hasGreeted) {
        addToast("Chào mừng trở lại! Hôm nay bạn muốn nghe gì...", "success");
        sessionStorage.setItem("has_greeted", "true");
      }
      
      // Mock notifications for now, or fetch if available
      fetch("/api/users/notifications")
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data.length > 0) {
            setNotifications(data.data);
          } else {
            // Mock data
            setNotifications([
              { id: "1", message: "Chào mừng bạn đến với MusicEVE!", is_read: false, created_at: new Date().toISOString() },
              { id: "2", message: "Tài khoản của bạn đã được nâng cấp lên hạng Thành viên Ảo", is_read: true, created_at: new Date(Date.now() - 86400000).toISOString() }
            ]);
          }
        })
        .catch(() => {
          setNotifications([
            { id: "1", message: "Chào mừng bạn đến với MusicEVE!", is_read: false, created_at: new Date().toISOString() },
            { id: "2", message: "Tài khoản của bạn đã được nâng cấp lên hạng Thành viên Ảo", is_read: true, created_at: new Date(Date.now() - 86400000).toISOString() }
          ]);
        });
    }
  }, [userId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifRef]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    addToast("Đã đánh dấu tất cả là đã đọc", "info");
  };

  return (
    <div className="h-16 bg-black/40 backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between px-8 border-b border-white/5 mx-6 mt-4 rounded-2xl shadow-2xl">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-zinc-400 hover:text-white transition hover:bg-black"
        >
          <ChevronLeft size={20} />
        </button>
        <button 
          onClick={() => navigate(1)}
          className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-zinc-400 hover:text-white transition hover:bg-black"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <a 
          href="/logo.png" 
          download="logo.png"
          className="hidden md:flex items-center gap-2 bg-white/5 text-white px-5 py-2 rounded-full font-black text-xs uppercase tracking-widest hover:bg-white/10 transition border border-white/5"
        >
          <Download size={14} />
          Tải ứng dụng
        </a>
        
        <div className="h-8 w-[1px] bg-white/10 mx-2 hidden md:block" />

        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={clsx(
              "w-10 h-10 rounded-full bg-black/60 flex items-center justify-center transition shadow-xl",
              showNotifications ? "text-[#1ed760] scale-110" : "text-zinc-400 hover:text-white hover:scale-110"
            )}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-black" />
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute top-14 right-0 w-80 bg-[#121212] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
               <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                 <h3 className="font-bold text-white text-sm">Thông báo</h3>
                 {unreadCount > 0 && (
                   <button onClick={handleMarkAllRead} className="text-xs text-zinc-400 hover:text-white transition flex items-center gap-1">
                     <CheckCheck size={14} /> Đọc tất cả
                   </button>
                 )}
               </div>
               <div className="max-h-[300px] overflow-y-auto">
                 {notifications.length > 0 ? notifications.map((notif) => (
                    <div key={notif.id} className={clsx(
                      "p-4 border-b border-white/5 hover:bg-white/5 transition flex gap-3",
                      !notif.is_read ? "bg-white/[0.02]" : "opacity-70"
                    )}>
                      <div className="mt-0.5">
                        <div className={clsx("w-2 h-2 rounded-full", !notif.is_read ? "bg-[#1ed760]" : "bg-transparent")} />
                      </div>
                      <div className="flex-1 flex flex-col gap-1">
                        <p className={clsx("text-xs leading-snug", !notif.is_read ? "text-white font-medium" : "text-zinc-300")}>{notif.message}</p>
                        <span className="text-[10px] text-zinc-500">
                          {new Date(notif.created_at).toLocaleDateString("vi-VN", { hour: '2-digit', minute: '2-digit'})}
                        </span>
                      </div>
                    </div>
                 )) : (
                    <div className="p-8 text-center text-zinc-500 text-xs">
                      Không có thông báo nào.
                    </div>
                 )}
               </div>
            </div>
          )}
        </div>
        
         {userId ? (
          <div className="flex items-center gap-3">
             {isAdmin && (
               <Link 
                 to="/admin"
                 className="w-10 h-10 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-400 hover:text-white hover:bg-indigo-600 transition hover:scale-110 shadow-xl"
                 title="Admin Dashboard"
               >
                 <ShieldCheck size={20} />
               </Link>
             )}
             <Link 
              to={`/profile/${userId}`}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1ed760] to-[#1db954] outline outline-2 outline-[#1ed760]/20 flex items-center justify-center text-black hover:scale-110 transition cursor-pointer shadow-[0_0_20px_rgba(30,215,96,0.4)] group overflow-hidden"
            >
              <User size={20} className="group-hover:scale-110 transition-transform" />
            </Link>
            <button 
              onClick={async () => {
                if (!window.confirm("Bạn có chắc chắn muốn đăng xuất?")) return;
                const { useLibraryStore } = await import("../store/libraryStore.js");
                await fetch("/api/auth/logout", { method: "POST" });
                useLibraryStore.getState().reset(); // SSOT Reset
                window.location.href = "/auth";
              }}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 hover:text-rose-500 transition hover:bg-rose-500/10"
              title="Đăng xuất"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => navigate("/auth")}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition hover:scale-110 border border-white/5"
          >
            <User size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
