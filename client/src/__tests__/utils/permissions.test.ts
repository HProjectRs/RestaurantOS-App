import { describe, it, expect } from 'vitest'
import { canAccess } from '../../utils/permissions'

describe('canAccess', () => {
  it('allows ADMIN orders access', () => {
    expect(canAccess('ADMIN', 'orders')).toBe(true)
    expect(canAccess('ADMIN', 'settings')).toBe(true)
    expect(canAccess('ADMIN', 'menu')).toBe(true)
  })
  it('allows WAITER limited access', () => {
    expect(canAccess('WAITER', 'orders')).toBe(true)
    expect(canAccess('WAITER', 'tables')).toBe(true)
    expect(canAccess('WAITER', 'reports')).toBe(false)
    expect(canAccess('WAITER', 'settings')).toBe(false)
  })
  it('allows CHEF kds access', () => {
    expect(canAccess('CHEF', 'kds')).toBe(true)
    expect(canAccess('CHEF', 'orders')).toBe(false)
    expect(canAccess('CHEF', 'menu')).toBe(false)
  })
  it('returns false for missing role', () => {
    expect(canAccess('', 'orders')).toBe(false)
    expect(canAccess(null, 'orders')).toBe(false)
  })
  it('returns false for missing module', () => {
    expect(canAccess('ADMIN', null)).toBe(false)
    expect(canAccess('ADMIN', '')).toBe(false)
  })
  it('returns false for invalid module', () => {
    expect(canAccess('ADMIN', 'nonexistent')).toBe(false)
  })
  it('returns false for invalid action', () => {
    expect(canAccess('ADMIN', 'orders', 'fly')).toBe(false)
  })
  it('defaults action to view', () => {
    expect(canAccess('CASHIER', 'reports')).toBe(true)
    expect(canAccess('WAITER', 'reports')).toBe(false)
  })
  it('handles VIEWER role that has no permissions', () => {
    expect(canAccess('VIEWER', 'orders')).toBe(false)
  })
})
