export interface BusinessSettings {
  taxRate: number | string | null
  serviceChargeRate: number | string | null
}

export function calculateOrderCharges(
  subtotal: number,
  orderType: string | undefined | null,
  settings: BusinessSettings | null
) {
  const taxRate = settings ? Number(settings.taxRate) / 100 : 0.15
  const serviceChargeRate = settings ? Number(settings.serviceChargeRate) / 100 : 0.10
  const tax = subtotal * taxRate
  const serviceCharge = orderType === 'DINE_IN' ? subtotal * serviceChargeRate : 0
  const total = subtotal + tax + serviceCharge
  return { tax, serviceCharge, total }
}

export function generateOrderNumber(): number {
  return parseInt(Date.now().toString().slice(-6)) + Math.floor(Math.random() * 100)
}
