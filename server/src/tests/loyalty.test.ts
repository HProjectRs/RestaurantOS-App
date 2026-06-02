import request from 'supertest'
import express from 'express'
import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset } from 'jest-mock-extended'
import loyaltyRoutes from '../routes/loyalty'
import { errorHandler } from '../middleware/errorHandler'

jest.mock('@prisma/client', () => ({ PrismaClient: jest.fn() }))
jest.mock('../middleware/auth', () => ({
  authenticate: jest.fn((req: any, _res: any, next: any) => {
    req.user = { userId: 'user-1', businessId: 'biz-1', role: 'ADMIN', name: 'Admin' }
    next()
  }),
  requireRole: jest.fn(() => (req: any, res: any, next: any) => next()),
}))
jest.mock('../middleware/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

const prisma = mockDeep<PrismaClient>()
const app = express()
app.use(express.json())
app.set('prisma', prisma)
app.use('/api/loyalty', loyaltyRoutes)
app.use(errorHandler)

beforeEach(() => {
  mockReset(prisma)
  ;(PrismaClient as unknown as jest.Mock).mockImplementation(() => prisma)
})

describe('GET /api/loyalty/program', () => {
  it('returns existing loyalty program', async () => {
    ;(prisma as any).loyaltyProgram.findFirst.mockResolvedValue({ id: 'prog-1', name: 'Loyalty', enabled: true })
    const res = await request(app).get('/api/loyalty/program')
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Loyalty')
  })

  it('creates program if none exists', async () => {
    ;(prisma as any).loyaltyProgram.findFirst.mockResolvedValue(null)
    ;(prisma as any).loyaltyProgram.create.mockResolvedValue({ id: 'prog-1', businessId: 'biz-1' })
    const res = await request(app).get('/api/loyalty/program')
    expect(res.status).toBe(200)
    expect((prisma as any).loyaltyProgram.create).toHaveBeenCalled()
  })
})

describe('PUT /api/loyalty/program', () => {
  it('upserts loyalty program settings', async () => {
    ;(prisma as any).loyaltyProgram.upsert.mockResolvedValue({ id: 'prog-1', name: 'Updated', enabled: true })
    const res = await request(app).put('/api/loyalty/program').send({ name: 'Updated', enabled: true })
    expect(res.status).toBe(200)
    expect((prisma as any).loyaltyProgram.upsert).toHaveBeenCalled()
  })
})

describe('GET /api/loyalty/customers/search', () => {
  it('returns customer by phone', async () => {
    ;(prisma as any).loyaltyCustomer.findFirst.mockResolvedValue({ id: 'cust-1', phone: '+966500000000' })
    const res = await request(app).get('/api/loyalty/customers/search?phone=+966500000000')
    expect(res.status).toBe(200)
    expect(res.body.phone).toBe('+966500000000')
  })

  it('returns null when customer not found', async () => {
    ;(prisma as any).loyaltyCustomer.findFirst.mockResolvedValue(null)
    const res = await request(app).get('/api/loyalty/customers/search?phone=+966500000001')
    expect(res.status).toBe(200)
    expect(res.body).toBeNull()
  })
})

describe('POST /api/loyalty/customers', () => {
  it('creates new customer when program exists', async () => {
    ;(prisma as any).loyaltyProgram.findFirst.mockResolvedValue({ id: 'prog-1' })
    ;(prisma as any).loyaltyCustomer.findFirst.mockResolvedValue(null)
    ;(prisma as any).loyaltyCustomer.create.mockResolvedValue({ id: 'cust-1', name: 'Ahmed', phone: '+966500000000' })
    const res = await request(app).post('/api/loyalty/customers').send({ phone: '+966500000000', name: 'Ahmed' })
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Ahmed')
  })

  it('updates existing customer name', async () => {
    ;(prisma as any).loyaltyProgram.findFirst.mockResolvedValue({ id: 'prog-1' })
    ;(prisma as any).loyaltyCustomer.findFirst.mockResolvedValue({ id: 'cust-1', phone: '+966500000000' })
    ;(prisma as any).loyaltyCustomer.update.mockResolvedValue({ id: 'cust-1', name: 'Updated', phone: '+966500000000' })
    const res = await request(app).post('/api/loyalty/customers').send({ phone: '+966500000000', name: 'Updated' })
    expect(res.status).toBe(200)
    expect((prisma as any).loyaltyCustomer.update).toHaveBeenCalled()
  })

  it('returns 400 when program not configured', async () => {
    ;(prisma as any).loyaltyProgram.findFirst.mockResolvedValue(null)
    const res = await request(app).post('/api/loyalty/customers').send({ phone: '+966500000000' })
    expect(res.status).toBe(400)
  })
})

describe('POST /api/loyalty/points/add', () => {
  it('adds points with order reference', async () => {
    ;(prisma as any).loyaltyTransaction.create.mockResolvedValue({ id: 'txn-1', points: 50, type: 'EARN' })
    ;(prisma as any).loyaltyCustomer.update.mockResolvedValue({})
    const res = await request(app).post('/api/loyalty/points/add').send({ customerId: '550e8400-e29b-41d4-a716-446655440000', points: 50, orderId: '550e8400-e29b-41d4-a716-446655440001' })
    expect(res.status).toBe(200)
    expect((prisma as any).loyaltyTransaction.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ referenceType: 'ORDER', type: 'EARN' }) }))
  })

  it('adds points without order reference (manual)', async () => {
    ;(prisma as any).loyaltyTransaction.create.mockResolvedValue({ id: 'txn-2', points: 20, type: 'EARN' })
    ;(prisma as any).loyaltyCustomer.update.mockResolvedValue({})
    const res = await request(app).post('/api/loyalty/points/add').send({ customerId: '550e8400-e29b-41d4-a716-446655440000', points: 20 })
    expect(res.status).toBe(200)
    expect((prisma as any).loyaltyTransaction.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ referenceType: 'MANUAL' }) }))
  })
})

describe('POST /api/loyalty/points/redeem', () => {
  it('redeems points successfully', async () => {
    ;(prisma as any).loyaltyCustomer.findUnique.mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440000', totalPoints: 100 })
    ;(prisma as any).loyaltyTransaction.create.mockResolvedValue({ id: 'txn-1', points: -30 })
    ;(prisma as any).loyaltyCustomer.update.mockResolvedValue({})
    const res = await request(app).post('/api/loyalty/points/redeem').send({ customerId: '550e8400-e29b-41d4-a716-446655440000', points: 30 })
    expect(res.status).toBe(200)
    expect((prisma as any).loyaltyTransaction.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ type: 'REDEEM', points: -30 }) }))
  })

  it('returns 404 when customer not found', async () => {
    ;(prisma as any).loyaltyCustomer.findUnique.mockResolvedValue(null)
    const res = await request(app).post('/api/loyalty/points/redeem').send({ customerId: '550e8400-e29b-41d4-a716-446655440000', points: 10 })
    expect(res.status).toBe(404)
  })

  it('returns 400 when insufficient points', async () => {
    ;(prisma as any).loyaltyCustomer.findUnique.mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440000', totalPoints: 5 })
    const res = await request(app).post('/api/loyalty/points/redeem').send({ customerId: '550e8400-e29b-41d4-a716-446655440000', points: 100 })
    expect(res.status).toBe(400)
  })
})

describe('GET /api/loyalty/customers', () => {
  it('returns all loyalty customers', async () => {
    ;(prisma as any).loyaltyCustomer.findMany.mockResolvedValue([{ id: 'cust-1', name: 'Ahmed', _count: { transactions: 3 } }])
    const res = await request(app).get('/api/loyalty/customers')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
  })
})
