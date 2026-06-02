import { Router, Response, Request } from 'express'
import { PrismaClient } from '@prisma/client'
import { Server as SocketIOServer } from 'socket.io'
import { authenticate } from '../middleware/auth'
import { AuthRequest } from '../types'
import { logger } from '../middleware/logger'
import { asyncHandler } from '../utils/asyncHandler'
import { NotFoundError, ValidationError, ConflictError } from '../errors'

const router = Router()

function getStripe(): any {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  const Stripe = require('stripe')
  return new Stripe(key)
}

router.get('/config', (_req: AuthRequest, res: Response) => {
  res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '' })
})

router.post('/create-intent', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const prisma: PrismaClient = req.app.get('prisma')
    const { orderId } = req.body

    const order = await prisma.order.findFirst({
      where: { id: orderId, businessId: req.user!.businessId },
    })
    if (!order) throw new NotFoundError('Order')
    if (order.paymentStatus === 'PAID') throw new ValidationError('Order already paid')

    const stripe = getStripe()
    if (!stripe) throw new ValidationError('Stripe not configured. Set STRIPE_SECRET_KEY in .env')

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total * 100),
      currency: 'usd',
      metadata: { orderId, orderNumber: String(order.orderNumber), businessId: req.user!.businessId },
    })

    await prisma.order.update({
      where: { id: orderId },
      data: { stripePaymentIntentId: paymentIntent.id },
    })

    res.json({ clientSecret: paymentIntent.client_secret })
}))

export async function handlePaymentSucceeded(
  paymentIntent: any,
  prisma: PrismaClient,
  io: SocketIOServer,
  webhookLogId: string
) {
  const { orderId, businessId } = paymentIntent.metadata || {}
  if (!orderId || !businessId) {
    logger.warn('Payment succeeded webhook missing metadata', { paymentIntent: paymentIntent.id })
    return
  }

  await prisma.$transaction(async (tx: any) => {
    const order = await tx.order.findUnique({ where: { id: orderId } })
    if (!order) throw new Error(`Order not found for payment intent ${paymentIntent.id}`)
    if (order.paymentStatus === 'PAID') return

    await tx.order.update({
      where: { id: orderId },
      data: { paymentStatus: 'PAID', paymentMethod: 'STRIPE', paidAt: new Date() },
    })

    await tx.payment.create({
      data: {
        orderId,
        stripePaymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: 'SUCCEEDED',
        method: 'STRIPE',
      },
    })

    await tx.webhookLog.update({
      where: { id: webhookLogId },
      data: { orderId },
    })
  })

  io.to(`business:${businessId}`).emit('order:paymentUpdate', { orderId, status: 'PAID' })
  logger.info('Payment succeeded', { orderId, paymentIntent: paymentIntent.id })
}

export async function handlePaymentFailed(
  paymentIntent: any,
  prisma: PrismaClient,
  io: SocketIOServer,
  webhookLogId: string
) {
  const { orderId, businessId } = paymentIntent.metadata || {}
  if (!orderId || !businessId) return

  await prisma.$transaction(async (tx: any) => {
    const order = await tx.order.findUnique({ where: { id: orderId } })
    if (!order) return

    await tx.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'UNPAID',
        paymentFailureReason: paymentIntent.last_payment_error?.message,
      },
    })

    await tx.payment.create({
      data: {
        orderId,
        stripePaymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: 'FAILED',
        method: 'STRIPE',
      },
    })

    await tx.webhookLog.update({
      where: { id: webhookLogId },
      data: { orderId },
    })
  })

  io.to(`business:${businessId}`).emit('order:payment_failed', {
    orderId,
    reason: paymentIntent.last_payment_error?.message,
  })
  logger.warn('Payment failed', { orderId, paymentIntent: paymentIntent.id })
}

