import request from 'supertest'
import express from 'express'
import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset } from 'jest-mock-extended'
import invoiceRoutes from '../routes/invoices'
import { errorHandler } from '../middleware/errorHandler'

jest.mock('@prisma/client', () => ({ PrismaClient: jest.fn() }))
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
app.use('/api/invoices', invoiceRoutes)
app.use(errorHandler)

beforeEach(() => {
  mockReset(prisma)
  ;(PrismaClient as unknown as jest.Mock).mockImplementation(() => prisma)
})

const mockOrder = {
  id: 'order-1',
  businessId: 'biz-1',
  orderNumber: 1001,
  type: 'DINE_IN',
  status: 'PAID',
  subtotal: 100,
  tax: 15,
  serviceCharge: 10,
  discount: 0,
  total: 125,
  paymentStatus: 'PAID',
  paymentMethod: 'CASH',
  createdAt: new Date(),
  cashier: { id: 'user-1', name: 'Admin' },
  table: { id: 'table-1', number: 'T1' },
  items: [{ id: 'item-1', menuItem: { name: 'Pasta', nameAr: 'باستا' }, quantity: 2, price: 50, selectedModifiers: { extra: 'cheese' } }],
}

describe('GET /api/invoices/orders/:id', () => {
  it('returns invoice data for an order', async () => {
    ;(prisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder)
    ;(prisma.business.findUnique as jest.Mock).mockResolvedValue({ name: 'My Restaurant', nameAr: 'مطعمي', logo: null })

    const res = await request(app).get('/api/invoices/orders/order-1')

    expect(res.status).toBe(200)
    expect(res.body.header.businessName).toBe('مطعمي')
    expect(res.body.order.number).toBe(1001)
    expect(res.body.items).toHaveLength(1)
    expect(res.body.summary.paid).toBe(125)
    expect(res.body.summary.due).toBe(0)
    expect(res.body.payment.method).toBe('CASH')
  })

  it('falls back to English name when Arabic name missing', async () => {
    ;(prisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder)
    ;(prisma.business.findUnique as jest.Mock).mockResolvedValue({ name: 'My Restaurant', nameAr: null, logo: null })

    const res = await request(app).get('/api/invoices/orders/order-1')

    expect(res.status).toBe(200)
    expect(res.body.header.businessName).toBe('My Restaurant')
  })

  it('returns empty business name when no business found', async () => {
    ;(prisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder)
    ;(prisma.business.findUnique as jest.Mock).mockResolvedValue(null)

    const res = await request(app).get('/api/invoices/orders/order-1')

    expect(res.status).toBe(200)
    expect(res.body.header.businessName).toBe('')
  })

  it('handles unpaid order without cashier', async () => {
    const unpaidOrder = { ...mockOrder, paymentStatus: 'UNPAID', paymentMethod: null, cashier: null }
    ;(prisma.order.findFirst as jest.Mock).mockResolvedValue(unpaidOrder)
    ;(prisma.business.findUnique as jest.Mock).mockResolvedValue({ name: 'My Restaurant', nameAr: null })

    const res = await request(app).get('/api/invoices/orders/order-1')

    expect(res.status).toBe(200)
    expect(res.body.summary.paid).toBe(0)
    expect(res.body.summary.due).toBe(125)
    expect(res.body.payment.method).toBeNull()
    expect(res.body.order.cashier).toBeNull()
  })

  it('handles order without table and cashier', async () => {
    const noTableOrder = { ...mockOrder, table: null, cashier: null }
    ;(prisma.order.findFirst as jest.Mock).mockResolvedValue(noTableOrder)
    ;(prisma.business.findUnique as jest.Mock).mockResolvedValue({ name: 'My Restaurant', nameAr: null })

    const res = await request(app).get('/api/invoices/orders/order-1')

    expect(res.status).toBe(200)
    expect(res.body.order.table).toBeNull()
    expect(res.body.order.cashier).toBeNull()
  })

  it('returns 404 when order not found', async () => {
    ;(prisma.order.findFirst as jest.Mock).mockResolvedValue(null)

    const res = await request(app).get('/api/invoices/orders/nonexistent')

    expect(res.status).toBe(404)
  })
})

describe('GET /api/invoices/orders/:id/print', () => {
  it('returns plain text receipt for paid order', async () => {
    ;(prisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder)
    ;(prisma.business.findUnique as jest.Mock).mockResolvedValue({ name: 'My Restaurant', nameAr: 'مطعمي', currency: 'SAR' })

    const res = await request(app).get('/api/invoices/orders/order-1/print')

    expect(res.status).toBe(200)
    expect(res.text).toContain('مطعمي')
    expect(res.text).toContain('فاتورة')
    expect(res.text).toContain('مدفوع')
  })

  it('uses DZD currency symbol for Algerian businesses', async () => {
    ;(prisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder)
    ;(prisma.business.findUnique as jest.Mock).mockResolvedValue({ name: 'Cafe', nameAr: null, currency: 'DZD' })

    const res = await request(app).get('/api/invoices/orders/order-1/print')

    expect(res.status).toBe(200)
    expect(res.text).toContain('د.ج')
  })

  it('uses default currency for non-DZD', async () => {
    ;(prisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder)
    ;(prisma.business.findUnique as jest.Mock).mockResolvedValue({ name: 'Cafe', nameAr: null, currency: 'USD' })

    const res = await request(app).get('/api/invoices/orders/order-1/print')

    expect(res.status).toBe(200)
    expect(res.text).toContain('DA')
  })

  it('shows unpaid status and includes table info', async () => {
    const order = { ...mockOrder, paymentStatus: 'UNPAID', table: { id: 't1', number: '5' } }
    ;(prisma.order.findFirst as jest.Mock).mockResolvedValue(order)
    ;(prisma.business.findUnique as jest.Mock).mockResolvedValue({ name: 'Test', nameAr: null, currency: 'USD' })

    const res = await request(app).get('/api/invoices/orders/order-1/print')

    expect(res.status).toBe(200)
    expect(res.text).toContain('غير مدفوع')
    expect(res.text).toContain('طاولة: 5')
  })

  it('includes service charge when > 0', async () => {
    const order = { ...mockOrder, serviceCharge: 15 }
    ;(prisma.order.findFirst as jest.Mock).mockResolvedValue(order)
    ;(prisma.business.findUnique as jest.Mock).mockResolvedValue({ name: 'Test', nameAr: null, currency: 'USD' })

    const res = await request(app).get('/api/invoices/orders/order-1/print')

    expect(res.status).toBe(200)
    expect(res.text).toContain('خدمة')
  })

  it('falls back to English business name when Arabic missing', async () => {
    ;(prisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder)
    ;(prisma.business.findUnique as jest.Mock).mockResolvedValue({ name: 'Restaurant', nameAr: undefined, currency: 'USD' })

    const res = await request(app).get('/api/invoices/orders/order-1/print')

    expect(res.status).toBe(200)
    expect(res.text).toContain('Restaurant')
  })

  it('returns 404 when order not found', async () => {
    ;(prisma.order.findFirst as jest.Mock).mockResolvedValue(null)

    const res = await request(app).get('/api/invoices/orders/nonexistent/print')

    expect(res.status).toBe(404)
  })
})
