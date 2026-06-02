import { describe, it, expect, vi, beforeEach } from 'vitest'

beforeEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('env config', () => {
  it('uses default values when no env vars set', async () => {
    vi.stubEnv('VITE_API_URL', '')
    vi.stubEnv('VITE_WS_URL', '')
    vi.stubEnv('VITE_SENTRY_DSN', '')
    vi.stubEnv('VITE_STRIPE_KEY', '')
    vi.stubEnv('VITE_APP_ENV', '')
    const mod = await import('../../config/env')
    expect(mod.VITE_API_URL).toBe('http://localhost:3001/api')
    expect(mod.VITE_WS_URL).toBe('ws://localhost:3001/ws')
    expect(mod.VITE_SENTRY_DSN).toBe('')
    expect(mod.VITE_STRIPE_KEY).toBe('')
    expect(mod.VITE_APP_ENV).toBe('development')
  })
  it('uses env vars when set', async () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:4000/api')
    vi.stubEnv('VITE_WS_URL', 'ws://localhost:4000/ws')
    vi.stubEnv('VITE_SENTRY_DSN', 'https://key@sentry.io/1')
    vi.stubEnv('VITE_STRIPE_KEY', 'pk_test_123')
    vi.stubEnv('VITE_APP_ENV', 'production')
    const mod = await import('../../config/env')
    expect(mod.VITE_API_URL).toBe('http://localhost:4000/api')
    expect(mod.VITE_WS_URL).toBe('ws://localhost:4000/ws')
    expect(mod.VITE_SENTRY_DSN).toBe('https://key@sentry.io/1')
    expect(mod.VITE_STRIPE_KEY).toBe('pk_test_123')
    expect(mod.VITE_APP_ENV).toBe('production')
  })
})
