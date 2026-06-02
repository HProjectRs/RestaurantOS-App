import { describe, it, expect, jest } from '@jest/globals'
import { Prisma } from '@prisma/client'

jest.mock('../middleware/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import { updateWithOptimisticLock } from '../middleware/optimisticLock'

describe('updateWithOptimisticLock', () => {
  it('should succeed on first try', async () => {
    const result = await updateWithOptimisticLock(async () => 'success', 3)
    expect(result).toBe('success')
  })

  it('should retry on P2025 and succeed', async () => {
    let attempt = 0
    const result = await updateWithOptimisticLock(async () => {
      attempt++
      if (attempt < 3) {
        const err = new Prisma.PrismaClientKnownRequestError('Conflict', {
          code: 'P2025',
          clientVersion: '6.0.0',
        })
        throw err
      }
      return 'ok'
    }, 5)
    expect(result).toBe('ok')
    expect(attempt).toBe(3)
  })

  it('should throw after max retries', async () => {
    const err = new Prisma.PrismaClientKnownRequestError('Conflict', {
      code: 'P2025',
      clientVersion: '6.0.0',
    })
    await expect(updateWithOptimisticLock(async () => { throw err }, 2)).rejects.toThrow(/Optimistic lock failed/i)
  })

  it('should rethrow non-P2025 errors immediately', async () => {
    await expect(updateWithOptimisticLock(async () => { throw new Error('DB down') }, 3)).rejects.toThrow('DB down')
  })
})
