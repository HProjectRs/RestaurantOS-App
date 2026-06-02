import { describe, it, expect } from '@jest/globals'
import {
  tableUpdateSchema,
  menuItemUpdateSchema,
  menuCategoryUpdateSchema,
  expenseCreateSchema,
  expenseUpdateSchema,
  shiftCreateSchema,
  shiftUpdateSchema,
  reservationSchema,
  reservationUpdateSchema,
  loyaltyProgramUpdateSchema,
  loyaltyCustomerCreateSchema,
  loyaltyPointsAddSchema,
  loyaltyPointsRedeemSchema,
  settingsSchema,
  employeeCreateSchema,
  employeeUpdateSchema,
  salaryUpdateSchema,
  licenseCreateSchema,
  licenseUpdateSchema,
  trackOrderSchema,
} from '../schemas'

describe('tableUpdateSchema', () => {
  it('should accept valid table update', () => {
    const result = tableUpdateSchema.parse({ number: '5', capacity: 4, status: 'AVAILABLE', version: 1 })
    expect(result.number).toBe('5')
    expect(result.version).toBe(1)
  })

  it('should reject missing version', () => {
    expect(() => tableUpdateSchema.parse({ number: '5' })).toThrow()
  })

  it('should reject negative version', () => {
    expect(() => tableUpdateSchema.parse({ number: '5', version: -1 })).toThrow()
  })

  it('should reject invalid status', () => {
    expect(() => tableUpdateSchema.parse({ status: 'INVALID', version: 1 })).toThrow()
  })

  it('should accept partial update with only version', () => {
    const result = tableUpdateSchema.parse({ version: 2 })
    expect(result.version).toBe(2)
  })

  it('should reject capacity > 100', () => {
    expect(() => tableUpdateSchema.parse({ capacity: 101, version: 1 })).toThrow()
  })
})

describe('menuItemUpdateSchema', () => {
  it('should accept partial menu item update', () => {
    const result = menuItemUpdateSchema.parse({ name: 'Updated Pizza' })
    expect(result.name).toBe('Updated Pizza')
  })

  it('should accept empty object', () => {
    const result = menuItemUpdateSchema.parse({})
    expect(Object.keys(result)).toHaveLength(0)
  })

  it('should reject empty name', () => {
    expect(() => menuItemUpdateSchema.parse({ name: '' })).toThrow()
  })

  it('should accept multiple fields', () => {
    const result = menuItemUpdateSchema.parse({ price: 20, description: 'New desc', discountPrice: 15 })
    expect(result.price).toBe(20)
    expect(result.discountPrice).toBe(15)
  })

  it('should reject negative price', () => {
    expect(() => menuItemUpdateSchema.parse({ price: -5 })).toThrow()
  })
})

describe('menuCategoryUpdateSchema', () => {
  it('should accept partial category update', () => {
    const result = menuCategoryUpdateSchema.parse({ nameAr: 'مشروبات' })
    expect(result.nameAr).toBe('مشروبات')
  })

  it('should accept empty object', () => {
    const result = menuCategoryUpdateSchema.parse({})
    expect(Object.keys(result)).toHaveLength(0)
  })
})

describe('expenseCreateSchema', () => {
  it('should accept valid expense', () => {
    const result = expenseCreateSchema.parse({ description: 'Rent', amount: 5000 })
    expect(result.description).toBe('Rent')
    expect(result.amount).toBe(5000)
  })

  it('should reject missing description', () => {
    expect(() => expenseCreateSchema.parse({ amount: 100 })).toThrow()
  })

  it('should reject negative amount', () => {
    expect(() => expenseCreateSchema.parse({ description: 'Test', amount: -10 })).toThrow()
  })

  it('should accept with optional fields', () => {
    const result = expenseCreateSchema.parse({ description: 'Test', amount: 100, category: 'Food', notes: 'Test note' })
    expect(result.category).toBe('Food')
  })

  it('should reject empty description', () => {
    expect(() => expenseCreateSchema.parse({ description: '', amount: 100 })).toThrow()
  })
})

describe('expenseUpdateSchema', () => {
  it('should accept partial expense update', () => {
    const result = expenseUpdateSchema.parse({ amount: 200 })
    expect(result.amount).toBe(200)
  })

  it('should accept empty object', () => {
    const result = expenseUpdateSchema.parse({})
    expect(Object.keys(result)).toHaveLength(0)
  })
})

