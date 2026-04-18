import { trackRepository } from "../repositories/trackRepository.js";
import crypto from "crypto";

// Demo sample tracks in /public/audio
const SAMPLE_TRACKS = [
  "/audio/demo-1.mp3",
  "/audio/demo-2.mp3",
  "/audio/demo-3.mp3"
];

/**
 * Track Service - Asynchronous implementation
 * Orchestrates calls to the repository and handles business logic.
 */
export const trackService = {
  /**
   * Fetch all tracks with pagination
   */
  getAllTracks: async (page: number = 1, limit: number = 50) => {
    const offset = (page - 1) * limit;
    return await trackRepository.findAll(limit, offset);
  },
  
  /**
   * Fetch a single track by ID with error handling
   */
  getTrackById: async (id: string) => {
    const track = await trackRepository.findById(id);
    if (!track) throw new Error("Track not found");
    return track;
  },

  /**
   * Handle track upload and metadata creation
   */
  uploadTrack: async (data: {
    title: string;
    main_artist: string;
    uploader_user_id: string;
    genre?: string;
    description?: string;
    visibility?: string;
    releaseDate?: string;
    album?: string;
    file_path: string;
    cover_image_path?: string;
  }) => {
    const id = crypto.randomUUID();
    
    const trackData = {
      id,
      ...data,
      file_path: data.file_path,
      cover_image_path: data.cover_image_path
    };

    await trackRepository.create(trackData);
    return { id, title: data.title, main_artist: data.main_artist, file_path: data.file_path };
  },

  /**
   * Handle track deletion
   */
  deleteTrack: async (id: string) => {
    const track = await trackRepository.findById(id);
    if (!track) throw new Error("Track not found");
    
    // In demo mode, we don't actually delete physical files in /public/audio
    await trackRepository.delete(id);
  },

  /**
   * Increment play count
   */
  incrementPlayCount: async (id: string) => {
    await trackRepository.incrementPlayCount(id);
  },

  /**
   * Log playback in history
   */
  logPlay: async (id: string, userId: string) => {
    await trackRepository.logPlay(id, userId);
  },

  /**
   * Search for tracks
   */
  searchTracks: async (query: string) => {
    return await trackRepository.search(query);
  }
};
