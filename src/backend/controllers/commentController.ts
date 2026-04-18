import { Request, Response, NextFunction } from "express";
import { commentRepository } from "../repositories/commentRepository.js";
import { AuthRequest } from "../middleware/auth.js";
import crypto from "crypto";

/**
 * Comment Controller
 * Fix BUG #4: Use AuthRequest to get userId from JWT middleware (no more session fallback).
 */
export const commentController = {
  // POST /api/comments/:trackId — Requires authenticate middleware
  create: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;
      if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });

      const { content } = req.body;
      if (!content?.trim()) {
        return res.status(400).json({ success: false, error: "Nội dung bình luận không được trống." });
      }

      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();

      await commentRepository.create({
        id,
        user_id: userId,
        track_id: req.params.id,
        content: content.trim()
      });

      // Get username for the response to avoid extra fetch on frontend
      const { userRepository } = await import("../repositories/userRepository.js");
      const user = await userRepository.findById(userId);

      res.status(201).json({
        success: true,
        data: { 
          id, 
          user_id: userId, 
          username: user?.username || "Ẩn danh",
          avatar_url: user?.avatar_url,
          content: content.trim(),
          created_at: createdAt
        }
      });
    } catch (error: any) {
      next(error);
    }
  },

  // GET /api/comments/:trackId — Public (only APPROVED comments)
  getByTrackId: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const comments = await commentRepository.findByTrackId(req.params.id);
      res.status(200).json({ success: true, data: comments });
    } catch (error: any) {
      next(error);
    }
  }
};
