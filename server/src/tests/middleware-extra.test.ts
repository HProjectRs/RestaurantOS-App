import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { Request, Response, NextFunction } from 'express'



describe('correlationId', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let next: jest.Mock

  beforeEach(() => {
    res = { setHeader: jest.fn() }
    next = jest.fn()
  })

  it('should use existing x-correlation-id header', () => {
    req = { headers: { 'x-correlation-id': 'existing-id' } } as any
    const { correlationId } = require('../middleware/correlationId')
    correlationId(req as Request, res as Response, next as NextFunction)
    expect((req as any).correlationId).toBe('existing-id')
    expect(res.setHeader).toHaveBeenCalledWith('x-correlation-id', 'existing-id')
    expect(next).toHaveBeenCalled()
  })

  it('should generate UUID when no correlation id header', () => {
    req = { headers: {} } as any
    const { correlationId } = require('../middleware/correlationId')
    correlationId(req as Request, res as Response, next as NextFunction)
    expect((req as any).correlationId).toBeDefined()
    expect(typeof (req as any).correlationId).toBe('string')
    expect(res.setHeader).toHaveBeenCalledWith('x-correlation-id', (req as any).correlationId)
    expect(next).toHaveBeenCalled()
  })
})

describe('cacheControl', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let next: jest.Mock

  beforeEach(() => {
    req = {} as any
    res = { setHeader: jest.fn() }
    next = jest.fn()
  })

  it('should set Cache-Control with default max-age', () => {
    const { cacheControl } = require('../middleware/cacheControl')
    cacheControl()(req as Request, res as Response, next as NextFunction)
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
    expect(next).toHaveBeenCalled()
  })

  it('should set Cache-Control with custom max-age', () => {
    const { cacheControl } = require('../middleware/cacheControl')
    cacheControl(300)(req as Request, res as Response, next as NextFunction)
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
    expect(next).toHaveBeenCalled()
  })

  it('should set no-store when CACHE_DISABLED is true', () => {
    process.env.CACHE_DISABLED = 'true'
    const { cacheControl } = require('../middleware/cacheControl')
    cacheControl()(req as Request, res as Response, next as NextFunction)
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store')
    expect(next).toHaveBeenCalled()
    delete process.env.CACHE_DISABLED
  })
})

describe('asyncHandler', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let next: jest.Mock

  beforeEach(() => {
    req = {} as any
    res = {} as any
    next = jest.fn()
  })

  it('should call next on successful handler', async () => {
    const { asyncHandler } = require('../utils/asyncHandler')
    const handler = asyncHandler(async (_req, _res, _next) => {
      return 'done'
    })
    await handler(req as Request, res as Response, next as NextFunction)
    expect(next).not.toHaveBeenCalled()
  })

  it('should call next with error when handler throws', async () => {
    const { asyncHandler } = require('../utils/asyncHandler')
    const error = new Error('test error')
    const handler = asyncHandler(async (_req, _res, _next) => {
      throw error
    })
    await handler(req as Request, res as Response, next as NextFunction)
    expect(next).toHaveBeenCalledWith(error)
  })
})

describe('requestLogger', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let next: jest.Mock

  beforeEach(() => {
    req = {
      method: 'GET',
      path: '/test',
      ip: '127.0.0.1',
      correlationId: 'corr-1',
      user: { id: 'user-1' },
    } as any
    res = {
      on: jest.fn(),
      statusCode: 200,
    } as any
    next = jest.fn()
  })

  it('should log request on finish', () => {
    const { requestLogger, logger } = require('../middleware/logger')
    requestLogger(req as Request, res as Response, next as NextFunction)
    expect(next).toHaveBeenCalled()
    expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function))
  })

  it('should log warning for 4xx responses', () => {
    res.statusCode = 400
    const { requestLogger } = require('../middleware/logger')
    requestLogger(req as Request, res as Response, next as NextFunction)
    expect(next).toHaveBeenCalled()
  })
})
