import { toCents, fromCents, safeAdd, safeSubtract, safeMultiply, safeDivide, formatMoney } from '../utils/cents'

describe('cents utilities', () => {
  describe('toCents', () => {
    it('converts decimal to cents', () => {
      expect(toCents(10.50)).toBe(1050)
    })
    it('handles whole numbers', () => {
      expect(toCents(10)).toBe(1000)
    })
    it('handles zero', () => {
      expect(toCents(0)).toBe(0)
    })
    it('avoids floating point errors', () => {
      expect(toCents(0.1 + 0.2)).toBe(30)
    })
  })

  describe('fromCents', () => {
    it('converts cents to decimal', () => {
      expect(fromCents(1050)).toBe(10.50)
    })
    it('handles zero', () => {
      expect(fromCents(0)).toBe(0)
    })
    it('rounds to 2 decimal places', () => {
      expect(fromCents(1055)).toBe(10.55)
    })
  })

  describe('safeAdd', () => {
    it('adds multiple amounts without floating point errors', () => {
      expect(safeAdd(0.1, 0.2)).toBe(0.3)
    })
    it('handles single amount', () => {
      expect(safeAdd(10.50)).toBe(10.50)
    })
    it('handles zero amounts', () => {
      expect(safeAdd(0, 0)).toBe(0)
    })
  })

  describe('safeSubtract', () => {
    it('subtracts without floating point errors', () => {
      expect(safeSubtract(0.3, 0.1)).toBe(0.2)
    })
    it('handles zero result', () => {
      expect(safeSubtract(10, 10)).toBe(0)
    })
  })

  describe('safeMultiply', () => {
    it('multiplies without floating point errors', () => {
      expect(safeMultiply(0.1, 3)).toBe(0.3)
    })
    it('handles zero', () => {
      expect(safeMultiply(10, 0)).toBe(0)
    })
  })

  describe('safeDivide', () => {
    it('divides without floating point errors', () => {
      expect(safeDivide(0.3, 3)).toBe(0.1)
    })
    it('returns 0 when dividing by zero', () => {
      expect(safeDivide(10, 0)).toBe(0)
    })
  })

  describe('formatMoney', () => {
    it('formats with currency', () => {
      expect(formatMoney(10.50)).toBe('10.50 SAR')
    })
    it('formats with custom currency', () => {
      expect(formatMoney(10.50, 'USD')).toBe('10.50 USD')
    })
    it('formats zero', () => {
      expect(formatMoney(0)).toBe('0.00 SAR')
    })
    it('formats negative amounts as absolute', () => {
      expect(formatMoney(-10.50)).toBe('10.50 SAR')
    })
  })
})
