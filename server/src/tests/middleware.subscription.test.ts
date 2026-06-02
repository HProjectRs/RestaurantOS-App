import express from 'express'
import request from 'supertest'
import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset } from 'jest-mock-extended'
import { requireSubscription } from '../middleware/subscriptionGuard'
import { updateWithOptimisticLock } from '../middleware/optimisticLock'
import { Prisma } from '@prisma/client'

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(),
  Prisma: {
    PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
      code: string
      constructor(message: string, { code }: { code: string }) {
        super(message)
        this.code = code
      }
    },
  },
}))
jest.mock('../middleware/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

const prisma = mockDeep<PrismaClient>()

// ─── requireSubscription ─────────────────────────────────────────────────────

function makeApp(minPlan: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE' = 'FREE') {
  const app = express()
  app.use(express.json())
  app.set('prisma', prisma)
  app.use((req: any, _res: any, next: any) => {
    req.user = { userId: 'user-1', businessId: 'biz-1', role: 'ADMIN' }
    next()
  })
  app.get('/protected', requireSubscription(minPlan), (_req, res) => {
    res.json({ access: true })
  })
  return app
}

beforeEach(() => {
  mockReset(prisma)
  ;(PrismaClient as unknown as jest.Mock).mockImplementation(() => prisma)
})

describe('requireSubscription middleware', () => {
  it('allows access when subscription is ACTIVE and plan sufficient', async () => {
    ;(prisma as any).subscription = {
      findUnique: jest.fn().mockResolvedValue({ plan: 'PRO', status: 'ACTIVE' }),
    }
    const res = await request(makeApp('BASIC')).get('/protected')
    expect(res.status).toBe(200)
    expect(res.body.access).toBe(true)
  })

  it('returns 402 when no subscription exists', async () => {
    ;(prisma as any).subscription = {
      findUnique: jest.fn().mockResolvedValue(null),
    }
    const res = await request(makeApp()).get('/protected')
    expect(res.status).toBe(402)
    expect(res.body.code).toBe('SUBSCRIPTION_REQUIRED')
  })

  it('returns 402 when subscription is EXPIRED', async () => {
    ;(prisma as any).subscription = {
      findUnique: jest.fn().mockResolvedValue({ plan: 'BASIC', status: 'EXPIRED' }),
    }
    const res = await request(makeApp()).get('/protected')
    expect(res.status).toBe(402)
  })

  it('returns 402 when subscription is CANCELED', async () => {
    ;(prisma as any).subscription = {
      findUnique: jest.fn().mockResolvedValue({ plan: 'BASIC', status: 'CANCELED' }),
    }
    const res = await request(makeApp()).get('/protected')
    expect(res.status).toBe(402)
    expect(res.body.code).toBe('SUBSCRIPTION_CANCELED')
  })

  it('returns 402 when subscription is PAST_DUE', async () => {
    ;(prisma as any).subscription = {
      findUnique: jest.fn().mockResolvedValue({ plan: 'BASIC', status: 'PAST_DUE' }),
    }
    const res = await request(makeApp()).get('/protected')
    expect(res.status).toBe(402)
    expect(res.body.code).toBe('SUBSCRIPTION_PAST_DUE')
  })

  it('returns 403 when plan is below required minimum', async () => {
    ;(prisma as any).subscription = {
      findUnique: jest.fn().mockResolvedValue({ plan: 'FREE', status: 'ACTIVE' }),
    }
    const res = await request(makeApp('PRO')).get('/protected')
    expect(res.status).toBe(403)
    expect(res.body.code).toBe('PLAN_UPGRADE_REQUIRED')
    expect(res.body.requiredPlan).toBe('PRO')
  })

  it('returns 401 when no user on request', async () => {
    const app = express()
    app.use(express.json())
    app.set('prisma', prisma)
    // no user middleware
    app.get('/protected', requireSubscription(), (_req, res) => res.json({ ok: true }))
    const res = await request(app).get('/protected')
    expect(res.status).toBe(401)
  })

  it('FREE plan passes FREE requirement', async () => {
    ;(prisma as any).subscription = {
      findUnique: jest.fn().mockResolvedValue({ plan: 'FREE', status: 'ACTIVE' }),
    }
    const res = await request(makeApp('FREE')).get('/protected')
    expect(res.status).toBe(200)
  })

  it('returns 500 on database error', async () => {
    ;(prisma as any).subscription = {
      findUnique: jest.fn().mockRejectedValue(new Error('DB error')),
    }
    const res = await request(makeApp()).get('/protected')
    expect(res.status).toBe(500)
  })
})

// ─── updateWithOptimisticLock ─────────────────────────────────────────────────

describe('updateWithOptimisticLock', () => {
  it('returns result on first success', async () => {
    const fn = jest.fn().mockResolvedValue({ id: 'table-1', version: 2 })
    const result = await updateWithOptimisticLock(fn)
    expect(result).toEqual({ id: 'table-1', version: 2 })
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries on P2025 and succeeds on second attempt', async () => {
    const p2025 = new (Prisma.PrismaClientKnownRequestError as any)(
      'Record not found', { code: 'P2025' }
    )
    const fn = jest.fn()
      .mockRejectedValueOnce(p2025)
      .mockResolvedValueOnce({ id: 'table-1', version: 2 })

    const result = await updateWithOptimisticLock(fn, 3)
    expect(result).toEqual({ id: 'table-1', version: 2 })
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('throws after maxRetries exhausted', async () => {
    const p2025 = new (Prisma.PrismaClientKnownRequestError as any)(
      'Record not found', { code: 'P2025' }
    )
    const fn = jest.fn().mockRejectedValue(p2025)

    await expect(updateWithOptimisticLock(fn, 3)).rejects.toThrow(
      /optimistic lock failed after 3 retries/i
    )
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('does not retry on non-P2025 errors', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('Connection refused'))
    await expect(updateWithOptimisticLock(fn, 3)).rejects.toThrow('Connection refused')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('uses default 3 retries when maxRetries not specified', async () => {
    const p2025 = new (Prisma.PrismaClientKnownRequestError as any)(
      'Record not found', { code: 'P2025' }
    )
    const fn = jest.fn().mockRejectedValue(p2025)
    await expect(updateWithOptimisticLock(fn)).rejects.toThrow()
    expect(fn).toHaveBeenCalledTimes(3)
  })
})
