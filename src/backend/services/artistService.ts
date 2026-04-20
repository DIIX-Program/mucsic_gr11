import { artistRepository } from "../repositories/artistRepository.js";
import crypto from "crypto";

export const artistService = {
  requestArtist: async (userId: string, data: { artist_name: string; bio?: string; avatar_url?: string }) => {
    // Check if user already has an artist profile or request
    const existing = await artistRepository.findByUserId(userId);
    if (existing) {
      if (existing.status === 'APPROVED') throw new Error("ALREADY_ARTIST");
      if (existing.status === 'PENDING') throw new Error("REQUEST_PENDING");
      // If rejected, maybe allow resubmission? For now, just re-use or update.
    }

    const id = crypto.randomUUID();
    await artistRepository.createRequest({
      id,
      user_id: userId,
      artist_name: data.artist_name,
      bio: data.bio,
      avatar_url: data.avatar_url,
      status: 'PENDING'
    });
    return { id };
  },

  getArtistProfile: async (id: string) => {
    const artist = await artistRepository.findById(id);
    if (!artist) throw new Error("ARTIST_NOT_FOUND");
    return artist;
  },

  getPendingRequests: async () => {
    return artistRepository.findAllPending();
  },

  approveArtist: async (id: string, verified: boolean = true) => {
    await artistRepository.updateStatus(id, 'APPROVED', verified);
    return { success: true };
  },

  rejectArtist: async (id: string) => {
    await artistRepository.updateStatus(id, 'REJECTED');
    return { success: true };
  },

  demoteArtist: async (id: string) => {
    await artistRepository.updateStatus(id, 'DEMOTED');
    return { success: true };
  }
};
