import { Response, NextFunction } from "express";
import { trackService } from "../services/trackService.js";
import { artistRepository } from "../repositories/artistRepository.js";
import { AuthRequest } from "../middleware/auth.js";

export const trackController = {
  upload: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;
      if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });

      const { title, main_artist, genre, description, visibility, releaseDate, album } = req.body;
      if (!title || !main_artist) {
        return res.status(400).json({ success: false, error: "Title and Artist are required" });
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const audioFile = files?.audio?.[0];
      const coverImageFile = files?.cover_image?.[0];

      if (!audioFile) {
        return res.status(400).json({ success: false, error: "Audio file is required" });
      }

      // Check artist_id
      const artist = await artistRepository.findByUserId(userId);
      const artistId = artist?.status === 'APPROVED' ? artist.id : undefined;

      const track = await trackService.uploadTrack({
        uploader_user_id: userId,
        title,
        main_artist,
        genre: genre || "genre_pop",
        description,
        visibility,
        releaseDate,
        album,
        artist_id: artistId,
        file_path: `/uploads/audio/${audioFile.filename}`,
        cover_image_path: coverImageFile ? `/uploads/images/${coverImageFile.filename}` : undefined
      });

      res.status(201).json({ success: true, data: track });
    } catch (error: any) {
      next(error);
    }
  },

  getAll: async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const tracks = await trackService.getAllTracks();
      res.status(200).json({ success: true, data: tracks });
    } catch (error: any) {
      next(error);
    }
  },

  search: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const query = req.query.q as string;
      const tracks = await trackService.searchTracks(query);
      res.status(200).json({ success: true, data: tracks });
    } catch (error: any) {
      next(error);
    }
  },

  getById: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const track = await trackService.getTrackById(id);
      res.status(200).json({ success: true, data: track });
    } catch (error: any) {
      next(error);
    }
  },

  delete: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await trackService.deleteTrack(id);
      res.status(200).json({ success: true, message: "Track deleted" });
    } catch (error: any) {
      next(error);
    }
  },

  recordPlay: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.userId;
      
      // VERIFY TRACK EXISTS (Prevention for non-existent IDs passed from frontend)
      const track = await trackService.getTrackById(id);
      if (!track) {
        return res.status(404).json({ success: false, error: "Bài hát không tồn tại." });
      }

      if (userId) {
        await trackService.logPlay(id, userId);
      } else {
        await trackService.incrementPlayCount(id);
      }
      
      res.status(200).json({ success: true, message: "Play recorded" });
    } catch (error: any) {
      if (error.message === "Track not found") {
        return res.status(404).json({ success: false, error: "Bài hát không tồn tại." });
      }
      next(error);
    }
  },

  generateDescription: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { title, artist } = req.body;
      if (!title || !artist) {
        return res.status(400).json({ success: false, error: "Title and Artist are required for AI generation" });
      }

      // We need to import aiService. This is a bit tricky since I'm editing the object.
      // I'll add the import at the top in the next step or do it now if I can.
      const { aiService } = await import("../services/aiService.js");
      const description = await aiService.generateTrackDescription(title, artist);
      
      res.status(200).json({ success: true, description });
    } catch (error: any) {
      next(error);
    }
  }
};
