import { Router } from "express";
import { likeController } from "../controllers/likeController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticate, likeController.getLikes);
router.post("/:id", authenticate, likeController.like);
router.delete("/:id", authenticate, likeController.unlike);

export default router;
