import rateLimit from "express-rate-limit"

const  strictLimiter = rateLimit({
  windowMs: process.env.NODE_ENV === 'test' ? 1000 : 15 * 60 * 1000, // 1 second for tests, 15 minutes for production
  max: process.env.NODE_ENV === 'test' ? 10 : 50, // Lower limit for tests
  message: {
    success: false,
    message: 'Too many attempts. Please try again later.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Removed keyGenerator - uses default IPv6-safe implementation
  handler: (req, res) => {
    console.warn(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
    res.status(429).json({
      success: false,
      message: 'Too many attempts. Please try again later.',
      timestamp: new Date().toISOString(),
      retryAfter: process.env.NODE_ENV === 'test' ? 1 : Math.ceil(15 * 60) // seconds
    });
  }
});

const moderateLimiter = rateLimit({
  windowMs: process.env.NODE_ENV === 'test' ? 1000 : 15 * 60 * 1000, // 1 second for tests, 15 minutes for production
  max: process.env.NODE_ENV === 'test' ? 20 : 100, // Lower limit for tests
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Removed keyGenerator - uses default IPv6-safe implementation
  handler: (req, res) => {
    console.warn(`Moderate rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
      timestamp: new Date().toISOString(),
      retryAfter: process.env.NODE_ENV === 'test' ? 1 : Math.ceil(15 * 60) // seconds
    });
  }
});

const refreshLimiter = rateLimit({
  windowMs: process.env.NODE_ENV === 'test' ? 1000 : 5 * 60 * 1000, // 5 minutes
  max: process.env.NODE_ENV === 'test' ? 50 : 200, // Allow more refresh attempts
  message: {
    success: false,
    message: 'Too many refresh attempts. Please try again later.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export {
  strictLimiter,
  moderateLimiter,
  refreshLimiter
}