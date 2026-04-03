const rateLimit = require("express-rate-limit");

// General rate limiter for all routes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per 15 minutes
  message: {
    success: false,
    message: "Too many requests, please try again after 15 minutes",
  },
});
// Strict limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 requests per 15 minutes
  message: {
    success: false,
    message: "Too many login attempts, please try again after 15 minutes",
  },
});

module.exports = { generalLimiter, authLimiter };
