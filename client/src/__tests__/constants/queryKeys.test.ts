import { describe, it, expect } from 'vitest'
import { queryKeys } from '../../constants/queryKeys'

describe('queryKeys', () => {
  it('should have orders keys', () => {
    expect(queryKeys.orders.all).toEqual(['orders'])
    expect(queryKeys.orders.list({ status: 'pending' })).toEqual(['orders', 'list', { status: 'pending' }])
    expect(queryKeys.orders.detail('123')).toEqual(['orders', 'detail', '123'])
  })

  it('should have menu keys', () => {
    expect(queryKeys.menu.all).toEqual(['menu'])
    expect(queryKeys.menu.categories).toEqual(['menu', 'categories'])
    expect(queryKeys.menu.category('c1')).toEqual(['menu', 'category', 'c1'])
    expect(queryKeys.menu.items({ cat: 'Drinks' })).toEqual(['menu', 'items', { cat: 'Drinks' }])
    expect(queryKeys.menu.item('i1')).toEqual(['menu', 'item', 'i1'])
  })

  it('should have inventory keys', () => {
    expect(queryKeys.inventory.all).toEqual(['inventory'])
    expect(queryKeys.inventory.list({ low: true })).toEqual(['inventory', 'list', { low: true }])
    expect(queryKeys.inventory.item('inv-1')).toEqual(['inventory', 'item', 'inv-1'])
    expect(queryKeys.inventory.lowStock).toEqual(['inventory', 'lowStock'])
    expect(queryKeys.inventory.movements('inv-1')).toEqual(['inventory', 'movements', 'inv-1'])
  })

  it('should have customers keys', () => {
    expect(queryKeys.customers.all).toEqual(['customers'])
    expect(queryKeys.customers.list({ page: 1 })).toEqual(['customers', 'list', { page: 1 }])
    expect(queryKeys.customers.detail('c1')).toEqual(['customers', 'detail', 'c1'])
  })

  it('should have employees keys', () => {
    expect(queryKeys.employees.all).toEqual(['employees'])
    expect(queryKeys.employees.list({ role: 'chef' })).toEqual(['employees', 'list', { role: 'chef' }])
    expect(queryKeys.employees.detail('e1')).toEqual(['employees', 'detail', 'e1'])
  })

  it('should have tables keys', () => {
    expect(queryKeys.tables.all).toEqual(['tables'])
    expect(queryKeys.tables.available).toEqual(['tables', 'available'])
  })

  it('should have reports keys', () => {
    expect(queryKeys.reports.sales({ from: '2026-01-01' })).toEqual(['reports', 'sales', { from: '2026-01-01' }])
    expect(queryKeys.reports.inventory({ id: 'inv-1' })).toEqual(['reports', 'inventory', { id: 'inv-1' }])
    expect(queryKeys.reports.financial({ year: 2026 })).toEqual(['reports', 'financial', { year: 2026 }])
  })

  it('should have accounting keys', () => {
    expect(queryKeys.accounting.transactions({ account: 'acc-1' })).toEqual(['accounting', 'transactions', { account: 'acc-1' }])
    expect(queryKeys.accounting.summary({ month: 5 })).toEqual(['accounting', 'summary', { month: 5 }])
  })

  it('should have settings keys', () => {
    expect(queryKeys.settings.all).toEqual(['settings'])
    expect(queryKeys.settings.restaurant).toEqual(['settings', 'restaurant'])
  })

  it('should have distinct root keys', () => {
    const roots = [queryKeys.orders, queryKeys.menu, queryKeys.inventory, queryKeys.customers, queryKeys.employees, queryKeys.tables]
    roots.forEach(r => {
      expect(r.all).toBeDefined()
      expect(Array.isArray(r.all)).toBe(true)
    })
    const functionalRoots = [queryKeys.reports, queryKeys.accounting, queryKeys.settings]
    functionalRoots.forEach(r => {
      expect(Object.keys(r).length).toBeGreaterThan(0)
    })
  })
})
