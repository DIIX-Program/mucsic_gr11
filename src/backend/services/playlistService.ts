import { playlistRepository } from "../repositories/playlistRepository.js";
import { likeRepository } from "../repositories/likeRepository.js";
import crypto from "crypto";

/**
 * Playlist Service - Asynchronous implementation
 * Orchestrates playlist operations and interactions with liked tracks.
 */
export const playlistService = {
  createPlaylist: async (userId: string, name: string, cover_url?: string, visibility: string = 'PRIVATE') => {
    const id = crypto.randomUUID();
    const playlist = { id, user_id: userId, name, cover_url, visibility, status: 'APPROVED' };
    await playlistRepository.create(playlist);
    return { ...playlist, created_at: new Date().toISOString(), track_count: 0 };
  },

  getPlaylist: async (id: string) => {
    const playlist = await playlistRepository.findById(id);
    if (!playlist) throw new Error("Playlist not found");
    
    const tracks = await playlistRepository.getTracks(id);
    return { ...playlist, tracks };
  },

  getUserPlaylists: async (userId: string) => {
    return await playlistRepository.findByUser(userId);
  },

  addTrackToPlaylist: async (playlistId: string, trackId: string) => {
    const exists = await playlistRepository.isTrackInPlaylist(playlistId, trackId);
    if (exists) {
       throw new Error("This track is already in your registry, Node duplication prevented.");
    }
    const maxPos = await playlistRepository.getMaxPosition(playlistId);
    await playlistRepository.addTrack(playlistId, trackId, maxPos + 1);
  },

  removeTrackFromPlaylist: async (playlistId: string, trackId: string) => {
    await playlistRepository.removeTrack(playlistId, trackId);
  },

  updatePlaylist: async (id: string, name: string) => {
    await playlistRepository.update(id, name);
  },

  deletePlaylist: async (id: string) => {
    await playlistRepository.delete(id);
  },

  /**
   * Complex logic for toggling liked status across multiple repositories
   */
  toggleTrackInLikedPlaylist: async (userId: string, trackId: string) => {
    let likedPlaylist = await playlistRepository.findByNameAndUser("Nhạc yêu thích", userId);
    
    if (!likedPlaylist) {
       likedPlaylist = await playlistService.createPlaylist(userId, "Nhạc yêu thích", "https://i1.sndcdn.com/artworks-000476030787-oj6sz0-t500x500.jpg", "PRIVATE");
    }

    const isLiked = await playlistRepository.isTrackInPlaylist(likedPlaylist.id, trackId);
    if (isLiked) {
       await playlistRepository.removeTrack(likedPlaylist.id, trackId);
       await likeRepository.unlikeTrack(userId, trackId);
       return { liked: false };
    } else {
       const maxPos = await playlistRepository.getMaxPosition(likedPlaylist.id);
       await playlistRepository.addTrack(likedPlaylist.id, trackId, maxPos + 1);
       await likeRepository.likeTrack(userId, trackId);
       return { liked: true };
    }
  },

  isTrackLiked: async (userId: string, trackId: string) => {
    return await likeRepository.hasLiked(userId, trackId);
  }
};
