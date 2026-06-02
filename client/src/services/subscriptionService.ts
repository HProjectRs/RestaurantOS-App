import { apiGet, apiPost } from './httpClient'
import { API } from '../config/api'
import { Plan, Subscription } from '../types'

export const subscriptionService = {
  getPlans: () => apiGet<Plan[]>(API.SUBSCRIPTIONS.PLANS),
  getCurrent: () => apiGet<Subscription>(API.SUBSCRIPTIONS.CURRENT),
  createCheckout: (data: { priceId: string; successUrl: string; cancelUrl: string }) =>
    apiPost<{ url: string; sessionId: string }>(API.SUBSCRIPTIONS.CHECKOUT, data),
  portal: (returnUrl?: string) => apiPost<{ url: string }>(API.SUBSCRIPTIONS.PORTAL, { returnUrl }),
  cancel: () => apiPost<{ message: string }>(API.SUBSCRIPTIONS.CANCEL),
}
