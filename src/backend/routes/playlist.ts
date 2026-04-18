import { Router } from "express";
import { playlistController } from "../controllers/playlistController.js";
import { authenticate, optionalAuthenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validation.js";
import { createPlaylistSchema, addTrackSchema } from "../schemas/index.js";

const router = Router();

router.post("/", authenticate, validate(createPlaylistSchema), playlistController.create);
router.patch("/:id", authenticate, playlistController.update);
router.delete("/:id", authenticate, playlistController.delete);
router.get("/user/:userId?", optionalAuthenticate, playlistController.getByUser); // Get gallery
router.get("/:id", optionalAuthenticate, playlistController.getById);

// Liked Songs logic
router.post("/track/:id/toggle-like", authenticate, playlistController.toggleLike);
router.get("/track/:id/is-liked", authenticate, playlistController.isLiked);

router.post("/:id/tracks", authenticate, validate(addTrackSchema), playlistController.addTrack);
router.delete("/:id/tracks/:trackId", authenticate, playlistController.removeTrack);

export default router;
