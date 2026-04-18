import { Response, NextFunction } from "express";
import { adminService } from "../services/adminService.js";
import { AuthRequest } from "../middleware/auth.js";

export const adminController = {
  // ── Tracks ──────────────────────────────────────────────────────────────────
  getPendingTracks: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = await adminService.getPendingTracks(Number(req.query.page) || 1);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  approveTrack: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await adminService.approveTrack(req.params.id);
      res.json({ success: true, message: "Track approved" });
    } catch (err) { next(err); }
  },

  rejectTrack: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await adminService.rejectTrack(req.params.id);
      res.json({ success: true, message: "Track rejected" });
    } catch (err) { next(err); }
  },

  // ── Comments ─────────────────────────────────────────────────────────────────
  getRecentComments: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = await adminService.getRecentComments(Number(req.query.page) || 1);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  moderateComment: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { status } = req.body;
      await adminService.moderateComment(req.params.id, status);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  deleteComment: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await adminService.deleteComment(req.params.id);
      res.json({ success: true, message: "Comment deleted" });
    } catch (err) { next(err); }
  },

  // ── Users ─────────────────────────────────────────────────────────────────────
  getUsers: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const page   = Number(req.query.page) || 1;
      const search = req.query.search as string | undefined;
      const data   = await adminService.getUsers(page, 50, search);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  disableUser: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await adminService.disableUser(req.params.id);
      res.json({ success: true, message: "User disabled" });
    } catch (err) { next(err); }
  },

  enableUser: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await adminService.enableUser(req.params.id);
      res.json({ success: true, message: "User enabled" });
    } catch (err) { next(err); }
  },

  deleteUser: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await adminService.deleteUser(req.params.id);
      res.json({ success: true, message: "User deleted" });
    } catch (err) { next(err); }
  },

  // ── Stats ─────────────────────────────────────────────────────────────────────
  getStats: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = await adminService.getStats();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },
};
