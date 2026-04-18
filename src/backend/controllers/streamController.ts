import { Response } from "express";
import { trackService } from "../services/trackService.js";
import { AuthRequest } from "../middleware/auth.js";
import fs from "fs";

export const streamController = {
  streamTrack: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized: Please login to stream." });
      }

      const trackId = req.params.trackId;
      const track = await trackService.getTrackById(trackId);
      
      const filePath = track.file_path;
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "Audio file not found on server" });
      }

      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });
        const head = {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunksize,
          "Content-Type": "audio/mpeg",
        };

        res.writeHead(206, head);
        file.pipe(res);
      } else {
        const head = {
          "Content-Length": fileSize,
          "Content-Type": "audio/mpeg",
        };
        res.writeHead(200, head);
        fs.createReadStream(filePath).pipe(res);
      }
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }
};
