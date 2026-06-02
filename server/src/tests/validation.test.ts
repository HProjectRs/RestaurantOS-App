import { describe, it, expect } from '@jest/globals'
import {
  createOrderSchema,
  updateOrderStatusSchema,
  updatePaymentSchema,
  addItemsSchema,
  splitBillSchema,
  callWaiterSchema,
  menuItemSchema,
  menuCategorySchema,
} from '../schemas'

describe('createOrderSchema', () => {
  it('should accept valid order data', () => {
    const data = {
      businessId: 'biz-1',
      items: [{ menuItemId: 'item-1', quantity: 2 }],
      type: 'DINE_IN',
    }
    const result = createOrderSchema.parse(data)
    expect(result.businessId).toBe(data.businessId)
    expect(result.items).toHaveLength(1)
  })

  it('should reject missing businessId', () => {
    const data = { items: [{ menuItemId: 'item-1', quantity: 1 }] }
    expect(() => createOrderSchema.parse(data)).toThrow()
  })

  it('should reject empty items', () => {
    const data = { businessId: 'biz-1', items: [] }
    expect(() => createOrderSchema.parse(data)).toThrow()
  })

  it('should reject negative quantity', () => {
    const data = { businessId: 'biz-1', items: [{ menuItemId: 'item-1', quantity: -1 }] }
    expect(() => createOrderSchema.parse(data)).toThrow()
  })

  it('should reject invalid order type', () => {
    const data = { businessId: 'biz-1', items: [{ menuItemId: 'item-1', quantity: 1 }], type: 'INVALID' }
    expect(() => createOrderSchema.parse(data)).toThrow()
  })

  it('should accept all optional fields', () => {
    const data = {
      businessId: 'biz-1',
      tableId: 'table-1',
      customerName: 'John',
      customerPhone: '+966500000000',
      type: 'DELIVERY',
      notes: 'Extra sauce',
      items: [{ menuItemId: 'item-1', quantity: 1, notes: 'No onions', selectedModifiers: { size: 'large' }, sortOrder: 1 }],
    }
    const result = createOrderSchema.parse(data)
    expect(result.customerName).toBe('John')
    expect(result.notes).toBe('Extra sauce')
  })
})

describe('updateOrderStatusSchema', () => {
  it('should accept valid status', () => {
    const result = updateOrderStatusSchema.parse({ status: 'PREPARING' })
    expect(result.status).toBe('PREPARING')
  })

  it('should reject invalid status', () => {
    expect(() => updateOrderStatusSchema.parse({ status: 'INVALID' })).toThrow()
  })
})

describe('updatePaymentSchema', () => {
  it('should accept valid payment data', () => {
    const result = updatePaymentSchema.parse({ paymentStatus: 'PAID', paymentMethod: 'CASH' })
    expect(result.paymentStatus).toBe('PAID')
  })

  it('should accept payment without method', () => {
    const result = updatePaymentSchema.parse({ paymentStatus: 'PAID' })
    expect(result.paymentStatus).toBe('PAID')
  })

  it('should reject invalid payment status', () => {
    expect(() => updatePaymentSchema.parse({ paymentStatus: 'INVALID' })).toThrow()
  })
})

describe('addItemsSchema', () => {
  it('should accept valid items', () => {
    const result = addItemsSchema.parse({ items: [{ menuItemId: 'item-1', quantity: 1 }] })
    expect(result.items).toHaveLength(1)
  })

  it('should reject empty items', () => {
    expect(() => addItemsSchema.parse({ items: [] })).toThrow()
  })
})

describe('splitBillSchema', () => {
  it('should accept valid splits', () => {
    const result = splitBillSchema.parse({ splits: [{ items: ['oi-1'] }] })
    expect(result.splits).toHaveLength(1)
  })

  it('should reject empty splits', () => {
    expect(() => splitBillSchema.parse({ splits: [] })).toThrow()
  })
})

describe('callWaiterSchema', () => {
  it('should accept valid call data', () => {
    const result = callWaiterSchema.parse({ businessId: 'biz-1', message: 'Water please' })
    expect(result.message).toBe('Water please')
  })

  it('should reject missing businessId', () => {
    expect(() => callWaiterSchema.parse({ message: 'Help' })).toThrow()
  })
})

describe('menuItemSchema', () => {
  it('should accept valid menu item', () => {
    const result = menuItemSchema.parse({ name: 'Pizza', price: 15, categoryId: '550e8400-e29b-41d4-a716-446655440000' })
    expect(result.name).toBe('Pizza')
  })

  it('should reject missing name', () => {
    expect(() => menuItemSchema.parse({ price: 15, categoryId: '550e8400-e29b-41d4-a716-446655440000' })).toThrow()
  })

  it('should reject negative price', () => {
    expect(() => menuItemSchema.parse({ name: 'Pizza', price: -1, categoryId: '550e8400-e29b-41d4-a716-446655440000' })).toThrow()
  })
})

describe('menuCategorySchema', () => {
  it('should accept valid category', () => {
    const result = menuCategorySchema.parse({ name: 'Drinks' })
    expect(result.name).toBe('Drinks')
  })

  it('should reject empty name', () => {
    expect(() => menuCategorySchema.parse({ name: '' })).toThrow()
  })
})
