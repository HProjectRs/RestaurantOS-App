import { Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthRequest } from '../types'
import { logger } from './logger'

export type PlanName = 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE'

export interface PlanConfig {
  name: PlanName
  label: string
  labelAr: string
  price: number // monthly USD
  maxUsers: number
  maxBranches: number
  features: string[]
  stripePriceId?: string
}

export const PLANS: Record<PlanName, PlanConfig> = {
  FREE: {
    name: 'FREE',
    label: 'Free',
    labelAr: 'مجاني',
    price: 0,
    maxUsers: 1,
    maxBranches: 1,
    features: ['Basic POS', 'Menu management', 'Up to 50 orders/month'],
  },
  BASIC: {
    name: 'BASIC',
    label: 'Basic',
    labelAr: 'أساسي',
    price: 199,
    maxUsers: 3,
    maxBranches: 1,
    features: ['Everything in Free', 'Unlimited orders', 'Kitchen display', 'Basic reports'],
    stripePriceId: process.env.STRIPE_PRICE_BASIC,
  },
  PRO: {
    name: 'PRO',
    label: 'Professional',
    labelAr: 'احترافي',
    price: 499,
    maxUsers: 10,
    maxBranches: 3,
    features: ['Everything in Basic', 'Advanced reports', 'Inventory management', 'Employee management', 'API access'],
    stripePriceId: process.env.STRIPE_PRICE_PRO,
  },
  ENTERPRISE: {
    name: 'ENTERPRISE',
    label: 'Enterprise',
    labelAr: 'مؤسسة',
    price: 999,
    maxUsers: 999,
    maxBranches: 99,
    features: ['Everything in Pro', 'Dedicated support', 'Custom features', 'On-premise option', 'Priority SLA'],
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE,
  },
}

export function requireSubscription(minPlan: PlanName = 'FREE') {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const prisma: PrismaClient = req.app.get('prisma')
      const businessId = req.user?.businessId
      if (!businessId) return res.status(401).json({ error: 'Authentication required' })

      const sub = await (prisma as any).subscription.findUnique({ where: { businessId } })
      if (!sub || sub.status === 'EXPIRED') {
        return res.status(402).json({ error: 'No active subscription', code: 'SUBSCRIPTION_REQUIRED' })
      }
      if (sub.status === 'CANCELED') {
        return res.status(402).json({ error: 'Subscription canceled', code: 'SUBSCRIPTION_CANCELED' })
      }
      if (sub.status === 'PAST_DUE') {
        return res.status(402).json({ error: 'Payment required', code: 'SUBSCRIPTION_PAST_DUE' })
      }

      const planRank: Record<string, number> = { FREE: 0, BASIC: 1, PRO: 2, ENTERPRISE: 3 }
      if (planRank[sub.plan] < (planRank[minPlan] || 0)) {
        return res.status(403).json({
          error: `Upgrade to ${minPlan} plan required`,
          code: 'PLAN_UPGRADE_REQUIRED',
          requiredPlan: minPlan,
        })
      }

      next()
    } catch (err) {
      logger.error('Subscription guard error', { error: err })
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}
