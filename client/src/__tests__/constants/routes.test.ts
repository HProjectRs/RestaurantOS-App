import { describe, it, expect } from 'vitest'
import { ROUTES } from '../../constants/routes'

describe('ROUTES', () => {
  it('should have all basic routes defined', () => {
    expect(ROUTES.LOGIN).toBe('/login')
    expect(ROUTES.DASHBOARD).toBe('/admin')
    expect(ROUTES.POS).toBe('/admin/pos')
    expect(ROUTES.ORDERS).toBe('/admin/orders')
    expect(ROUTES.PUBLIC_MENU).toBe('/menu')
    expect(ROUTES.KDS).toBe('/admin/kds')
    expect(ROUTES.REPORTS).toBe('/admin/reports')
    expect(ROUTES.SETTINGS).toBe('/admin/settings')
    expect(ROUTES.TABLES).toBe('/admin/tables')
  })

  it('should generate dynamic routes correctly', () => {
    expect(ROUTES.ORDER_DETAIL('123')).toBe('/admin/orders/123')
    expect(ROUTES.MENU_CATEGORY('cat-1')).toBe('/admin/menu/category/cat-1')
    expect(ROUTES.MENU_ITEM('item-1')).toBe('/admin/menu/item/item-1')
    expect(ROUTES.INVENTORY_ITEM('inv-1')).toBe('/admin/inventory/inv-1')
    expect(ROUTES.CUSTOMER_DETAIL('cust-1')).toBe('/admin/customers/cust-1')
    expect(ROUTES.HR_EMPLOYEE('emp-1')).toBe('/admin/hr/emp-1')
  })

  it('should handle special characters in dynamic routes', () => {
    expect(ROUTES.ORDER_DETAIL('')).toBe('/admin/orders/')
    expect(ROUTES.MENU_ITEM('a/b')).toBe('/admin/menu/item/a/b')
  })

  it('should have routes for all major modules', () => {
    const routeValues = Object.values(ROUTES).map(r => (typeof r === 'function' ? r('x') : r))
    expect(routeValues.some(r => r.startsWith('/admin/pos'))).toBe(true)
    expect(routeValues.some(r => r.startsWith('/admin/inventory'))).toBe(true)
    expect(routeValues.some(r => r.startsWith('/admin/accounting'))).toBe(true)
    expect(routeValues.some(r => r.startsWith('/admin/suppliers'))).toBe(true)
    expect(routeValues.some(r => r.startsWith('/admin/profile'))).toBe(true)
  })

  it('should have at least 20 routes', () => {
    expect(Object.keys(ROUTES).length).toBeGreaterThanOrEqual(20)
  })
})
