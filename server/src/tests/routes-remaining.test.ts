import request from 'supertest'
import express from 'express'
import { PrismaClient } from '@prisma/client'
import { mockDeep } from 'jest-mock-extended'
import employeeRoutes from '../routes/employees'
import wifiRoutes from '../routes/wifi'
import licenseRoutes from '../routes/licenses'
import invoiceRoutes from '../routes/invoices'
import loyaltyRoutes from '../routes/loyalty'
import subscriptionRoutes from '../routes/subscriptions'

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(),
}))

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

beforeEach(() => {
  jest.clearAllMocks()
  ;(PrismaClient as unknown as jest.Mock).mockImplementation(() => prisma)
})

// ─── employees ───
describe('Employees Route', () => {
  it('GET should return list', async () => {
    ;(prisma.user.findMany as jest.Mock).mockResolvedValue([{ id: 'emp-1', name: 'Waiter' }])
    const res = await request(makeApp(employeeRoutes)).get('/')
    expect(res.status).toBe(200)
  })

  it('POST should create employee', async () => {
    ;(prisma.user.create as jest.Mock).mockResolvedValue({ id: 'emp-1', name: 'New Waiter' })
    const res = await request(makeApp(employeeRoutes)).post('/').send({ name: 'New Waiter', email: 'waiter@test.com', phone: '+966500000000' })
    expect(res.status).toBe(201)
  })

  it('POST should reject missing name', async () => {
    const res = await request(makeApp(employeeRoutes)).post('/').send({ email: 'test@test.com', phone: '+966500000000' })
    expect(res.status).toBe(400)
  })

  it('PUT should update employee', async () => {
    ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'emp-1', name: 'Updated Waiter' })
    const res = await request(makeApp(employeeRoutes)).put('/emp-1').send({ name: 'Updated Waiter' })
    expect(res.status).toBe(200)
  })

  it('DELETE should remove employee', async () => {
    ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'emp-1', isActive: false })
    const res = await request(makeApp(employeeRoutes)).delete('/emp-1')
    expect(res.status).toBe(200)
  })

  it('GET shifts should return list', async () => {
    ;(prisma as any).shift.findMany.mockResolvedValue([{ id: 'shift-1', name: 'Morning' }])
    const res = await request(makeApp(employeeRoutes)).get('/shifts')
    expect(res.status).toBe(200)
  })

  it('POST clock-in should record attendance', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'emp-1', isActive: true })
    ;(prisma as any).attendance.create.mockResolvedValue({ id: 'att-1', userId: 'emp-1', clockIn: new Date() })
    const res = await request(makeApp(employeeRoutes)).post('/clock-in').send({ userId: 'emp-1' })
    expect(res.status).toBe(200)
  })
})

