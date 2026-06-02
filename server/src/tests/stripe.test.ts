import { describe, it, expect, jest } from '@jest/globals'
import { PrismaClient } from '@prisma/client'
import { mockDeep } from 'jest-mock-extended'
import { handlePaymentSucceeded, handlePaymentFailed, handleChargeRefunded } from '../routes/payments'

jest.mock('../middleware/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
  logError: jest.fn(),
}))

jest.mock('stripe', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    webhooks: { constructEvent: jest.fn() },
  })),
}))

const prisma = mockDeep<PrismaClient>()
const mockIo = { to: jest.fn().mockReturnThis(), emit: jest.fn() } as any

function makeTx() {
  return {
    order: {
      update: jest.fn().mockResolvedValue({ id: 'order-1', paymentStatus: 'PAID', paidAt: new Date() }),
      findUnique: jest.fn().mockResolvedValue({ id: 'order-1', paymentStatus: 'UNPAID' }),
    },
    payment: { create: jest.fn().mockResolvedValue({ id: 'pay-1', status: 'SUCCEEDED' }) },
    webhookLog: { update: jest.fn().mockResolvedValue({}) },
    orderItem: {} as any,
    table: {} as any,
    backupLog: {} as any,
    menuItem: {} as any,
    menuCategory: {} as any,
    business: {} as any,
  }
}

describe('Stripe Webhook Handlers (unit)', () => {
  it('should handle payment_intent.succeeded and update order', async () => {
    const tx = makeTx()
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => cb(tx))

    const paymentIntent = {
      id: 'pi_test_1',
      amount: 10000,
      currency: 'usd',
      metadata: { orderId: 'order-1', businessId: 'biz-1' },
    }
    await handlePaymentSucceeded(paymentIntent as any, prisma, mockIo, 'log-1')
    expect(tx.order.update).toHaveBeenCalled()
    expect(tx.payment.create).toHaveBeenCalled()
  })

  it('should handle payment_intent.payment_failed', async () => {
    const tx = makeTx()
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => cb(tx))

    const paymentIntent = {
      id: 'pi_fail_1',
      amount: 5000,
      currency: 'usd',
      metadata: { orderId: 'order-1', businessId: 'biz-1' },
      last_payment_error: { message: 'Card declined' },
    }
    await handlePaymentFailed(paymentIntent as any, prisma, mockIo, 'log-2')
    expect(tx.order.update).toHaveBeenCalled()
    expect(tx.payment.create).toHaveBeenCalled()
  })
})
