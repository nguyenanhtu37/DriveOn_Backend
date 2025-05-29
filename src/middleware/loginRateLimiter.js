import rateLimit from "express-rate-limit";

export const loginRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 15p
  max: 5, // max 10req within 15p
  message: "Too many login attempts. Please try again after 15 minutes.",
  standardHeaders: true, // insert rate limit vo header
  legacyHeaders: false, // Tắt header cũ (x-rateLimit-*)
});
