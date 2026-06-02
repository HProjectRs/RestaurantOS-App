import { describe, it, expect } from 'vitest'
import { ROLE_HIERARCHY, ROLE_LABELS } from '../../constants/roles'

describe('ROLE_HIERARCHY', () => {
  it('should have SUPER_ADMIN with highest level', () => {
    expect(ROLE_HIERARCHY.SUPER_ADMIN).toBe(100)
  })

  it('should have ADMIN with level 80', () => {
    expect(ROLE_HIERARCHY.ADMIN).toBe(80)
  })

  it('should have CHEF with lowest level', () => {
    const levels = Object.values(ROLE_HIERARCHY)
    expect(Math.min(...levels)).toBe(ROLE_HIERARCHY.CHEF)
  })

  it('should have strictly decreasing hierarchy', () => {
    expect(ROLE_HIERARCHY.SUPER_ADMIN).toBeGreaterThan(ROLE_HIERARCHY.ADMIN)
    expect(ROLE_HIERARCHY.ADMIN).toBeGreaterThan(ROLE_HIERARCHY.MANAGER)
    expect(ROLE_HIERARCHY.MANAGER).toBeGreaterThan(ROLE_HIERARCHY.CASHIER)
    expect(ROLE_HIERARCHY.CASHIER).toBeGreaterThan(ROLE_HIERARCHY.WAITER)
    expect(ROLE_HIERARCHY.WAITER).toBeGreaterThan(ROLE_HIERARCHY.CHEF)
  })

  it('should have 6 roles', () => {
    expect(Object.keys(ROLE_HIERARCHY)).toHaveLength(6)
  })
})

describe('ROLE_LABELS', () => {
  it('should have Arabic labels for all non-SUPER_ADMIN roles', () => {
    expect(ROLE_LABELS.ADMIN).toBe('مدير')
    expect(ROLE_LABELS.MANAGER).toBe('مدير تنفيذي')
    expect(ROLE_LABELS.CASHIER).toBe('كاشير')
    expect(ROLE_LABELS.WAITER).toBe('نادل')
    expect(ROLE_LABELS.CHEF).toBe('شيف')
  })

  it('should have labels for 5 roles', () => {
    expect(Object.keys(ROLE_LABELS)).toHaveLength(5)
  })

  it('should not have SUPER_ADMIN label', () => {
    expect(ROLE_LABELS).not.toHaveProperty('SUPER_ADMIN')
  })
})
