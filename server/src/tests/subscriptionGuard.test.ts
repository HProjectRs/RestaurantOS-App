import request from 'supertest'
import express from 'express'
import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset } from 'jest-mock-extended'
import { requireSubscription, PLANS } from '../middleware/subscriptionGuard'

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(),
}))

jest.mock('../middleware/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

const prisma = mockDeep<PrismaClient>()
;(PrismaClient as unknown as jest.Mock).mockImplementation(() => prisma)

const app = express()
app.use(express.json())
app.set('prisma', prisma)

app.get('/test-free', (req: any, res, next) => {
  req.user = { userId: 'user-1', businessId: 'biz-1', role: 'ADMIN' }
  next()
}, requireSubscription('FREE'), (req, res) => res.json({ ok: true }))

app.get('/test-pro', (req: any, res, next) => {
  req.user = { userId: 'user-1', businessId: 'biz-1', role: 'ADMIN' }
  next()
}, requireSubscription('PRO'), (req, res) => res.json({ ok: true }))

app.get('/test-no-auth', (req: any, res, next) => {
  next()
}, requireSubscription('FREE'), (req, res) => res.json({ ok: true }))

beforeEach(() => {
  mockReset(prisma)
  ;(PrismaClient as unknown as jest.Mock).mockImplementation(() => prisma)
})

describe('subscriptionGuard', () => {
  it('should allow access when business has required plan', async () => {
    ;(prisma as any).subscription.findUnique.mockResolvedValue({
      businessId: 'biz-1',
      plan: 'PRO',
      status: 'ACTIVE',
    })
    const res = await request(app).get('/test-pro')
    expect(res.status).toBe(200)
  })

  it('should return 402 when no active subscription', async () => {
    ;(prisma as any).subscription.findUnique.mockResolvedValue(null)
    const res = await request(app).get('/test-free')
    expect(res.status).toBe(402)
    expect(res.body.code).toBe('SUBSCRIPTION_REQUIRED')
  })

  it('should return 402 when subscription expired', async () => {
    ;(prisma as any).subscription.findUnique.mockResolvedValue({
      businessId: 'biz-1',
      plan: 'FREE',
      status: 'EXPIRED',
    })
    const res = await request(app).get('/test-free')
    expect(res.status).toBe(402)
  })

  it('should return 402 when subscription canceled', async () => {
    ;(prisma as any).subscription.findUnique.mockResolvedValue({
      businessId: 'biz-1',
      plan: 'FREE',
      status: 'CANCELED',
    })
    const res = await request(app).get('/test-free')
    expect(res.status).toBe(402)
    expect(res.body.code).toBe('SUBSCRIPTION_CANCELED')
  })

  it('should return 402 when past due', async () => {
    ;(prisma as any).subscription.findUnique.mockResolvedValue({
      businessId: 'biz-1',
      plan: 'FREE',
      status: 'PAST_DUE',
    })
    const res = await request(app).get('/test-free')
    expect(res.status).toBe(402)
    expect(res.body.code).toBe('SUBSCRIPTION_PAST_DUE')
  })

  it('should return 403 when plan too low', async () => {
    ;(prisma as any).subscription.findUnique.mockResolvedValue({
      businessId: 'biz-1',
      plan: 'FREE',
      status: 'ACTIVE',
    })
    const res = await request(app).get('/test-pro')
    expect(res.status).toBe(403)
    expect(res.body.code).toBe('PLAN_UPGRADE_REQUIRED')
  })

  it('should return 401 when no auth', async () => {
    const res = await request(app).get('/test-no-auth')
    expect(res.status).toBe(401)
  })

  it('should define all plan constants', () => {
    expect(PLANS.FREE.name).toBe('FREE')
    expect(PLANS.BASIC.name).toBe('BASIC')
    expect(PLANS.PRO.name).toBe('PRO')
    expect(PLANS.ENTERPRISE.name).toBe('ENTERPRISE')
    expect(PLANS.FREE.price).toBe(0)
    expect(PLANS.ENTERPRISE.price).toBe(999)
  })
})
