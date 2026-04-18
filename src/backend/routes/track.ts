import { Router } from "express";
import { trackController } from "../controllers/trackController.js";
import { authenticate, optionalAuthenticate } from "../middleware/auth.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = process.env.VERCEL ? "/tmp/uploads" : path.join(process.cwd(), "uploads");
const audioDir = path.join(uploadDir, "audio");
const imageDir = path.join(uploadDir, "images");

// Ensure dirs exist
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir);
if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "audio") {
      cb(null, audioDir);
    } else if (file.fieldname === "cover_image") {
      cb(null, imageDir);
    } else {
      cb(null, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20 MB limit
  }
});

const router = Router();

router.get("/", trackController.getAll);
router.get("/search", trackController.search);
router.get("/:id", trackController.getById);
router.post("/ai-generate-description", authenticate, trackController.generateDescription);
router.post("/:id/play", optionalAuthenticate, trackController.recordPlay);
router.post("/", authenticate, upload.fields([{ name: "audio", maxCount: 1 }, { name: "cover_image", maxCount: 1 }]), trackController.upload);
router.delete("/:id", authenticate, trackController.delete);

export default router;
