import { Router } from "express";
import { authController } from "../controllers/authController.js";
import { authRateLimiter } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validation.js";
import { loginSchema, registerSchema } from "../schemas/index.js";

const router = Router();

router.post("/register", authRateLimiter, validate(registerSchema), authController.register);
router.post("/login",    authRateLimiter, validate(loginSchema),    authController.login);
router.post("/logout",   authController.logout);
router.get("/me",        authController.me);

export default router;
