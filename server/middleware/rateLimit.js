const rateLimit = require("express-rate-limit");

const chatRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
  max: parseInt(process.env.RATE_LIMIT_MAX || "20", 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please wait before sending another message.",
  },
});

const conversationRateLimit = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many new conversations. Please wait a moment.",
  },
});

module.exports = { chatRateLimit, conversationRateLimit };
