import { Request, Response, NextFunction } from "express";
import { trackService } from "../services/trackService.js";

/**
 * Search Controller
 */
export const searchController = {
  search: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(200).json({ success: true, data: [] });
      }

      const tracks = await trackService.searchTracks(query);
      res.status(200).json({ success: true, data: tracks });
    } catch (error: any) {
      next(error);
    }
  }
};