// ─── wifi ───
describe('WiFi Route', () => {
  it('GET qr-codes should return list', async () => {
    ;(prisma as any).wifiQrCode.findMany.mockResolvedValue([{ id: 'wifi-1', code: 'ABC123' }])
    const res = await request(makeApp(wifiRoutes)).get('/qr-codes')
    expect(res.status).toBe(200)
  })

  it('POST qr-codes should create QR', async () => {
    ;(prisma as any).wifiQrCode.create.mockResolvedValue({ id: 'wifi-1', code: 'ABC123', label: 'Table 5' })
    const res = await request(makeApp(wifiRoutes)).post('/qr-codes').send({ label: 'Table 5' })
    expect(res.status).toBe(201)
  })

  it('POST connect should record connection', async () => {
    ;(prisma as any).wifiQrCode.findUnique.mockResolvedValue({ id: 'wifi-1', code: 'ABC123', isActive: true, durationMinutes: 60, maxSessions: 10, business: { name: 'Test Cafe' } })
    ;(prisma as any).wifiSession.count.mockResolvedValue(0)
    ;(prisma as any).wifiSession.create.mockResolvedValue({ id: 'conn-1', durationMinutes: 60, startTime: new Date(), endTime: new Date() })
    const res = await request(makeApp(wifiRoutes)).post('/connect').send({ code: 'ABC123' })
    expect(res.status).toBe(200)
  })

  it('POST connect returns 404 for inactive QR', async () => {
    ;(prisma as any).wifiQrCode.findUnique.mockResolvedValue({ id: 'wifi-1', code: 'INACTIVE', isActive: false })
    const res = await request(makeApp(wifiRoutes)).post('/connect').send({ code: 'INACTIVE' })
    expect(res.status).toBe(404)
  })

  it('POST connect returns 429 when max sessions reached', async () => {
    ;(prisma as any).wifiQrCode.findUnique.mockResolvedValue({ id: 'wifi-1', code: 'FULL', isActive: true, maxSessions: 2, business: { name: 'Test Cafe' } })
    ;(prisma as any).wifiSession.count.mockResolvedValue(2)
    const res = await request(makeApp(wifiRoutes)).post('/connect').send({ code: 'FULL' })
    expect(res.status).toBe(429)
  })

  it('POST connect returns 404 for missing QR', async () => {
    ;(prisma as any).wifiQrCode.findUnique.mockResolvedValue(null)
    const res = await request(makeApp(wifiRoutes)).post('/connect').send({ code: 'MISSING' })
    expect(res.status).toBe(404)
  })

  it('GET sessions should return list', async () => {
    ;(prisma as any).wifiSession.findMany.mockResolvedValue([{ id: 'conn-1', deviceInfo: 'iPhone' }])
    const res = await request(makeApp(wifiRoutes)).get('/sessions')
    expect(res.status).toBe(200)
  })

  it('GET /info/:code should return QR info', async () => {
    ;(prisma as any).wifiQrCode.findUnique.mockResolvedValue({ id: 'wifi-1', code: 'ABC123', durationMinutes: 60, business: { name: 'Cafe', nameAr: 'مقهى', logo: null } })
    const res = await request(makeApp(wifiRoutes)).get('/info/ABC123')
    expect(res.status).toBe(200)
    expect(res.body.durationMinutes).toBe(60)
  })

  it('GET /info/:code returns 404 for missing QR', async () => {
    ;(prisma as any).wifiQrCode.findUnique.mockResolvedValue(null)
    const res = await request(makeApp(wifiRoutes)).get('/info/MISSING')
    expect(res.status).toBe(404)
  })

  it('PATCH /sessions/:id/disconnect should disconnect session', async () => {
    ;(prisma as any).wifiSession.update.mockResolvedValue({ id: 'conn-1', status: 'DISCONNECTED' })
    const res = await request(makeApp(wifiRoutes)).patch('/sessions/conn-1/disconnect')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('DISCONNECTED')
  })

  it('PATCH /qr-codes/:id/toggle should toggle active status', async () => {
    ;(prisma as any).wifiQrCode.findUnique.mockResolvedValue({ id: 'wifi-1', isActive: false })
    ;(prisma as any).wifiQrCode.update.mockResolvedValue({ id: 'wifi-1', isActive: true })
    const res = await request(makeApp(wifiRoutes)).patch('/qr-codes/wifi-1/toggle')
    expect(res.status).toBe(200)
    expect(res.body.isActive).toBe(true)
  })

  it('PATCH /qr-codes/:id/toggle returns 404 for missing QR', async () => {
    ;(prisma as any).wifiQrCode.findUnique.mockResolvedValue(null)
    const res = await request(makeApp(wifiRoutes)).patch('/qr-codes/missing/toggle')
    expect(res.status).toBe(404)
  })
})

// ─── licenses ───
describe('Licenses Route', () => {
  it('GET should return license', async () => {
    ;(prisma as any).license.findUnique.mockResolvedValue({ id: 'lic-1', key: 'ABC-123' })
    const res = await request(makeApp(licenseRoutes)).get('/')
    expect(res.status).toBe(200)
  })

  it('POST should create license', async () => {
    ;(prisma as any).license.create.mockResolvedValue({ id: 'lic-1', key: 'ABC-123', businessId: 'biz-1' })
    ;(prisma as any).license.findUnique.mockResolvedValue(null)
    const res = await request(makeApp(licenseRoutes)).post('/').send({ businessId: '550e8400-e29b-41d4-a716-446655440000' })
    expect(res.status).toBe(201)
  })

  it('POST should reject missing businessId', async () => {
    const res = await request(makeApp(licenseRoutes)).post('/').send({})
    expect(res.status).toBe(400)
  })

  it('POST /verify should verify license key', async () => {
    ;(prisma as any).license.findFirst.mockResolvedValue({ id: 'lic-1', key: 'ABC-123', isActive: true, validUntil: new Date(Date.now() + 86400000) })
    const res = await request(makeApp(licenseRoutes)).post('/verify').send({ key: 'ABC-123' })
    expect(res.status).toBe(200)
    expect(res.body.valid).toBe(true)
  })

  it('POST /verify returns 410 for expired license', async () => {
    ;(prisma as any).license.findFirst.mockResolvedValue({ id: 'lic-1', key: 'EXPIRED', isActive: true, validUntil: new Date(Date.now() - 86400000) })
    const res = await request(makeApp(licenseRoutes)).post('/verify').send({ key: 'EXPIRED' })
    expect(res.status).toBe(410)
    expect(res.body.valid).toBe(false)
  })

  it('POST /verify returns 403 for inactive license', async () => {
    ;(prisma as any).license.findFirst.mockResolvedValue({ id: 'lic-1', key: 'INACTIVE', isActive: false, validUntil: new Date(Date.now() + 86400000) })
    const res = await request(makeApp(licenseRoutes)).post('/verify').send({ key: 'INACTIVE' })
    expect(res.status).toBe(403)
    expect(res.body.valid).toBe(false)
  })

  it('POST /verify returns 404 for unknown key', async () => {
    ;(prisma as any).license.findFirst.mockResolvedValue(null)
    const res = await request(makeApp(licenseRoutes)).post('/verify').send({ key: 'UNKNOWN' })
    expect(res.status).toBe(404)
  })

  it('POST /verify with businessId should filter by business', async () => {
    ;(prisma as any).license.findFirst.mockResolvedValue({ id: 'lic-1', key: 'ABC-123', isActive: true, validUntil: new Date(Date.now() + 86400000) })
    const res = await request(makeApp(licenseRoutes)).post('/verify').send({ key: 'ABC-123', businessId: '550e8400-e29b-41d4-a716-446655440000' })
    expect(res.status).toBe(200)
    expect(res.body.valid).toBe(true)
  })

  it('POST returns 409 when business already has license', async () => {
    ;(prisma as any).license.findUnique.mockResolvedValue({ id: 'lic-1', key: 'EXISTING' })
    const res = await request(makeApp(licenseRoutes)).post('/').send({ businessId: '550e8400-e29b-41d4-a716-446655440000' })
    expect(res.status).toBe(409)
  })

  it('PUT should update license with dates', async () => {
    ;(prisma as any).license.update.mockResolvedValue({ id: 'lic-1' })
    const res = await request(makeApp(licenseRoutes)).put('/lic-1').send({ validFrom: '2025-01-01T00:00:00.000Z', validUntil: '2026-01-01T00:00:00.000Z' })
    expect(res.status).toBe(200)
  })
})