export async function upsertPlanFromPriceId(priceId: string): Promise<string> {
  const planMap: Record<string, string> = {}
  if (process.env.STRIPE_PRICE_BASIC) planMap[process.env.STRIPE_PRICE_BASIC] = 'BASIC'
  if (process.env.STRIPE_PRICE_PRO) planMap[process.env.STRIPE_PRICE_PRO] = 'PRO'
  if (process.env.STRIPE_PRICE_ENTERPRISE) planMap[process.env.STRIPE_PRICE_ENTERPRISE] = 'ENTERPRISE'
  return planMap[priceId] || 'BASIC'
}

export function planLimits(plan: string): { maxUsers: number; maxBranches: number } {
  switch (plan) {
    case 'BASIC': return { maxUsers: 3, maxBranches: 1 }
    case 'PRO': return { maxUsers: 10, maxBranches: 3 }
    case 'ENTERPRISE': return { maxUsers: 999, maxBranches: 99 }
    default: return { maxUsers: 1, maxBranches: 1 }
  }
}

export async function handleSubscriptionCreated(subscription: any, prisma: PrismaClient) {
  const { metadata, items, id: stripeSubId, customer, status, current_period_start, current_period_end, trial_end } = subscription
  const businessId = metadata?.businessId
  const customerId = customer
  if (!businessId) {
    logger.warn('Subscription created without businessId metadata', { subscriptionId: stripeSubId })
    return
  }

  const priceId = items?.data?.[0]?.price?.id
  const plan = await upsertPlanFromPriceId(priceId)
  const limits = planLimits(plan)

  const subData: any = {
    stripeSubscriptionId: stripeSubId,
    plan,
    status: status === 'trialing' ? 'TRIALING' : 'ACTIVE',
    currentPeriodStart: current_period_start ? new Date(current_period_start * 1000) : null,
    currentPeriodEnd: current_period_end ? new Date(current_period_end * 1000) : null,
    trialEndsAt: trial_end ? new Date(trial_end * 1000) : null,
    maxUsers: limits.maxUsers,
    maxBranches: limits.maxBranches,
  }
  if (customerId) subData.stripeCustomerId = customerId

  await (prisma as any).subscription.upsert({
    where: { stripeSubscriptionId: stripeSubId },
    update: subData,
    create: { businessId, ...subData },
  })
  logger.info('Subscription created', { businessId, plan, stripeSubId })
}

export async function handleSubscriptionUpdated(subscription: any, prisma: PrismaClient) {
  const { id: stripeSubId, status, items, cancel_at_period_end, current_period_end } = subscription
  const priceId = items?.data?.[0]?.price?.id
  const plan = await upsertPlanFromPriceId(priceId)
  const limits = planLimits(plan)

  const newStatus = cancel_at_period_end ? 'CANCELED' : status === 'past_due' ? 'PAST_DUE' : status === 'canceled' ? 'CANCELED' : status === 'active' ? 'ACTIVE' : status === 'incomplete_expired' ? 'EXPIRED' : status

  const updateData: any = {
    plan,
    status: newStatus,
    maxUsers: limits.maxUsers,
    maxBranches: limits.maxBranches,
    currentPeriodEnd: current_period_end ? new Date(current_period_end * 1000) : null,
  }
  if (cancel_at_period_end) updateData.canceledAt = new Date()

  await (prisma as any).subscription.updateMany({
    where: { stripeSubscriptionId: stripeSubId },
    data: updateData,
  })
  logger.info('Subscription updated', { stripeSubId, status: newStatus, plan })
}

export async function handleSubscriptionDeleted(subscription: any, prisma: PrismaClient) {
  const { id: stripeSubId } = subscription
  await (prisma as any).subscription.updateMany({
    where: { stripeSubscriptionId: stripeSubId },
    data: { status: 'EXPIRED', canceledAt: new Date() },
  })
  logger.info('Subscription deleted', { stripeSubId })
}

export async function handleInvoicePaymentSucceeded(invoice: any, prisma: PrismaClient, io: SocketIOServer) {
  const { subscription: stripeSubId, customer, metadata } = invoice
  const businessId = metadata?.businessId
  if (!stripeSubId || !businessId) return

  await (prisma as any).subscription.updateMany({
    where: { stripeSubscriptionId: stripeSubId },
    data: { status: 'ACTIVE' },
  })
  io.to(`business:${businessId}`).emit('subscription:updated', { status: 'ACTIVE' })
  logger.info('Invoice payment succeeded', { stripeSubId, businessId })
}

