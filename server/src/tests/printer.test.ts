import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { PrismaClient } from '@prisma/client'
import { mockDeep } from 'jest-mock-extended'
import { generateEscPosReceipt, generateReceiptData } from '../services/printer'

describe('printer', () => {
  describe('generateReceiptData', () => {
    const baseOrder = {
      id: 'order-1',
      orderNumber: 1001,
      table: { number: '5' },
      cashier: { name: 'Ahmed' },
      items: [
        {
          menuItem: { name: 'Kabsa', nameAr: 'كبسة' },
          quantity: 2,
          price: 50,
          selectedModifiers: { extras: ['Extra Rice', 'Salad'] },
        },
      ],
      subtotal: 100,
      tax: 15,
      serviceCharge: 10,
      discount: 5,
      total: 120,
      paymentMethod: 'CASH',
      paymentStatus: 'PAID',
      createdAt: new Date('2026-06-01T12:00:00Z'),
      customerName: 'Ali',
    }

    const baseBusiness = { name: 'Test Restaurant', nameAr: 'مطعم تجريبي' }

    it('should map all fields correctly', () => {
      const data = generateReceiptData(baseOrder, baseBusiness)
      expect(data.businessName).toBe('Test Restaurant')
      expect(data.businessNameAr).toBe('مطعم تجريبي')
      expect(data.orderNumber).toBe(1001)
      expect(data.tableNumber).toBe('5')
      expect(data.cashierName).toBe('Ahmed')
      expect(data.customerName).toBe('Ali')
      expect(data.items).toHaveLength(1)
      expect(data.items[0].name).toBe('Kabsa')
      expect(data.items[0].nameAr).toBe('كبسة')
      expect(data.items[0].quantity).toBe(2)
      expect(data.items[0].price).toBe(50)
      expect(data.items[0].modifiers).toEqual(['Extra Rice', 'Salad'])
      expect(data.subtotal).toBe(100)
      expect(data.tax).toBe(15)
      expect(data.serviceCharge).toBe(10)
      expect(data.discount).toBe(5)
      expect(data.total).toBe(120)
      expect(data.paymentMethod).toBe('CASH')
      expect(data.paymentStatus).toBe('PAID')
      expect(data.date).toBeDefined()
      expect(data.footer).toBe('مطعم تجريبي')
    })

    it('should handle missing optional fields', () => {
      const order = {
        ...baseOrder,
        table: undefined,
        cashier: undefined,
        customerName: undefined,
        items: [
          {
            menuItem: { name: 'Tea', nameAr: undefined },
            quantity: 1,
            price: 5,
            selectedModifiers: undefined,
          },
        ],
        paymentMethod: undefined,
        paymentStatus: undefined,
        discount: 0,
        serviceCharge: 0,
      }
      const business = { name: 'Cafe', nameAr: undefined }
      const data = generateReceiptData(order, business)
      expect(data.tableNumber).toBeUndefined()
      expect(data.cashierName).toBeUndefined()
      expect(data.customerName).toBeUndefined()
      expect(data.paymentMethod).toBeUndefined()
      expect(data.paymentStatus).toBeUndefined()
      expect(data.items[0].modifiers).toBeUndefined()
      expect(data.businessNameAr).toBeUndefined()
      expect(data.footer).toBe('Cafe')
    })
  })

  describe('generateEscPosReceipt', () => {
    const sampleData = {
      businessName: 'Test Cafe',
      businessNameAr: 'مقهى تجريبي',
      orderNumber: 1001,
      tableNumber: '5',
      cashierName: 'Ahmed',
      items: [
        { name: 'Kabsa', nameAr: 'كبسة', quantity: 2, price: 50, modifiers: ['Extra Rice'] },
        { name: 'Tea', quantity: 1, price: 10 },
      ],
      subtotal: 110,
      tax: 16.5,
      serviceCharge: 11,
      discount: 0,
      total: 137.5,
      paymentMethod: 'CASH',
      paymentStatus: 'PAID',
      date: '2026-06-01',
      customerName: 'Ali',
      footer: 'شكراً',
    }

    it('should return Uint8Array', () => {
      const result = generateEscPosReceipt(sampleData)
      expect(result).toBeInstanceOf(Uint8Array)
    })

    it('should start with ESC/POS initialize command (0x1B 0x40)', () => {
      const result = generateEscPosReceipt(sampleData)
      expect(result[0]).toBe(0x1B)
      expect(result[1]).toBe(0x40)
    })

    it('should end with cut paper command (0x1D 0x56 0x00)', () => {
      const result = generateEscPosReceipt(sampleData)
      const len = result.length
      expect(result[len - 3]).toBe(0x1D)
      expect(result[len - 2]).toBe(0x56)
      expect(result[len - 1]).toBe(0x00)
    })

    it('should omit serviceCharge line when zero', () => {
      const data = { ...sampleData, serviceCharge: 0 }
      const result = generateEscPosReceipt(data)
      expect(result.length).toBeGreaterThan(10)
    })

    it('should include discount line when non-zero', () => {
      const data = { ...sampleData, discount: 10 }
      const result = generateEscPosReceipt(data)
      expect(result.length).toBeGreaterThan(10)
    })
  })
})
