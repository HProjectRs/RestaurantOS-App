import request from 'supertest'
import express from 'express'
import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset } from 'jest-mock-extended'
import settingsRoutes from '../routes/settings'

jest.mock('@prisma/client', () => ({ PrismaClient: jest.fn() }))
jest.mock('../middleware/auth', () => ({
  authenticate: jest.fn((req: any, _res: any, next: any) => {
    req.user = { userId: 'user-1', businessId: 'biz-1', role: 'ADMIN' }
    next()
  }),
  requireRole: jest.fn((...roles: string[]) => (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role))
      return res.status(403).json({ error: 'Insufficient permissions' })
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
app.use('/api/settings', settingsRoutes)

beforeEach(() => {
  mockReset(prisma)
  ;(PrismaClient as unknown as jest.Mock).mockImplementation(() => prisma)
})

const mockBusiness = {
  id: 'biz-1',
  name: 'My Restaurant',
  nameAr: 'مطعمي',
  logo: null,
  taxRate: 15,
  serviceChargeRate: 0,
  currency: 'SAR',
  wifiDuration: 60,
  wifiVoucherEnabled: false,
  autoPrintOrders: false,
  kitchenDisplayEnabled: true,
}

// ─── GET / ───────────────────────────────────────────────────────────────────

describe('GET /api/settings', () => {
  it('returns business settings for authenticated user', async () => {
    ;(prisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness)
    const res = await request(app).get('/api/settings')
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('My Restaurant')
    expect(prisma.business.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'biz-1' } })
    )
  })

  it('returns 500 on database error', async () => {
    ;(prisma.business.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'))
    const res = await request(app).get('/api/settings')
    expect(res.status).toBe(500)
  })
})

// ─── GET /public ─────────────────────────────────────────────────────────────

describe('GET /api/settings/public', () => {
  it('returns public business info', async () => {
    ;(prisma.business.findFirst as jest.Mock).mockResolvedValue(mockBusiness)
    const res = await request(app).get('/api/settings/public')
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ id: 'biz-1', name: 'My Restaurant' })
    // sensitive fields not returned
    expect(res.body.taxRate).toBeUndefined()
  })

  it('returns 404 when no business exists', async () => {
    ;(prisma.business.findFirst as jest.Mock).mockResolvedValue(null)
    const res = await request(app).get('/api/settings/public')
    expect(res.status).toBe(404)
  })
})

// ─── GET /public/:id ─────────────────────────────────────────────────────────

describe('GET /api/settings/public/:id', () => {
  it('returns public business info by id', async () => {
    ;(prisma.business.findUnique as jest.Mock).mockResolvedValue({
      id: 'biz-1', name: 'My Restaurant', nameAr: 'مطعمي', logo: null, currency: 'SAR',
    })
    const res = await request(app).get('/api/settings/public/biz-1')
    expect(res.status).toBe(200)
    expect(res.body.id).toBe('biz-1')
  })

  it('returns 404 when business not found', async () => {
    ;(prisma.business.findUnique as jest.Mock).mockResolvedValue(null)
    const res = await request(app).get('/api/settings/public/nonexistent')
    expect(res.status).toBe(404)
  })
})

// ─── PUT / ───────────────────────────────────────────────────────────────────

describe('PUT /api/settings', () => {
  it('updates business settings', async () => {
    const updated = { ...mockBusiness, taxRate: 10 }
    ;(prisma.business.update as jest.Mock).mockResolvedValue(updated)

    const res = await request(app)
      .put('/api/settings')
      .send({ taxRate: 10, currency: 'SAR' })

    expect(res.status).toBe(200)
    expect(res.body.taxRate).toBe(10)
  })

  it('returns 400 for taxRate over 100', async () => {
    const res = await request(app)
      .put('/api/settings')
      .send({ taxRate: 150 })
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid currency (not 3 chars)', async () => {
    const res = await request(app)
      .put('/api/settings')
      .send({ currency: 'DOLLAR' })
    expect(res.status).toBe(400)
  })

  it('returns 500 on database error', async () => {
    ;(prisma.business.update as jest.Mock).mockRejectedValue(new Error('DB error'))
    const res = await request(app)
      .put('/api/settings')
      .send({ name: 'New Name' })
    expect(res.status).toBe(500)
  })
})
