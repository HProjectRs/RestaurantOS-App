export type UserRole = 'ADMIN' | 'MANAGER' | 'CASHIER' | 'WAITER' | 'CHEF'
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED'
export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED' | 'PARTIAL'
export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'ONLINE'
export type PaymentMethod = 'CASH' | 'CARD' | 'STRIPE' | 'WALLET' | 'BANK_TRANSFER'
export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE'
export type DeliveryStatus = 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed'
export type DriverStatus = 'online' | 'offline' | 'busy'
export type PlanName = 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE'
export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED' | 'TRIALING'
export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'SEATED' | 'CANCELLED' | 'NO_SHOW'

export interface User {
  id: string; businessId: string; name: string; email: string; phone?: string
  role: UserRole; isActive: boolean; shiftId?: string; shift?: Shift
  salary: number; salaryPeriod: string
}
export interface Business {
  id: string; name: string; nameAr?: string; logo?: string
  taxRate: number; serviceChargeRate: number; currency: string
  wifiDuration: number; wifiVoucherEnabled: boolean
  autoPrintOrders: boolean; kitchenDisplayEnabled: boolean
}
export interface MenuCategory {
  id: string; businessId: string; name: string; nameAr?: string
  description?: string; sortOrder: number; isActive: boolean; items?: MenuItem[]
}
export interface MenuItem {
  id: string; categoryId: string; name: string; nameAr?: string
  description?: string; descriptionAr?: string; price: number; discountPrice?: number
  image?: string; barcode?: string; isAvailable: boolean; prepTime: number
  sortOrder: number; modifiers?: MenuModifier[]
}
export interface MenuModifier {
  id: string; menuItemId: string; name: string; nameAr?: string
  type: 'SINGLE' | 'MULTIPLE'; required: boolean; min: number; max: number
  options: ModifierOption[]
}
export interface ModifierOption {
  id: string; modifierId: string; name: string; nameAr?: string; price: number; sortOrder: number
}
export interface Table {
  id: string; businessId: string; number: string; capacity: number
  status: TableStatus; qrCode?: string; isActive: boolean; version: number
}
export interface OrderItem {
  id: string; orderId: string; menuItemId: string; quantity: number; price: number
  notes?: string; selectedModifiers?: Record<string, string[]>; status: string
  sortOrder: number; menuItem?: MenuItem
}
export interface Order {
  id: string; businessId: string; orderNumber: number; tableId?: string
  table?: Table; cashierId?: string; cashier?: User
  customerName?: string; customerPhone?: string; customerEmail?: string
  type: OrderType; status: OrderStatus; paymentStatus: PaymentStatus
  paymentMethod?: string; subtotal: number; tax: number; serviceCharge: number
  discount: number; discountAmount?: number; total: number; notes?: string
  isOnlineOrder: boolean; stripePaymentIntentId?: string
  paidAt?: string; paymentFailureReason?: string; version: number
  items: OrderItem[]; payments?: Payment[]
}
export interface Payment {
  id: string; orderId: string; stripePaymentIntentId?: string
  stripeChargeId?: string; amount: number; currency: string
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED'
  method: string; refundAmount?: number; refundedAt?: string
}
export interface Shift {
  id: string; businessId: string; name: string; nameAr?: string
  startTime: string; endTime: string; days: number; isActive: boolean
}
export interface Attendance {
  id: string; userId: string; businessId: string; date: string
  clockIn: string; clockOut?: string; user?: User
}
export interface Expense {
  id: string; businessId: string; description: string; amount: number
  category: string; date: string; notes?: string
}
export interface Reservation {
  id: string; businessId: string; tableId?: string; table?: Table
  customerName: string; customerPhone: string; guests: number
  dateTime: string; status: ReservationStatus; notes?: string
}
export interface Subscription {
  id: string; businessId: string; stripeCustomerId?: string
  stripeSubscriptionId?: string; plan: PlanName; status: SubscriptionStatus
  trialEndsAt?: string; currentPeriodStart?: string; currentPeriodEnd?: string
  canceledAt?: string; maxUsers: number; maxBranches: number; features?: Record<string, boolean>
}
export interface Plan {
  name: string; label: string; labelAr: string; price: number
  maxUsers: number; maxBranches: number; features: string[]
  stripePriceId?: string
}
export interface LoyaltyProgram {
  id: string; businessId: string; name: string
  pointsPerDinar: number; dinarPerPoint: number; minPointsRedeem: number; enabled: boolean
}
export interface LoyaltyCustomer {
  id: string; businessId: string; programId: string; phone: string
  name?: string; totalPoints: number; totalSpent: number; visitCount: number; lastVisit?: string
}
export interface LoyaltyTransaction {
  id: string; customerId: string; type: 'EARN' | 'REDEEM'; points: number
  referenceType?: string; referenceId?: string; description?: string
}
export interface DeliveryDriver {
  id: string; businessId: string; name: string; phone: string
  vehicle?: string; vehiclePlate?: string; status: DriverStatus
  currentLat?: number; currentLng?: number; currentDeliveries: number
  totalDeliveries: number; rating: number; isActive: boolean
}
export interface DeliveryZone {
  id: string; businessId: string; name: string; nameAr?: string
  areas?: string[]; deliveryFee: number; minOrder: number; estimatedTime: number; isActive: boolean
}
export interface Delivery {
  id: string; businessId: string; orderId?: string; order?: Order
  driverId?: string; driver?: DeliveryDriver; zoneId?: string; zone?: DeliveryZone
  status: DeliveryStatus; customerName: string; customerPhone?: string
  customerAddress?: string; customerLat?: number; customerLng?: number
  deliveryFee: number; distance?: number; estimatedTime?: number; actualTime?: number
  notes?: string; assignedAt?: string; pickedUpAt?: string; deliveredAt?: string
}
export interface WifiQrCode {
  id: string; businessId: string; code: string; label?: string
  durationMinutes: number; maxSessions: number; isActive: boolean
}
export interface WifiSession {
  id: string; wifiQrCodeId: string; macAddress?: string; ipAddress?: string
  phoneNumber?: string; durationMinutes: number; status: string
  startTime: string; endTime: string
}
export interface BackupLog {
  id: string; businessId?: string; fileName: string; fileSize: number
  status: 'SUCCESS' | 'FAILED'; notes?: string
}
export interface License {
  id: string; key: string; businessId: string; plan: string
  maxUsers: number; maxBranches: number; validFrom: string; validUntil: string; isActive: boolean
}
export interface AuditLog {
  id: string; businessId?: string; userId?: string; action: string
  entity: string; entityId?: string; details?: string; ipAddress?: string
}
export interface ApiResponse<T = any> { success: boolean; data?: T; message?: string; error?: string }
export interface PaginatedResponse<T> { items: T[]; total: number; page: number; pageSize: number; totalPages: number }
