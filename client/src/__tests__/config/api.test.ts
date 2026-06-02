import { describe, it, expect } from 'vitest'
import { BASE_URL, TIMEOUT, API, SOCKET_URL } from '../../config/api'

describe('API config', () => {
  it('exports constants', () => {
    expect(BASE_URL).toBe('/api')
    expect(TIMEOUT).toBe(30000)
  })
  it('exports socket URL', () => {
    expect(SOCKET_URL).toBeTruthy()
  })
  it('exports AUTH endpoints', () => {
    expect(API.AUTH.LOGIN).toBe('/api/auth/login')
    expect(API.AUTH.REFRESH).toBe('/api/auth/refresh')
    expect(API.AUTH.ME).toBe('/api/auth/me')
  })
  it('exports MENU endpoints', () => {
    expect(API.MENU.CATEGORIES).toBe('/api/menu/categories')
    expect(API.MENU.ITEMS).toBe('/api/menu/items')
  })
  it('exports ORDERS endpoints', () => {
    expect(API.ORDERS.BASE).toBe('/api/orders')
    expect(API.ORDERS.ACTIVE).toBe('/api/orders/active')
  })
  it('exports EMPLOYEES endpoints', () => {
    expect(API.EMPLOYEES.BASE).toBe('/api/employees')
    expect(API.EMPLOYEES.PAYROLL).toBe('/api/employees/payroll')
  })
  it('exports DELIVERY endpoints', () => {
    expect(API.DELIVERY.DRIVERS).toBe('/api/delivery/drivers')
    expect(API.DELIVERY.ZONES).toBe('/api/delivery/zones')
    expect(API.DELIVERY.DELIVERIES).toBe('/api/delivery/deliveries')
  })
  it('exports LOYALTY endpoints', () => {
    expect(API.LOYALTY.CUSTOMERS).toBe('/api/loyalty/customers')
  })
  it('exports REPORTS endpoints', () => {
    expect(API.REPORTS.SALES).toBe('/api/reports/sales')
    expect(API.REPORTS.PEAK_HOURS).toBe('/api/reports/peak-hours')
  })
})
