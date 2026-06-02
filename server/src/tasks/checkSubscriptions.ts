import { PrismaClient } from '@prisma/client'
import { logger } from '../middleware/logger'
import cron from 'node-cron'

export async function checkSubscriptionExpirations(prisma: PrismaClient) {
  try {
    const now = new Date()

    const expired = await (prisma as any).subscription.findMany({
      where: {
        currentPeriodEnd: { lt: now },
        status: { notIn: ['EXPIRED', 'CANCELED'] },
      },
    })

    if (expired.length === 0) return

    logger.info(`Found ${expired.length} expired subscriptions`)

    await (prisma as any).subscription.updateMany({
      where: {
        currentPeriodEnd: { lt: now },
        status: { notIn: ['EXPIRED', 'CANCELED'] },
      },
      data: { status: 'EXPIRED' },
    })

    for (const sub of expired) {
      logger.info(`Subscription expired for business: ${sub.businessId}`, {
        businessId: sub.businessId,
        plan: sub.plan,
        endedAt: sub.currentPeriodEnd,
      })
    }
  } catch (err) {
    logger.error('Subscription expiration check error', { error: err })
  }
}

export function startSubscriptionCron(prisma: PrismaClient) {
  cron.schedule('0 0 * * *', () => {
    logger.info('Running subscription expiration check...')
    checkSubscriptionExpirations(prisma)
  })

  logger.info('Subscription cron job registered (daily at midnight)')
}
