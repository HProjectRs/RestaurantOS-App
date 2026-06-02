import { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'
import { AppError } from '../errors'
import { logger } from './logger'

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message, code: err.code })
    return
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'Resource already exists', code: 'CONFLICT' })
      return
    }
    if (err.code === 'P2003') {
      res.status(400).json({ error: 'Invalid reference', code: 'INVALID_REFERENCE' })
      return
    }
  }

  logger.error('Unhandled error', { error: err.message, stack: err.stack })
  res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
}
