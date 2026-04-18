import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getConnection } from "../config/db.js";
import mssql from 'mssql';

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-music-app";

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

/**
 * Basic Authentication Middleware
 * Verifies JWT and checks if user exists in SQL Server
 */
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies.auth_token;
  
  if (!token) {
    return res.status(401).json({ success: false, error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', mssql.VarChar, decoded.userId)
      .query("SELECT id FROM users WHERE id = @userId");

    if (result.recordset.length === 0) {
      res.clearCookie("auth_token");
      return res.status(401).json({ success: false, error: "Tài khoản không tồn tại hoặc đã bị xóa." });
    }

    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.clearCookie("auth_token");
    return res.status(401).json({ success: false, error: "Phiên đăng nhập hết hạn hoặc không hợp lệ." });
  }
};

/**
 * Role-Based Access Control (RBAC) Middleware
 * Checks user permissions against the database to ensure they have the required role.
 */
export const requireRole = (roleName: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) return res.status(401).json({ success: false, error: "Authentication required" });

      const pool = await getConnection();
      const result = await pool.request()
        .input('userId', mssql.VarChar, req.userId)
        .input('roleName', mssql.NVarChar, roleName)
        .query(`
          SELECT 1 
          FROM user_roles ur 
          JOIN app_roles ar ON ur.role_id = ar.id 
          WHERE ur.user_id = @userId AND ar.name = @roleName
        `);

      if (result.recordset.length === 0) {
        return res.status(403).json({ success: false, error: `Unauthorized: Missing required role '${roleName}'` });
      }

      next();
    } catch (error) {
      console.error('RBAC Middleware Error:', error);
      res.status(500).json({ success: false, error: "Internal Server error during authorization" });
    }
  };
};

/**
 * Optional Authentication
 * Populates req.userId if a valid token is present, but doesn't block.
 */
export const optionalAuthenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies.auth_token;
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', mssql.VarChar, decoded.userId)
      .query("SELECT id FROM users WHERE id = @userId");

    if (result.recordset.length > 0) {
      req.userId = decoded.userId;
    }
    
    next();
  } catch (error) {
    next();
  }
};
