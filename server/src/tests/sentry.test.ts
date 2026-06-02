import { describe, it, expect, jest } from '@jest/globals'

jest.mock('@sentry/node', () => ({
  init: jest.fn(),
  setupExpressErrorHandler: jest.fn(),
  captureException: jest.fn(),
  default: { init: jest.fn(), setupExpressErrorHandler: jest.fn(), captureException: jest.fn() },
}))

jest.mock('@sentry/profiling-node', () => ({
  nodeProfilingIntegration: jest.fn(() => ({ name: 'profiling' })),
}))

describe('Sentry', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  it('should initialize Sentry when DSN is set', () => {
    process.env.SENTRY_DSN = 'https://key@o0.ingest.sentry.io/0'
    process.env.NODE_ENV = 'production'
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

    const { initSentry } = require('../sentry')
    const Sentry = require('@sentry/node')
    const app = { use: jest.fn() } as any
    initSentry(app)

    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({ dsn: 'https://key@o0.ingest.sentry.io/0', environment: 'production' })
    )
    warnSpy.mockRestore()
  })

  it('should warn when SENTRY_DSN is not set', () => {
    delete process.env.SENTRY_DSN
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

    const { initSentry } = require('../sentry')
    const app = { use: jest.fn() } as any
    initSentry(app)

    expect(warnSpy).toHaveBeenCalledWith('SENTRY_DSN not set — Sentry error monitoring disabled')
    warnSpy.mockRestore()
  })

  it('should setup Sentry error handler', () => {
    const { setupSentryErrorHandler } = require('../sentry')
    const Sentry = require('@sentry/node')
    const app = { use: jest.fn() } as any
    setupSentryErrorHandler(app)
    expect(Sentry.setupExpressErrorHandler).toHaveBeenCalledWith(app)
  })
})
