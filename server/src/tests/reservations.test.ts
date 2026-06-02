import request from 'supertest'
import express from 'express'
import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset } from 'jest-mock-extended'
import reservationRoutes from '../routes/reservations'
import { errorHandler } from '../middleware/errorHandler'

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('@prisma/client', () => ({ PrismaClient: jest.fn() }))

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
app.use('/api/reservations', reservationRoutes)
app.use(errorHandler)

beforeEach(() => {
  mockReset(prisma)
  ;(PrismaClient as unknown as jest.Mock).mockImplementation(() => prisma)
})

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockReservation = {
  id: 'res-1',
  businessId: 'biz-1',
  tableId: '550e8400-e29b-41d4-a716-446655440000',
  customerName: 'Khalid Mohammed',
  customerPhone: '+966500000001',
  guests: 4,
  dateTime: new Date('2025-01-01T19:00:00.000Z'),
  status: 'PENDING',
  notes: null,
  table: { id: '550e8400-e29b-41d4-a716-446655440000', number: 'T1', capacity: 4, status: 'AVAILABLE' },
  createdAt: new Date(),
  updatedAt: new Date(),
}

const validReservationBody = {
  customerName: 'Khalid Mohammed',
  customerPhone: '+966500000001',
  guests: 4,
  tableId: '550e8400-e29b-41d4-a716-446655440000',
  dateTime: '2025-01-01T19:00:00.000Z',
}

// ─── GET / ───────────────────────────────────────────────────────────────────

describe('GET /api/reservations', () => {
  it('returns all reservations for the business', async () => {
    ;(prisma.reservation.findMany as jest.Mock).mockResolvedValue([mockReservation])

    const res = await request(app).get('/api/reservations')

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].customerName).toBe('Khalid Mohammed')
  })

  it('filters by date when query param provided', async () => {
    ;(prisma.reservation.findMany as jest.Mock).mockResolvedValue([mockReservation])

    const res = await request(app).get('/api/reservations?date=2025-01-01')

    expect(res.status).toBe(200)
    expect(prisma.reservation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          dateTime: expect.objectContaining({ gte: expect.any(Date) }),
        }),
      })
    )
  })

  it('filters by status when query param provided', async () => {
    ;(prisma.reservation.findMany as jest.Mock).mockResolvedValue([])

    const res = await request(app).get('/api/reservations?status=CONFIRMED')

    expect(res.status).toBe(200)
    expect(prisma.reservation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'CONFIRMED' }),
      })
    )
  })

  it('returns 500 on database error', async () => {
    ;(prisma.reservation.findMany as jest.Mock).mockRejectedValue(new Error('DB error'))
    const res = await request(app).get('/api/reservations')
    expect(res.status).toBe(500)
  })
})

// ─── POST / ──────────────────────────────────────────────────────────────────

describe('POST /api/reservations', () => {
  it('creates reservation and updates table status to RESERVED', async () => {
    ;(prisma.reservation.create as jest.Mock).mockResolvedValue(mockReservation)
    ;(prisma.table.update as jest.Mock).mockResolvedValue({})

    const res = await request(app)
      .post('/api/reservations')
      .send(validReservationBody)

    expect(res.status).toBe(201)
    expect(res.body.customerName).toBe('Khalid Mohammed')
    expect(prisma.table.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'RESERVED' } })
    )
  })

  it('creates reservation without table (no table update)', async () => {
    const noTableReservation = { ...mockReservation, tableId: null, table: null }
    ;(prisma.reservation.create as jest.Mock).mockResolvedValue(noTableReservation)

    const res = await request(app)
      .post('/api/reservations')
      .send({ ...validReservationBody, tableId: undefined })

    expect(res.status).toBe(201)
    expect(prisma.table.update).not.toHaveBeenCalled()
  })

  it('returns 400 for missing customerName', async () => {
    const res = await request(app)
      .post('/api/reservations')
      .send({ ...validReservationBody, customerName: undefined })
    expect(res.status).toBe(400)
  })

  it('returns 400 for missing customerPhone', async () => {
    const res = await request(app)
      .post('/api/reservations')
      .send({ ...validReservationBody, customerPhone: undefined })
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid guests count (0)', async () => {
    const res = await request(app)
      .post('/api/reservations')
      .send({ ...validReservationBody, guests: 0 })
    expect(res.status).toBe(400)
  })

  it('returns 400 for missing dateTime', async () => {
    const res = await request(app)
      .post('/api/reservations')
      .send({ ...validReservationBody, dateTime: undefined })
    expect(res.status).toBe(400)
  })
})

