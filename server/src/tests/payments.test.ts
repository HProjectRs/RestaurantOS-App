import request from 'supertest'
import express from 'express'
import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset } from 'jest-mock-extended'
import paymentRoutes, { handleStripeWebhook } from '../routes/payments'

jest.mock('../middleware/auth', () => ({
  authenticate: jest.fn((req: any, _res: any, next: any) => {
    req.user = { userId: 'user-1', businessId: 'biz-1', role: 'ADMIN', name: 'Admin' }
    next()
  }),
  requireRole: jest.fn(() => (req: any, res: any, next: any) => next()),
}))

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(),
}))

const prisma = mockDeep<PrismaClient>()
const mockIo = {
  to: jest.fn().mockReturnThis(),
  emit: jest.fn(),
}

let mockCreatePaymentIntent: jest.Mock
let mockConstructEvent: jest.Mock
let mockRetrievePaymentIntent: jest.Mock

jest.mock('stripe', () => {
  const create = jest.fn()
  const construct = jest.fn()
  const retrieve = jest.fn()
  return jest.fn(() => ({
    paymentIntents: { create, retrieve },
    webhooks: { constructEvent: construct },
  }))
})

const app = express()
app.set('prisma', prisma)
app.set('io', mockIo)
// Stripe webhook MUST use raw body before JSON body parser
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook)
app.use(express.json())
app.use('/api/payments', paymentRoutes)
import { errorHandler } from '../middleware/errorHandler'
app.use(errorHandler)

beforeEach(() => {
  mockReset(prisma)
  ;(PrismaClient as unknown as jest.Mock).mockImplementation(() => prisma)
  mockIo.to.mockClear()
  mockIo.emit.mockClear()

  const Stripe = require('stripe')
  const instance = Stripe()
  mockCreatePaymentIntent = instance.paymentIntents.create
  mockConstructEvent = instance.webhooks.constructEvent
  mockRetrievePaymentIntent = instance.paymentIntents.retrieve

  process.env.STRIPE_SECRET_KEY = 'sk_test_mock'
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock'
  process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_mock'
})

afterAll(() => {
  delete process.env.STRIPE_SECRET_KEY
  delete process.env.STRIPE_WEBHOOK_SECRET
  delete process.env.STRIPE_PUBLISHABLE_KEY
})

