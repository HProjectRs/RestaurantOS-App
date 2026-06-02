import { describe, it, expect, jest, afterAll } from '@jest/globals'

const originalEnv = { ...process.env }

afterAll(() => {
  process.env = { ...originalEnv }
})

describe('validateEnv', () => {
  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  it('should pass when all required vars are set with secure values', () => {
    process.env.JWT_SECRET = 'a-very-long-and-secure-jwt-secret-32-chars-min'
    process.env.REFRESH_SECRET = 'a-very-long-and-secure-refresh-secret-32-chars-min'
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'
    process.env.NODE_ENV = 'development'
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any)
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

    const { validateEnv } = require('../check-env')
    validateEnv()

    expect(exitSpy).not.toHaveBeenCalled()
    exitSpy.mockRestore()
    errorSpy.mockRestore()
    warnSpy.mockRestore()
    logSpy.mockRestore()
  })

  it('should exit when JWT_SECRET is missing', () => {
    delete process.env.JWT_SECRET
    process.env.REFRESH_SECRET = 'a-very-long-and-secure-refresh-secret-32-chars-min'
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any)
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const { validateEnv } = require('../check-env')
    validateEnv()

    expect(exitSpy).toHaveBeenCalledWith(1)
    exitSpy.mockRestore()
    errorSpy.mockRestore()
  })

  it('should exit when DATABASE_URL is missing', () => {
    process.env.JWT_SECRET = 'a-very-long-and-secure-jwt-secret-32-chars-min'
    process.env.REFRESH_SECRET = 'a-very-long-and-secure-refresh-secret-32-chars-min'
    delete process.env.DATABASE_URL
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any)
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const { validateEnv } = require('../check-env')
    validateEnv()

    expect(exitSpy).toHaveBeenCalledWith(1)
    exitSpy.mockRestore()
    errorSpy.mockRestore()
  })

  it('should exit when JWT_SECRET is a default value', () => {
    process.env.NODE_ENV = 'development'
    process.env.JWT_SECRET = 'change-me'
    process.env.REFRESH_SECRET = 'a-very-long-and-secure-refresh-secret-32-chars-min'
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any)
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const { validateEnv } = require('../check-env')
    validateEnv()

    expect(exitSpy).toHaveBeenCalledWith(1)
    exitSpy.mockRestore()
    errorSpy.mockRestore()
  })

  it('should exit when DATABASE_URL has invalid prefix', () => {
    process.env.JWT_SECRET = 'a-very-long-and-secure-jwt-secret-32-chars-min'
    process.env.REFRESH_SECRET = 'a-very-long-and-secure-refresh-secret-32-chars-min'
    process.env.DATABASE_URL = 'mysql://user:pass@localhost:5432/db'
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any)
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const { validateEnv } = require('../check-env')
    validateEnv()

    expect(exitSpy).toHaveBeenCalledWith(1)
    exitSpy.mockRestore()
    errorSpy.mockRestore()
  })

  it('should skip default check for test environment', () => {
    process.env.JWT_SECRET = 'test-jwt-secret'
    process.env.REFRESH_SECRET = 'test-refresh-secret'
    process.env.DATABASE_URL = 'file:./dev.db'
    process.env.NODE_ENV = 'test'
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any)
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

    const { validateEnv } = require('../check-env')
    validateEnv()

    expect(exitSpy).not.toHaveBeenCalled()
    exitSpy.mockRestore()
    errorSpy.mockRestore()
    warnSpy.mockRestore()
    logSpy.mockRestore()
  })

  it('should warn about optional vars when missing', () => {
    process.env.JWT_SECRET = 'a-very-long-and-secure-jwt-secret-32-chars-min'
    process.env.REFRESH_SECRET = 'a-very-long-and-secure-refresh-secret-32-chars-min'
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'
    process.env.NODE_ENV = 'production'
    delete process.env.SENTRY_DSN
    delete process.env.STRIPE_SECRET_KEY
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any)
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

    const { validateEnv } = require('../check-env')
    validateEnv()

    expect(warnSpy).toHaveBeenCalled()
    expect(exitSpy).not.toHaveBeenCalled()
    exitSpy.mockRestore()
    warnSpy.mockRestore()
    logSpy.mockRestore()
  })

  it('should enforce PostgreSQL in production', () => {
    process.env.JWT_SECRET = 'a-very-long-and-secure-jwt-secret-32-chars-min'
    process.env.REFRESH_SECRET = 'a-very-long-and-secure-refresh-secret-32-chars-min'
    process.env.DATABASE_URL = 'file:./dev.db'
    process.env.NODE_ENV = 'production'
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any)
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const { validateEnv } = require('../check-env')
    validateEnv()

    expect(exitSpy).toHaveBeenCalledWith(1)
    exitSpy.mockRestore()
    errorSpy.mockRestore()
  })
})
