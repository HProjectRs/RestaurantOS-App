import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middleware/auth'
import { AuthRequest } from '../types'
import { logger } from '../middleware/logger'
import { PLANS } from '../middleware/subscriptionGuard'
import { asyncHandler } from '../utils/asyncHandler'
import { NotFoundError, ValidationError, ConflictError } from '../errors'

const router = Router()

function getStripe(): any {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  const Stripe = require('stripe')
  return new Stripe(key)
}

router.get('/plans', (_req, res) => {
  const plans = Object.values(PLANS).map(p => ({
    name: p.name,
    label: p.label,
    labelAr: p.labelAr,
    price: p.price,
    maxUsers: p.maxUsers,
    maxBranches: p.maxBranches,
    features: p.features,
  }))
  res.json(plans)
})

router.get('/current', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const prisma: PrismaClient = req.app.get('prisma')
    const businessId = req.user!.businessId

    let sub = await (prisma as any).subscription.findUnique({ where: { businessId } })
    if (!sub) {
      sub = await (prisma as any).subscription.create({
        data: { businessId, plan: 'FREE', status: 'ACTIVE' },
      })
    }

    res.json({
      id: sub.id,
      plan: sub.plan,
      status: sub.status,
      trialEndsAt: sub.trialEndsAt,
      currentPeriodEnd: sub.currentPeriodEnd,
      maxUsers: sub.maxUsers,
      maxBranches: sub.maxBranches,
      features: sub.features ? (typeof sub.features === 'string' ? JSON.parse(sub.features) : sub.features) : PLANS[sub.plan as keyof typeof PLANS]?.features || [],
    })
}))

router.post('/create-checkout', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const prisma: PrismaClient = req.app.get('prisma')
    const stripe = getStripe()
    if (!stripe) throw new ValidationError('Stripe not configured')

    const { priceId, successUrl, cancelUrl } = req.body
    if (!priceId || !successUrl || !cancelUrl) {
      throw new ValidationError('priceId, successUrl, and cancelUrl required')
    }

    const businessId = req.user!.businessId
    let sub = await (prisma as any).subscription.findUnique({ where: { businessId } })

    let stripeCustomerId = sub?.stripeCustomerId
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        metadata: { businessId },
        name: req.user?.name || businessId,
      })
      stripeCustomerId = customer.id
      if (sub) {
        await (prisma as any).subscription.update({
          where: { businessId },
          data: { stripeCustomerId },
        })
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { businessId },
    })

    res.json({ url: session.url, sessionId: session.id })
}))

router.post('/portal', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const stripe = getStripe()
    if (!stripe) throw new ValidationError('Stripe not configured')

    const prisma: PrismaClient = req.app.get('prisma')
    const businessId = req.user!.businessId
    const sub = await (prisma as any).subscription.findUnique({ where: { businessId } })
    if (!sub?.stripeCustomerId) {
      throw new ValidationError('No Stripe customer found')
    }

    const { returnUrl } = req.body
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: returnUrl || process.env.FRONTEND_URL || 'http://localhost:5173',
    })

    res.json({ url: session.url })
}))

router.post('/cancel', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const stripe = getStripe()
    if (!stripe) throw new ValidationError('Stripe not configured')

    const prisma: PrismaClient = req.app.get('prisma')
    const businessId = req.user!.businessId
    const sub = await (prisma as any).subscription.findUnique({ where: { businessId } })
    if (!sub?.stripeSubscriptionId) {
      throw new ValidationError('No active subscription to cancel')
    }

    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: true,
    })

    await (prisma as any).subscription.update({
      where: { businessId },
      data: { status: 'CANCELED', canceledAt: new Date() },
    })

    res.json({ message: 'Subscription canceled' })
}))

export default router
