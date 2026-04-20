import { Router } from "express";
import { artistController } from "../controllers/artistController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// Public endpoints
router.get("/:id", artistController.getById);

// Authenticated endpoints
router.post("/request", authenticate, artistController.request);

export default router;
