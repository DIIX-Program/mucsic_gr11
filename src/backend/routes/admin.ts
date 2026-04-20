import { Router } from "express";
import { adminController } from "../controllers/adminController.js";
import { artistController } from "../controllers/artistController.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(authenticate);
router.use(requireRole('ADMIN'));

// ── Tracks Moderation ──────────────────────────────────────
router.get("/tracks/pending",       adminController.getPendingTracks);
router.patch("/tracks/:id/approve", adminController.approveTrack);
router.patch("/tracks/:id/reject",  adminController.rejectTrack);

// ── Comments Moderation ────────────────────────────────────
router.get("/comments/recent",          adminController.getRecentComments);
router.patch("/comments/:id/status",    adminController.moderateComment);
router.delete("/comments/:id",          adminController.deleteComment);

// ── User Management ────────────────────────────────────────
router.get("/users",                adminController.getUsers);
router.patch("/users/:id/disable",  adminController.disableUser);
router.patch("/users/:id/enable",   adminController.enableUser);
router.delete("/users/:id",         adminController.deleteUser);

// ── Artists Moderation ─────────────────────────────────────
router.get("/artists/requests",     artistController.getPendingRequests);
router.post("/artists/:id/approve",  artistController.approve);
router.post("/artists/:id/reject",   artistController.reject);
router.post("/artists/:id/demote",   artistController.demote);

// ── Dashboard stats ────────────────────────────────────────
router.get("/stats", adminController.getStats);

export default router;