describe('Payment Routes', () => {
  beforeEach(() => {
    mockCreatePaymentIntent.mockReset()
    mockConstructEvent.mockReset()
    mockRetrievePaymentIntent.mockReset()
  })

  describe('POST /api/payments/create-intent', () => {
    it('should create a PaymentIntent for a pending order', async () => {
      const orderId = 'order-1'
      const mockStripe = { client_secret: 'pi_mock_123_secret_abc' }

      ;(prisma.order.findFirst as jest.Mock).mockResolvedValue({
        id: orderId,
        total: 24.0,
        status: 'pending',
        paymentStatus: 'UNPAID',
        orderNumber: 1001,
      })
      mockCreatePaymentIntent.mockResolvedValue(mockStripe)

      const res = await request(app)
        .post('/api/payments/create-intent')
        .send({ orderId })

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('clientSecret')
      expect(res.body.clientSecret).toBe('pi_mock_123_secret_abc')
      expect(mockCreatePaymentIntent).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 2400,
          currency: 'usd',
          metadata: expect.objectContaining({ orderId }),
        })
      )
    })

    it('should return 404 when order not found', async () => {
      ;(prisma.order.findFirst as jest.Mock).mockResolvedValue(null)

      const res = await request(app)
        .post('/api/payments/create-intent')
        .send({ orderId: 'nonexistent' })

      expect(res.status).toBe(404)
      expect(res.body.error).toBe('Order not found')
    })

    it('should return 400 when order already paid', async () => {
      ;(prisma.order.findFirst as jest.Mock).mockResolvedValue({
        id: 'order-1',
        total: 24.0,
        paymentStatus: 'PAID',
      })

      const res = await request(app)
        .post('/api/payments/create-intent')
        .send({ orderId: 'order-1' })

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Order already paid')
    })

    it('should return 400 when Stripe not configured', async () => {
      delete process.env.STRIPE_SECRET_KEY
      ;(prisma.order.findFirst as jest.Mock).mockResolvedValue({
        id: 'order-1',
        total: 24.0,
        paymentStatus: 'UNPAID',
      })

      const res = await request(app)
        .post('/api/payments/create-intent')
        .send({ orderId: 'order-1' })

      expect(res.status).toBe(400)
      expect(res.body.error).toContain('Stripe not configured')
      process.env.STRIPE_SECRET_KEY = 'sk_test_mock'
    })
  })

  describe('POST /api/payments/webhook', () => {
    beforeEach(() => {
      ;(prisma.webhookLog.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.webhookLog.upsert as jest.Mock).mockResolvedValue({ id: 'wh-1' })
      ;(prisma.webhookLog.update as jest.Mock).mockResolvedValue({})
    })

    it('should handle payment_intent.succeeded event', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_mock_123',
            metadata: { orderId: 'order-1', businessId: 'biz-1' },
          },
        },
      })
      const mockTx = {
        order: { findUnique: jest.fn().mockResolvedValue({ id: 'order-1', paymentStatus: 'UNPAID' }), update: jest.fn() },
        payment: { create: jest.fn() },
        webhookLog: { update: jest.fn() },
      }
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => cb(mockTx))

      const res = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'valid_sig')
        .send({ raw: true })

      expect(res.status).toBe(200)
      expect(res.body.received).toBe(true)
      expect(mockTx.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { paymentStatus: 'PAID', paymentMethod: 'STRIPE', paidAt: expect.any(Date) },
      })
      expect(mockIo.to).toHaveBeenCalledWith('business:biz-1')
      expect(mockIo.emit).toHaveBeenCalledWith('order:paymentUpdate', expect.any(Object))
    })

    it('should return 400 on invalid signature', async () => {
      mockConstructEvent.mockImplementation(() => {
        throw new Error('Invalid signature')
      })

      const res = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'bad_sig')
        .send({})

      expect(res.status).toBe(400)
    })

    it('should return 400 when Stripe not configured', async () => {
      delete process.env.STRIPE_SECRET_KEY

      const res = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'sig')
        .send({})

      expect(res.status).toBe(400)
      expect(res.body.error).toContain('Stripe not configured')
      process.env.STRIPE_SECRET_KEY = 'sk_test_mock'
    })

    it('should not crash on non-payment_intent.succeeded events', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'payment_intent.canceled',
        data: {
          object: {
            id: 'pi_mock_123',
            metadata: {},
          },
        },
      })

      const res = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'sig')
        .send({})

      expect(res.status).toBe(200)
      expect(res.body.received).toBe(true)
      expect(prisma.order.update).not.toHaveBeenCalled()
    })
  })

  describe('GET /api/payments/config', () => {
    it('should return stripe publishable key', async () => {
      const res = await request(app).get('/api/payments/config')

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('publishableKey')
      expect(res.body.publishableKey).toBe('pk_test_mock')
    })
  })

  // ─── Additional webhook event types ────────────────────────────────────

  describe('POST /api/payments/webhook — additional event types', () => {
    beforeEach(() => {
      ;(prisma.webhookLog.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.webhookLog.upsert as jest.Mock).mockResolvedValue({ id: 'wh-1' })
      ;(prisma.webhookLog.update as jest.Mock).mockResolvedValue({})
    })

    it('handles payment_intent.payment_failed', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_failed',
            amount: 2400,
            currency: 'usd',
            last_payment_error: { message: 'Card declined' },
            metadata: { orderId: 'order-1', businessId: 'biz-1' },
          },
        },
      })
      const mockTx = {
        order: { findUnique: jest.fn().mockResolvedValue({ id: 'order-1' }), update: jest.fn() },
        payment: { create: jest.fn() },
        webhookLog: { update: jest.fn() },
      }
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => cb(mockTx))

      const res = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'sig')
        .send({})

      expect(res.status).toBe(200)
      expect(mockTx.order.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ paymentStatus: 'UNPAID' }) })
      )
      expect(mockIo.emit).toHaveBeenCalledWith('order:payment_failed', expect.any(Object))
    })

    it('handles charge.refunded', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'charge.refunded',
        data: {
          object: {
            id: 'ch_refunded',
            amount_refunded: 1000,
            metadata: {},
          },
        },
      })
      const mockTx = {
        payment: { findFirst: jest.fn().mockResolvedValue({ id: 'pay-1', orderId: 'order-1' }), update: jest.fn() },
        order: { update: jest.fn() },
        webhookLog: { update: jest.fn() },
      }
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => cb(mockTx))

      const res = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'sig')
        .send({})

      expect(res.status).toBe(200)
      expect(mockTx.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'REFUNDED' }) })
      )
    })

    it('handles customer.subscription.created', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_created',
            customer: 'cus_123',
            status: 'active',
            metadata: { businessId: 'biz-1' },
            items: { data: [{ price: { id: 'price_basic' } }] },
            current_period_start: 1000000,
            current_period_end: 2000000,
            trial_end: null,
          },
        },
      })
      ;(prisma as any).subscription = { upsert: jest.fn().mockResolvedValue({}) }

      const res = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'sig')
        .send({})

      expect(res.status).toBe(200)
      expect((prisma as any).subscription.upsert).toHaveBeenCalled()
    })

    it('handles customer.subscription.updated', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_updated',
            status: 'past_due',
            cancel_at_period_end: false,
            items: { data: [{ price: { id: 'price_pro' } }] },
            current_period_end: 3000000,
          },
        },
      })
      ;(prisma as any).subscription = { updateMany: jest.fn().mockResolvedValue({}) }

      const res = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'sig')
        .send({})

      expect(res.status).toBe(200)
      expect((prisma as any).subscription.updateMany).toHaveBeenCalled()
    })

    it('handles customer.subscription.deleted', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'customer.subscription.deleted',
        data: {
          object: { id: 'sub_deleted' },
        },
      })
      ;(prisma as any).subscription = { updateMany: jest.fn().mockResolvedValue({}) }

      const res = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'sig')
        .send({})

      expect(res.status).toBe(200)
      expect((prisma as any).subscription.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'EXPIRED' }) })
      )
    })

    it('handles invoice.payment_succeeded', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            subscription: 'sub_invoice',
            customer: 'cus_123',
            metadata: { businessId: 'biz-1' },
          },
        },
      })
      ;(prisma as any).subscription = { updateMany: jest.fn().mockResolvedValue({}) }

      const res = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'sig')
        .send({})

      expect(res.status).toBe(200)
      expect((prisma as any).subscription.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'ACTIVE' }) })
      )
    })

    it('handles invoice.payment_failed', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'invoice.payment_failed',
        data: {
          object: {
            subscription: 'sub_failed',
            metadata: { businessId: 'biz-1' },
          },
        },
      })
      ;(prisma as any).subscription = { updateMany: jest.fn().mockResolvedValue({}) }

      const res = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'sig')
        .send({})

      expect(res.status).toBe(200)
      expect((prisma as any).subscription.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'PAST_DUE' }) })
      )
      expect(mockIo.emit).toHaveBeenCalledWith('subscription:payment_failed', expect.any(Object))
    })
  })

  // ─── Webhook edge cases ────────────────────────────────────────────────

  describe('POST /api/payments/webhook — edge cases', () => {
    it('skips already processed events', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_dup', metadata: {} } },
      })
      ;(prisma.webhookLog.findUnique as jest.Mock).mockResolvedValue({ id: 'wh-existing', status: 'PROCESSED' })

      const res = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'sig')
        .send({})

      expect(res.status).toBe(200)
      expect(res.body.received).toBe(true)
    })

    it('catches handler error and sets webhook to FAILED', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_err', metadata: { orderId: 'order-1', businessId: 'biz-1' } } },
      })
      ;(prisma.$transaction as jest.Mock).mockRejectedValue(new Error('DB failure'))
      ;(prisma.webhookLog.update as jest.Mock).mockResolvedValue({})

      const res = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'sig')
        .send({})

      expect(res.status).toBe(500)
    })
  })

  // ─── Helper function tests ─────────────────────────────────────────────

  describe('Helper functions', () => {
    it('handlePaymentSucceeded skips when metadata missing', async () => {
      const { handlePaymentSucceeded } = await import('../routes/payments')
      const paymentIntent = { id: 'pi_no_meta', amount: 1000, currency: 'usd', metadata: {} }
      await handlePaymentSucceeded(paymentIntent, prisma as any, mockIo as any, 'wh-1')
      expect(prisma.order.update).not.toHaveBeenCalled()
    })

    it('handlePaymentSucceeded skips when order already paid', async () => {
      const { handlePaymentSucceeded } = await import('../routes/payments')
      const paymentIntent = { id: 'pi_paid', amount: 1000, currency: 'usd', metadata: { orderId: 'order-1', businessId: 'biz-1' } }
      const mockTx = {
        order: { findUnique: jest.fn().mockResolvedValue({ id: 'order-1', paymentStatus: 'PAID' }), update: jest.fn() },
        payment: { create: jest.fn() },
        webhookLog: { update: jest.fn() },
      }
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => cb(mockTx))
      await handlePaymentSucceeded(paymentIntent, prisma as any, mockIo as any, 'wh-1')
      expect(mockTx.order.update).not.toHaveBeenCalled()
    })

    it('handlePaymentFailed returns early when metadata missing', async () => {
      const { handlePaymentFailed } = await import('../routes/payments')
      const paymentIntent = { id: 'pi_fail_no_meta', amount: 1000, currency: 'usd', last_payment_error: { message: 'err' }, metadata: {} }
      await handlePaymentFailed(paymentIntent, prisma as any, mockIo as any, 'wh-1')
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it('handlePaymentFailed returns early when order not found', async () => {
      const { handlePaymentFailed } = await import('../routes/payments')
      const paymentIntent = { id: 'pi_no_order', amount: 1000, currency: 'usd', metadata: { orderId: 'missing', businessId: 'biz-1' } }
      const mockTx = {
        order: { findUnique: jest.fn().mockResolvedValue(null) },
        payment: { create: jest.fn() },
        webhookLog: { update: jest.fn() },
      }
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => cb(mockTx))
      await handlePaymentFailed(paymentIntent, prisma as any, mockIo as any, 'wh-1')
      expect(mockTx.payment.create).not.toHaveBeenCalled()
    })

    it('handleSubscriptionCreated returns early when businessId missing', async () => {
      const { handleSubscriptionCreated } = await import('../routes/payments')
      const sub = { id: 'sub_no_biz', customer: 'cus_123', status: 'active', items: { data: [{ price: { id: 'price_x' } }] }, metadata: {} }
      await handleSubscriptionCreated(sub, prisma as any)
      expect((prisma as any).subscription?.upsert).toBeUndefined()
    })

    it('handleSubscriptionCreated handles trialing status', async () => {
      const { handleSubscriptionCreated } = await import('../routes/payments')
      const sub = { id: 'sub_trial', customer: 'cus_123', status: 'trialing', items: { data: [{ price: { id: 'price_basic' } }] }, metadata: { businessId: 'biz-1' }, current_period_start: 1000000, current_period_end: 2000000, trial_end: 3000000 }
      ;(prisma as any).subscription = { upsert: jest.fn().mockResolvedValue({}) }
      await handleSubscriptionCreated(sub, prisma as any)
      expect((prisma as any).subscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ status: 'TRIALING', trialEndsAt: expect.any(Date) }),
        })
      )
    })

    it('handleSubscriptionUpdated with cancel_at_period_end', async () => {
      const { handleSubscriptionUpdated } = await import('../routes/payments')
      const sub = { id: 'sub_canceled', status: 'active', cancel_at_period_end: true, items: { data: [{ price: { id: 'price_pro' } }] }, current_period_end: 3000000 }
      ;(prisma as any).subscription = { updateMany: jest.fn().mockResolvedValue({}) }
      await handleSubscriptionUpdated(sub, prisma as any)
      expect((prisma as any).subscription.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'CANCELED', canceledAt: expect.any(Date) }),
        })
      )
    })

    it('handleSubscriptionUpdated with canceled status', async () => {
      const { handleSubscriptionUpdated } = await import('../routes/payments')
      const sub = { id: 'sub_canceled2', status: 'canceled', cancel_at_period_end: false, items: { data: [{ price: { id: 'price_basic' } }] }, current_period_end: 3000000 }
      ;(prisma as any).subscription = { updateMany: jest.fn().mockResolvedValue({}) }
      await handleSubscriptionUpdated(sub, prisma as any)
      expect((prisma as any).subscription.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'CANCELED' }) })
      )
    })

    it('handleSubscriptionUpdated with expired status', async () => {
      const { handleSubscriptionUpdated } = await import('../routes/payments')
      const sub = { id: 'sub_expired', status: 'incomplete_expired', cancel_at_period_end: false, items: { data: [{ price: { id: 'price_enterprise' } }] }, current_period_end: null }
      ;(prisma as any).subscription = { updateMany: jest.fn().mockResolvedValue({}) }
      await handleSubscriptionUpdated(sub, prisma as any)
      expect((prisma as any).subscription.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'EXPIRED' }) })
      )
    })

    it('handleInvoicePaymentSucceeded returns early when subId missing', async () => {
      const { handleInvoicePaymentSucceeded } = await import('../routes/payments')
      const invoice = { subscription: null, customer: 'cus_123', metadata: { businessId: 'biz-1' } }
      await handleInvoicePaymentSucceeded(invoice, prisma as any, mockIo as any)
      expect(mockIo.emit).not.toHaveBeenCalled()
    })

    it('handleInvoicePaymentFailed returns early when subId missing', async () => {
      const { handleInvoicePaymentFailed } = await import('../routes/payments')
      const invoice = { subscription: 'sub_orphan', metadata: {} }
      await handleInvoicePaymentFailed(invoice, prisma as any, mockIo as any)
      expect(mockIo.emit).not.toHaveBeenCalled()
    })

    it('handleChargeRefunded returns early when no payment found', async () => {
      const { handleChargeRefunded } = await import('../routes/payments')
      const mockTx = {
        payment: { findFirst: jest.fn().mockResolvedValue(null) },
        order: { update: jest.fn() },
        webhookLog: { update: jest.fn() },
      }
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => cb(mockTx))
      const charge = { id: 'ch_empty', amount_refunded: 500 }
      await handleChargeRefunded(charge, prisma as any, mockIo as any, undefined)
      expect(mockTx.order.update).not.toHaveBeenCalled()
    })

    it('planLimits returns correct limits for each plan', async () => {
      const { planLimits } = await import('../routes/payments')
      expect(planLimits('BASIC')).toEqual({ maxUsers: 3, maxBranches: 1 })
      expect(planLimits('PRO')).toEqual({ maxUsers: 10, maxBranches: 3 })
      expect(planLimits('ENTERPRISE')).toEqual({ maxUsers: 999, maxBranches: 99 })
      expect(planLimits('UNKNOWN')).toEqual({ maxUsers: 1, maxBranches: 1 })
    })

    it('upsertPlanFromPriceId maps price IDs to plan names', async () => {
      process.env.STRIPE_PRICE_BASIC = 'price_basic'
      process.env.STRIPE_PRICE_PRO = 'price_pro'
      process.env.STRIPE_PRICE_ENTERPRISE = 'price_enterprise'
      const { upsertPlanFromPriceId } = await import('../routes/payments')
      expect(await upsertPlanFromPriceId('price_basic')).toBe('BASIC')
      expect(await upsertPlanFromPriceId('price_pro')).toBe('PRO')
      expect(await upsertPlanFromPriceId('price_enterprise')).toBe('ENTERPRISE')
      expect(await upsertPlanFromPriceId('unknown')).toBe('BASIC')
      delete process.env.STRIPE_PRICE_BASIC
      delete process.env.STRIPE_PRICE_PRO
      delete process.env.STRIPE_PRICE_ENTERPRISE
    })
  })
})
