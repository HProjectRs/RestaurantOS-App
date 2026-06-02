export interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'MANAGER' | 'CASHIER' | 'WAITER' | 'CHEF'
  businessId?: string
  phone?: string
  permissions?: string[]
  active?: boolean
}

export interface MenuItem {
  id: string
  name: string
  price: number
  discountPrice?: number
  categoryId?: string
  isAvailable: boolean
  image?: string
  description?: string
}

export interface OrderItem {
  id: string
  menuItemId: string
  orderId: string
  quantity: number
  price: number
  notes?: string
  status?: string
  selectedModifiers?: Record<string, unknown>
  menuItem?: MenuItem
}

export interface Order {
  id: string
  orderNumber: number
  businessId: string
  tableId?: string
  customerName?: string
  customerPhone?: string
  type: 'DINE_IN' | 'TAKEOUT' | 'DELIVERY' | 'ONLINE'
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED'
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED'
  subtotal: number
  tax: number
  serviceCharge: number
  total: number
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

export interface TableInfo {
  id: string
  number: number
  capacity: number
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED'
  businessId: string
}

export interface Business {
  id: string
  name: string
  taxRate: number
  serviceChargeRate: number
  currency: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type OrderStatus = Order['status']
export type PaymentStatus = Order['paymentStatus']
export type UserRole = User['role']
