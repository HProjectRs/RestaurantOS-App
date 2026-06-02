import { PrismaClient, Prisma } from '@prisma/client'
import { Server as SocketIOServer } from 'socket.io'
import { mockDeep, mockReset } from 'jest-mock-extended'

jest.mock('@prisma/client', () => ({ PrismaClient: jest.fn(), Prisma: { PrismaClientKnownRequestError: class extends Error { code: string; constructor(m: string, { code }: { code: string }) { super(m); this.code = code } } } }))
jest.mock('../middleware/logger', () => ({ logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() } }))

let OrderService: any, orderService: any, prisma: any

beforeAll(async () => {
  prisma = mockDeep<PrismaClient>()
  ;(PrismaClient as unknown as jest.Mock).mockImplementation(() => prisma)
  OrderService = (await import('../services/orderService')).OrderService
})

beforeEach(() => {
  mockReset(prisma)
  ;(PrismaClient as unknown as jest.Mock).mockImplementation(() => prisma)
  ;(prisma.$transaction as jest.Mock).mockImplementation((fn: any) => fn(prisma))
  orderService = new OrderService(prisma)
})

const baseOrderInput = {
  businessId: 'biz-1',
  tableId: 'table-1',
  items: [{ menuItemId: 'item-1', quantity: 2, price: 15 }],
}

const mockOrder = {
  id: 'order-1',
  businessId: 'biz-1',
  tableId: 'table-1',
  status: 'PENDING',
  subtotal: 30,
  total: 30,
  orderNumber: 123456,
  items: [{ id: 'oi-1', menuItemId: 'item-1', quantity: 2, price: 15 }],
  table: { id: 'table-1', number: 'T1', status: 'AVAILABLE', version: 1 },
}

describe('OrderService.createOrder', () => {
  it('creates order and occupies table atomically', async () => {
    ;(prisma.menuItem.findMany as jest.Mock).mockResolvedValue([{ id: 'item-1', isAvailable: true, price: 15 }])
    ;(prisma.order.create as jest.Mock).mockResolvedValue(mockOrder)
    ;(prisma.table.findUnique as jest.Mock).mockResolvedValue({ id: 'table-1', status: 'AVAILABLE' })
    ;(prisma.table.update as jest.Mock).mockResolvedValue({ id: 'table-1', status: 'OCCUPIED' })
    ;(prisma.orderStatusLog.create as jest.Mock).mockResolvedValue({})

    const result = await orderService.createOrder(baseOrderInput)

    expect(prisma.order.create).toHaveBeenCalled()
    expect(prisma.table.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'table-1', status: 'AVAILABLE' }, data: { status: 'OCCUPIED' } })
    )
    expect(prisma.orderStatusLog.create).toHaveBeenCalled()
    expect(result.id).toBe('order-1')
  })

  it('throws when table is already occupied', async () => {
    ;(prisma.menuItem.findMany as jest.Mock).mockResolvedValue([{ id: 'item-1', isAvailable: true, price: 15 }])
    ;(prisma.order.create as jest.Mock).mockResolvedValue(mockOrder)
    ;(prisma.table.findUnique as jest.Mock).mockResolvedValue({ id: 'table-1', status: 'OCCUPIED' })

    await expect(orderService.createOrder(baseOrderInput)).rejects.toThrow(/occupied/i)
    expect(prisma.table.update).not.toHaveBeenCalled()
  })

  it('creates takeaway order without occupying table', async () => {
    ;(prisma.menuItem.findMany as jest.Mock).mockResolvedValue([{ id: 'item-1', isAvailable: true, price: 15 }])
    ;(prisma.order.create as jest.Mock).mockResolvedValue({ ...mockOrder, tableId: null })
    ;(prisma.orderStatusLog.create as jest.Mock).mockResolvedValue({})

    await orderService.createOrder({ ...baseOrderInput, tableId: undefined })

    expect(prisma.table.findUnique).not.toHaveBeenCalled()
    expect(prisma.table.update).not.toHaveBeenCalled()
  })

  it('throws when table not found', async () => {
    ;(prisma.menuItem.findMany as jest.Mock).mockResolvedValue([{ id: 'item-1', isAvailable: true, price: 15 }])
    ;(prisma.table.findUnique as jest.Mock).mockResolvedValue(null)

    await expect(orderService.createOrder(baseOrderInput)).rejects.toThrow(/not found/i)
  })
})

describe('OrderService.updateOrderStatus', () => {
  it('updates order status', async () => {
    ;(prisma.order.update as jest.Mock).mockResolvedValue({ ...mockOrder, status: 'PREPARING' })
    ;(prisma.orderStatusLog.create as jest.Mock).mockResolvedValue({})

    const result = await orderService.updateOrderStatus('order-1', 'PREPARING')

    expect(result.status).toBe('PREPARING')
  })

  it('frees table when order is DELIVERED', async () => {
    ;(prisma.order.update as jest.Mock).mockResolvedValue({ ...mockOrder, status: 'DELIVERED', tableId: 'table-1' })
    ;(prisma.order.count as jest.Mock).mockResolvedValue(0)
    ;(prisma.table.update as jest.Mock).mockResolvedValue({})

    await orderService.updateOrderStatus('order-1', 'DELIVERED')

    expect(prisma.table.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'AVAILABLE' } })
    )
  })

  it('throws when order not found', async () => {
    ;(prisma.order.update as jest.Mock).mockRejectedValue(new Error('Record not found'))

    await expect(orderService.updateOrderStatus('nonexistent', 'DELIVERED')).rejects.toThrow()
  })
})

describe('OrderService.handlePaymentSuccess', () => {
  it('updates order payment status and creates payment record', async () => {
    ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder)
    ;(prisma.order.update as jest.Mock).mockResolvedValue({})
    ;(prisma.payment.create as jest.Mock).mockResolvedValue({})

    await orderService.handlePaymentSuccess('pi_test', 'biz-1', 'order-1')

    expect(prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ paymentStatus: 'PAID' }) }))
    expect(prisma.payment.create).toHaveBeenCalled()
  })
})

describe('OrderService.handlePaymentFailed', () => {
  it('updates order as unpaid and creates failed payment record', async () => {
    ;(prisma.order.update as jest.Mock).mockResolvedValue({})
    ;(prisma.payment.create as jest.Mock).mockResolvedValue({})

    await orderService.handlePaymentFailed('pi_fail', 'card_declined', 'biz-1', 'order-1')

    expect(prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ paymentStatus: 'UNPAID' }) }))
    expect(prisma.payment.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'FAILED' }) }))
  })
})
