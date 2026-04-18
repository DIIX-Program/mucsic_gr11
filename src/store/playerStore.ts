import { create } from "zustand";

export interface Track {
  id: string;
  title: string;
  main_artist: string;
  uploader_user_id: string;
  file_path: string;
   cover_url?: string;
  plays_count?: number;
  lyrics_lrc?: string;
  genre?: string;
  genre_id?: string;
}

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
  queue: Track[];
  currentIndex: number;
  showLyrics: boolean;
  likedTrackIds: Set<string>;
  isShuffle: boolean;
  repeatMode: "none" | "one" | "all";
  fullScreen: boolean;
  
  setPlaying: (isPlaying: boolean) => void;
  setCurrentTrack: (track: Track | null) => void;
  setVolume: (volume: number) => void;
  setProgress: (progress: number) => void;
  setDuration: (duration: number) => void;
  setQueue: (tracks: Track[], startIndex?: number) => void;
  setFullScreen: (val: boolean) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setShowLyrics: (val: boolean) => void;
  toggleLike: (trackId: string) => Promise<void>;
  setLikedTrackIds: (ids: string[]) => void;
  toggleShuffle: () => void;
  toggleRepeatMode: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentTrack: null,
  isPlaying: false,
  volume: 1,
  progress: 0,
  duration: 0,
  queue: [],
  currentIndex: -1,
  showLyrics: false,
  likedTrackIds: new Set(),
  isShuffle: false,
  repeatMode: "none",
  fullScreen: false,

  setPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTrack: (track) => set({ currentTrack: track }),
  setVolume: (volume) => set({ volume }),
  setProgress: (progress) => set({ progress }),
  setDuration: (duration) => set({ duration }),
  setShowLyrics: (showLyrics) => set({ showLyrics }),
  setFullScreen: (fullScreen) => set({ fullScreen }),
  setLikedTrackIds: (ids) => set({ likedTrackIds: new Set(ids) }),
  toggleShuffle: () => set((state) => ({ isShuffle: !state.isShuffle })),
  toggleRepeatMode: () => set((state) => {
    const modes: ("none" | "one" | "all")[] = ["none", "one", "all"];
    const nextMode = modes[(modes.indexOf(state.repeatMode) + 1) % modes.length];
    return { repeatMode: nextMode };
  }),
  
  toggleLike: async (trackId) => {
    try {
      const { likedTrackIds } = usePlayerStore.getState();
      const isLiked = likedTrackIds.has(trackId);
      
      const res = await fetch(`/api/likes/${trackId}`, {
        method: isLiked ? "DELETE" : "POST"
      });
      
      if (res.ok) {
        const newLikedIds = new Set(likedTrackIds);
        if (isLiked) newLikedIds.delete(trackId);
        else newLikedIds.add(trackId);
        set({ likedTrackIds: newLikedIds });
      }
    } catch (err) {
      console.error("Like toggle failed", err);
    }
  },
  
  setQueue: (tracks, startIndex = 0) => {
    if (!tracks || tracks.length === 0) return;
    const safeIndex = Math.max(0, Math.min(startIndex, tracks.length - 1));
    set({ 
      queue: tracks, 
      currentIndex: safeIndex, 
      currentTrack: tracks[safeIndex],
      isPlaying: true,
      progress: 0
    });
  },

  nextTrack: () => set((state) => {
    if (state.queue.length === 0) return state;

    if (state.repeatMode === "one") {
      return { progress: 0, isPlaying: true };
    }

    let nextIndex;
    if (state.isShuffle) {
      nextIndex = Math.floor(Math.random() * state.queue.length);
    } else {
      nextIndex = state.currentIndex + 1;
      if (nextIndex >= state.queue.length) {
        if (state.repeatMode === "all") nextIndex = 0;
        else return { isPlaying: false, progress: 0 }; // End of queue
      }
    }

    return {
      currentIndex: nextIndex,
      currentTrack: state.queue[nextIndex],
      progress: 0,
      isPlaying: true
    };
  }),

  prevTrack: () => set((state) => {
    if (state.queue.length === 0) return state;

    let prevIndex;
    if (state.isShuffle) {
      prevIndex = Math.floor(Math.random() * state.queue.length);
    } else {
      prevIndex = state.currentIndex - 1;
      if (prevIndex < 0) {
        if (state.repeatMode === "all") prevIndex = state.queue.length - 1;
        else prevIndex = 0;
      }
    }

    return {
      currentIndex: prevIndex,
      currentTrack: state.queue[prevIndex],
      progress: 0,
      isPlaying: true
    };
  }),
}));
