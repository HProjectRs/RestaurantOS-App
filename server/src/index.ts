import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import hpp from 'hpp'
import compression from 'compression'
import dotenv from 'dotenv'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './swagger'
import path from 'path'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { createClient } from 'redis'
import { createAdapter } from '@socket.io/redis-adapter'
import { PrismaClient } from '@prisma/client'
import { setupSocketHandlers } from './sockets'
import authRoutes from './routes/auth'
import menuRoutes from './routes/menu'
import orderRoutes from './routes/orders'
import tableRoutes from './routes/tables'
import wifiRoutes from './routes/wifi'
import employeeRoutes from './routes/employees'
import reportRoutes from './routes/reports'
import reservationRoutes from './routes/reservations'
import settingsRoutes from './routes/settings'
import expenseRoutes from './routes/expenses'
import licenseRoutes from './routes/licenses'
import backupRoutes from './routes/backups'
import invoiceRoutes from './routes/invoices'
import paymentRoutes, { handleStripeWebhook } from './routes/payments'
import subscriptionRoutes from './routes/subscriptions'
import { startSubscriptionCron } from './tasks/checkSubscriptions'
import loyaltyRoutes from './routes/loyalty'
import deliveryRoutes from './routes/delivery'
import { apiLimiter, authLimiter, webhookLimiter } from './middleware/rateLimiter'
import { sanitizeInput } from './middleware/sanitize'
import { correlationId } from './middleware/correlationId'
import { initSentry, setupSentryErrorHandler } from './sentry'
import { validateEnv } from './check-env'

dotenv.config()
if (process.env.NODE_ENV !== 'test') {
  validateEnv()
}

const app = express()
const httpServer = createServer(app)
const isProduction = process.env.NODE_ENV === 'production'
const prisma = new PrismaClient({
  log: isProduction ? ['warn', 'error'] : ['query', 'warn', 'error'],
})

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
})

const pubClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' })
const subClient = pubClient.duplicate()

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  io.adapter(createAdapter(pubClient, subClient))
  console.log('🚀 Redis adapter connected for Socket.io')
})

// Trust proxy for correct IP behind reverse proxies
app.set('trust proxy', 1)

// Compression
app.use(compression())

// Security headers (must be first)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      connectSrc: ["'self'", 'ws:', 'wss:'],
    },
  },
  crossOriginEmbedderPolicy: false,
}))

// CORS
const corsOrigin = process.env.FRONTEND_URL || 'http://localhost:5173'
app.use(cors({
  origin: corsOrigin.split(',').map(s => s.trim()),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400,
}))

// Remove Express fingerprint
app.disable('x-powered-by')

// Initialize Sentry error monitoring
initSentry(app)

// Stripe webhook MUST use raw body before any other body parser
app.post('/api/payments/webhook', webhookLimiter, express.raw({ type: 'application/json' }), handleStripeWebhook)

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Parameter pollution protection
app.use(hpp())

// Correlation ID for request tracing
app.use(correlationId)

// Input sanitization (XSS prevention)
app.use('/api/', sanitizeInput)

// Rate limiting
app.use('/api/', apiLimiter)
app.use('/api/auth/login', authLimiter)

// Serve uploaded images
const uploadsDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads')
app.use('/api/uploads', express.static(uploadsDir))

// Make prisma and io available to routes
app.set('prisma', prisma)
app.set('io', io)

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/menu', menuRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/tables', tableRoutes)
app.use('/api/wifi', wifiRoutes)
app.use('/api/employees', employeeRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/reservations', reservationRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/expenses', expenseRoutes)
app.use('/api/licenses', licenseRoutes)
app.use('/api/backups', backupRoutes)
app.use('/api/invoices', invoiceRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/subscriptions', subscriptionRoutes)
app.use('/api/loyalty', loyaltyRoutes)
app.use('/api/delivery', deliveryRoutes)

// Swagger documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'RestaurantOS API Docs',
}))
app.get('/api/docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Sentry test endpoint (development only)
if (!isProduction) {
  app.get('/api/sentry-test', () => {
    throw new Error('Sentry test error — this is intentional')
  })
}

// 404 handler
app.use('/api/*', (_req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Sentry error handler (must be before generic error handler)
setupSentryErrorHandler(app)

import { errorHandler } from './middleware/errorHandler'
app.use(errorHandler)

setupSocketHandlers(io, prisma, pubClient)

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`🚀 RestaurantOS Server running on port ${PORT}`)
  startSubscriptionCron(prisma)
})

function gracefulShutdown(signal: string) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`)
  io.close()
  httpServer.close(async () => {
    await prisma.$disconnect()
    await pubClient.quit()
    await subClient.quit()
    process.exit(0)
  })
  setTimeout(() => {
    console.error('Forced shutdown after timeout')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
