import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLibraryStore } from "../store/libraryStore";
import { useAuthStore } from "../store/authStore";
import { usePlayerStore } from "../store/playerStore";

/**
 * useLibrarySync - Hook to synchronize backend library data with Zustand SSOT.
 * Uses TanStack Query for fetching and caching, then populates useLibraryStore.
 */
export function useLibrarySync() {
  const { userId } = useAuthStore();
  const { setLibraryData, isInitialized } = useLibraryStore();

  const query = useQuery({
    queryKey: ['me', 'library'],
    queryFn: async () => {
      if (!userId) return null;
      const res = await fetch("/api/users/me/library");
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to fetch library");
      return json.data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  useEffect(() => {
    if (query.data && userId) {
      setLibraryData(query.data);
      
      // Also sync liked ids to player store for global state consistency
      const likedIds = query.data.likedTracks.map((t: any) => t.id);
      usePlayerStore.getState().setLikedTrackIds(likedIds);
    }
  }, [query.data, userId, setLibraryData]);

  return {
    ...query,
    isSyncing: query.isLoading,
    isInitialized
  };
}
