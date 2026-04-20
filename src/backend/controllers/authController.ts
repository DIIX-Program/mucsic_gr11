import { Request, Response, NextFunction } from "express";
import { authService } from "../services/authService.js";
import { userRepository } from "../repositories/userRepository.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-music-app";

export const authController = {
  register: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, email, password } = req.body;
      if (!username || !email || !password) {
        return res.status(400).json({ success: false, error: "Missing required fields" });
      }

      const user = await authService.register(username, email, password);

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 7,
      });

      res.status(201).json({
        success: true,
        message: "Registered successfully",
        user: { id: user.id, username: user.username, email: user.email, isAdmin: user.isAdmin, isArtist: false }
      });
    } catch (error: any) {
      if (error.message?.includes("already registered") || error.message?.includes("Violation of UNIQUE")) {
        return res.status(409).json({ success: false, error: "Email hoặc tên đăng nhập đã tồn tại." });
      }
      next(error);
    }
  },

  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, error: "Missing required fields" });
      }

      const user = await authService.login(email, password);

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 7,
      });

      res.status(200).json({
        success: true,
        message: "Logged in successfully",
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email, 
          isAdmin: user.isAdmin,
          isArtist: await userRepository.isArtist(user.id)
        }
      });
    } catch (error: any) {
      if (error.message === "Invalid credentials") {
        return res.status(401).json({ success: false, error: "Email/username hoặc mật khẩu không đúng." });
      }
      next(error);
    }
  },

  logout: (_req: Request, res: Response) => {
    res.clearCookie("auth_token");
    res.status(200).json({ success: true, message: "Logged out successfully" });
  },

  // Fix Minor #13: Use static import instead of dynamic import
  me: async (req: Request, res: Response) => {
    const token = req.cookies.auth_token;
    if (!token) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const isAdmin = await userRepository.isAdmin(decoded.userId);

      res.status(200).json({
        success: true,
        userId: decoded.userId,
        isAdmin,
        isArtist: await userRepository.isArtist(decoded.userId)
      });
    } catch {
      res.status(401).json({ success: false, error: "Invalid token" });
    }
  }
};
