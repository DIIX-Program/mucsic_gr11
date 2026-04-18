import { Router } from "express";
import { streamController } from "../controllers/streamController.js";

const router = Router();

router.get("/:trackId", streamController.streamTrack);

export default router;
