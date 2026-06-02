import { apiGet, apiPost, apiPut } from './httpClient'
import { API } from '../config/api'
import { LoyaltyProgram, LoyaltyCustomer, LoyaltyTransaction } from '../types'

export const loyaltyService = {
  getProgram: () => apiGet<LoyaltyProgram>(API.LOYALTY.PROGRAM),
  updateProgram: (data: Partial<LoyaltyProgram>) =>
    apiPut<LoyaltyProgram>(API.LOYALTY.PROGRAM, data),
  searchCustomer: (phone: string) =>
    apiGet<LoyaltyCustomer & { transactions: LoyaltyTransaction[] }>(`${API.LOYALTY.CUSTOMERS}/search`, { phone }),
  createCustomer: (data: { phone: string; name?: string }) =>
    apiPost<LoyaltyCustomer>(API.LOYALTY.CUSTOMERS, data),
  listCustomers: () => apiGet<LoyaltyCustomer[]>(API.LOYALTY.CUSTOMERS),
  addPoints: (data: { customerId: string; points: number; orderId?: string; description?: string }) =>
    apiPost<LoyaltyTransaction>(API.LOYALTY.POINTS_ADD, data),
  redeemPoints: (data: { customerId: string; points: number; description?: string }) =>
    apiPost<LoyaltyTransaction>(API.LOYALTY.POINTS_REDEEM, data),
}
