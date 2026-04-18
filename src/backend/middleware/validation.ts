import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";

/**
 * Generic Zod validation middleware for Express
 * Validates body, params, and query against a Zod schema.
 */
export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: "Dữ liệu không hợp lệ",
          details: (error.errors || []).map(e => ({
            path: e.path.join('.').replace(/^(body|params|query)\./, ''),
            message: e.message
          }))
        });
      }
      return res.status(500).json({ success: false, error: "Lỗi hệ thống khi validate dữ liệu" });
    }
  };
};
