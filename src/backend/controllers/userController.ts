import { Response, NextFunction } from "express";
import { userService } from "../services/userService.js";
import { userRepository } from "../repositories/userRepository.js";
import { AuthRequest } from "../middleware/auth.js";

export const userController = {
  // GET /api/users/:id/profile
  getProfile: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const profile = await userService.getProfile(req.params.id, req.userId);
      res.json({ success: true, data: profile });
    } catch (err: any) {
      if (err.message === "USER_NOT_FOUND")
        return res.status(404).json({ success: false, error: "Người dùng không tồn tại." });
      next(err);
    }
  },

  // GET /api/users/:id/tracks
  getTracksByUser: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = await userService.getTracksByUser(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  getLibrary: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;
      if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });
      const data = await userRepository.findLibrary(userId);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  // GET /api/me/playlists
  getMyPlaylists: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = await userService.getMyPlaylists(req.userId!);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/me/liked-tracks
  getLikedTracks: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = await userService.getLikedTracks(req.userId!);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/me/history
  getHistory: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const data = await userService.getHistory(req.userId!, limit);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  // PATCH /api/me
  updateProfile: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { display_name, bio, avatar_url } = req.body;

      // Simple field-level validation (no extra deps needed)
      if (display_name !== undefined && typeof display_name !== "string")
        return res.status(400).json({ success: false, error: "display_name phải là chuỗi." });
      if (bio !== undefined && typeof bio !== "string")
        return res.status(400).json({ success: false, error: "bio phải là chuỗi." });
      if (avatar_url !== undefined && typeof avatar_url !== "string")
        return res.status(400).json({ success: false, error: "avatar_url phải là chuỗi." });

      await userService.updateProfile(req.userId!, { display_name, bio, avatar_url });
      res.json({ success: true, message: "Cập nhật hồ sơ thành công." });
    } catch (err: any) {
      if (err.message === "NOTHING_TO_UPDATE")
        return res.status(400).json({ success: false, error: "Không có thông tin nào để cập nhật." });
      next(err);
    }
  },

  // POST /api/users/:id/follow
  follow: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await userService.follow(req.userId!, req.params.id);
      res.json({ success: true, message: "Đã theo dõi." });
    } catch (err: any) {
      if (err.message === "SELF_FOLLOW")
        return res.status(400).json({ success: false, error: "Bạn không thể tự theo dõi." });
      next(err);
    }
  },

  // POST /api/users/:id/unfollow
  unfollow: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await userService.unfollow(req.userId!, req.params.id);
      res.json({ success: true, message: "Đã bỏ theo dõi." });
    } catch (err) {
      next(err);
    }
  },
};
