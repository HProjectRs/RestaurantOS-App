import { apiGet, apiPost, apiPatch } from './httpClient'
import { API } from '../config/api'
import { Order, OrderItem } from '../types'

export const orderService = {
  list: (params?: { status?: string; type?: string; dateFrom?: string; dateTo?: string; limit?: number }) =>
    apiGet<Order[]>(API.ORDERS.BASE, params),
  getById: (id: string) => apiGet<Order>(`${API.ORDERS.BASE}/${id}`),
  create: (data: { items: { menuItemId: string; quantity: number; price?: number; selectedModifiers?: any; notes?: string }[]; tableId?: string; customerName?: string; customerPhone?: string; type?: string; notes?: string }) =>
    apiPost<Order>(API.ORDERS.BASE, data),
  updateStatus: (id: string, status: string) =>
    apiPatch<Order>(`${API.ORDERS.BASE}/${id}/status`, { status }),
  updateItemStatus: (orderId: string, itemId: string, status: string) =>
    apiPatch<OrderItem>(`${API.ORDERS.BASE}/${orderId}/items/${itemId}/status`, { status }),
  updatePayment: (id: string, paymentStatus: string, paymentMethod?: string) =>
    apiPatch<Order>(`${API.ORDERS.BASE}/${id}/payment`, { paymentStatus, paymentMethod }),
  cancel: (id: string) => apiPatch<Order>(`${API.ORDERS.BASE}/${id}/cancel`),
  track: (orderNumber: number, businessId?: string) =>
    apiGet<Order>(`${API.ORDERS.TRACK}/${orderNumber}`, { businessId }),
  callWaiter: (data: { tableId?: string; businessId?: string; message?: string }) =>
    apiPost(API.ORDERS.CALL_WAITER, data),
  addItems: (id: string, items: { menuItemId: string; quantity: number; price?: number }[]) =>
    apiPost<Order>(`${API.ORDERS.BASE}/${id}/items`, { items }),
  getReceipt: (id: string) => apiGet<any>(`${API.ORDERS.BASE}/${id}/receipt`),
  split: (id: string, splits: { items: string[] }[]) =>
    apiPost<{ original: Order; splits: Order[] }>(`${API.ORDERS.BASE}/${id}/split`, { splits }),
  getActive: (tableId: string, businessId?: string) =>
    apiGet<Order | null>(API.ORDERS.ACTIVE, { tableId, businessId }),
  getByPhone: (phone: string, businessId?: string) =>
    apiGet<Order[]>(`${API.ORDERS.BASE}/customer/${phone}`, { businessId }),
  getInvoice: (id: string) => apiGet<any>(`${API.INVOICES}/orders/${id}`),
  getZatcaInvoice: (id: string) => apiGet<any>(`${API.INVOICES}/orders/${id}/zatca`),
}
