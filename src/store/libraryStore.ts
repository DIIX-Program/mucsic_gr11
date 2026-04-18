import { create } from "zustand";

export interface TrackItem {
  id: string;
  title: string;
  main_artist: string;
  file_path: string;
  cover_url?: string;
  plays_count?: number;
  likes_count?: number;
  liked_at?: string;
  played_at?: string;
}

export interface PlaylistItem {
  id: string;
  name: string;
  cover_url?: string;
  visibility: string;
  track_count: number;
}

interface LibraryState {
  likedSongs: TrackItem[];
  playlists: PlaylistItem[];
  history: TrackItem[];
  isInitialized: boolean;

  // Actions
  setLibraryData: (data: { 
    likedTracks: TrackItem[], 
    playlists: PlaylistItem[], 
    history: TrackItem[] 
  }) => void;
  
  addPlaylist: (playlist: PlaylistItem) => void;
  removePlaylist: (playlistId: string) => void;
  updatePlaylist: (playlistId: string, changes: Partial<PlaylistItem>) => void;
  
  toggleLikeOptimistic: (track: TrackItem, shouldLike: boolean) => void;
  
  addHistoryOptimistic: (track: TrackItem) => void;
  
  reset: () => void;
}

export const useLibraryStore = create<LibraryState>((set) => ({
  likedSongs: [],
  playlists: [],
  history: [],
  isInitialized: false,

  setLibraryData: (data) => set({
    likedSongs: data.likedTracks,
    playlists: data.playlists,
    history: data.history,
    isInitialized: true,
  }),

  addPlaylist: (playlist) => set((state) => ({
    playlists: [playlist, ...state.playlists]
  })),

  removePlaylist: (playlistId) => set((state) => ({
    playlists: state.playlists.filter(p => p.id !== playlistId)
  })),

  updatePlaylist: (playlistId, changes) => set((state) => ({
    playlists: state.playlists.map(p => p.id === playlistId ? { ...p, ...changes } : p)
  })),

  toggleLikeOptimistic: (track, shouldLike) => set((state) => {
    if (shouldLike) {
      return { likedSongs: [track, ...state.likedSongs] };
    } else {
      return { likedSongs: state.likedSongs.filter(s => s.id !== track.id) };
    }
  }),

  addHistoryOptimistic: (track) => set((state) => {
    // Remove if already in history to move it to the top
    const filtered = state.history.filter(s => s.id !== track.id);
    return { 
      history: [{ ...track, played_at: new Date().toISOString() }, ...filtered].slice(0, 50) 
    };
  }),

  reset: () => set({
    likedSongs: [],
    playlists: [],
    history: [],
    isInitialized: false
  })
}));
