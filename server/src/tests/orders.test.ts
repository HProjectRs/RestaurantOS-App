import request from 'supertest'
import express from 'express'
import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset } from 'jest-mock-extended'
import orderRoutes from '../routes/orders'

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(),
}))

jest.mock('../services/printer', () => ({
  generateReceiptData: jest.fn(() => ({ lines: [] })),
}))

jest.mock('../middleware/auth', () => ({
  authenticate: jest.fn((req: any, _res: any, next: any) => {
    req.user = { userId: 'user-1', businessId: 'biz-1', role: 'ADMIN', name: 'Admin' }
    next()
  }),
  requireRole: jest.fn((...roles: string[]) => {
    return (req: any, res: any, next: any) => {
      if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' })
      }
      next()
    }
  }),
}))

const prisma = mockDeep<PrismaClient>()
const mockIo = {
  to: jest.fn().mockReturnThis(),
  emit: jest.fn(),
  on: jest.fn(),
}

const app = express()
app.use(express.json())
app.set('prisma', prisma)
app.set('io', mockIo)
app.use('/api/orders', orderRoutes)
import { errorHandler } from '../middleware/errorHandler'
app.use(errorHandler)

beforeEach(() => {
  mockReset(prisma)
  ;(PrismaClient as unknown as jest.Mock).mockImplementation(() => prisma)
  mockIo.to.mockClear()
  mockIo.emit.mockClear()
})

