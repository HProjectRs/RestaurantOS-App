import request from 'supertest'
import express from 'express'
import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset } from 'jest-mock-extended'
import expenseRoutes from '../routes/expenses'

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

const prisma = mockDeep<PrismaClient>()
const app = express()
app.use(express.json())
app.set('prisma', prisma)
app.use('/api/expenses', expenseRoutes)

beforeEach(() => {
  mockReset(prisma)
  ;(PrismaClient as unknown as jest.Mock).mockImplementation(() => prisma)
})

const mockExpense = {
  id: 'exp-1',
  businessId: 'biz-1',
  description: 'Cleaning supplies',
  amount: 250,
  category: 'Supplies',
  notes: null,
  date: new Date('2025-01-01'),
  createdAt: new Date(),
  updatedAt: new Date(),
}

// ─── GET / ───────────────────────────────────────────────────────────────────

describe('GET /api/expenses', () => {
  it('returns list of expenses', async () => {
    ;(prisma.expense.findMany as jest.Mock).mockResolvedValue([mockExpense])

    const res = await request(app).get('/api/expenses')

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].description).toBe('Cleaning supplies')
  })

  it('returns 500 on database error', async () => {
    ;(prisma.expense.findMany as jest.Mock).mockRejectedValue(new Error('DB error'))
    const res = await request(app).get('/api/expenses')
    expect(res.status).toBe(500)
  })
})

// ─── POST / ──────────────────────────────────────────────────────────────────

describe('POST /api/expenses', () => {
  it('creates a new expense', async () => {
    ;(prisma.expense.create as jest.Mock).mockResolvedValue(mockExpense)

    const res = await request(app)
      .post('/api/expenses')
      .send({ description: 'Cleaning supplies', amount: 250, category: 'Supplies' })

    expect(res.status).toBe(201)
    expect(res.body.amount).toBe(250)
    expect(prisma.expense.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ businessId: 'biz-1', amount: 250 }),
      })
    )
  })

  it('returns 400 for missing description', async () => {
    const res = await request(app)
      .post('/api/expenses')
      .send({ amount: 250 })
    expect(res.status).toBe(400)
  })

  it('returns 400 for negative amount', async () => {
    const res = await request(app)
      .post('/api/expenses')
      .send({ description: 'Test', amount: -50 })
    expect(res.status).toBe(400)
  })

  it('returns 400 for zero amount', async () => {
    const res = await request(app)
      .post('/api/expenses')
      .send({ description: 'Test', amount: 0 })
    expect(res.status).toBe(400)
  })

  it('returns 500 on database error', async () => {
    ;(prisma.expense.create as jest.Mock).mockRejectedValue(new Error('DB error'))
    const res = await request(app)
      .post('/api/expenses')
      .send({ description: 'Test', amount: 100 })
    expect(res.status).toBe(500)
  })
})

// ─── PUT /:id ────────────────────────────────────────────────────────────────

describe('PUT /api/expenses/:id', () => {
  it('updates expense successfully', async () => {
    ;(prisma.expense.update as jest.Mock).mockResolvedValue({
      ...mockExpense,
      amount: 300,
    })

    const res = await request(app)
      .put('/api/expenses/exp-1')
      .send({ description: 'Updated', amount: 300 })

    expect(res.status).toBe(200)
    expect(res.body.amount).toBe(300)
  })

  it('returns 500 on database error', async () => {
    ;(prisma.expense.update as jest.Mock).mockRejectedValue(new Error('DB error'))
    const res = await request(app)
      .put('/api/expenses/exp-1')
      .send({ amount: 300 })
    expect(res.status).toBe(500)
  })
})

// ─── DELETE /:id ─────────────────────────────────────────────────────────────

describe('DELETE /api/expenses/:id', () => {
  it('deletes expense successfully', async () => {
    ;(prisma.expense.delete as jest.Mock).mockResolvedValue(mockExpense)

    const res = await request(app).delete('/api/expenses/exp-1')

    expect(res.status).toBe(200)
    expect(res.body.message).toBe('Expense deleted')
    expect(prisma.expense.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'exp-1' } })
    )
  })

  it('returns 500 on database error', async () => {
    ;(prisma.expense.delete as jest.Mock).mockRejectedValue(new Error('DB error'))
    const res = await request(app).delete('/api/expenses/exp-1')
    expect(res.status).toBe(500)
  })
})
