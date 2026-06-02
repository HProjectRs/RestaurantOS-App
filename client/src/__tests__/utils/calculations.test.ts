import { describe, it, expect } from 'vitest'
import { calcIRG, calcCNAS, calcFoodCost, calcPrimeCost, calcProfitMargin } from '../../utils/calculations'

describe('calcIRG', () => {
  it('returns 0 for salary <= 500', () => {
    expect(calcIRG(0)).toBe(0)
    expect(calcIRG(500)).toBe(0)
  })
  it('calculates 15% above 500', () => {
    expect(calcIRG(1000)).toBe(75) // (1000-500)*0.15
    expect(calcIRG(1500)).toBe(150) // (1500-500)*0.15
  })
  it('calculates 25% between 1500 and 3000', () => {
    expect(calcIRG(2000)).toBe(275) // 150 + (2000-1500)*0.25
    expect(calcIRG(3000)).toBe(525) // 150 + (3000-1500)*0.25
  })
  it('calculates 35% above 3000', () => {
    expect(calcIRG(4000)).toBe(875) // 525 + (4000-3000)*0.35
  })
})

describe('calcCNAS', () => {
  it('returns 9% of gross salary', () => {
    expect(calcCNAS(1000)).toBe(90)
    expect(calcCNAS(50000)).toBe(4500)
    expect(calcCNAS(0)).toBe(0)
  })
})

describe('calcFoodCost', () => {
  it('calculates percentage', () => {
    expect(calcFoodCost(30, 100)).toBe(30)
    expect(calcFoodCost(50, 200)).toBe(25)
  })
  it('returns 0 when no selling price', () => {
    expect(calcFoodCost(30, 0)).toBe(0)
    expect(calcFoodCost(30, null)).toBe(0)
  })
})

describe('calcPrimeCost', () => {
  it('calculates prime cost percentage', () => {
    expect(calcPrimeCost(30, 20, 100)).toBe(50)
    expect(calcPrimeCost(100, 100, 400)).toBe(50)
  })
  it('returns 0 when no revenue', () => {
    expect(calcPrimeCost(30, 20, 0)).toBe(0)
    expect(calcPrimeCost(30, 20, null)).toBe(0)
  })
})

describe('calcProfitMargin', () => {
  it('calculates profit margin percentage', () => {
    expect(calcProfitMargin(100, 60)).toBe(40)
    expect(calcProfitMargin(200, 150)).toBe(25)
  })
  it('returns 0 when no revenue', () => {
    expect(calcProfitMargin(0, 60)).toBe(0)
    expect(calcProfitMargin(null, 60)).toBe(0)
  })
})
