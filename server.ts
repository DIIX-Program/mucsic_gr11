import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";

import dotenv from "dotenv";
dotenv.config();

// Routes
import authRoutes from "./src/backend/routes/auth.js";
import trackRoutes from "./src/backend/routes/track.js";
import playlistRoutes from "./src/backend/routes/playlist.js";
import searchRoutes from "./src/backend/routes/search.js";
import likeRoutes from "./src/backend/routes/like.js";
import commentRoutes from "./src/backend/routes/comment.js";
import userRoutes from "./src/backend/routes/user.js";
import adminRoutes from "./src/backend/routes/admin.js";
import streamRoutes from "./src/backend/routes/stream.js";
import homeRoutes from "./src/backend/routes/home.js";

// Init DB
import { initDb } from "./src/backend/db/index.js";
import { apiRateLimiter } from "./src/backend/middleware/rateLimit.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
const PORT = Number(process.env.PORT) || 3000;

export async function createApp() {

  // Initialize Database
  await initDb();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use("/api/", apiRateLimiter);

  // Serve static files
  const uploadDir = process.env.VERCEL ? "/tmp/uploads" : path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  app.use("/uploads", express.static(uploadDir));

  const musicDir = path.join(process.cwd(), "nhac");
  if (fs.existsSync(musicDir)) {
    app.use("/nhac", express.static(musicDir));
  }

  // ── API Routes (MUST be before Vite catch-all) ──────────────────
  app.use("/api/auth",     authRoutes);
  app.use("/api/tracks",   trackRoutes);
  app.use("/api/playlists",playlistRoutes);
  app.use("/api/search",   searchRoutes);
  app.use("/api/likes",    likeRoutes);
  app.use("/api/comments", commentRoutes);
  app.use("/api/users",    userRoutes);
  app.use("/api/admin",    adminRoutes);
  app.use("/api/stream",   streamRoutes);
  app.use("/api/home",     homeRoutes);

  // ── Global Error Handler ─────────────────────────────────────────
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("Global Error Handler:", err);
    const status = err.status || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ success: false, error: message });
  });

  // ── Vite (dev) / Static (prod) — AFTER API routes ───────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      root: process.cwd(),
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);

    app.get("*", async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith("/api") || url.startsWith("/uploads") || url.includes(".")) {
        return next();
      }
      try {
        const template = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf-8");
        const transformedHtml = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(transformedHtml);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  return app;
}

if (process.env.NODE_ENV !== "production") {
  createApp().then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  });
}
