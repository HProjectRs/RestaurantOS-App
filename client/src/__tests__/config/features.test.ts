import { describe, it, expect } from 'vitest'
import { FEATURES } from '../../config/features'

describe('FEATURES', () => {
  it('should have delivery enabled', () => {
    expect(FEATURES.delivery).toBe(true)
  })

  it('should have loyalty enabled', () => {
    expect(FEATURES.loyalty).toBe(true)
  })

  it('should have catering disabled', () => {
    expect(FEATURES.catering).toBe(false)
  })

  it('should have multiBranch disabled', () => {
    expect(FEATURES.multiBranch).toBe(false)
  })

  it('should have wifiPortal enabled', () => {
    expect(FEATURES.wifiPortal).toBe(true)
  })

  it('should have onlineOrdering enabled', () => {
    expect(FEATURES.onlineOrdering).toBe(true)
  })

  it('should have autoPO disabled', () => {
    expect(FEATURES.autoPO).toBe(false)
  })

  it('should have 7 features defined', () => {
    expect(Object.keys(FEATURES)).toHaveLength(7)
  })

  it('should only have boolean values', () => {
    Object.values(FEATURES).forEach(v => {
      expect(typeof v).toBe('boolean')
    })
  })
})
