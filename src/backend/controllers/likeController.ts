import { Response, NextFunction } from "express";
import { likeRepository } from "../repositories/likeRepository.js";
import { AuthRequest } from "../middleware/auth.js";

/**
 * Like Controller
 */
export const likeController = {
  like: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;
      if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });

      await likeRepository.likeTrack(userId, req.params.id);
      res.status(200).json({ success: true, message: "Liked" });
    } catch (error: any) {
      next(error);
    }
  },

  unlike: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;
      if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });

      await likeRepository.unlikeTrack(userId, req.params.id);
      res.status(200).json({ success: true, message: "Unliked" });
    } catch (error: any) {
      next(error);
    }
  },

  getLikes: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;
      if (!userId) return res.status(200).json({ success: true, data: [] });

      const likes = await likeRepository.getUserLikedTrackIds(userId);
      res.status(200).json({ success: true, data: likes });
    } catch (error: any) {
      next(error);
    }
  }
};
