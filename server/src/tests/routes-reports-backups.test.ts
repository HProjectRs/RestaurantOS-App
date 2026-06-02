import request from 'supertest'
import express from 'express'
import { PrismaClient } from '@prisma/client'
import { mockDeep } from 'jest-mock-extended'
import fs from 'fs'

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
  logError: jest.fn(),
}))

jest.mock('child_process', () => ({ exec: jest.fn() }))
jest.mock('fs')

const prisma = mockDeep<PrismaClient>()
;(PrismaClient as unknown as jest.Mock).mockImplementation(() => prisma)

import { errorHandler } from '../middleware/errorHandler'
function makeApp(routes: any) {
  const app = express()
  app.use(express.json())
  app.set('prisma', prisma)
  app.use(routes)
  app.use(errorHandler)
  return app
}

afterEach(() => {
  // Clean up any DATABASE_URL override from Postgres tests
  delete process.env.DATABASE_URL_OVERRIDE
})

beforeEach(() => {
  jest.clearAllMocks()
  ;(PrismaClient as unknown as jest.Mock).mockImplementation(() => prisma)
})

// ─── reports ───
describe('Reports Route', () => {
  let routes: any
  beforeAll(async () => { routes = (await import('../routes/reports')).default })

  it('GET /dashboard should return summary', async () => {
    ;(prisma.order.count as jest.Mock).mockResolvedValue(15)
    ;(prisma.order.aggregate as jest.Mock).mockResolvedValue({ _sum: { total: 2500 } })
    ;(prisma.table.count as jest.Mock).mockResolvedValue(8)
    ;(prisma.menuItem.count as jest.Mock).mockResolvedValue(42)
    ;(prisma.menuCategory.count as jest.Mock).mockResolvedValue(6)
    ;(prisma.order.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.orderItem.groupBy as jest.Mock).mockResolvedValue([])
    ;(prisma.menuItem.findMany as jest.Mock).mockResolvedValue([])
    const res = await request(makeApp(routes)).get('/dashboard')
    expect(res.status).toBe(200)
    expect(res.body.todayOrders).toBe(15)
  })

  it('GET /sales should return sales data', async () => {
    ;(prisma.order.findMany as jest.Mock).mockResolvedValue([
      { id: 'o-1', createdAt: new Date(), total: 100, paymentStatus: 'PAID' },
    ])
    const res = await request(makeApp(routes)).get('/sales')
    expect(res.status).toBe(200)
  })

  it('GET /sales with date range', async () => {
    ;(prisma.order.findMany as jest.Mock).mockResolvedValue([
      { id: 'o-1', createdAt: new Date('2025-01-01'), total: 100, paymentStatus: 'PAID' },
      { id: 'o-2', createdAt: new Date('2025-01-02'), total: 50, paymentStatus: 'PAID' },
    ])
    const res = await request(makeApp(routes)).get('/sales?from=2025-01-01&to=2025-01-31')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
  })

  it('GET /sales with groupBy=month should group by month', async () => {
    ;(prisma.order.findMany as jest.Mock).mockResolvedValue([
      { id: 'o-1', createdAt: new Date('2025-01-15'), total: 100, paymentStatus: 'PAID' },
    ])
    const res = await request(makeApp(routes)).get('/sales?groupBy=month')
    expect(res.status).toBe(200)
  })

  it('GET /sales with groupBy=week should group by week', async () => {
    ;(prisma.order.findMany as jest.Mock).mockResolvedValue([
      { id: 'o-1', createdAt: new Date('2025-01-15'), total: 100, paymentStatus: 'PAID' },
    ])
    const res = await request(makeApp(routes)).get('/sales?groupBy=week')
    expect(res.status).toBe(200)
  })

  it('GET /categories should return category breakdown', async () => {
    ;(prisma.menuCategory.findMany as jest.Mock).mockResolvedValue([
      { id: 'cat-1', name: 'مشروبات', nameAr: 'مشروبات', items: [{ id: 'item-1', orderItems: [{ quantity: 5, price: 10 }] }] },
    ])
    ;(prisma.menuItem.findMany as jest.Mock).mockResolvedValue([])
    const res = await request(makeApp(routes)).get('/categories')
    expect(res.status).toBe(200)
  })

  it('GET /categories with date range', async () => {
    ;(prisma.menuCategory.findMany as jest.Mock).mockResolvedValue([])
    const res = await request(makeApp(routes)).get('/categories?from=2025-01-01&to=2025-01-31')
    expect(res.status).toBe(200)
  })

  it('GET /employees should return employee report', async () => {
    ;(prisma.user.findMany as jest.Mock).mockResolvedValue([
      { id: 'emp-1', name: 'Waiter', orders: [{ total: 100 }] },
    ])
    const res = await request(makeApp(routes)).get('/employees')
    expect(res.status).toBe(200)
  })

  it('GET /items-performance should return item stats', async () => {
    ;(prisma.orderItem.findMany as jest.Mock).mockResolvedValue([
      { id: 'oi-1', menuItemId: 'item-1', quantity: 2, price: 50, menuItem: { id: 'item-1', name: 'Kabsa', nameAr: 'كبسة', price: 50 }, order: { createdAt: new Date() } },
    ])
    const res = await request(makeApp(routes)).get('/items-performance')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].quantity).toBe(2)
  })

  it('GET /items-performance with date range', async () => {
    ;(prisma.orderItem.findMany as jest.Mock).mockResolvedValue([])
    const res = await request(makeApp(routes)).get('/items-performance?from=2025-01-01&to=2025-01-31')
    expect(res.status).toBe(200)
  })

  it('GET /peak-hours should return hourly stats', async () => {
    ;(prisma.order.findMany as jest.Mock).mockResolvedValue([
      { id: 'o-1', createdAt: new Date(), total: 100 },
    ])
    const res = await request(makeApp(routes)).get('/peak-hours')
    expect(res.status).toBe(200)
  })

  it('GET /peak-hours with date range', async () => {
    ;(prisma.order.findMany as jest.Mock).mockResolvedValue([])
    const res = await request(makeApp(routes)).get('/peak-hours?from=2025-01-01&to=2025-01-31')
    expect(res.status).toBe(200)
  })

  it('GET /payment-methods should return method breakdown', async () => {
    ;(prisma.order.findMany as jest.Mock).mockResolvedValue([
      { id: 'o-1', paymentMethod: 'CASH', paymentStatus: 'PAID', total: 100 },
    ])
    ;(prisma.payment.findMany as jest.Mock).mockResolvedValue([])
    const res = await request(makeApp(routes)).get('/payment-methods')
    expect(res.status).toBe(200)
  })
})

