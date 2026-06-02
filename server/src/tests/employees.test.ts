import request from 'supertest'
import express from 'express'
import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset } from 'jest-mock-extended'
import employeeRoutes from '../routes/employees'
import { errorHandler } from '../middleware/errorHandler'

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('@prisma/client', () => ({ PrismaClient: jest.fn() }))

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
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
app.use('/api/employees', employeeRoutes)
app.use(errorHandler)

beforeEach(() => {
  mockReset(prisma)
  ;(PrismaClient as unknown as jest.Mock).mockImplementation(() => prisma)
})

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockEmployee = {
  id: 'emp-1',
  name: 'Ahmed Ali',
  email: 'ahmed@restaurant.com',
  phone: '+966500000001',
  role: 'WAITER',
  isActive: true,
  shiftId: null,
  shift: null,
  salary: 3000,
  salaryPeriod: 'MONTHLY',
  createdAt: new Date(),
}

const validEmployeeBody = {
  name: 'Ahmed Ali',
  email: 'ahmed@restaurant.com',
  phone: '+966500000001',
  password: 'secret123',
  role: 'WAITER',
}

// ─── GET / ───────────────────────────────────────────────────────────────────

describe('GET /api/employees', () => {
  it('returns all employees for the business', async () => {
    ;(prisma.user.findMany as jest.Mock).mockResolvedValue([mockEmployee])

    const res = await request(app).get('/api/employees')

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].email).toBe('ahmed@restaurant.com')
    expect(res.body[0].password).toBeUndefined() // password never returned
  })

  it('returns empty array when no employees', async () => {
    ;(prisma.user.findMany as jest.Mock).mockResolvedValue([])
    const res = await request(app).get('/api/employees')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('returns 500 on database error', async () => {
    ;(prisma.user.findMany as jest.Mock).mockRejectedValue(new Error('DB error'))
    const res = await request(app).get('/api/employees')
    expect(res.status).toBe(500)
  })
})

// ─── POST / ──────────────────────────────────────────────────────────────────

describe('POST /api/employees', () => {
  it('creates a new employee successfully', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null) // no existing
    ;(prisma.user.create as jest.Mock).mockResolvedValue({
      id: 'emp-1',
      name: 'Ahmed Ali',
      email: 'ahmed@restaurant.com',
      phone: '+966500000001',
      role: 'WAITER',
      isActive: true,
    })

    const res = await request(app)
      .post('/api/employees')
      .send(validEmployeeBody)

    expect(res.status).toBe(201)
    expect(res.body.email).toBe('ahmed@restaurant.com')
    expect(res.body.password).toBeUndefined()
  })

  it('returns 400 when email already in use', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockEmployee)

    const res = await request(app)
      .post('/api/employees')
      .send(validEmployeeBody)

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/email already in use/i)
  })

  it('returns 400 for missing required fields', async () => {
    const res = await request(app)
      .post('/api/employees')
      .send({ name: 'Ahmed' }) // missing email, phone
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid role', async () => {
    const res = await request(app)
      .post('/api/employees')
      .send({ ...validEmployeeBody, role: 'SUPERUSER' })
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid PIN (not 4 digits)', async () => {
    const res = await request(app)
      .post('/api/employees')
      .send({ ...validEmployeeBody, pin: '12' })
    expect(res.status).toBe(400)
  })

})

// ─── PUT /:id ────────────────────────────────────────────────────────────────

describe('PUT /api/employees/:id', () => {
  it('updates employee info', async () => {
    ;(prisma.user.update as jest.Mock).mockResolvedValue({
      ...mockEmployee,
      name: 'Ahmed Updated',
    })

    const res = await request(app)
      .put('/api/employees/emp-1')
      .send({ name: 'Ahmed Updated', phone: '+966500000001' })

    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Ahmed Updated')
  })

  it('updates employee with all optional fields', async () => {
    ;(prisma.user.update as jest.Mock).mockResolvedValue({
      ...mockEmployee,
      name: 'Full Update',
      role: 'MANAGER',
      isActive: true,
    })

    const res = await request(app)
      .put('/api/employees/emp-1')
      .send({ name: 'Full Update', phone: '+966511111111', role: 'MANAGER', pin: '1234', isActive: true })

    expect(res.status).toBe(200)
  })

  it('returns 400 for invalid update data', async () => {
    const res = await request(app)
      .put('/api/employees/emp-1')
      .send({ role: 'INVALID_ROLE' })
    expect(res.status).toBe(400)
  })

  it('returns 500 on database error', async () => {
    ;(prisma.user.update as jest.Mock).mockRejectedValue(new Error('DB error'))
    const res = await request(app)
      .put('/api/employees/emp-1')
      .send({ name: 'New Name', phone: '+966500000001' })
    expect(res.status).toBe(500)
  })
})

// ─── DELETE /:id ─────────────────────────────────────────────────────────────