describe('shiftCreateSchema', () => {
  it('should accept valid shift', () => {
    const result = shiftCreateSchema.parse({ name: 'Morning', startTime: '08:00', endTime: '16:00' })
    expect(result.name).toBe('Morning')
  })

  it('should accept optional days', () => {
    const result = shiftCreateSchema.parse({ name: 'Morning', startTime: '08:00', endTime: '16:00', days: 62 })
    expect(result.days).toBe(62)
  })

  it('should reject invalid time format', () => {
    expect(() => shiftCreateSchema.parse({ name: 'Test', startTime: '8:00', endTime: '16:00' })).toThrow()
  })

  it('should reject missing name', () => {
    expect(() => shiftCreateSchema.parse({ startTime: '08:00', endTime: '16:00' })).toThrow()
  })
})

describe('shiftUpdateSchema', () => {
  it('should accept partial shift update', () => {
    const result = shiftUpdateSchema.parse({ isActive: false })
    expect(result.isActive).toBe(false)
  })
})

describe('reservationSchema', () => {
  it('should accept valid reservation', () => {
    const result = reservationSchema.parse({
      customerName: 'Ahmed',
      customerPhone: '+966500000000',
      guests: 4,
      dateTime: '2025-06-01T20:00:00Z',
    })
    expect(result.customerName).toBe('Ahmed')
  })

  it('should reject missing customerName', () => {
    expect(() => reservationSchema.parse({ customerPhone: '+9665', guests: 2, dateTime: '2025-06-01T20:00:00Z' })).toThrow()
  })

  it('should reject guests > 100', () => {
    expect(() => reservationSchema.parse({ customerName: 'A', customerPhone: '+9665', guests: 200, dateTime: '2025-06-01T20:00:00Z' })).toThrow()
  })

  it('should reject invalid dateTime', () => {
    expect(() => reservationSchema.parse({ customerName: 'A', customerPhone: '+9665', guests: 2, dateTime: 'not-a-date' })).toThrow()
  })

  it('should accept optional status', () => {
    const result = reservationSchema.parse({
      customerName: 'Sara', customerPhone: '+9665', guests: 2, dateTime: '2025-06-01T20:00:00Z', status: 'CONFIRMED',
    })
    expect(result.status).toBe('CONFIRMED')
  })
})

describe('reservationUpdateSchema', () => {
  it('should accept partial update', () => {
    const result = reservationUpdateSchema.parse({ guests: 6 })
    expect(result.guests).toBe(6)
  })
})

describe('settingsSchema', () => {
  it('should accept valid settings', () => {
    const result = settingsSchema.parse({ name: 'My Restaurant', taxRate: 15, currency: 'SAR' })
    expect(result.name).toBe('My Restaurant')
  })

  it('should reject taxRate > 100', () => {
    expect(() => settingsSchema.parse({ taxRate: 150 })).toThrow()
  })

  it('should reject currency not length 3', () => {
    expect(() => settingsSchema.parse({ currency: 'USDollar' })).toThrow()
  })

  it('should accept empty object', () => {
    const result = settingsSchema.parse({})
    expect(Object.keys(result)).toHaveLength(0)
  })
})

describe('employeeCreateSchema', () => {
  it('should accept valid employee', () => {
    const result = employeeCreateSchema.parse({ name: 'John', email: 'john@test.com', phone: '+966500000000' })
    expect(result.name).toBe('John')
    expect(result.role).toBeUndefined()
  })

  it('should reject missing email', () => {
    expect(() => employeeCreateSchema.parse({ name: 'John', phone: '+9665' })).toThrow()
  })

  it('should reject invalid email', () => {
    expect(() => employeeCreateSchema.parse({ name: 'John', email: 'not-email', phone: '+9665' })).toThrow()
  })

  it('should reject short password', () => {
    expect(() => employeeCreateSchema.parse({ name: 'John', email: 'j@t.com', phone: '+9665', password: '12' })).toThrow()
  })

  it('should reject invalid role', () => {
    expect(() => employeeCreateSchema.parse({ name: 'John', email: 'j@t.com', phone: '+9665', role: 'SUPERVISOR' })).toThrow()
  })

  it('should accept all optional fields', () => {
    const result = employeeCreateSchema.parse({
      name: 'Jane', email: 'j@t.com', phone: '+9665', role: 'WAITER', pin: '1234', salary: 5000, salaryPeriod: 'MONTHLY',
    })
    expect(result.pin).toBe('1234')
    expect(result.salary).toBe(5000)
  })

  it('should reject pin not length 4', () => {
    expect(() => employeeCreateSchema.parse({ name: 'J', email: 'j@t.com', phone: '+9665', pin: '123' })).toThrow()
  })
})

describe('employeeUpdateSchema', () => {
  it('should accept partial update', () => {
    const result = employeeUpdateSchema.parse({ isActive: false })
    expect(result.isActive).toBe(false)
  })
})

