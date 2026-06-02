import { PrismaClient, Prisma } from '@prisma/client'
import { Server as SocketIOServer } from 'socket.io'
import { logger } from '../middleware/logger'
import { calculateOrderCharges, generateOrderNumber } from '../utils/pricing'
import { ValidationError, NotFoundError, ConflictError } from '../errors'

export interface CreateOrderInput {
  businessId: string
  items: Array<{
    menuItemId: string
    quantity: number
    price?: number
    notes?: string
    selectedModifiers?: any
    sortOrder?: number
  }>
  tableId?: string
  customerName?: string
  customerPhone?: string
  type?: string
  notes?: string
  cashierId?: string | null
  isOnlineOrder?: boolean
}

export interface AddItemsInput {
  orderId: string
  items: Array<{
    menuItemId: string
    quantity: number
    notes?: string
    selectedModifiers?: any
    sortOrder?: number
  }>
}

export class OrderService {
  constructor(
    private prisma: PrismaClient,
    private io?: SocketIOServer
  ) {}

  async createOrder(data: CreateOrderInput) {
    const { items, businessId, type, tableId } = data
    if (!items?.length) throw new ValidationError('items required')

    const itemIds = items.map((i) => i.menuItemId)
    const menuItems = await this.prisma.menuItem.findMany({ where: { id: { in: itemIds } } })
    const menuItemMap = new Map(menuItems.map((mi: any) => [mi.id, mi]))

    let subtotal = 0
    const orderItemsData: Prisma.OrderItemUncheckedCreateWithoutOrderInput[] = []

    for (const item of items) {
      const menuItem = menuItemMap.get(item.menuItemId)
      if (!menuItem || !menuItem.isAvailable) {
        throw new ValidationError(`Item ${item.menuItemId} is not available`)
      }
      const itemPrice = item.price ?? (menuItem.discountPrice || menuItem.price)
      subtotal += Number(itemPrice) * item.quantity
      orderItemsData.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: itemPrice,
        notes: item.notes || null,
        selectedModifiers: item.selectedModifiers || {},
        sortOrder: item.sortOrder || 0,
      })
    }

    const business = await this.prisma.business.findUnique({ where: { id: businessId } })
    const { tax, serviceCharge, total } = calculateOrderCharges(subtotal, type, business)

    if (tableId) {
      const table = await this.prisma.table.findUnique({ where: { id: tableId } })
      if (!table) throw new NotFoundError('Table')
      if ((table as any).status === 'OCCUPIED') throw new ConflictError('Table is occupied')
    }

    return this.prisma.$transaction(async (tx) => {
      if (tableId) {
        await (tx.table as any).update({
          where: { id: tableId, status: 'AVAILABLE' },
          data: { status: 'OCCUPIED' },
        })
      }

      const order = await tx.order.create({
        data: {
          businessId,
          orderNumber: generateOrderNumber(),
          tableId: tableId || null,
          customerName: data.customerName || null,
          customerPhone: data.customerPhone || null,
          type: type || 'DINE_IN',
          subtotal, tax, serviceCharge, total,
          notes: data.notes || null,
          isOnlineOrder: data.isOnlineOrder ?? false,
          cashierId: data.cashierId || null,
          items: { create: orderItemsData },
        },
        include: { items: { include: { menuItem: true } }, table: true },
      })

      try { await tx.orderStatusLog.create({ data: { orderId: order.id, status: 'PENDING' } }) } catch {}

      logger.info('Order created', { orderId: order.id, orderNumber: order.orderNumber, businessId })
      if (this.io) this.io.to(`business:${businessId}`).emit('order:new', order)

      return order
    })
  }

  async addItemsToOrder(data: AddItemsInput) {
    const existingOrder = await this.prisma.order.findUnique({
      where: { id: data.orderId }, include: { table: true },
    })
    if (!existingOrder) throw new NotFoundError('Order')
    if (existingOrder.status === 'DELIVERED' || existingOrder.status === 'CANCELLED') {
      throw new ValidationError('Cannot add items to delivered/cancelled order')
    }

    const itemIds = data.items.map((i) => i.menuItemId)
    const menuItems = await this.prisma.menuItem.findMany({ where: { id: { in: itemIds } } })
    const menuItemMap = new Map(menuItems.map((mi: any) => [mi.id, mi]))

    let additionalSubtotal = 0
    const newItemsData: Prisma.OrderItemUncheckedCreateWithoutOrderInput[] = []

    for (const item of data.items) {
      const menuItem = menuItemMap.get(item.menuItemId)
      if (!menuItem || !menuItem.isAvailable) {
        throw new ValidationError(`Item ${item.menuItemId} not available`)
      }
      const itemPrice = menuItem.discountPrice || menuItem.price
      additionalSubtotal += Number(itemPrice) * item.quantity
      newItemsData.push({
        menuItemId: item.menuItemId, quantity: item.quantity, price: itemPrice,
        notes: item.notes || null, selectedModifiers: item.selectedModifiers || {}, sortOrder: item.sortOrder || 0,
      })
    }

    const business = await this.prisma.business.findUnique({ where: { id: existingOrder.businessId } })
    const { tax, serviceCharge, total } = calculateOrderCharges(additionalSubtotal, existingOrder.type, business)

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: data.orderId, status: { notIn: ['DELIVERED', 'CANCELLED'] } },
        data: {
          subtotal: { increment: additionalSubtotal },
          tax: { increment: tax },
          serviceCharge: { increment: serviceCharge },
          total: { increment: total },
          items: { create: newItemsData }, status: 'PENDING',
        },
        include: { items: { include: { menuItem: true } }, table: true },
      })

      if (existingOrder.tableId) {
        await (tx.table as any).update({
          where: { id: existingOrder.tableId },
          data: { status: 'OCCUPIED' },
        })
      }

      if (this.io) {
        this.io.to(`business:${existingOrder.businessId}`).emit('order:statusUpdate', updated)
        this.io.to(`business:${existingOrder.businessId}`).emit('kitchen:itemsAdded', { orderId: data.orderId, items: newItemsData, order: updated })
      }

      return updated
    })
  }

  async updateOrderStatus(orderId: string, newStatus: string) {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId }, data: { status: newStatus },
        include: { items: { include: { menuItem: true } }, table: true },
      })

      if (newStatus === 'DELIVERED' && updated.tableId) {
        try {
          const activeCount = await (tx.order as any).count({
            where: { tableId: updated.tableId, status: { notIn: ['DELIVERED', 'CANCELLED'] } },
          })
          if (activeCount === 0) {
            await (tx.table as any).update({
              where: { id: updated.tableId },
              data: { status: 'AVAILABLE' },
            })
          }
        } catch {}
      }

      try { await tx.orderStatusLog.create({ data: { orderId, status: newStatus } }) } catch {}
      logger.info('Order status updated', { orderId, newStatus })
      if (this.io) this.io.to(`business:${updated.businessId}`).emit('order:statusUpdate', updated)
      return updated
    })
  }

  async updatePayment(orderId: string, paymentStatus: string, paymentMethod?: string) {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId }, data: { paymentStatus, paymentMethod },
        include: { items: { include: { menuItem: true } }, table: true },
      })

      if (paymentStatus === 'PAID' && updated.tableId) {
        try {
          const activeCount = await (tx.order as any).count({
            where: { tableId: updated.tableId, status: { notIn: ['DELIVERED', 'CANCELLED'] } },
          })
          if (activeCount === 0) {
            await (tx.table as any).update({
              where: { id: updated.tableId },
              data: { status: 'AVAILABLE' },
            })
          }
        } catch {}
      }

      if (this.io) this.io.to(`business:${updated.businessId}`).emit('order:paymentUpdate', updated)
      return updated
    })
  }

  async cancelOrder(orderId: string) {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId }, data: { status: 'CANCELLED' },
        include: { items: { include: { menuItem: true } }, table: true },
      })

      if (updated.tableId) {
        await (tx.table as any).update({
          where: { id: updated.tableId },
          data: { status: 'AVAILABLE' },
        })
      }

      if (this.io) this.io.to(`business:${updated.businessId}`).emit('order:cancelled', updated)
      return updated
    })
  }

  async splitOrder(orderId: string, businessId: string, splits: Array<{ items: string[] }>) {
    return this.prisma.$transaction(async (tx) => {
      const originalOrder = await tx.order.findFirst({
        where: { id: orderId, businessId }, include: { items: true, table: true },
      })
      if (!originalOrder) throw new NotFoundError('Order')
      if (originalOrder.paymentStatus === 'PAID') throw new ValidationError('Cannot split a paid order')

      const newOrders: any[] = []
      const movedItemIds: string[] = []

      for (const split of splits) {
        const itemIds = split.items
        if (!itemIds.length) continue
        const splitItems = originalOrder.items.filter(i => itemIds.includes(i.id))
        if (!splitItems.length) continue

        const splitSubtotal = splitItems.reduce((s, i) => s + i.price * i.quantity, 0)
        const business = await tx.business.findUnique({ where: { id: businessId } })
        const { tax, serviceCharge, total } = calculateOrderCharges(splitSubtotal, originalOrder.type, business)

        const newOrder = await tx.order.create({
          data: {
            businessId: originalOrder.businessId, orderNumber: generateOrderNumber(),
            tableId: originalOrder.tableId, customerName: originalOrder.customerName,
            type: originalOrder.type, subtotal: splitSubtotal, tax, serviceCharge, total, isOnlineOrder: false,
          },
        })
        await tx.orderItem.updateMany({ where: { id: { in: itemIds } }, data: { orderId: newOrder.id } })
        movedItemIds.push(...itemIds)
        const fullOrder = await tx.order.findUnique({
          where: { id: newOrder.id }, include: { items: { include: { menuItem: true } }, table: true },
        })
        newOrders.push(fullOrder)
      }

      const remainingItems = originalOrder.items.filter(i => !movedItemIds.includes(i.id))

      if (remainingItems.length === 0) {
        await tx.orderItem.deleteMany({ where: { orderId: originalOrder.id } })
        await tx.order.delete({ where: { id: originalOrder.id } })
      } else {
        const remainingSubtotal = remainingItems.reduce((s, i) => s + i.price * i.quantity, 0)
        const business = await tx.business.findUnique({ where: { id: businessId } })
        const { tax, serviceCharge, total } = calculateOrderCharges(remainingSubtotal, originalOrder.type, business)
        await tx.order.update({
          where: { id: originalOrder.id }, data: { subtotal: remainingSubtotal, tax, serviceCharge, total },
        })
      }

      return { originalDeleted: remainingItems.length === 0, originalId: originalOrder.id, newOrders }
    })
  }

  async handlePaymentSuccess(stripePaymentIntentId: string, businessId: string, orderId: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } })
      if (!order) throw new NotFoundError(`Order ${orderId}`)

      await tx.order.update({
        where: { id: orderId }, data: { paymentStatus: 'PAID', paymentMethod: 'CARD', paidAt: new Date() },
      })
      await tx.payment.create({
        data: { orderId, stripePaymentIntentId, amount: order.total, currency: 'USD', status: 'SUCCEEDED', method: 'STRIPE' },
      })

      logger.info('Payment succeeded', { orderId, stripePaymentIntentId })
      if (this.io) this.io.to(`business:${businessId}`).emit('order:paymentUpdate', { orderId, status: 'PAID' })
    })
  }

  async handlePaymentFailed(stripePaymentIntentId: string, reason: string, businessId: string, orderId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId }, data: { paymentStatus: 'UNPAID', paymentFailureReason: reason, stripePaymentIntentId },
      })
      await tx.payment.create({
        data: { orderId, stripePaymentIntentId, amount: 0, currency: 'USD', status: 'FAILED', method: 'STRIPE' },
      })

      logger.warn('Payment failed', { orderId, stripePaymentIntentId, reason })
      if (this.io) this.io.to(`business:${businessId}`).emit('order:payment_failed', { orderId, reason })
    })
  }
}
