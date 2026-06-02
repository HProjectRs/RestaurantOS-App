import request from 'supertest'
import express from 'express'
import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset } from 'jest-mock-extended'
import tableRoutes from '../routes/tables'
import { errorHandler } from '../middleware/errorHandler'

jest.mock('@prisma/client', () => ({ PrismaClient: jest.fn() }))

jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mockqr'),
}))

jest.mock('../middleware/auth', () => ({
  authenticate: jest.fn((req: any, _res: any, next: any) => {
    req.user = { userId: 'user-1', businessId: 'biz-1', role: 'ADMIN', name: 'Admin' }
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

// ─── App setup ───────────────────────────────────────────────────────────────

const prisma = mockDeep<PrismaClient>()
const app = express()
app.use(express.json())
app.set('prisma', prisma)
app.use('/api/tables', tableRoutes)
app.use(errorHandler)

beforeEach(() => {
  mockReset(prisma)
  ;(PrismaClient as unknown as jest.Mock).mockImplementation(() => prisma)
})

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockTable = {
  id: 'table-1',
  businessId: 'biz-1',
  number: 'T1',
  capacity: 4,
  status: 'AVAILABLE',
  version: 1,
  qrCode: 'data:image/png;base64,mockqr',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

// ─── GET / ───────────────────────────────────────────────────────────────────

describe('GET /api/tables', () => {
  it('returns all active tables for the business', async () => {
    ;(prisma.table.findMany as jest.Mock).mockResolvedValue([mockTable])

    const res = await request(app).get('/api/tables')

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].id).toBe('table-1')
    expect(prisma.table.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { businessId: 'biz-1', isActive: true },
      })
    )
  })

  it('returns empty array when no tables', async () => {
    ;(prisma.table.findMany as jest.Mock).mockResolvedValue([])
    const res = await request(app).get('/api/tables')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('returns 500 on database error', async () => {
    ;(prisma.table.findMany as jest.Mock).mockRejectedValue(new Error('DB error'))
    const res = await request(app).get('/api/tables')
    expect(res.status).toBe(500)
  })
})

// ─── POST / ──────────────────────────────────────────────────────────────────

describe('POST /api/tables', () => {
  it('creates a table and generates QR code', async () => {
    ;(prisma.table.create as jest.Mock).mockResolvedValue({ ...mockTable, qrCode: null })
    ;(prisma.table.update as jest.Mock).mockResolvedValue(mockTable)

    const res = await request(app)
      .post('/api/tables')
      .send({ number: 'T1', capacity: 4 })

    expect(res.status).toBe(201)
    expect(res.body.qrCode).toBe('data:image/png;base64,mockqr')
    expect(prisma.table.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ number: 'T1', capacity: 4, businessId: 'biz-1' }),
      })
    )
  })

  it('returns 500 on database error', async () => {
    ;(prisma.table.create as jest.Mock).mockRejectedValue(new Error('DB error'))
    const res = await request(app)
      .post('/api/tables')
      .send({ number: 'T1', capacity: 4 })
    expect(res.status).toBe(500)
  })
})

// ─── PUT /:id ────────────────────────────────────────────────────────────────

describe('PUT /api/tables/:id', () => {
  it('updates table with version for optimistic locking', async () => {
    const updated = { ...mockTable, capacity: 6, version: 2 }
    ;(prisma.table.update as jest.Mock).mockResolvedValue(updated)

    const res = await request(app)
      .put('/api/tables/table-1')
      .send({ capacity: 6, version: 1 })

    expect(res.status).toBe(200)
    expect(res.body.capacity).toBe(6)
  })

  it('returns 400 when version is missing (Zod validation)', async () => {
    const res = await request(app)
      .put('/api/tables/table-1')
      .send({ capacity: 6 })
    expect(res.status).toBe(400)
  })

  it('returns 409 on optimistic lock conflict (P2025)', async () => {
    const p2025Err = new Error('Record not found') as any
    p2025Err.code = 'P2025'
    ;(prisma.table.update as jest.Mock).mockRejectedValue(p2025Err)

    const res = await request(app)
      .put('/api/tables/table-1')
      .send({ capacity: 6, version: 1 })

    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/modified by another request/i)
  })

  it('rejects invalid status value', async () => {
    const res = await request(app)
      .put('/api/tables/table-1')
      .send({ status: 'INVALID_STATUS', version: 1 })
    expect(res.status).toBe(400)
  })
})

// ─── DELETE /:id ─────────────────────────────────────────────────────────────

describe('DELETE /api/tables/:id', () => {
  it('soft-deletes a table (sets isActive false)', async () => {
    ;(prisma.table.update as jest.Mock).mockResolvedValue({ ...mockTable, isActive: false })

    const res = await request(app).delete('/api/tables/table-1')

    expect(res.status).toBe(200)
    expect(res.body.message).toBe('Table removed')
    expect(prisma.table.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: false } })
    )
  })

  it('returns 500 on database error', async () => {
    ;(prisma.table.update as jest.Mock).mockRejectedValue(new Error('DB error'))
    const res = await request(app).delete('/api/tables/table-1')
    expect(res.status).toBe(500)
  })
})

// ─── PATCH /:id/status ───────────────────────────────────────────────────────

describe('PATCH /api/tables/:id/status', () => {
  it('updates table status', async () => {
    const updated = { ...mockTable, status: 'OCCUPIED', version: 2 }
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (fn: any) => {
      return fn({
        table: {
          findUnique: jest.fn().mockResolvedValue(mockTable),
          update: jest.fn().mockResolvedValue(updated),
        },
      })
    })

    const res = await request(app)
      .patch('/api/tables/table-1/status')
      .send({ status: 'OCCUPIED' })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('OCCUPIED')
  })

  it('returns 404 when table not found', async () => {
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (fn: any) => {
      return fn({
        table: {
          findUnique: jest.fn().mockResolvedValue(null),
          update: jest.fn(),
        },
      })
    })

    const res = await request(app)
      .patch('/api/tables/nonexistent/status')
      .send({ status: 'OCCUPIED' })

    expect(res.status).toBe(404)
  })

  it('returns 409 when occupying an already-occupied table', async () => {
    const occupied = { ...mockTable, status: 'OCCUPIED' }
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (fn: any) => {
      return fn({
        table: {
          findUnique: jest.fn().mockResolvedValue(occupied),
          update: jest.fn(),
        },
      })
    })

    const res = await request(app)
      .patch('/api/tables/table-1/status')
      .send({ status: 'OCCUPIED' })

    expect(res.status).toBe(409)
  })
})

// ─── POST /:id/regenerate-qr ─────────────────────────────────────────────────

describe('POST /api/tables/:id/regenerate-qr', () => {
  it('regenerates QR code successfully', async () => {
    ;(prisma.table.findUnique as jest.Mock).mockResolvedValue(mockTable)
    ;(prisma.table.update as jest.Mock).mockResolvedValue({
      ...mockTable,
      qrCode: 'data:image/png;base64,newqr',
    })

    const res = await request(app).post('/api/tables/table-1/regenerate-qr')

    expect(res.status).toBe(200)
    expect(res.body.qrCode).toBeDefined()
  })

  it('returns 404 when table not found', async () => {
    ;(prisma.table.findUnique as jest.Mock).mockResolvedValue(null)

    const res = await request(app).post('/api/tables/nonexistent/regenerate-qr')

    expect(res.status).toBe(404)
    expect(res.body.error).toMatch(/Table not found/i)
  })
})
