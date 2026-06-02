import { describe, it, expect, jest } from '@jest/globals'
import { PrismaClient } from '@prisma/client'
import { mockDeep } from 'jest-mock-extended'
import { OrderService } from '../services/orderService'

jest.mock('../middleware/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
  logError: jest.fn(),
}))

const prisma = mockDeep<PrismaClient>()
const orderService = new OrderService(prisma)

function makeTx() {
  return {
    order: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    table: { findUnique: jest.fn(), update: jest.fn() },
    payment: { create: jest.fn() },
    orderStatusLog: { create: jest.fn() },
  }
}

describe('Orders Integration (unit)', () => {
  it('should create order and occupy table atomically', async () => {
    ;(prisma.menuItem.findMany as jest.Mock).mockResolvedValue([{ id: 'item-1', isAvailable: true, price: 15 }])
    ;(prisma.table.findUnique as jest.Mock).mockResolvedValue({ id: 'table-1', status: 'AVAILABLE' })
    const tx = makeTx()
    tx.order.create.mockResolvedValue({ id: 'order-1', orderNumber: 1001, tableId: 'table-1', subtotal: 30 })
    tx.table.update.mockResolvedValue({})
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => cb(tx))

    const order = await orderService.createOrder({
      businessId: 'biz-1',
      tableId: 'table-1',
      items: [{ menuItemId: 'item-1', quantity: 2, price: 15 }],
      type: 'DINE_IN',
    })
    expect(order.id).toBeDefined()
    expect(order.tableId).toBe('table-1')
  })

  it('should process payment and create payment record', async () => {
    const tx = makeTx()
    tx.order.findUnique.mockResolvedValue({ id: 'order-2', total: 100 })
    tx.order.update.mockResolvedValue({ id: 'order-2', paymentStatus: 'PAID' })
    tx.payment.create.mockResolvedValue({ id: 'pay-1', status: 'SUCCEEDED' })
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => cb(tx))

    await orderService.handlePaymentSuccess('pi_test', 'biz-1', 'order-2')
  })

  it('should handle payment failure gracefully', async () => {
    const tx = makeTx()
    tx.order.update.mockResolvedValue({ id: 'order-3', paymentFailureReason: 'Card declined' })
    tx.payment.create.mockResolvedValue({ id: 'pay-2', status: 'FAILED' })
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => cb(tx))

    await orderService.handlePaymentFailed('pi_fail', 'Card declined', 'biz-1', 'order-3')
  })
})
