import { Router } from "express";
import { commentController } from "../controllers/commentController.js";
import { authenticate, optionalAuthenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validation.js";
import { commentSchema } from "../schemas/index.js";

const router = Router();

// Fix BUG #4: POST comment requires authentication
router.post("/:id", authenticate, validate(commentSchema), commentController.create);
// GET comments is public, but optionally auth for future user-specific data
router.get("/:id", optionalAuthenticate, commentController.getByTrackId);

export default router;
