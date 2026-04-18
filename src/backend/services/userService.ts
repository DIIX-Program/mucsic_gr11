import { userRepository } from "../repositories/userRepository.js";

export const userService = {
  getProfile: async (targetId: string, currentUserId?: string) => {
    const profile = await userRepository.findProfileById(targetId, currentUserId);
    if (!profile) throw new Error("USER_NOT_FOUND");
    return profile;
  },
  
  getTracksByUser: async (userId: string) => {
    return userRepository.findTracksByUser(userId);
  },

  getMyPlaylists: async (userId: string) => {
    return userRepository.findPlaylistsByUser(userId);
  },

  getLikedTracks: async (userId: string) => {
    return userRepository.findLikedTracks(userId);
  },

  getHistory: async (userId: string, limit?: number) => {
    return userRepository.findHistory(userId, limit);
  },

  updateProfile: async (
    userId: string,
    data: { display_name?: string; bio?: string; avatar_url?: string }
  ) => {
    // Validate: at least one field
    if (!data.display_name && !data.bio && !data.avatar_url) {
      throw new Error("NOTHING_TO_UPDATE");
    }
    // Strip disallowed fields (id, email, password not in signature, safe)
    const safe = {
      display_name: data.display_name?.trim() || undefined,
      bio: data.bio?.trim() || undefined,
      avatar_url: data.avatar_url?.trim() || undefined,
    };
    await userRepository.updateProfile(userId, safe);
    return { updated: true };
  },

  follow: async (followerId: string, followingId: string) => {
    if (followerId === followingId) throw new Error("SELF_FOLLOW");
    await userRepository.follow(followerId, followingId);
  },

  unfollow: async (followerId: string, followingId: string) => {
    await userRepository.unfollow(followerId, followingId);
  },
};
