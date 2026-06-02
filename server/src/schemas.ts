import { z } from 'zod'

export const tableUpdateSchema = z.object({
  number: z.string().optional(),
  capacity: z.number().int().min(1).max(100).optional(),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE']).optional(),
  version: z.number().int().positive(),
})

export const menuItemSchema = z.object({
  name: z.string().min(1).max(100),
  nameAr: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  descriptionAr: z.string().max(500).optional(),
  price: z.number().positive(),
  discountPrice: z.number().positive().optional(),
  categoryId: z.string().uuid(),
  barcode: z.string().optional(),
  prepTime: z.number().int().min(0).max(999).optional(),
  sortOrder: z.number().int().optional(),
})

export const menuItemUpdateSchema = menuItemSchema.partial()

export const menuCategorySchema = z.object({
  name: z.string().min(1).max(100),
  nameAr: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().optional(),
})

export const menuCategoryUpdateSchema = menuCategorySchema.partial()

export const expenseSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  category: z.string().min(1),
  date: z.string().datetime().optional(),
  notes: z.string().optional(),
})

export const shiftSchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  days: z.number().int().min(0).optional(),
})

export const reservationSchema = z.object({
  businessId: z.string().uuid().optional(),
  tableId: z.string().uuid().nullable().optional(),
  customerName: z.string().min(1).max(100),
  customerPhone: z.string().min(1).max(20),
  guests: z.number().int().min(1).max(100),
  dateTime: z.string().datetime(),
  status: z.enum(['PENDING', 'CONFIRMED', 'SEATED', 'CANCELLED', 'NO_SHOW']).optional(),
  notes: z.string().optional(),
})

export const reservationUpdateSchema = z.object({
  tableId: z.string().uuid().nullable().optional(),
  customerName: z.string().min(1).max(100).optional(),
  customerPhone: z.string().min(1).max(20).optional(),
  guests: z.number().int().min(1).max(100).optional(),
  dateTime: z.string().datetime().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'SEATED', 'CANCELLED', 'NO_SHOW']).optional(),
  notes: z.string().optional(),
})

export const loyaltyProgramUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  pointsPerDinar: z.number().positive().optional(),
  dinarPerPoint: z.number().positive().optional(),
  minPointsRedeem: z.number().int().nonnegative().optional(),
  enabled: z.boolean().optional(),
})

export const loyaltyCustomerCreateSchema = z.object({
  phone: z.string().min(1).max(20),
  name: z.string().max(100).optional(),
})

export const loyaltyPointsAddSchema = z.object({
  customerId: z.string().uuid(),
  points: z.number().int().positive(),
  orderId: z.string().uuid().optional(),
  description: z.string().max(200).optional(),
})

export const loyaltyPointsRedeemSchema = z.object({
  customerId: z.string().uuid(),
  points: z.number().int().positive(),
  description: z.string().max(200).optional(),
})

export const settingsSchema = z.object({
  name: z.string().optional(),
  nameAr: z.string().optional(),
  logo: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  serviceChargeRate: z.number().min(0).max(100).optional(),
  currency: z.string().length(3).optional(),
  wifiDuration: z.number().int().positive().optional(),
  wifiVoucherEnabled: z.boolean().optional(),
  autoPrintOrders: z.boolean().optional(),
  kitchenDisplayEnabled: z.boolean().optional(),
})

export const employeeCreateSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100).optional(),
  phone: z.string().min(1).max(20),
  role: z.enum(['ADMIN', 'MANAGER', 'WAITER', 'KITCHEN', 'CASHIER', 'RECEPTION']).optional(),
  pin: z.string().length(4).optional(),
  shiftId: z.string().uuid().optional(),
  salary: z.number().min(0).optional(),
  salaryPeriod: z.enum(['MONTHLY', 'WEEKLY', 'DAILY']).optional(),
})

export const employeeUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().min(1).max(20).optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'WAITER', 'KITCHEN', 'CASHIER', 'RECEPTION']).optional(),
  pin: z.string().length(4).optional(),
  shiftId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
})

export const salaryUpdateSchema = z.object({
  salary: z.number().min(0),
  salaryPeriod: z.enum(['MONTHLY', 'WEEKLY', 'DAILY']),
})

export const expenseCreateSchema = z.object({
  description: z.string().min(1).max(500),
  amount: z.number().positive(),
  category: z.string().min(1).max(100).optional(),
  notes: z.string().max(500).optional(),
  date: z.string().datetime().optional(),
})

export const expenseUpdateSchema = expenseCreateSchema.partial()

export const licenseCreateSchema = z.object({
  businessId: z.string().uuid(),
  plan: z.enum(['STANDARD', 'PREMIUM', 'ENTERPRISE']).optional(),
  maxUsers: z.number().int().positive().optional(),
  maxBranches: z.number().int().positive().optional(),
  validDays: z.number().int().positive().optional(),
})

export const licenseUpdateSchema = z.object({
  plan: z.enum(['STANDARD', 'PREMIUM', 'ENTERPRISE']).optional(),
  maxUsers: z.number().int().positive().optional(),
  maxBranches: z.number().int().positive().optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
})

export const shiftCreateSchema = z.object({
  name: z.string().min(1).max(100),
  nameAr: z.string().max(100).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  days: z.number().int().min(0).max(127).optional(),
})

export const shiftUpdateSchema = shiftCreateSchema.partial().extend({
  isActive: z.boolean().optional(),
})

const orderItemSchema = z.object({
  menuItemId: z.string().min(1),
  quantity: z.number().int().positive(),
  notes: z.string().max(500).optional(),
  selectedModifiers: z.record(z.any()).optional(),
  sortOrder: z.number().int().optional(),
})

export const createOrderSchema = z.object({
  businessId: z.string().min(1),
  tableId: z.string().min(1).optional(),
  customerName: z.string().max(100).optional(),
  customerPhone: z.string().max(20).optional(),
  type: z.enum(['DINE_IN', 'TAKEAWAY', 'DELIVERY', 'ONLINE']).optional(),
  notes: z.string().max(1000).optional(),
  items: z.array(orderItemSchema).min(1),
})

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED']),
})

export const updatePaymentSchema = z.object({
  paymentStatus: z.enum(['UNPAID', 'PAID', 'REFUNDED', 'PARTIAL']),
  paymentMethod: z.enum(['CASH', 'CARD', 'WALLET', 'BANK_TRANSFER']).optional(),
})

export const addItemsSchema = z.object({
  items: z.array(orderItemSchema).min(1),
})

export const splitBillSchema = z.object({
  splits: z.array(z.object({
    items: z.array(z.string().min(1)).min(1),
  })).min(1),
})

export const callWaiterSchema = z.object({
  tableId: z.string().min(1).optional(),
  businessId: z.string().min(1),
  message: z.string().max(200).optional(),
})

export const trackOrderSchema = z.object({
  orderNumber: z.string().regex(/^\d+$/),
  businessId: z.string().min(1),
})
