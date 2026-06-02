import { describe, it, expect } from 'vitest'
import { ORDER_STATUS, ORDER_FLOW } from '../../constants/orderStatus'

describe('ORDER_STATUS', () => {
  it('should have all required statuses', () => {
    const values = ORDER_STATUS.map(s => s.value)
    expect(values).toContain('pending')
    expect(values).toContain('preparing')
    expect(values).toContain('ready')
    expect(values).toContain('served')
    expect(values).toContain('paid')
    expect(values).toContain('cancelled')
    expect(values).toContain('void')
  })

  it('should have labels for all statuses', () => {
    ORDER_STATUS.forEach(s => {
      expect(s.label).toBeDefined()
      expect(s.label.length).toBeGreaterThan(0)
    })
  })

  it('should have colors for all statuses', () => {
    ORDER_STATUS.forEach(s => {
      expect(s.color).toMatch(/^#[0-9a-fA-F]{6}$/)
    })
  })

  it('should have 7 statuses', () => {
    expect(ORDER_STATUS).toHaveLength(7)
  })
})

describe('ORDER_FLOW', () => {
  it('should define the correct order flow', () => {
    expect(ORDER_FLOW).toEqual(['pending', 'preparing', 'ready', 'served', 'paid'])
  })

  it('should not include cancelled or void', () => {
    expect(ORDER_FLOW).not.toContain('cancelled')
    expect(ORDER_FLOW).not.toContain('void')
  })
})
