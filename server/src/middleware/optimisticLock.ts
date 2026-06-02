import { Prisma } from '@prisma/client'
import { logger } from './logger'

export async function updateWithOptimisticLock<T>(
  updateFn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let retries = 0

  while (retries < maxRetries) {
    try {
      return await updateFn()
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2025') {
          retries++
          if (retries >= maxRetries) {
            throw new Error(`Optimistic lock failed after ${maxRetries} retries`)
          }
          const delay = Math.pow(2, retries) * 100
          logger.warn('Optimistic lock conflict, retrying', { retry: retries, delay: `${delay}ms` })
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
      }
      throw err
    }
  }

  throw new Error('Optimistic lock failed: max retries exceeded')
}
