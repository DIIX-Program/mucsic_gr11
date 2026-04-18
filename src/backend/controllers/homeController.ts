import { Response, NextFunction } from "express";
import { trackRepository } from "../repositories/trackRepository.js";
import { userRepository } from "../repositories/userRepository.js";
import { AuthRequest } from "../middleware/auth.js";

export const homeController = {
  getHomeData: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;
      
      // 1. Trending (All users)
      const trending = await trackRepository.findAll(12, 0);
      
      // 2. New Releases
      const newReleases = await trackRepository.getLatest(6);

      // 3. Local Collection (@nhac)
      const localNhac = await trackRepository.findLocalCollection(20);
      
      let recentlyPlayed = [];
      let recommended = [];

      if (userId) {
        // 4. Recently Played
        recentlyPlayed = await userRepository.findHistory(userId, 6);
        
        // 5. Recommended (Top Genres)
        recommended = await trackRepository.findRecommended(userId, 10);
      }

      res.json({
        success: true,
        data: {
          trending,
          newReleases,
          localNhac, // Added!
          recentlyPlayed,
          recommended
        }
      });
    } catch (err) {
      next(err);
    }
  }
};