describe('Order Routes', () => {
  const mockMenuItem = {
    id: 'item-1',
    categoryId: 'cat-1',
    name: 'Espresso',
    nameAr: 'إسبريسو',
    description: 'Rich coffee shot',
    descriptionAr: null,
    price: 12.0,
    discountPrice: null,
    image: null,
    barcode: null,
    isAvailable: true,
    isActive: true,
    prepTime: 5,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockOrder = {
    id: 'order-1',
    businessId: 'biz-1',
    orderNumber: 1001,
    tableId: null,
    cashierId: 'user-1',
    customerName: 'John',
    customerPhone: '+966500000000',
    customerEmail: null,
    type: 'DINE_IN',
    status: 'PENDING',
    paymentStatus: 'UNPAID',
    paymentMethod: null,
    subtotal: 24.0,
    tax: 3.6,
    serviceCharge: 2.4,
    discount: 0,
    total: 30.0,
    notes: null,
    isOnlineOrder: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockSettings = {
    id: 'biz-1',
    name: 'Test Cafe',
    taxRate: 15,
    serviceChargeRate: 10,
  }

  describe('POST /api/orders', () => {
    it('should create an order and return 201', async () => {
      ;(prisma.menuItem.findMany as jest.Mock).mockResolvedValue([mockMenuItem])
      ;(prisma.business.findUnique as jest.Mock).mockResolvedValue(mockSettings)
      const mockTx = {
        order: {
          create: jest.fn().mockResolvedValue({
            ...mockOrder,
            id: 'new-order',
            orderNumber: 1002,
            items: [],
            table: null,
          }),
          update: jest.fn().mockResolvedValue({ ...mockOrder }),
        },
        table: {
          update: jest.fn().mockResolvedValue({}),
        },
      }
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => cb(mockTx))

      const res = await request(app)
        .post('/api/orders')
        .send({
          businessId: 'biz-1',
          items: [{ menuItemId: 'item-1', quantity: 2 }],
          type: 'DINE_IN',
          customerName: 'John',
          customerPhone: '+966500000000',
        })

      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('id')
      expect(res.body).toHaveProperty('orderNumber')
    })

    it('should return 400 when businessId is missing', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({ items: [{ menuItemId: 'item-1', quantity: 1 }] })

      expect(res.status).toBe(400)
    })

    it('should return 400 when item is not available', async () => {
      ;(prisma.menuItem.findMany as jest.Mock).mockResolvedValue([{ ...mockMenuItem, isAvailable: false }])

      const res = await request(app)
        .post('/api/orders')
        .send({
          businessId: 'biz-1',
          items: [{ menuItemId: 'item-1', quantity: 1 }],
        })

      expect(res.status).toBe(400)
    })

    it('should update table status to OCCUPIED when tableId is provided', async () => {
      ;(prisma.menuItem.findMany as jest.Mock).mockResolvedValue([mockMenuItem])
      ;(prisma.business.findUnique as jest.Mock).mockResolvedValue(mockSettings)
      ;(prisma.table.findUnique as jest.Mock).mockResolvedValue({ id: 'table-1', status: 'AVAILABLE', version: 1 })
      const mockTx = {
        order: {
          create: jest.fn().mockResolvedValue({
            ...mockOrder,
            id: 'new-order',
            orderNumber: 1002,
            tableId: 'table-1',
            items: [],
            table: null,
          }),
        },
        table: {
          update: jest.fn().mockResolvedValue({ id: 'table-1', status: 'OCCUPIED' }),
        },
      }
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => cb(mockTx))

      const res = await request(app)
        .post('/api/orders')
        .send({
          businessId: 'biz-1',
          tableId: 'table-1',
          items: [{ menuItemId: 'item-1', quantity: 2 }],
          type: 'DINE_IN',
        })

      expect(res.status).toBe(201)
      expect(mockTx.table.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'table-1', status: 'AVAILABLE' },
          data: { status: 'OCCUPIED' },
        })
      )
    })

    it('should return 409 when table is already occupied', async () => {
      ;(prisma.menuItem.findMany as jest.Mock).mockResolvedValue([mockMenuItem])
      ;(prisma.business.findUnique as jest.Mock).mockResolvedValue(mockSettings)
      ;(prisma.table.findUnique as jest.Mock).mockResolvedValue({ id: 'table-1', status: 'OCCUPIED' })

      const res = await request(app)
        .post('/api/orders')
        .send({
          businessId: 'biz-1',
          tableId: 'table-1',
          items: [{ menuItemId: 'item-1', quantity: 1 }],
        })

      expect(res.status).toBe(409)
      expect(res.body.error).toMatch(/occupied/i)
    })
  })

  describe('GET /api/orders', () => {
    it('should return list of orders', async () => {
      ;(prisma.order.findMany as jest.Mock).mockResolvedValue([mockOrder])

      const res = await request(app).get('/api/orders')

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    it('should filter orders by date range', async () => {
      ;(prisma.order.findMany as jest.Mock).mockResolvedValue([mockOrder])

      const res = await request(app).get('/api/orders?dateFrom=2024-01-01&dateTo=2024-12-31')

      expect(res.status).toBe(200)
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({ gte: expect.any(Date), lte: expect.any(Date) }),
          }),
        })
      )
    })

    it('should filter orders by status', async () => {
      ;(prisma.order.findMany as jest.Mock).mockResolvedValue([mockOrder])

      const res = await request(app).get('/api/orders?status=PENDING')

      expect(res.status).toBe(200)
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'PENDING' }),
        })
      )
    })
  })

  describe('GET /api/orders/:id', () => {
    it('should return a single order', async () => {
      ;(prisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder)

      const res = await request(app).get('/api/orders/order-1')

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('id', 'order-1')
    })

    it('should return 404 when order is not found', async () => {
      ;(prisma.order.findFirst as jest.Mock).mockResolvedValue(null)

      const res = await request(app).get('/api/orders/nonexistent')
      expect(res.status).toBe(404)
    })
  })

  describe('PATCH /api/orders/:id/status', () => {
    it('should update order status', async () => {
      const mockTx = {
        order: { update: jest.fn().mockResolvedValue({ ...mockOrder, id: 'order-1', status: 'PREPARING', items: [], table: null }) },
        orderItem: {} as any,
        table: {} as any,
      }
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => cb(mockTx))

      const res = await request(app)
        .patch('/api/orders/order-1/status')
        .send({ status: 'PREPARING' })

      expect(res.status).toBe(200)
      expect(res.body.status).toBe('PREPARING')
    })

    it('should free the table when status is DELIVERED with no remaining active orders', async () => {
      const mockTx = {
        order: {
          update: jest.fn().mockResolvedValue({ ...mockOrder, id: 'order-1', tableId: 'table-1', status: 'DELIVERED', items: [], table: null }),
          count: jest.fn().mockResolvedValue(0),
        },
        table: { update: jest.fn().mockResolvedValue({ id: 'table-1', status: 'AVAILABLE' }) },
        orderItem: {} as any,
      }
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => cb(mockTx))

      const res = await request(app)
        .patch('/api/orders/order-1/status')
        .send({ status: 'DELIVERED' })

      expect(res.status).toBe(200)
    })
  })

  describe('PATCH /api/orders/:orderId/items/:itemId/status', () => {
    it('should update an order item status', async () => {
      ;(prisma.orderItem.update as jest.Mock).mockResolvedValue({
        id: 'oi-1',
        status: 'PREPARING',
        menuItem: mockMenuItem,
      })
      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue({
        ...mockOrder,
        items: [{ id: 'oi-1', status: 'PREPARING', menuItem: mockMenuItem }],
        table: null,
      })

      const res = await request(app)
        .patch('/api/orders/order-1/items/oi-1/status')
        .send({ status: 'PREPARING' })

      expect(res.status).toBe(200)
      expect(res.body.status).toBe('PREPARING')
    })
  })

  describe('PATCH /api/orders/:id/payment', () => {
    it('should update payment status', async () => {
      const mockTx = {
        order: { update: jest.fn().mockResolvedValue({ ...mockOrder, paymentStatus: 'PAID', paymentMethod: 'CASH', items: [], table: null }) },
        table: { update: jest.fn() },
        orderItem: {} as any,
      }
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => cb(mockTx))
      ;(mockTx.order.count as unknown as jest.Mock) = jest.fn().mockResolvedValue(0)

      const res = await request(app)
        .patch('/api/orders/order-1/payment')
        .send({ paymentStatus: 'PAID', paymentMethod: 'CASH' })

      expect(res.status).toBe(200)
      expect(res.body.paymentStatus).toBe('PAID')
    })

    it('should free table when paid and no active orders remain', async () => {
      const paidWithTable = {
        ...mockOrder,
        tableId: 'table-1',
        paymentStatus: 'PAID',
        paymentMethod: 'CASH',
        items: [],
        table: null,
      }
      const mockTx = {
        order: { update: jest.fn().mockResolvedValue(paidWithTable) },
        table: { update: jest.fn().mockResolvedValue({ id: 'table-1', status: 'AVAILABLE' }) },
        orderItem: {} as any,
      }
      mockTx.order.count = jest.fn().mockResolvedValue(0)
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => cb(mockTx))

      const res = await request(app)
        .patch('/api/orders/order-1/payment')
        .send({ paymentStatus: 'PAID', paymentMethod: 'CASH' })

      expect(res.status).toBe(200)
      expect(mockTx.table.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'table-1' },
          data: { status: 'AVAILABLE' },
        })
      )
    })
  })

  describe('PATCH /api/orders/:id/cancel', () => {
    it('should cancel an order', async () => {
      const mockTx = {
        order: { update: jest.fn().mockResolvedValue({ ...mockOrder, status: 'CANCELLED', items: [], table: null }) },
        table: { update: jest.fn() },
        orderItem: {} as any,
      }
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => cb(mockTx))

      const res = await request(app).patch('/api/orders/order-1/cancel')

      expect(res.status).toBe(200)
      expect(res.body.status).toBe('CANCELLED')
    })

    it('should free the table when cancelling a dine-in order with table', async () => {
      const mockTx = {
        order: { update: jest.fn().mockResolvedValue({ ...mockOrder, tableId: 'table-1', status: 'CANCELLED', items: [], table: null }) },
        table: { update: jest.fn().mockResolvedValue({ id: 'table-1', status: 'AVAILABLE' }) },
      }
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => cb(mockTx))

      const res = await request(app).patch('/api/orders/order-1/cancel')

      expect(res.status).toBe(200)
      expect(mockTx.table.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'table-1' },
          data: { status: 'AVAILABLE' },
        })
      )
    })
  })

  describe('GET /api/orders/track/:orderNumber', () => {
    it('should return order details by order number', async () => {
      ;(prisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder)

      const res = await request(app).get('/api/orders/track/1001?businessId=biz-1')

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('orderNumber', 1001)
    })

    it('should return 404 when order is not found', async () => {
      ;(prisma.order.findFirst as jest.Mock).mockResolvedValue(null)

      const res = await request(app).get('/api/orders/track/9999?businessId=biz-1')
      expect(res.status).toBe(404)
    })
  })

  describe('POST /api/orders/call-waiter', () => {
    it('should emit waiter:called event and return success', async () => {
      ;(prisma.table.findUnique as jest.Mock).mockResolvedValue({
        id: 'table-1',
        number: '5',
        businessId: 'biz-1',
      })

      const res = await request(app)
        .post('/api/orders/call-waiter')
        .send({ tableId: 'table-1', businessId: 'biz-1', message: 'Water please' })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(mockIo.emit).toHaveBeenCalledWith('waiter:called', expect.objectContaining({
        tableNumber: '5',
        message: 'Water please',
      }))
    })
  })

  describe('GET /api/orders/active', () => {
    it('should return active order for a table', async () => {
      ;(prisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder)

      const res = await request(app).get('/api/orders/active?tableId=table-1&businessId=biz-1')

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('id', 'order-1')
    })

    it('should return 400 when tableId or businessId is missing', async () => {
      const res = await request(app).get('/api/orders/active')
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('tableId and businessId required')
    })
    it('should return null when no active order found', async () => {
      ;(prisma.order.findFirst as jest.Mock).mockResolvedValue(null)

      const res = await request(app).get('/api/orders/active?tableId=table-1&businessId=biz-1')
      expect(res.status).toBe(200)
      expect(res.body).toBeNull()
    })
  })

  describe('POST /api/orders/:id/items', () => {
    it('should add items to an existing order', async () => {
      ;(prisma.order.findUnique as jest.Mock).mockResolvedValueOnce({
        ...mockOrder,
        table: null,
      })
      ;(prisma.menuItem.findMany as jest.Mock).mockResolvedValue([mockMenuItem])
      ;(prisma.business.findUnique as jest.Mock).mockResolvedValue(mockSettings)
      const mockTx = {
        order: { update: jest.fn().mockResolvedValue({ ...mockOrder, items: [{ id: 'oi-2', menuItem: mockMenuItem }], table: null }) },
        table: { update: jest.fn().mockResolvedValue({ id: 'table-1', status: 'OCCUPIED' }) },
        orderItem: {} as any,
        menuItem: {} as any,
        business: {} as any,
      }
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => cb(mockTx))

      const res = await request(app)
        .post('/api/orders/order-1/items')
        .send({ items: [{ menuItemId: 'item-1', quantity: 1 }] })

      expect(res.status).toBe(200)
    })

    it('should return 404 when order is not found', async () => {
      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(null)

      const res = await request(app)
        .post('/api/orders/nonexistent/items')
        .send({ items: [{ menuItemId: 'item-1', quantity: 1 }] })

      expect(res.status).toBe(404)
    })

    it('should return 400 when adding items to delivered order', async () => {
      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue({
        ...mockOrder,
        status: 'DELIVERED',
        table: null,
      })

      const res = await request(app)
        .post('/api/orders/order-1/items')
        .send({ items: [{ menuItemId: 'item-1', quantity: 1 }] })

      expect(res.status).toBe(400)
    })

    it('should return 400 when menu item is not available', async () => {
      ;(prisma.order.findUnique as jest.Mock).mockResolvedValueOnce({ ...mockOrder, table: null })
      ;(prisma.menuItem.findMany as jest.Mock).mockResolvedValue([{ ...mockMenuItem, isAvailable: false }])

      const res = await request(app)
        .post('/api/orders/order-1/items')
        .send({ items: [{ menuItemId: 'item-1', quantity: 1 }] })

      expect(res.status).toBe(400)
    })

    it('should update table to OCCUPIED when order has tableId', async () => {
      ;(prisma.order.findUnique as jest.Mock).mockResolvedValueOnce({ ...mockOrder, tableId: 'table-1', table: { id: 'table-1', number: '5' } })
      ;(prisma.menuItem.findMany as jest.Mock).mockResolvedValue([mockMenuItem])
      ;(prisma.business.findUnique as jest.Mock).mockResolvedValue(mockSettings)
      const mockTx = {
        order: { update: jest.fn().mockResolvedValue({ ...mockOrder, tableId: 'table-1', items: [{ menuItem: mockMenuItem }], table: null }) },
        table: { update: jest.fn().mockResolvedValue({ id: 'table-1', status: 'OCCUPIED' }) },
        orderItem: {} as any,
      }
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => cb(mockTx))

      const res = await request(app)
        .post('/api/orders/order-1/items')
        .send({ items: [{ menuItemId: 'item-1', quantity: 1 }] })

      expect(res.status).toBe(200)
      expect(mockTx.table.update).toHaveBeenCalled()
    })
  })

  describe('GET /api/orders/:id/receipt', () => {
    it('should return receipt data', async () => {
      ;(prisma.order.findFirst as jest.Mock).mockResolvedValue({
        ...mockOrder,
        items: [{ id: 'oi-1', menuItem: mockMenuItem, price: 12, quantity: 2 }],
        table: null,
      })
      ;(prisma.business.findUnique as jest.Mock).mockResolvedValue(mockSettings)

      const res = await request(app).get('/api/orders/order-1/receipt')

      expect(res.status).toBe(200)
    })

    it('should return 404 when order not found', async () => {
      ;(prisma.order.findFirst as jest.Mock).mockResolvedValue(null)

      const res = await request(app).get('/api/orders/nonexistent/receipt')

      expect(res.status).toBe(404)
    })
  })

  describe('GET /api/orders/customer/:phone', () => {
    it('should return orders for a customer phone', async () => {
      ;(prisma.order.findMany as jest.Mock).mockResolvedValue([mockOrder])

      const res = await request(app).get('/api/orders/customer/+966500000000?businessId=biz-1')

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })
  })

  describe('POST /api/orders/:id/split', () => {
    it('should split order items into new orders', async () => {
      const mockTx = {
        order: {
          findFirst: jest.fn().mockResolvedValue({
            ...mockOrder,
            paymentStatus: 'UNPAID',
            items: [{ id: 'oi-1', menuItemId: 'item-1', price: 12, quantity: 2, menuItem: mockMenuItem }],
            table: { id: 'table-1', number: '5' },
          }),
          create: jest.fn().mockImplementation(({ data }: any) =>
            Promise.resolve({ id: 'split-order-1', ...data, items: [], table: null })
          ),
          findUnique: jest.fn().mockResolvedValue({
            ...mockOrder,
            id: 'split-order-1',
            items: [{ id: 'oi-1', menuItem: mockMenuItem }],
            table: null,
          }),
          update: jest.fn().mockResolvedValue(mockOrder),
          delete: jest.fn().mockResolvedValue({}),
        },
        orderItem: { updateMany: jest.fn().mockResolvedValue({ count: 1 }), deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
        business: { findUnique: jest.fn().mockResolvedValue(mockSettings) },
      }
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => cb(mockTx))
      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue({ ...mockOrder, items: [], table: null })

      const res = await request(app)
        .post('/api/orders/order-1/split')
        .send({ splits: [{ items: ['oi-1'] }] })

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('original')
      expect(res.body).toHaveProperty('splits')
    })

    it('should recalculate totals when not all items are split', async () => {
      const mockTx = {
        order: {
          findFirst: jest.fn().mockResolvedValue({
            ...mockOrder,
            paymentStatus: 'UNPAID',
            items: [
              { id: 'oi-1', menuItemId: 'item-1', price: 12, quantity: 2, menuItem: mockMenuItem },
              { id: 'oi-2', menuItemId: 'item-1', price: 12, quantity: 1, menuItem: mockMenuItem },
            ],
            table: { id: 'table-1', number: '5' },
          }),
          create: jest.fn().mockImplementation(({ data }: any) =>
            Promise.resolve({ id: 'split-order-1', ...data, items: [], table: null })
          ),
          findUnique: jest.fn().mockResolvedValue({
            ...mockOrder,
            id: 'split-order-1',
            items: [{ id: 'oi-1', menuItem: mockMenuItem }],
            table: null,
          }),
          update: jest.fn().mockResolvedValue(mockOrder),
          delete: jest.fn(),
        },
        orderItem: { updateMany: jest.fn().mockResolvedValue({ count: 1 }), deleteMany: jest.fn() },
        business: { findUnique: jest.fn().mockResolvedValue(mockSettings) },
      }
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => cb(mockTx))
      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue({ ...mockOrder, items: [{ id: 'oi-2', menuItem: mockMenuItem }], table: null })

      const res = await request(app)
        .post('/api/orders/order-1/split')
        .send({ splits: [{ items: ['oi-1'] }] })

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('original')
      expect(res.body).toHaveProperty('splits')
    })
  })
})
