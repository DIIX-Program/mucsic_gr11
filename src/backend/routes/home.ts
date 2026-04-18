import { Router } from "express";
import { homeController } from "../controllers/homeController.js";
import { optionalAuthenticate } from "../middleware/auth.js";

const router = Router();

// GET /api/home - Get multiple sections (Trending, Recent, Recommended, New)
router.get("/", optionalAuthenticate, homeController.getHomeData);

export default router;
