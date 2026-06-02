import request from 'supertest'
import express from 'express'
import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset } from 'jest-mock-extended'
import paymentRoutes from '../routes/payments'

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(),
}))

jest.mock('../middleware/auth', () => ({
  authenticate: jest.fn((req: any, _res: any, next: any) => {
    req.user = { userId: 'user-1', businessId: 'biz-1', role: 'ADMIN', name: 'Admin' }
    next()
  }),
}))

jest.mock('../middleware/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
  logError: jest.fn(),
}))

const prisma = mockDeep<PrismaClient>()
;(PrismaClient as unknown as jest.Mock).mockImplementation(() => prisma)

const app = express()
app.use(express.json())
app.set('prisma', prisma)
app.set('io', { to: jest.fn().mockReturnThis(), emit: jest.fn() })
app.use('/api/payments', paymentRoutes)
import { errorHandler } from '../middleware/errorHandler'
app.use(errorHandler)

beforeEach(() => {
  jest.clearAllMocks()
  ;(PrismaClient as unknown as jest.Mock).mockImplementation(() => prisma)
})

describe('Payments Route', () => {
  describe('GET /api/payments/config', () => {
    it('should return publishable key', async () => {
      const res = await request(app).get('/api/payments/config')
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('publishableKey')
    })
  })

  describe('POST /api/payments/create-intent', () => {
    it('should return 404 when order not found', async () => {
      ;(prisma.order.findFirst as jest.Mock).mockResolvedValue(null)
      const res = await request(app).post('/api/payments/create-intent').send({ orderId: 'order-1' })
      expect(res.status).toBe(404)
    })

    it('should return 400 when order already paid', async () => {
      ;(prisma.order.findFirst as jest.Mock).mockResolvedValue({
        id: 'order-1',
        paymentStatus: 'PAID',
        total: 50,
      })
      const res = await request(app).post('/api/payments/create-intent').send({ orderId: 'order-1' })
      expect(res.status).toBe(400)
    })

    it('should return 400 when no Stripe key configured', async () => {
      ;(prisma.order.findFirst as jest.Mock).mockResolvedValue({
        id: 'order-1',
        paymentStatus: 'UNPAID',
        total: 50,
        businessId: 'biz-1',
      })
      const res = await request(app).post('/api/payments/create-intent').send({ orderId: 'order-1' })
      expect(res.status).toBe(400)
      expect(res.body.error).toMatch(/Stripe not configured/i)
    })
  })
})