// ─── backups ───
describe('Backups Route', () => {
  let routes: any
  beforeAll(async () => { routes = (await import('../routes/backups')).default })

  it('GET / should return backup list', async () => {
    ;(prisma.backupLog.findMany as jest.Mock).mockResolvedValue([])
    ;(fs.readdirSync as jest.Mock).mockReturnValue([])
    const res = await request(makeApp(routes)).get('/')
    expect(res.status).toBe(200)
  })

  it('GET / should filter non-db files and format sizes', async () => {
    ;(prisma.backupLog.findMany as jest.Mock).mockResolvedValue([])
    ;(fs.readdirSync as jest.Mock).mockReturnValue(['backup.db', 'readme.txt', 'large.sqlite', 'huge.db'])
    ;(fs.statSync as jest.Mock).mockImplementation((p: string) => {
      if (p.includes('huge.db')) return { size: 5242880, mtime: new Date('2025-01-03') }
      if (p.includes('large.sqlite')) return { size: 204800, mtime: new Date('2025-01-02') }
      if (p.includes('backup.db')) return { size: 500, mtime: new Date('2025-01-01') }
      return { size: 0, mtime: new Date() }
    })
    const res = await request(makeApp(routes)).get('/')
    expect(res.status).toBe(200)
    expect(res.body.files).toHaveLength(3)
    expect(res.body.files[0].fileSizeFormatted).toBe('5.0 MB')
    expect(res.body.files[1].fileSizeFormatted).toBe('200.0 KB')
    expect(res.body.files[2].fileSizeFormatted).toBe('500 B')
  })

  it('POST / should create SQLite backup', async () => {
    ;(fs.existsSync as jest.Mock).mockReturnValue(true)
    ;(fs.copyFileSync as jest.Mock).mockImplementation(() => {})
    ;(fs.statSync as jest.Mock).mockReturnValue({ size: 1024 })
    ;(prisma.backupLog.create as jest.Mock).mockResolvedValue({})
    const res = await request(makeApp(routes)).post('/')
    expect(res.status).toBe(200)
  })

  it('POST / should create Postgres backup via pg_dump', async () => {
    const origDbUrl = process.env.DATABASE_URL
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb'
    ;(fs.existsSync as jest.Mock).mockReturnValue(true)
    ;(fs.statSync as jest.Mock).mockReturnValue({ size: 2048 })
    ;(prisma.backupLog.create as jest.Mock).mockResolvedValue({})
    const childProcess = require('child_process')
    childProcess.exec.mockImplementation((cmd: string, opts: any, cb: any) => {
      cb(null, 'pg_dump success', '')
    })

    const res = await request(makeApp(routes)).post('/')

    expect(res.status).toBe(200)
    process.env.DATABASE_URL = origDbUrl
  })

  it('POST / should handle Postgres backup pg_dump error', async () => {
    const origDbUrl = process.env.DATABASE_URL
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb'
    ;(fs.existsSync as jest.Mock).mockReturnValue(true)
    ;(prisma.backupLog.create as jest.Mock).mockResolvedValue({})
    const childProcess = require('child_process')
    childProcess.exec.mockImplementation((cmd: string, opts: any, cb: any) => {
      cb(new Error('pg_dump failed'), '', '')
    })

    const res = await request(makeApp(routes)).post('/')

    expect(res.status).toBe(500)
    process.env.DATABASE_URL = origDbUrl
  })

  it('POST /restore should restore backup', async () => {
    ;(fs.existsSync as jest.Mock).mockReturnValue(true)
    ;(fs.copyFileSync as jest.Mock).mockImplementation(() => {})
    ;(prisma.backupLog.create as jest.Mock).mockResolvedValue({})
    const res = await request(makeApp(routes)).post('/restore').send({ fileName: 'test.db' })
    expect(res.status).toBe(200)
  })

  it('POST /restore should 404 for missing file', async () => {
    ;(fs.existsSync as jest.Mock).mockReturnValue(false)
    const res = await request(makeApp(routes)).post('/restore').send({ fileName: 'missing.db' })
    expect(res.status).toBe(404)
  })

  it('GET /settings should return settings', async () => {
    ;(prisma.business.findUnique as jest.Mock).mockResolvedValue({ id: 'biz-1' })
    const res = await request(makeApp(routes)).get('/settings')
    expect(res.status).toBe(200)
  })

  it('GET /settings should 404 for missing business', async () => {
    ;(prisma.business.findUnique as jest.Mock).mockResolvedValue(null)
    const res = await request(makeApp(routes)).get('/settings')
    expect(res.status).toBe(404)
  })
})
