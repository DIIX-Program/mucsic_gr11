import React, { useEffect, useRef, useState } from "react";
import { usePlayerStore, Track } from "../store/playerStore";
import { useAuthStore } from "../store/authStore";
import { 
  Play, Pause, SkipForward, SkipBack, Volume2, Mic2, ListMusic, 
  MonitorSpeaker, Repeat, Shuffle, X, Heart, Share2, ChevronDown, 
  PlusCircle, Disc, Loader2, Check
} from "lucide-react";
import clsx from "clsx";
import { Link } from "react-router-dom";
import { useToastStore } from "../store/toastStore";
import { PlaylistPickerModal } from "./PlaylistPickerModal";
import { FullScreenPlayer } from "./FullScreenPlayer";

interface LrcLine {
  time: number;
  text: string;
}

export function Player() {
  const { 
    currentTrack, isPlaying, setPlaying, volume, setVolume, 
    progress, setProgress, duration, setDuration, 
    nextTrack, prevTrack, showLyrics, setShowLyrics, queue, currentIndex, setQueue,
    likedTrackIds, toggleLike: globalToggleLike,
    isShuffle, toggleShuffle, repeatMode, toggleRepeatMode
  } = usePlayerStore();

  const { userId } = useAuthStore();
  const { addToast } = useToastStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [lrcLines, setLrcLines] = useState<LrcLine[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const [artistData, setArtistData] = useState<any>(null);
  const [showMicInfo, setShowMicInfo] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  
  const isLiked = currentTrack ? likedTrackIds.has(currentTrack.id) : false;

  // Sync lyrics parsing & Liked status
  useEffect(() => {
    if (!currentTrack) return;

    if (currentTrack.lyrics_lrc) {
      const lines = currentTrack.lyrics_lrc.split('\n').map(line => {
        const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2})\](.*)/);
        if (match) {
          const time = parseInt(match[1]) * 60 + parseInt(match[2]) + parseInt(match[3]) / 100;
          return { time, text: match[4].trim() };
        }
        return null;
      }).filter(l => l !== null) as LrcLine[];
      setLrcLines(lines);
    } else {
      setLrcLines([]);
    }

    if (currentTrack.uploader_user_id) {
       fetch(`/api/users/${currentTrack.uploader_user_id}/profile`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setArtistData(data.data);
        });
    }
  }, [currentTrack, userId]);

  // Sync current line
  useEffect(() => {
    const index = lrcLines.findIndex((line, i) => {
      const nextLine = lrcLines[i + 1];
      return progress >= line.time && (!nextLine || progress < nextLine.time);
    });
    setCurrentLineIndex(index);
  }, [progress, lrcLines]);
  useEffect(() => {
    if (currentTrack && audioRef.current) {
      audioRef.current.src = currentTrack.file_path;
      if (isPlaying) {
        audioRef.current.play().catch(() => setPlaying(false));
      }
      
      // Log play to history
      fetch(`/api/tracks/${currentTrack.id}/play`, { method: "POST" })
        .catch(err => console.error("Failed to log play:", err));

      // Media Session API Sync
      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentTrack.title,
          artist: currentTrack.main_artist,
          album: "MusicEVE",
          artwork: [
            { src: `https://picsum.photos/seed/${currentTrack.id}/512/512`, sizes: "512x512", type: "image/png" }
          ]
        });
      }
    }
  }, [currentTrack]);

  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("play", () => setPlaying(true));
      navigator.mediaSession.setActionHandler("pause", () => setPlaying(false));
      navigator.mediaSession.setActionHandler("previoustrack", prevTrack);
      navigator.mediaSession.setActionHandler("nexttrack", nextTrack);
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime && audioRef.current) {
          audioRef.current.currentTime = details.seekTime;
          setProgress(details.seekTime);
        }
      });
    }
  }, [nextTrack, prevTrack]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => setPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleToggleLike = async () => {
    if (!userId || !currentTrack) return;
    const currentlyLiked = likedTrackIds.has(currentTrack.id);
    await globalToggleLike(currentTrack.id);
    addToast(!currentlyLiked ? "Đã lưu vào Nhạc yêu thích! 💖" : "Đã gỡ khỏi Nhạc yêu thích.", "info");
  };

  if (!currentTrack) return null;

  const upNext = queue.slice(currentIndex + 1, currentIndex + 4);

  return (
    <>
      {showLyrics && (
        <FullScreenPlayer 
          progress={progress}
          duration={duration}
          volume={volume}
          handleSeek={handleSeek}
          handleVolumeChange={(e) => setVolume(parseFloat(e.target.value))}
          togglePlay={() => setPlaying(!isPlaying)}
          formatTime={formatTime}
        />
      )}

      {/* Main Bottom Player Bar (Persistent) */}
      <div className="fixed bottom-0 left-0 right-0 h-24 bg-black/95 backdrop-blur-3xl border-t border-white/5 px-8 flex items-center justify-between z-50 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
        <audio 
          ref={audioRef} 
          onTimeUpdate={handleTimeUpdate} 
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={nextTrack}
        />
        
        <div className="flex items-center gap-5 w-1/3 overflow-hidden">
          <div className="relative group">
            <img src={currentTrack.cover_url || `https://picsum.photos/seed/${currentTrack.id}/120/120`} alt="" className="w-14 h-14 rounded-xl shadow-2xl border border-white/10 group-hover:brightness-50 transition-all duration-300" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <ChevronDown className="text-white rotate-180" size={16} />
            </div>
          </div>
          <div className="flex flex-col truncate min-w-0">
            <span className="text-sm font-black text-white hover:text-[#1ed760] cursor-pointer transition truncate tracking-tight">
              {currentTrack.title}
            </span>
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] hover:text-white cursor-pointer transition truncate mt-0.5">
              {currentTrack.main_artist}
            </span>
          </div>
          <button 
            onClick={handleToggleLike}
            className={clsx(
              "p-2 hover:bg-white/5 rounded-full transition-all active:scale-75",
              isLiked ? "text-[#1ed760]" : "text-zinc-600 hover:text-white"
            )}
          >
            <Heart size={18} className={isLiked ? "fill-current" : ""} />
          </button>
        </div>

        <div className="flex flex-col items-center gap-2 max-w-2xl w-full">
          <div className="flex items-center gap-6 scale-90 lg:scale-100">
            <button 
              onClick={toggleShuffle}
              className={clsx(
                "transition active:scale-75",
                isShuffle ? "text-[#1ed760]" : "text-zinc-500 hover:text-white"
              )}
            >
              <Shuffle size={16} />
            </button>
            <button onClick={prevTrack} className="text-zinc-300 hover:text-white transition transform active:scale-75"><SkipBack size={24} className="fill-current" /></button>
            <button 
              onClick={() => setPlaying(!isPlaying)}
              className="w-11 h-11 bg-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all text-black shadow-2xl border border-white/10"
            >
              {isPlaying ? <Pause size={22} className="fill-current" /> : <Play size={22} className="fill-current ml-0.5" />}
            </button>
            <button onClick={nextTrack} className="text-zinc-300 hover:text-white transition transform active:scale-75"><SkipForward size={24} className="fill-current" /></button>
            <button 
              onClick={toggleRepeatMode}
              className={clsx(
                "transition active:scale-75 relative",
                repeatMode !== "none" ? "text-[#1ed760]" : "text-zinc-500 hover:text-white"
              )}
            >
              <Repeat size={16} />
              {repeatMode === "one" && <span className="absolute -top-1 -right-1 text-[7px] font-black bg-[#1ed760] text-black w-2.5 h-2.5 rounded-full flex items-center justify-center">1</span>}
            </button>
          </div>
          
          <div className="flex items-center gap-4 w-full group mt-1">
            <span className="text-[9px] text-zinc-600 font-black tabular-nums w-10 text-right">{formatTime(progress)}</span>
            <div className="flex-1 h-1 relative cursor-pointer">
              <input 
                type="range" 
                min="0" 
                max={duration || 0} 
                value={progress} 
                onChange={handleSeek}
                className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
              />
              <div className="absolute inset-0 bg-white/10 rounded-full" />
              <div 
                className="absolute inset-y-0 left-0 bg-white group-hover:bg-[#1ed760] rounded-full transition-colors" 
                style={{ width: `${(progress / (duration || 1)) * 100}%` }}
              />
            </div>
            <span className="text-[9px] text-zinc-600 font-black tabular-nums w-10">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-5 w-1/3 pr-2">
          <div 
            className="relative"
            onMouseEnter={() => setShowMicInfo(true)}
            onMouseLeave={() => setShowMicInfo(false)}
          >
            <button 
              onClick={() => setShowLyrics(!showLyrics)}
              className={clsx(
                "transition-all transform hover:scale-110 p-2 rounded-full hover:bg-white/5",
                showLyrics ? "text-[#1ed760] drop-shadow-[0_0_8px_rgba(30,215,96,0.5)] bg-white/5" : "text-zinc-500 hover:text-white"
              )}
            >
              <Mic2 size={16} />
            </button>
            
            {showMicInfo && (
              <div className="absolute bottom-14 right-0 bg-zinc-900 border border-white/10 p-3 rounded-[24px] shadow-[0_30px_60px_rgba(0,0,0,0.8)] w-56 flex gap-4 animate-in fade-in slide-in-from-bottom-3 duration-500 z-[70] backdrop-blur-xl">
                 <img src={`https://picsum.photos/seed/${currentTrack.id}/100/100`} className="w-10 h-10 rounded-xl shadow-2xl grayscale group-hover:grayscale-0 transition-all duration-700" alt="" />
                 <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-black text-white truncate drop-shadow-lg">{currentTrack.title}</span>
                    <span className="text-[9px] font-black text-[#1ed760] uppercase truncate drop-shadow-lg">{currentTrack.main_artist}</span>
                    <span className="text-[7px] text-white/20 mt-1 uppercase tracking-[0.3em] font-black">MusicEVE Synced</span>
                 </div>
              </div>
            )}
          </div>

          <button onClick={() => setIsPickerOpen(true)} className="text-zinc-500 hover:text-white transition p-2 hover:bg-white/5 rounded-full"><ListMusic size={16} /></button>
          <button className="text-zinc-500 hover:text-white transition p-2 hover:bg-white/5 rounded-full"><MonitorSpeaker size={16} /></button>
          
          <div className="flex items-center gap-3 group px-3 py-2 bg-white/5 rounded-full border border-white/5 hover:border-white/10 transition-all">
            <Volume2 size={14} className="text-zinc-500 group-hover:text-white transition" />
            <div className="w-20 h-1 bg-white/10 rounded-full relative cursor-pointer overflow-hidden">
               <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={volume} 
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
               />
               <div className="absolute inset-y-0 left-0 bg-white group-hover:bg-[#1ed760] transition-colors" style={{ width: `${volume * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      {userId && (
        <PlaylistPickerModal 
          isOpen={isPickerOpen} 
          onClose={() => setIsPickerOpen(false)} 
          trackId={currentTrack.id} 
          userId={userId} 
        />
      )}
    </>
  );
}
