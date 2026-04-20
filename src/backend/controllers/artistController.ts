import { Response, NextFunction } from "express";
import { artistService } from "../services/artistService.js";
import { AuthRequest } from "../middleware/auth.js";

export const artistController = {
  request: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { artist_name, bio, avatar_url } = req.body;
      if (!artist_name) return res.status(400).json({ success: false, error: "Tên nghệ sĩ là bắt buộc." });
      
      const result = await artistService.requestArtist(req.userId!, { artist_name, bio, avatar_url });
      res.json({ success: true, message: "Yêu cầu đã được gửi và đang chờ phê duyệt.", data: result });
    } catch (err: any) {
      if (err.message === "ALREADY_ARTIST")
        return res.status(400).json({ success: false, error: "Bạn đã là nghệ sĩ." });
      if (err.message === "REQUEST_PENDING")
        return res.status(400).json({ success: false, error: "Yêu cầu của bạn đang được xử lý." });
      next(err);
    }
  },

  getById: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const artist = await artistService.getArtistProfile(req.params.id);
      res.json({ success: true, data: artist });
    } catch (err: any) {
      if (err.message === "ARTIST_NOT_FOUND")
        return res.status(404).json({ success: false, error: "Không tìm thấy nghệ sĩ." });
      next(err);
    }
  },

  // Admin actions in controller (could also be in adminController if it exists)
  getPendingRequests: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const requests = await artistService.getPendingRequests();
      res.json({ success: true, data: requests });
    } catch (err) {
      next(err);
    }
  },

  approve: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { verified } = req.body;
      await artistService.approveArtist(req.params.id, verified);
      res.json({ success: true, message: "Đã phê duyệt nghệ sĩ thành công." });
    } catch (err) {
      next(err);
    }
  },

  reject: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await artistService.rejectArtist(req.params.id);
      res.json({ success: true, message: "Đã từ chối yêu cầu." });
    } catch (err) {
      next(err);
    }
  },

  demote: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await artistService.demoteArtist(req.params.id);
      res.json({ success: true, message: "Đã hạ cấp nghệ sĩ về người dùng bình thường." });
    } catch (err) {
      next(err);
    }
  }
};
