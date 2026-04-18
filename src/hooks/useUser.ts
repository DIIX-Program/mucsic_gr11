import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import { usePlayerStore } from "../store/playerStore";

// ─── Types ───────────────────────────────────────────────────────────────────
export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  banner_url: string;
  followers_count: number;
  following_count: number;
  total_tracks: number;
  total_playlists: number;
  isFollowing: boolean;
}

export interface TrackItem {
  id: string;
  title: string;
  main_artist: string;
  plays_count: number;
  likes_count: number;
  file_path: string;
  cover_url: string | null;
  liked_at?: string;
  played_at?: string;
}

export interface PlaylistItem {
  id: string;
  name: string;
  cover_url: string | null;
  visibility: string;
  track_count: number;
  created_at: string;
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────
const fetchProfile = async (id: string): Promise<UserProfile> => {
  const res = await fetch(`/api/users/${id}/profile`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to load profile");
  return json.data;
};

const fetchMyPlaylists = async (): Promise<PlaylistItem[]> => {
  const res = await fetch("/api/users/me/playlists");
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to load playlists");
  return json.data;
};

const fetchLikedTracks = async (): Promise<TrackItem[]> => {
  const res = await fetch("/api/users/me/liked-tracks");
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to load liked tracks");
  return json.data;
};

const fetchHistory = async (): Promise<TrackItem[]> => {
  const res = await fetch("/api/users/me/history?limit=50");
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to load history");
  return json.data;
};

export interface LibraryData {
  playlists: PlaylistItem[];
  likedTracks: TrackItem[];
  history: TrackItem[];
}

const fetchLibrary = async (): Promise<LibraryData> => {
  const res = await fetch("/api/users/me/library");
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to load library");
  return json.data;
};
 
const fetchUserTracks = async (userId: string): Promise<TrackItem[]> => {
  const res = await fetch(`/api/users/${userId}/tracks`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to load user tracks");
  return json.data;
};

// ─── Hooks ────────────────────────────────────────────────────────────────────
export const useProfile = (userId: string | undefined) =>
  useQuery({
    queryKey: ["profile", userId],
    queryFn: () => fetchProfile(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });

export const useMyPlaylists = () => {
  const { userId } = useAuthStore();
  return useQuery({
    queryKey: ["me", "playlists", userId],
    queryFn: fetchMyPlaylists,
    enabled: !!userId,
  });
};

export const useLikedTracks = () => {
  const { userId } = useAuthStore();
  return useQuery({
    queryKey: ["me", "liked", userId],
    queryFn: fetchLikedTracks,
    enabled: !!userId,
  });
};

export const useHistory = () => {
  const { userId } = useAuthStore();
  return useQuery({
    queryKey: ["me", "history", userId],
    queryFn: fetchHistory,
    enabled: !!userId,
  });
};

export const useUserTracks = (userId: string | undefined) =>
  useQuery({
    queryKey: ["user", "tracks", userId],
    queryFn: () => fetchUserTracks(userId!),
    enabled: !!userId,
  });

export const useLibrary = () => {
  const { userId } = useAuthStore();
  const { setLikedTrackIds } = usePlayerStore();
  const query = useQuery({
    queryKey: ['me', 'library'],
    queryFn: fetchLibrary,
    enabled: !!userId,
    refetchInterval: 30000, // Refresh library every 30s
  });

  // Sync with playerStore when data changes
  useEffect(() => {
    if (query.data?.likedTracks) {
      setLikedTrackIds(query.data.likedTracks.map(t => t.id));
    }
  }, [query.data, setLikedTrackIds]);

  return {
    ...query,
    playlists: query.data?.playlists || [],
    likedTracks: query.data?.likedTracks || [],
    history: query.data?.history || [],
  };
};
