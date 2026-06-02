import request from 'supertest'
import express from 'express'
import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset } from 'jest-mock-extended'
import subscriptionRoutes from '../routes/subscriptions'
import { errorHandler } from '../middleware/errorHandler'

jest.mock('@prisma/client', () => ({ PrismaClient: jest.fn() }))
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    customers: {
      create: jest.fn().mockResolvedValue({ id: 'cus_test' }),
    },
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/pay/test', id: 'cs_test' }),
      },
    },
    billingPortal: {
      sessions: {
        create: jest.fn().mockResolvedValue({ url: 'https://billing.stripe.com/test' }),
      },
    },
    subscriptions: {
      update: jest.fn().mockResolvedValue({}),
    },
  }))
})
jest.mock('../middleware/auth', () => ({
  authenticate: jest.fn((req: any, _res: any, next: any) => {
    req.user = { userId: 'user-1', businessId: 'biz-1', role: 'ADMIN', name: 'Admin' }
    next()
  }),
}))
jest.mock('../middleware/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

const prisma = mockDeep<PrismaClient>()
const app = express()
app.use(express.json())
app.set('prisma', prisma)
// expose stripe key so getStripe() initialises
process.env.STRIPE_SECRET_KEY = 'sk_test_mock'
app.use('/api/subscriptions', subscriptionRoutes)
app.use(errorHandler)

beforeEach(() => {
  mockReset(prisma)
  ;(PrismaClient as unknown as jest.Mock).mockImplementation(() => prisma)
})

const mockSub = {
  id: 'sub-1',
  businessId: 'biz-1',
  plan: 'FREE',
  status: 'ACTIVE',
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  trialEndsAt: null,
  currentPeriodEnd: null,
  maxUsers: 1,
  maxBranches: 1,
  features: [],
  canceledAt: null,
}

// ─── GET /plans ───────────────────────────────────────────────────────────────

describe('GET /api/subscriptions/plans', () => {
  it('returns all plan configurations', async () => {
    const res = await request(app).get('/api/subscriptions/plans')
    expect(res.status).toBe(200)
    expect(res.body).toBeInstanceOf(Array)
    expect(res.body.length).toBe(4) // FREE, BASIC, PRO, ENTERPRISE
    expect(res.body[0]).toMatchObject({ name: 'FREE', price: 0 })
  })

  it('each plan has required fields', async () => {
    const res = await request(app).get('/api/subscriptions/plans')
    res.body.forEach((plan: any) => {
      expect(plan).toHaveProperty('name')
      expect(plan).toHaveProperty('price')
      expect(plan).toHaveProperty('maxUsers')
      expect(plan).toHaveProperty('features')
    })
  })
})

// ─── GET /current ─────────────────────────────────────────────────────────────

describe('GET /api/subscriptions/current', () => {
  it('returns existing subscription', async () => {
    ;(prisma as any).subscription = {
      findUnique: jest.fn().mockResolvedValue(mockSub),
      create: jest.fn(),
    }
    const res = await request(app).get('/api/subscriptions/current')
    expect(res.status).toBe(200)
    expect(res.body.plan).toBe('FREE')
    expect(res.body.status).toBe('ACTIVE')
  })

  it('creates FREE subscription when none exists', async () => {
    ;(prisma as any).subscription = {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(mockSub),
    }
    const res = await request(app).get('/api/subscriptions/current')
    expect(res.status).toBe(200)
    expect((prisma as any).subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ plan: 'FREE', status: 'ACTIVE' }),
      })
    )
  })

  it('parses features when stored as JSON string', async () => {
    ;(prisma as any).subscription = {
      findUnique: jest.fn().mockResolvedValue({ ...mockSub, features: JSON.stringify({ someFeature: true }) }),
    }
    const res = await request(app).get('/api/subscriptions/current')
    expect(res.status).toBe(200)
  })

  it('falls back to plan features when features is null', async () => {
    ;(prisma as any).subscription = {
      findUnique: jest.fn().mockResolvedValue({ ...mockSub, features: null }),
    }
    const res = await request(app).get('/api/subscriptions/current')
    expect(res.status).toBe(200)
  })
})

// ─── POST /create-checkout ────────────────────────────────────────────────────

