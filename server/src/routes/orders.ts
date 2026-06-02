import { Router, Response } from 'express'
import { Prisma, PrismaClient } from '@prisma/client'
import { Server as SocketIOServer } from 'socket.io'
import { authenticate, requireRole } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { createOrderSchema, updateOrderStatusSchema, updatePaymentSchema, addItemsSchema, splitBillSchema, callWaiterSchema } from '../schemas'
import { AuthRequest } from '../types'
import { asyncHandler } from '../utils/asyncHandler'
import { NotFoundError, ValidationError } from '../errors'
import { OrderService } from '../services/orderService'

const router = Router()

function getService(req: AuthRequest) {
  return new OrderService(req.app.get('prisma'), req.app.get('io'))
}

router.post('/', validate(createOrderSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const businessId = req.user?.businessId || req.body.businessId
    if (!businessId) return res.status(400).json({ error: 'businessId required' })

    const order = await getService(req).createOrder({
      businessId,
      items: req.body.items,
      tableId: req.body.tableId,
      customerName: req.body.customerName,
      customerPhone: req.body.customerPhone,
      type: req.body.type,
      notes: req.body.notes,
      cashierId: req.user?.userId || null,
      isOnlineOrder: !req.user,
    })

    res.status(201).json(order)
}))

router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const prisma: PrismaClient = req.app.get('prisma')
    const { status, type, dateFrom, dateTo, limit } = req.query

    const where: any = { businessId: req.user!.businessId }
    if (status) {
      const statuses = (status as string).split(',').map(s => s.trim()).filter(Boolean)
      where.status = statuses.length > 1 ? { in: statuses } : statuses[0]
    }
    if (type) where.type = type as string
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom as string)
      if (dateTo) where.createdAt.lte = new Date(dateTo as string)
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit as string) : 100,
      include: { items: { include: { menuItem: true } }, table: true, cashier: { select: { id: true, name: true } } },
    })
    res.json(orders)
}))

router.get('/active', asyncHandler(async (req: AuthRequest, res: Response) => {
    const prisma: PrismaClient = req.app.get('prisma')
    const { tableId, businessId } = req.query

    if (!tableId || !businessId) {
      return res.status(400).json({ error: 'tableId and businessId required' })
    }

    const order = await prisma.order.findFirst({
      where: { tableId: tableId as string, businessId: businessId as string, status: { notIn: ['DELIVERED', 'CANCELLED'] } },
      include: { items: { include: { menuItem: true } }, table: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json(order)
}))

router.get('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const prisma: PrismaClient = req.app.get('prisma')
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, businessId: req.user!.businessId },
      include: { items: { include: { menuItem: true } }, table: true, cashier: { select: { id: true, name: true } } },
    })
    if (!order) return res.status(404).json({ error: 'Order not found' })
    res.json(order)
}))

router.patch('/:id/status', authenticate, validate(updateOrderStatusSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const order = await getService(req).updateOrderStatus(req.params.id, req.body.status)
    res.json(order)
}))

router.patch('/:orderId/items/:itemId/status', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const prisma: PrismaClient = req.app.get('prisma')
    const io: SocketIOServer = req.app.get('io')
    const { status } = req.body

    const item = await prisma.orderItem.update({ where: { id: req.params.itemId }, data: { status }, include: { menuItem: true } })

    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId }, include: { items: { include: { menuItem: true } }, table: true },
    })

    if (order) io.to(`business:${order.businessId}`).emit('order:itemStatusUpdate', { orderId: order.id, item, order })
    res.json(item)
}))

router.patch('/:id/payment', authenticate, requireRole('ADMIN', 'MANAGER', 'CASHIER'), validate(updatePaymentSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const order = await getService(req).updatePayment(req.params.id, req.body.paymentStatus, req.body.paymentMethod)
    res.json(order)
}))

router.patch('/:id/cancel', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const order = await getService(req).cancelOrder(req.params.id)
    res.json(order)
}))

router.get('/track/:orderNumber', asyncHandler(async (req: AuthRequest, res: Response) => {
    const prisma: PrismaClient = req.app.get('prisma')
    const orderNumber = parseInt(req.params.orderNumber)
    const businessId = req.query.businessId as string
    if (!orderNumber) return res.status(400).json({ error: 'Invalid order number' })

    const order = await prisma.order.findFirst({ where: { orderNumber, businessId }, include: { items: { include: { menuItem: true } }, table: true } })
    if (!order) return res.status(404).json({ error: 'Order not found' })
    res.json(order)
}))

router.post('/call-waiter', validate(callWaiterSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const prisma: PrismaClient = req.app.get('prisma')
    const io: SocketIOServer = req.app.get('io')
    const { tableId, businessId, message } = req.body
    const table = tableId ? await prisma.table.findUnique({ where: { id: tableId } }) : null
    const callData = { tableId, tableNumber: table?.number || 'Unknown', message: message || 'طلب نادل', timestamp: new Date().toISOString() }
    io.to(`business:${businessId}`).emit('waiter:called', callData)
    res.json({ success: true, callData })
}))

router.post('/:id/items', validate(addItemsSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const order = await getService(req).addItemsToOrder({ orderId: req.params.id, items: req.body.items })
    res.json(order)
}))

router.get('/:id/receipt', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const prisma: PrismaClient = req.app.get('prisma')
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, businessId: req.user!.businessId },
      include: { items: { include: { menuItem: true } }, table: true, cashier: { select: { id: true, name: true } } },
    })
    if (!order) return res.status(404).json({ error: 'Order not found' })
    const business = await prisma.business.findUnique({ where: { id: req.user!.businessId } })
    const { generateReceiptData } = require('../services/printer')
    res.json(generateReceiptData(order, business))
}))

router.post('/:id/split', authenticate, requireRole('ADMIN', 'MANAGER', 'CASHIER'), validate(splitBillSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const io: SocketIOServer = req.app.get('io')
    const prisma: PrismaClient = req.app.get('prisma')
    const result = await getService(req).splitOrder(req.params.id, req.user!.businessId, req.body.splits)

    let originalAfterSplit = null as any
    if (!result.originalDeleted) {
      originalAfterSplit = await prisma.order.findUnique({
        where: { id: result.originalId }, include: { items: { include: { menuItem: true } }, table: true },
      })
      io.to(`business:${req.user!.businessId}`).emit('order:statusUpdate', originalAfterSplit)
    }

    for (const splitOrder of result.newOrders) {
      io.to(`business:${req.user!.businessId}`).emit('order:new', splitOrder)
    }

    res.json({ original: originalAfterSplit, splits: result.newOrders })
}))

router.get('/customer/:phone', asyncHandler(async (req: AuthRequest, res: Response) => {
    const prisma: PrismaClient = req.app.get('prisma')
    const { phone } = req.params
    const businessId = req.query.businessId as string
    const orders = await prisma.order.findMany({
      where: { customerPhone: phone, businessId }, orderBy: { createdAt: 'desc' }, take: 10,
      include: { items: { include: { menuItem: true } }, table: true },
    })
    res.json(orders)
}))

export default router