describe('DELETE /api/employees/:id', () => {
  it('deactivates employee (soft delete)', async () => {
    ;(prisma.user.update as jest.Mock).mockResolvedValue({
      ...mockEmployee,
      isActive: false,
    })

    const res = await request(app).delete('/api/employees/emp-1')

    expect(res.status).toBe(200)
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ isActive: false }) })
    )
  })

  it('returns 500 on database error', async () => {
    ;(prisma.user.update as jest.Mock).mockRejectedValue(new Error('DB error'))
    const res = await request(app).delete('/api/employees/emp-1')
    expect(res.status).toBe(500)
  })
})

// ─── PUT /:id/salary ─────────────────────────────────────────────────────────

describe('PUT /api/employees/:id/salary', () => {
  it('updates employee salary', async () => {
    ;(prisma.user.update as jest.Mock).mockResolvedValue({
      ...mockEmployee,
      salary: 5000,
      salaryPeriod: 'MONTHLY',
    })

    const res = await request(app)
      .put('/api/employees/emp-1/salary')
      .send({ salary: 5000, salaryPeriod: 'MONTHLY' })

    expect(res.status).toBe(200)
    expect(res.body.salary).toBe(5000)
  })

  it('returns 400 for missing salary', async () => {
    const res = await request(app)
      .put('/api/employees/emp-1/salary')
      .send({ salaryPeriod: 'MONTHLY' }) // missing salary
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid salaryPeriod', async () => {
    const res = await request(app)
      .put('/api/employees/emp-1/salary')
      .send({ salary: 3000, salaryPeriod: 'ANNUAL' }) // not in enum
    expect(res.status).toBe(400)
  })
})

// ─── POST /shifts ──────────────────────────────────────────────────────────

describe('POST /api/employees/shifts', () => {
  it('creates shift', async () => {
    ;(prisma.shift.create as jest.Mock).mockResolvedValue({ id: 'shift-1', name: 'Morning' })
    const res = await request(app)
      .post('/api/employees/shifts')
      .send({ name: 'Morning', startTime: '08:00', endTime: '16:00' })
    expect(res.status).toBe(201)
  })
})

// ─── PUT /shifts/:id ───────────────────────────────────────────────────────

describe('PUT /api/employees/shifts/:id', () => {
  it('updates shift', async () => {
    ;(prisma.shift.update as jest.Mock).mockResolvedValue({ id: 'shift-1', name: 'Evening' })
    const res = await request(app)
      .put('/api/employees/shifts/shift-1')
      .send({ name: 'Evening' })
    expect(res.status).toBe(200)
  })
})

// ─── DELETE /shifts/:id ────────────────────────────────────────────────────

describe('DELETE /api/employees/shifts/:id', () => {
  it('deletes shift', async () => {
    ;(prisma.shift.delete as jest.Mock).mockResolvedValue({})
    const res = await request(app).delete('/api/employees/shifts/shift-1')
    expect(res.status).toBe(200)
  })
})

// ─── GET /payroll ──────────────────────────────────────────────────────────

describe('GET /api/employees/payroll', () => {
  it('returns payroll data', async () => {
    ;(prisma.user.findMany as jest.Mock).mockResolvedValue([
      { id: 'emp-1', name: 'Waiter', role: 'WAITER', salary: 3000, salaryPeriod: 'MONTHLY', orders: [{ total: 500 }] },
    ])
    const res = await request(app).get('/api/employees/payroll')
    expect(res.status).toBe(200)
    expect(res.body[0].thisMonthOrders).toBe(1)
    expect(res.body[0].thisMonthSales).toBe(500)
  })
})

// ─── POST /clock-out ──────────────────────────────────────────────────────

describe('POST /api/employees/clock-out', () => {
  it('clocks out active attendance', async () => {
    ;(prisma.attendance.findFirst as jest.Mock).mockResolvedValue({ id: 'att-1' })
    ;(prisma.attendance.update as jest.Mock).mockResolvedValue({ id: 'att-1', clockOut: new Date() })
    const res = await request(app).post('/api/employees/clock-out')
    expect(res.status).toBe(200)
  })

  it('returns 404 when no active clock-in', async () => {
    ;(prisma.attendance.findFirst as jest.Mock).mockResolvedValue(null)
    const res = await request(app).post('/api/employees/clock-out')
    expect(res.status).toBe(404)
  })
})

// ─── GET /attendance ───────────────────────────────────────────────────────

describe('GET /api/employees/attendance', () => {
  it('returns attendance records', async () => {
    ;(prisma.attendance.findMany as jest.Mock).mockResolvedValue([{ id: 'att-1', user: { name: 'Waiter' } }])
    const res = await request(app).get('/api/employees/attendance')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
  })

  it('filters by userId', async () => {
    ;(prisma.attendance.findMany as jest.Mock).mockResolvedValue([])
    const res = await request(app).get('/api/employees/attendance?userId=emp-1')
    expect(res.status).toBe(200)
    expect(prisma.attendance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: 'emp-1' }) })
    )
  })

  it('filters by date range', async () => {
    ;(prisma.attendance.findMany as jest.Mock).mockResolvedValue([])
    const res = await request(app).get('/api/employees/attendance?from=2025-01-01&to=2025-01-31')
    expect(res.status).toBe(200)
    expect(prisma.attendance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ date: expect.objectContaining({ gte: '2025-01-01', lte: '2025-01-31' }) }) })
    )
  })
})
