import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate, formatTime, formatPhone, formatPercentage } from '../../utils/formatters'

describe('formatCurrency', () => {
  it('formats with SAR by default', () => {
    const result = formatCurrency(1234.5)
    expect(result).toBeTruthy()
  })
  it('formats with custom currency', () => {
    const result = formatCurrency(100, 'USD')
    expect(result).toBeTruthy()
  })
  it('handles null/undefined', () => {
    expect(formatCurrency(null)).toBeTruthy()
    expect(formatCurrency(undefined)).toBeTruthy()
  })
})

describe('formatDate', () => {
  it('returns a date string for falsy input (epoch)', () => {
    expect(formatDate(null)).toBeTruthy()
    expect(formatDate(undefined)).toBeTruthy()
    expect(formatDate('')).toBeTruthy()
  })
  it('formats short date by default', () => {
    const result = formatDate('2024-03-15')
    expect(result).toBeTruthy()
  })
  it('formats long date', () => {
    const result = formatDate('2024-03-15', 'long')
    expect(result).toBeTruthy()
  })
})

describe('formatTime', () => {
  it('returns a time string for falsy input (epoch)', () => {
    expect(formatTime(null)).toBeTruthy()
    expect(formatTime('')).toBeTruthy()
  })
  it('formats time', () => {
    const result = formatTime('2024-03-15T14:30:00')
    expect(result).toBeTruthy()
  })
})

describe('formatPhone', () => {
  it('returns empty for falsy input', () => {
    expect(formatPhone(null)).toBe('')
    expect(formatPhone('')).toBe('')
  })
  it('formats 10-digit phone', () => {
    const result = formatPhone('0555123456')
    expect(result.length).toBeGreaterThan(0)
    expect(result).not.toContain('0555123456')
  })
  it('formats 9-digit phone', () => {
    const result = formatPhone('555123456')
    expect(result.length).toBeGreaterThan(0)
    expect(result).not.toContain('555123456')
  })
  it('returns raw for unrecognized', () => {
    expect(formatPhone('123')).toBe('123')
  })
})

describe('formatPercentage', () => {
  it('formats percentage', () => {
    expect(formatPercentage(25.5)).toBe('25.5%')
    expect(formatPercentage(0)).toBe('0.0%')
  })
  it('handles null', () => {
    expect(formatPercentage(null)).toBe('0.0%')
    expect(formatPercentage(NaN)).toBe('0.0%')
  })
})
