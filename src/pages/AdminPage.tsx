import React, { useState } from 'react';
import {
  ShieldCheck, Music, MessageSquare, Users, RefreshCw,
  Check, X, Trash2, UserX, UserCheck, BarChart3,
  AlertCircle, Loader2, Search, Eye
} from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';

type Tab = 'stats' | 'tracks' | 'comments' | 'users' | 'artists';

// ── Skeleton ────────────────────────────────────────────────────────────────
const Sk = ({ className }: { className?: string; key?: React.Key }) => (
  <div className={clsx("bg-zinc-800 rounded-xl animate-pulse", className)} />
);

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className={clsx("p-5 rounded-2xl border", color)}>
      <p className="text-xs font-black uppercase tracking-widest opacity-60 mb-2">{label}</p>
      <p className="text-3xl font-black text-white">{(value ?? 0).toLocaleString()}</p>
    </div>
  );
}

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('stats');
  const [search, setSearch] = useState('');
  const {
    usePendingTracks, useRecentComments, useUsers, useStats,
    useModerateTrack, useModerateComment, useManageUser,
    useArtistRequests, useModerateArtist
  } = useAdmin();

  const { data: stats,    isLoading: sLoading,  refetch: rStats   } = useStats();
  const { data: tracks,   isLoading: tLoading,  refetch: rTracks  } = usePendingTracks();
  const { data: comments, isLoading: cLoading,  refetch: rComments } = useRecentComments();
  const { data: users,    isLoading: uLoading,  refetch: rUsers   } = useUsers(1, search);
  const { data: artists,  isLoading: arLoading, refetch: rArtists } = useArtistRequests();

  const moderateTrack   = useModerateTrack();
  const moderateComment = useModerateComment();
  const manageUser      = useManageUser();
  const moderateArtist  = useModerateArtist();

  const refetch = () => { rStats(); rTracks(); rComments(); rUsers(); rArtists(); };

  const tabs: { id: Tab; label: string; icon: any; badge?: number }[] = [
    { id: 'stats',    label: 'Tổng quan',        icon: BarChart3,     },
    { id: 'tracks',   label: 'Duyệt nhạc',       icon: Music,         badge: tracks?.length   },
    { id: 'artists',  label: 'Nghệ sĩ',          icon: ShieldCheck,   badge: artists?.length  },
    { id: 'comments', label: 'Bình luận',         icon: MessageSquare, },
    { id: 'users',    label: 'Người dùng',        icon: Users,         },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-[#1ed760] text-xs font-black uppercase tracking-widest mb-1">
            <ShieldCheck size={14} /> Hệ thống quản trị
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white">Admin Dashboard</h1>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-zinc-300 hover:bg-white/10 transition"
        >
          <RefreshCw size={15} /> Làm mới
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/5 pb-px mb-8">
        {tabs.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "relative flex items-center gap-2 px-5 py-3 text-sm font-bold transition rounded-t-lg",
                active ? "text-white" : "text-zinc-500 hover:text-white"
              )}
            >
              <tab.icon size={15} />
              {tab.label}
              {tab.badge ? (
                <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {tab.badge}
                </span>
              ) : null}
              {active && (
                <motion.div layoutId="admin-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1ed760]" />
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* STATS */}
        {activeTab === 'stats' && (
          <motion.div key="stats" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {sLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => <Sk key={i} className="h-24" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Tổng người dùng"  value={stats?.total_users}     color="bg-blue-500/10 border-blue-500/20" />
                <StatCard label="Tổng bài hát"     value={stats?.total_tracks}    color="bg-purple-500/10 border-purple-500/20" />
                <StatCard label="Chờ duyệt"        value={stats?.pending_tracks}  color="bg-amber-500/10 border-amber-500/20" />
                <StatCard label="Đã duyệt"         value={stats?.approved_tracks} color="bg-green-500/10 border-green-500/20" />
                <StatCard label="Tổng Playlist"    value={stats?.total_playlists} color="bg-pink-500/10 border-pink-500/20" />
                <StatCard label="Tổng bình luận"   value={stats?.total_comments}  color="bg-orange-500/10 border-orange-500/20" />
                <StatCard label="Tổng lượt nghe"   value={stats?.total_plays}     color="bg-[#1ed760]/10 border-[#1ed760]/20" />
              </div>
            )}
          </motion.div>
        )}

        {/* TRACKS */}
        {activeTab === 'tracks' && (
          <motion.div key="tracks" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {tLoading ? (
              <div className="space-y-3">{Array.from({length:4}).map((_,i)=><Sk key={i} className="h-20"/>)}</div>
            ) : !tracks?.length ? (
              <Empty icon={Music} t="Không có bài hát chờ duyệt" d="Tất cả bài hát đã được xử lý." />
            ) : (
              <div className="space-y-3">
                {tracks.map((track: any) => (
                  <div key={track.id} className="flex items-center gap-4 bg-zinc-900/60 p-4 rounded-2xl border border-white/5">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-800 shrink-0">
                      <img src={track.cover_path || `https://picsum.photos/seed/${track.id}/80/80`} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white truncate">{track.title}</p>
                      <p className="text-xs text-zinc-500">{track.main_artist} · by {track.uploader_name}</p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">{new Date(track.created_at).toLocaleDateString('vi-VN')}</p>
                    </div>
                    {track.audio_path && (
                      <audio controls src={track.audio_path} className="h-8 hidden sm:block w-36 rounded-lg" />
                    )}
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => moderateTrack.mutate({ id: track.id, action: 'approve' })}
                        disabled={moderateTrack.isPending}
                        className="flex items-center gap-1.5 bg-[#1ed760] text-black px-4 py-2 rounded-xl font-bold text-xs hover:scale-105 transition disabled:opacity-50"
                      >
                        <Check size={13} strokeWidth={3} /> Duyệt
                      </button>
                      <button
                        onClick={() => moderateTrack.mutate({ id: track.id, action: 'reject' })}
                        disabled={moderateTrack.isPending}
                        className="flex items-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2 rounded-xl font-bold text-xs hover:bg-red-500/20 transition disabled:opacity-50"
                      >
                        <X size={13} strokeWidth={3} /> Từ chối
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* COMMENTS */}
        {activeTab === 'comments' && (
          <motion.div key="comments" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {cLoading ? (
              <div className="space-y-3">{Array.from({length:4}).map((_,i)=><Sk key={i} className="h-20"/>)}</div>
            ) : !comments?.length ? (
              <Empty icon={MessageSquare} t="Không có bình luận nào" d="Chưa có phản hồi nào từ người dùng." />
            ) : (
              <div className="space-y-3">
                {comments.map((c: any) => (
                  <div key={c.id} className={clsx("bg-zinc-900/60 p-4 rounded-2xl border transition-all", c.status === 'HIDDEN' ? "opacity-50 grayscale border-red-500/20" : "border-white/5 shadow-xl")}>
                    <div className="flex items-start gap-4">
                      <img src={c.avatar_url || `https://picsum.photos/seed/${c.id}/50/50`} className="w-10 h-10 rounded-full border border-white/10" alt="" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1.5">
                          <span className="font-black text-sm text-white">{c.username}</span>
                          <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">trên</span>
                          <span className="text-[10px] text-[#1ed760] font-black truncate max-w-[150px] uppercase tracking-tighter">{c.track_title}</span>
                          {c.status === 'HIDDEN' && (
                            <span className="bg-red-500/20 text-red-500 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase ml-auto">Đã ẩn</span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-300 leading-relaxed font-medium">{c.content}</p>
                        <p className="text-[10px] text-zinc-600 mt-2 font-bold tabular-nums">{new Date(c.created_at).toLocaleString('vi-VN')}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {c.status === 'HIDDEN' ? (
                          <button
                            onClick={() => moderateComment.mutate({ id: c.id, action: 'status', status: 'APPROVED' })}
                            className="p-2.5 bg-[#1ed760]/10 text-[#1ed760] rounded-xl hover:bg-[#1ed760]/20 transition shadow-lg"
                            title="Hiện bình luận"
                          >
                            <Check size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => moderateComment.mutate({ id: c.id, action: 'status', status: 'HIDDEN' })}
                            className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl hover:bg-amber-500/20 transition shadow-lg"
                            title="Ẩn bình luận"
                          >
                            <Eye size={16} className="opacity-60" />
                          </button>
                        )}
                        <button
                          onClick={() => { if(confirm("Xóa vĩnh viễn bình luận này?")) moderateComment.mutate({ id: c.id, action: 'delete' }) }}
                          className="p-2.5 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition shadow-lg"
                          title="Xóa vĩnh viễn"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* USERS */}
        {activeTab === 'users' && (
          <motion.div key="users" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* Search */}
            <div className="relative mb-5">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm theo tên, email..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#1ed760]/40 transition"
              />
            </div>

            {uLoading ? (
              <div className="space-y-2">{Array.from({length:5}).map((_,i)=><Sk key={i} className="h-16"/>)}</div>
            ) : !users?.length ? (
              <Empty icon={Users} t="Không tìm thấy người dùng" d="" />
            ) : (
              <div className="space-y-2">
                {users.map((u: any) => (
                  <div key={u.id} className={clsx("flex items-center gap-4 p-4 rounded-2xl border transition", u.status === 'disabled' ? "bg-red-500/5 border-red-500/20" : "bg-zinc-900/60 border-white/5")}>
                    <img src={u.avatar_url || `https://picsum.photos/seed/${u.id}/60/60`} className="w-11 h-11 rounded-full" alt="" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white text-sm truncate">{u.display_name || u.username}</p>
                        {u.is_admin ? (
                          <span className="bg-[#1ed760]/20 text-[#1ed760] text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase">Admin</span>
                        ) : null}
                        {u.status === 'disabled' && (
                          <span className="bg-red-500/20 text-red-400 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase">Bị khoá</span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500">{u.email} · {u.total_tracks} bài · {u.total_playlists} pl</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {u.status === 'disabled' ? (
                        <button
                          onClick={() => manageUser.mutate({ id: u.id, action: 'enable' })}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl font-bold text-xs hover:bg-green-500/20 transition"
                        >
                          <UserCheck size={12} /> Mở khoá
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (u.is_admin) return;
                            if (confirm(`Khoá tài khoản ${u.username}?`)) manageUser.mutate({ id: u.id, action: 'disable' });
                          }}
                          disabled={u.is_admin}
                          className="flex items-center gap-1 px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl font-bold text-xs hover:bg-amber-500/20 transition disabled:opacity-30"
                        >
                          <UserX size={12} /> Khoá
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (u.is_admin) return;
                          if (confirm(`XÓA VĨNH VIỄN ${u.username}? Thao tác không thể hoàn tác.`))
                            manageUser.mutate({ id: u.id, action: 'delete' });
                        }}
                        disabled={u.is_admin}
                        className="p-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition disabled:opacity-30"
                        title="Xóa"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
        {/* ARTISTS */}
        {activeTab === 'artists' && (
          <motion.div key="artists" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
             {arLoading ? (
              <div className="space-y-3">{Array.from({length:3}).map((_,i)=><Sk key={i} className="h-24"/>)}</div>
            ) : !artists?.length ? (
              <Empty icon={ShieldCheck} t="Không có yêu cầu làm nghệ sĩ" d="Tất cả hồ sơ đã được xử lý." />
            ) : (
              <div className="space-y-3">
                {artists.map((art: any) => (
                  <div key={art.id} className="flex items-center gap-4 bg-zinc-900/60 p-5 rounded-2xl border border-white/5">
                    <img src={art.avatar_url || `https://picsum.photos/seed/${art.id}/100/100`} className="w-16 h-16 rounded-2xl object-cover shrink-0" alt="" />
                    <div className="flex-1 min-w-0">
                       <p className="font-black text-white text-lg">{art.artist_name}</p>
                       <p className="text-sm text-zinc-500 mb-2">Username: {art.username}</p>
                       <p className="text-xs text-zinc-400 italic line-clamp-2">"{art.bio || 'Không có tiểu sử'}"</p>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={() => moderateArtist.mutate({ id: art.id, action: 'approve' })}
                        className="bg-[#1ed760] text-black px-6 py-2.5 rounded-xl font-black text-xs hover:scale-105 transition"
                      >
                        PHÊ DUYỆT
                      </button>
                      <button
                        onClick={() => moderateArtist.mutate({ id: art.id, action: 'reject' })}
                        className="bg-red-500/10 text-red-500 border border-red-500/20 px-6 py-2.5 rounded-xl font-black text-xs hover:bg-red-500/20 transition"
                      >
                        TỪ CHỐI
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function Empty({ icon: Icon, t, d }: { icon: any; t: string; d: string }) {
  return (
    <div className="py-20 flex flex-col items-center opacity-40">
      <Icon size={48} className="text-zinc-600 mb-4" />
      <p className="font-bold text-white">{t}</p>
      {d && <p className="text-sm text-zinc-500">{d}</p>}
    </div>
  );
}

export default AdminPage;