describe('salaryUpdateSchema', () => {
  it('should accept valid salary update', () => {
    const result = salaryUpdateSchema.parse({ salary: 6000, salaryPeriod: 'WEEKLY' })
    expect(result.salary).toBe(6000)
  })

  it('should reject negative salary', () => {
    expect(() => salaryUpdateSchema.parse({ salary: -100, salaryPeriod: 'MONTHLY' })).toThrow()
  })

  it('should reject invalid period', () => {
    expect(() => salaryUpdateSchema.parse({ salary: 1000, salaryPeriod: 'YEARLY' })).toThrow()
  })
})

describe('licenseCreateSchema', () => {
  it('should accept valid license', () => {
    const result = licenseCreateSchema.parse({ businessId: '550e8400-e29b-41d4-a716-446655440000' })
    expect(result.businessId).toBe('550e8400-e29b-41d4-a716-446655440000')
  })

  it('should reject invalid businessId', () => {
    expect(() => licenseCreateSchema.parse({ businessId: 'not-uuid' })).toThrow()
  })

  it('should reject invalid plan', () => {
    expect(() => licenseCreateSchema.parse({ businessId: '550e8400-e29b-41d4-a716-446655440000', plan: 'FREE' })).toThrow()
  })

  it('should accept all fields', () => {
    const result = licenseCreateSchema.parse({
      businessId: '550e8400-e29b-41d4-a716-446655440000', plan: 'PREMIUM', maxUsers: 50, maxBranches: 3, validDays: 365,
    })
    expect(result.plan).toBe('PREMIUM')
  })
})

describe('licenseUpdateSchema', () => {
  it('should accept partial update', () => {
    const result = licenseUpdateSchema.parse({ isActive: true })
    expect(result.isActive).toBe(true)
  })
})

describe('loyaltyProgramUpdateSchema', () => {
  it('should accept valid loyalty update', () => {
    const result = loyaltyProgramUpdateSchema.parse({ pointsPerDinar: 10, enabled: true })
    expect(result.pointsPerDinar).toBe(10)
  })

  it('should reject negative pointsPerDinar', () => {
    expect(() => loyaltyProgramUpdateSchema.parse({ pointsPerDinar: -1 })).toThrow()
  })

  it('should accept empty object', () => {
    const result = loyaltyProgramUpdateSchema.parse({})
    expect(Object.keys(result)).toHaveLength(0)
  })
})

describe('loyaltyCustomerCreateSchema', () => {
  it('should accept valid customer', () => {
    const result = loyaltyCustomerCreateSchema.parse({ phone: '+966500000000' })
    expect(result.phone).toBe('+966500000000')
  })

  it('should reject empty phone', () => {
    expect(() => loyaltyCustomerCreateSchema.parse({ phone: '' })).toThrow()
  })
})

describe('loyaltyPointsAddSchema', () => {
  it('should accept valid points add', () => {
    const result = loyaltyPointsAddSchema.parse({ customerId: '550e8400-e29b-41d4-a716-446655440000', points: 50 })
    expect(result.points).toBe(50)
  })

  it('should reject non-positive points', () => {
    expect(() => loyaltyPointsAddSchema.parse({ customerId: '550e8400-e29b-41d4-a716-446655440000', points: 0 })).toThrow()
    expect(() => loyaltyPointsAddSchema.parse({ customerId: '550e8400-e29b-41d4-a716-446655440000', points: -5 })).toThrow()
  })

  it('should reject non-uuid', () => {
    expect(() => loyaltyPointsAddSchema.parse({ customerId: 'bad', points: 10 })).toThrow()
  })
})

describe('loyaltyPointsRedeemSchema', () => {
  it('should accept valid points redeem', () => {
    const result = loyaltyPointsRedeemSchema.parse({ customerId: '550e8400-e29b-41d4-a716-446655440000', points: 100 })
    expect(result.points).toBe(100)
  })

  it('should reject non-positive points', () => {
    expect(() => loyaltyPointsRedeemSchema.parse({ customerId: '550e8400-e29b-41d4-a716-446655440000', points: -1 })).toThrow()
  })
})

describe('trackOrderSchema', () => {
  it('should accept valid tracking data', () => {
    const result = trackOrderSchema.parse({ orderNumber: '12345', businessId: 'biz-1' })
    expect(result.orderNumber).toBe('12345')
  })

  it('should reject non-numeric orderNumber', () => {
    expect(() => trackOrderSchema.parse({ orderNumber: 'ORD-123', businessId: 'biz-1' })).toThrow()
  })

  it('should reject empty businessId', () => {
    expect(() => trackOrderSchema.parse({ orderNumber: '123', businessId: '' })).toThrow()
  })
})
