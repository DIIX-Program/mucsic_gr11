import { Response, NextFunction } from "express";
import { playlistService } from "../services/playlistService.js";
import { AuthRequest } from "../middleware/auth.js";

/**
 * Playlist Controller
 * Handles HTTP requests for playlist operations asynchronously.
 */
export const playlistController = {
  create: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;
      if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });

      const { name, cover_url } = req.body;
      if (!name) return res.status(400).json({ success: false, error: "Name is required" });

      const playlist = await playlistService.createPlaylist(userId, name, cover_url);
      res.status(201).json({ success: true, data: playlist });
    } catch (error: any) {
      next(error);
    }
  },

  getById: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const playlist = await playlistService.getPlaylist(req.params.id);
      
      const currentUserId = req.userId;
      const { userRepository } = await import("../repositories/userRepository.js");
      const isAdmin = currentUserId ? await userRepository.isAdmin(currentUserId) : false;

      // Privacy Check: if PRIVATE, only owner or ADMIN can see
      if (playlist.visibility === 'PRIVATE' && playlist.user_id !== currentUserId && !isAdmin) {
        return res.status(403).json({ success: false, error: "Đây là danh sách phát riêng tư." });
      }

      res.status(200).json({ success: true, data: playlist });
    } catch (error: any) {
      next(error);
    }
  },

  getByUser: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const targetUserId = req.params.userId || req.userId;
      const currentUserId = req.userId;
      if (!targetUserId) return res.status(401).json({ success: false, error: "Unauthorized" });
      
      let playlists = await playlistService.getUserPlaylists(targetUserId);

      // Filtering: If not owner and not Admin, hide PRIVATE playlists
      const { userRepository } = await import("../repositories/userRepository.js");
      const isAdmin = currentUserId ? await userRepository.isAdmin(currentUserId) : false;

      if (targetUserId !== currentUserId && !isAdmin) {
        playlists = playlists.filter(p => p.visibility === 'PUBLIC');
      }

      res.status(200).json({ success: true, data: playlists });
    } catch (error: any) {
      next(error);
    }
  },

  addTrack: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;
      if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });
      
      const { trackId } = req.body;
      if (!trackId) return res.status(400).json({ success: false, error: "trackId is required" });

      // Ownership check
      const playlist = await playlistService.getPlaylist(req.params.id);
      if (playlist.user_id !== userId) {
        return res.status(403).json({ success: false, error: "Bạn không có quyền chỉnh sửa danh sách phát này." });
      }

      await playlistService.addTrackToPlaylist(req.params.id, trackId);
      res.status(200).json({ success: true, message: "Track added to playlist" });
    } catch (error: any) {
      next(error);
    }
  },

  removeTrack: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;
      if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });

      // Ownership check
      const playlist = await playlistService.getPlaylist(req.params.id);
      if (playlist.user_id !== userId) {
        return res.status(403).json({ success: false, error: "Bạn không có quyền chỉnh sửa danh sách phát này." });
      }

      await playlistService.removeTrackFromPlaylist(req.params.id, req.params.trackId);
      res.status(200).json({ success: true, message: "Track removed from playlist" });
    } catch (error: any) {
      next(error);
    }
  },

  toggleLike: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;
      if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });
      
      const result = await playlistService.toggleTrackInLikedPlaylist(userId, req.params.id);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      next(error);
    }
  },

  isLiked: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;
      if (!userId) return res.status(200).json({ success: true, data: { liked: false } });
      
      const liked = await playlistService.isTrackLiked(userId, req.params.id);
      res.status(200).json({ success: true, data: { liked } });
    } catch (error: any) {
      next(error);
    }
  },

  update: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;
      if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });

      const { name } = req.body;
      if (!name?.trim()) return res.status(400).json({ success: false, error: "Name is required" });

      const playlist = await playlistService.getPlaylist(req.params.id);
      if (playlist.user_id !== userId) {
        return res.status(403).json({ success: false, error: "Bạn không có quyền chỉnh sửa danh sách phát này." });
      }

      await playlistService.updatePlaylist(req.params.id, name.trim());
      res.status(200).json({ success: true, message: "Đã cập nhật tên danh sách phát." });
    } catch (error: any) {
      next(error);
    }
  },

  delete: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;
      if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });

      const playlist = await playlistService.getPlaylist(req.params.id);
      if (playlist.user_id !== userId) {
        return res.status(403).json({ success: false, error: "Bạn không có quyền xóa danh sách phát này." });
      }

      await playlistService.deletePlaylist(req.params.id);
      res.status(200).json({ success: true, message: "Danh sách phát đã được xóa." });
    } catch (error: any) {
      next(error);
    }
  }
};
