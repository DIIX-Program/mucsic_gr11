import rateLimit from "express-rate-limit";

/**
 * Rate limiting configuration for security-sensitive routes.
 * Primarily used for Auth routes (Login/Register) to prevent brute force.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    success: false,
    error: "Quá nhiều yêu cầu từ địa chỉ IP này, vui lòng thử lại sau 15 phút."
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * General API rate limiter for overall stability.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per minute
  message: {
    success: false,
    error: "Yêu cầu quá nhanh, vui lòng chậm lại."
  }
});
