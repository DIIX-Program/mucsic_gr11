import { Router } from "express";
import { userController } from "../controllers/userController.js";
import { authenticate, optionalAuthenticate } from "../middleware/auth.js";

const router = Router();

// ── Public profile (optionally authenticated to get isFollowing) ──
router.get("/:id/profile", optionalAuthenticate, userController.getProfile);
router.get("/:id/tracks",                       userController.getTracksByUser);

// ── My data (requires login) ──
router.get("/me/library",      authenticate, userController.getLibrary);
router.get("/me/playlists",    authenticate, userController.getMyPlaylists);
router.get("/me/liked-tracks", authenticate, userController.getLikedTracks);
router.get("/me/history",      authenticate, userController.getHistory);
router.patch("/me",            authenticate, userController.updateProfile);

// ── Library (legacy, kept for Library.tsx) ──
router.get("/library/me", authenticate, userController.getLibrary);

// ── Social ──
router.post("/:id/follow",   authenticate, userController.follow);
router.post("/:id/unfollow", authenticate, userController.unfollow);

// ── Backward compat: GET /api/users/:id → profile ──
// Must be LAST to avoid shadowing /me/* and /:id/profile
router.get("/:id", optionalAuthenticate, userController.getProfile);

export default router;