// ─── PUT /:id ────────────────────────────────────────────────────────────────

describe('PUT /api/reservations/:id', () => {
  it('updates reservation details', async () => {
    const updated = { ...mockReservation, guests: 6 }
    ;(prisma.reservation.update as jest.Mock).mockResolvedValue(updated)

    const res = await request(app)
      .put('/api/reservations/res-1')
      .send({ guests: 6, customerName: 'Khalid Mohammed', customerPhone: '+966500000001' })

    expect(res.status).toBe(200)
    expect(res.body.guests).toBe(6)
  })

  it('returns 400 for invalid status value', async () => {
    const res = await request(app)
      .put('/api/reservations/res-1')
      .send({ status: 'INVALID_STATUS' })
    expect(res.status).toBe(400)
  })

  it('returns 500 on database error', async () => {
    ;(prisma.reservation.update as jest.Mock).mockRejectedValue(new Error('DB error'))
    const res = await request(app)
      .put('/api/reservations/res-1')
      .send({ guests: 6 })
    expect(res.status).toBe(500)
  })
})

// ─── PATCH /:id/status ───────────────────────────────────────────────────────

describe('PATCH /api/reservations/:id/status', () => {
  it('changes status to CONFIRMED', async () => {
    ;(prisma.reservation.update as jest.Mock).mockResolvedValue({
      ...mockReservation,
      status: 'CONFIRMED',
    })

    const res = await request(app)
      .patch('/api/reservations/res-1/status')
      .send({ status: 'CONFIRMED' })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('CONFIRMED')
  })

  it('sets table to OCCUPIED when status becomes SEATED', async () => {
    ;(prisma.reservation.update as jest.Mock).mockResolvedValue({
      ...mockReservation,
      status: 'SEATED',
      tableId: 'table-1',
    })
    ;(prisma.table.update as jest.Mock).mockResolvedValue({})

    const res = await request(app)
      .patch('/api/reservations/res-1/status')
      .send({ status: 'SEATED' })

    expect(res.status).toBe(200)
    expect(prisma.table.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'OCCUPIED' } })
    )
  })

  it('sets table to AVAILABLE when status becomes CANCELLED', async () => {
    ;(prisma.reservation.update as jest.Mock).mockResolvedValue({
      ...mockReservation,
      status: 'CANCELLED',
      tableId: 'table-1',
    })
    ;(prisma.table.update as jest.Mock).mockResolvedValue({})

    const res = await request(app)
      .patch('/api/reservations/res-1/status')
      .send({ status: 'CANCELLED' })

    expect(res.status).toBe(200)
    expect(prisma.table.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'AVAILABLE' } })
    )
  })

  it('sets table to AVAILABLE when status becomes NO_SHOW', async () => {
    ;(prisma.reservation.update as jest.Mock).mockResolvedValue({
      ...mockReservation,
      status: 'NO_SHOW',
      tableId: 'table-1',
    })
    ;(prisma.table.update as jest.Mock).mockResolvedValue({})

    await request(app)
      .patch('/api/reservations/res-1/status')
      .send({ status: 'NO_SHOW' })

    expect(prisma.table.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'AVAILABLE' } })
    )
  })
})
