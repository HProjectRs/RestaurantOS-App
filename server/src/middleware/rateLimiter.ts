import rateLimit from 'express-rate-limit'

/** Skip rate limiting for health & docs endpoints */
const skipHealth = (req: any) => req.path === '/health' || req.path.startsWith('/docs')

/** General API rate limiter: 200 requests per 15-minute window */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipHealth,
})

/** Strict rate limiter for auth endpoints: 10 requests per 15-minute window */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

/** Strictest rate limiter for sensitive operations: 20 requests per hour */
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Too many attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

/** Order submission rate limiter: 30 requests per minute */
export const orderLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: { error: 'Too many order requests, slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
})

/** Stripe webhook rate limiter: 20 requests per minute (Stripe retries) */
export const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: { error: 'Too many webhook requests' },
  standardHeaders: true,
  legacyHeaders: false,
})