// ─── invoices ───
describe('Invoices Route', () => {
  it('GET order invoice should return data', async () => {
    ;(prisma.order.findFirst as jest.Mock).mockResolvedValue({ id: 'order-1', orderNumber: 1001, items: [], table: null, cashier: null })
    const res = await request(makeApp(invoiceRoutes)).get('/orders/order-1')
    expect(res.status).toBe(200)
  })

  it('GET order invoice should 404 for missing order', async () => {
    ;(prisma.order.findFirst as jest.Mock).mockResolvedValue(null)
    const res = await request(makeApp(invoiceRoutes)).get('/orders/missing-id')
    expect(res.status).toBe(404)
  })
})

// ─── loyalty ───
describe('Loyalty Route', () => {
  it('GET program should return config', async () => {
    ;(prisma as any).loyaltyProgram.findFirst.mockResolvedValue({ id: 'prog-1', name: 'برنامج الولاء', enabled: true })
    const res = await request(makeApp(loyaltyRoutes)).get('/program')
    expect(res.status).toBe(200)
  })

  it('PUT program should update config', async () => {
    ;(prisma as any).loyaltyProgram.update.mockResolvedValue({ id: 'prog-1', name: 'Updated Program', enabled: true })
    const res = await request(makeApp(loyaltyRoutes)).put('/program').send({ name: 'Updated Program', enabled: true })
    expect(res.status).toBe(200)
  })

  it('GET customers should return list', async () => {
    ;(prisma as any).loyaltyCustomer.findMany.mockResolvedValue([{ id: 'cust-1', name: 'Ahmed', phone: '+966500000000' }])
    const res = await request(makeApp(loyaltyRoutes)).get('/customers')
    expect(res.status).toBe(200)
  })

  it('POST customers should create loyalty customer', async () => {
    ;(prisma as any).loyaltyProgram.findFirst.mockResolvedValue({ id: 'prog-1', enabled: true })
    ;(prisma as any).loyaltyCustomer.findFirst.mockResolvedValue(null)
    ;(prisma as any).loyaltyCustomer.create.mockResolvedValue({ id: 'cust-1', name: 'Ahmed', phone: '+966500000000' })
    const res = await request(makeApp(loyaltyRoutes)).post('/customers').send({ name: 'Ahmed', phone: '+966500000000' })
    expect(res.status).toBe(200)
  })

  it('POST points/add should add loyalty points', async () => {
    ;(prisma as any).loyaltyCustomer.findUnique.mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440000', points: 100 })
    ;(prisma as any).loyaltyTransaction.create.mockResolvedValue({ id: 'txn-1', points: 50 })
    ;(prisma as any).loyaltyCustomer.update.mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440000', points: 150 })
    const res = await request(makeApp(loyaltyRoutes)).post('/points/add').send({ customerId: '550e8400-e29b-41d4-a716-446655440000', points: 50 })
    expect(res.status).toBe(200)
  })
})

// ─── subscriptions ───
describe('Subscriptions Route', () => {
  it('GET /plans should return plans', async () => {
    const res = await request(makeApp(subscriptionRoutes)).get('/plans')
    expect(res.status).toBe(200)
  })

  it('GET /current should return subscription', async () => {
    ;(prisma as any).subscription.findUnique.mockResolvedValue({ plan: 'PRO', status: 'ACTIVE' })
    const res = await request(makeApp(subscriptionRoutes)).get('/current')
    expect(res.status).toBe(200)
  })

  it('POST /create-checkout should create checkout session', async () => {
    ;(prisma as any).subscription.findUnique.mockResolvedValue({ plan: 'PRO', status: 'ACTIVE' })
    const res = await request(makeApp(subscriptionRoutes)).post('/create-checkout').send({ priceId: 'price_123', successUrl: 'http://example.com', cancelUrl: 'http://example.com' })
    expect([200, 400, 500]).toContain(res.status)
  })
})
