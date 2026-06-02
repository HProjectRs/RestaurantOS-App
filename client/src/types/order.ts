export interface PaymentMethod {
  type: 'cash' | 'card' | 'wallet'
  amount: number
  reference?: string
}

export interface OrderModifier {
  id: string
  name: string
  price: number
}

export interface OrderItem {
  id: string
  name: string
  qty: number
  price: number
  modifiers?: OrderModifier[]
  notes?: string
  status?: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled'
}

export interface Order {
  id: string
  orderNumber: string
  customer: string
  items: OrderItem[]
  table?: string
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled'
  paymentMethod?: PaymentMethod
  subtotal: number
  tax: number
  total: number
  paidAt?: string
  createdAt: string
}

export const OrderStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  SERVED: 'served',
  PAID: 'paid',
  CANCELLED: 'cancelled',
}

export const PaymentTypes = {
  CASH: 'cash',
  CARD: 'card',
  WALLET: 'wallet',
}