export async function handleInvoicePaymentFailed(invoice: any, prisma: PrismaClient, io: SocketIOServer) {
  const { subscription: stripeSubId, metadata } = invoice
  const businessId = metadata?.businessId
  if (!stripeSubId || !businessId) return

  await (prisma as any).subscription.updateMany({
    where: { stripeSubscriptionId: stripeSubId },
    data: { status: 'PAST_DUE' },
  })
  io.to(`business:${businessId}`).emit('subscription:payment_failed', { status: 'PAST_DUE' })
  logger.warn('Invoice payment failed', { stripeSubId, businessId })
}

export async function handleChargeRefunded(charge: any, prisma: PrismaClient, _io: SocketIOServer, webhookLogId?: string) {
  await prisma.$transaction(async (tx: any) => {
    const payment = await tx.payment.findFirst({ where: { stripeChargeId: charge.id } })
    if (!payment) return

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: 'REFUNDED',
        refundAmount: charge.amount_refunded / 100,
        refundedAt: new Date(),
      },
    })

    await tx.order.update({
      where: { id: payment.orderId },
      data: { paymentStatus: 'REFUNDED' },
    })

    if (webhookLogId) {
      await tx.webhookLog.update({
        where: { id: webhookLogId },
        data: { orderId: payment.orderId },
      })
    }
  })
  logger.info('Charge refunded', { chargeId: charge.id })
}

export const handleStripeWebhook = asyncHandler(async (req: AuthRequest, res: Response) => {
    const prisma: PrismaClient = req.app.get('prisma')
    const io: SocketIOServer = req.app.get('io')
    const stripe = getStripe()
    if (!stripe) throw new ValidationError('Stripe not configured')

    const sig = req.headers['stripe-signature'] as string
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!endpointSecret) throw new ValidationError('Webhook secret not configured')

    let event: any
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
    } catch (err: any) {
      logger.error('Stripe signature verification failed', { error: err.message })
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    const existingLog = await (prisma as any).webhookLog.findUnique({
      where: { stripeEventId: event.id },
    })
    if (existingLog && existingLog.status === 'PROCESSED') {
      return res.json({ received: true })
    }

    const webhookLog = await (prisma as any).webhookLog.upsert({
      where: { stripeEventId: event.id },
      update: { status: 'PROCESSING' },
      create: {
        stripeEventId: event.id,
        type: event.type,
        status: 'PROCESSING',
        data: event.data,
      },
    })

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await handlePaymentSucceeded(event.data.object, prisma, io, webhookLog.id)
          break
        case 'payment_intent.payment_failed':
          await handlePaymentFailed(event.data.object, prisma, io, webhookLog.id)
          break
        case 'charge.refunded':
          await handleChargeRefunded(event.data.object, prisma, io, webhookLog.id)
          break
        case 'customer.subscription.created':
          await handleSubscriptionCreated(event.data.object, prisma)
          break
        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event.data.object, prisma)
          break
        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event.data.object, prisma)
          break
        case 'invoice.payment_succeeded':
          await handleInvoicePaymentSucceeded(event.data.object, prisma, io)
          break
        case 'invoice.payment_failed':
          await handleInvoicePaymentFailed(event.data.object, prisma, io)
          break
        default:
          logger.warn('Unhandled webhook event type', { type: event.type })
      }

      await (prisma as any).webhookLog.update({
        where: { id: webhookLog.id },
        data: { status: 'PROCESSED', processedAt: new Date() },
      })

      res.json({ received: true })
    } catch (err: any) {
      await (prisma as any).webhookLog.update({
        where: { id: webhookLog.id },
        data: { status: 'FAILED', error: err.message },
      }).catch(() => {})
      throw err
    }
})

export default router