describe('POST /api/subscriptions/create-checkout', () => {
  it('returns checkout URL', async () => {
    ;(prisma as any).subscription = {
      findUnique: jest.fn().mockResolvedValue({ ...mockSub, stripeCustomerId: 'cus_existing' }),
      update: jest.fn(),
    }

    const res = await request(app)
      .post('/api/subscriptions/create-checkout')
      .send({
        priceId: 'price_basic',
        successUrl: 'https://app.com/success',
        cancelUrl: 'https://app.com/cancel',
      })

    expect(res.status).toBe(200)
    expect(res.body.url).toContain('stripe.com')
  })

  it('returns 400 when priceId is missing', async () => {
    const res = await request(app)
      .post('/api/subscriptions/create-checkout')
      .send({ successUrl: 'https://app.com/success', cancelUrl: 'https://app.com/cancel' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/priceId/i)
  })

  it('returns 400 when successUrl is missing', async () => {
    const res = await request(app)
      .post('/api/subscriptions/create-checkout')
      .send({ priceId: 'price_basic', cancelUrl: 'https://app.com/cancel' })
    expect(res.status).toBe(400)
  })

  it('creates stripe customer when none exists', async () => {
    ;(prisma as any).subscription = {
      findUnique: jest.fn().mockResolvedValue({ ...mockSub, stripeCustomerId: null }),
      update: jest.fn(),
    }

    const res = await request(app)
      .post('/api/subscriptions/create-checkout')
      .send({
        priceId: 'price_basic',
        successUrl: 'https://app.com/success',
        cancelUrl: 'https://app.com/cancel',
      })

    expect(res.status).toBe(200)
    expect((prisma as any).subscription.update).toHaveBeenCalled()
  })
})

// ─── POST /portal ─────────────────────────────────────────────────────────────

describe('POST /api/subscriptions/portal', () => {
  it('returns billing portal URL', async () => {
    ;(prisma as any).subscription = {
      findUnique: jest.fn().mockResolvedValue({ ...mockSub, stripeCustomerId: 'cus_existing' }),
    }

    const res = await request(app)
      .post('/api/subscriptions/portal')
      .send({ returnUrl: 'https://app.com/settings' })

    expect(res.status).toBe(200)
    expect(res.body.url).toContain('stripe.com')
  })

  it('returns portal URL with default returnUrl', async () => {
    ;(prisma as any).subscription = {
      findUnique: jest.fn().mockResolvedValue({ ...mockSub, stripeCustomerId: 'cus_existing' }),
    }

    const res = await request(app)
      .post('/api/subscriptions/portal')
      .send({})

    expect(res.status).toBe(200)
    expect(res.body.url).toContain('stripe.com')
  })

  it('returns 400 when no stripe customer exists', async () => {
    ;(prisma as any).subscription = {
      findUnique: jest.fn().mockResolvedValue({ ...mockSub, stripeCustomerId: null }),
    }

    const res = await request(app)
      .post('/api/subscriptions/portal')
      .send({ returnUrl: 'https://app.com/settings' })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/no stripe customer/i)
  })
})

// ─── POST /cancel ─────────────────────────────────────────────────────────────

describe('POST /api/subscriptions/cancel', () => {
  it('cancels subscription successfully', async () => {
    ;(prisma as any).subscription = {
      findUnique: jest.fn().mockResolvedValue({
        ...mockSub,
        stripeCustomerId: 'cus_existing',
        stripeSubscriptionId: 'sub_existing',
      }),
      update: jest.fn().mockResolvedValue({ ...mockSub, status: 'CANCELED' }),
    }

    const res = await request(app).post('/api/subscriptions/cancel')

    expect(res.status).toBe(200)
    expect(res.body.message).toMatch(/canceled/i)
    expect((prisma as any).subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'CANCELED' }),
      })
    )
  })

  it('returns 400 when no active subscription to cancel', async () => {
    ;(prisma as any).subscription = {
      findUnique: jest.fn().mockResolvedValue({ ...mockSub, stripeSubscriptionId: null }),
    }

    const res = await request(app).post('/api/subscriptions/cancel')

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/no active subscription/i)
  })
})
