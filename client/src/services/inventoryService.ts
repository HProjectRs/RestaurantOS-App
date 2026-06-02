import { apiGet, apiPost, apiPut } from './httpClient'
import { API } from '../config/api'

// Falls back to generic API since there's no dedicated inventory route
// Inventory routes are expected to be added or accessed via settings/expenses

const INVENTORY_API = API.SETTINGS.BASE // placeholder; adjust when route exists

export const inventoryService = {
  getItems: (params?: any) => apiGet<any[]>(`${API.BASE_URL}/inventory/items`, params).catch(() => []),
  getItemById: (id: string) => apiGet<any>(`${API.BASE_URL}/inventory/items/${id}`),
  createItem: (data: any) => apiPost(`${API.BASE_URL}/inventory/items`, data),
  updateItem: (id: string, data: any) => apiPut(`${API.BASE_URL}/inventory/items/${id}`, data),
  adjustStock: (id: string, data: any) => apiPost(`${API.BASE_URL}/inventory/items/${id}/adjust`, data),
  getTransactions: (params?: any) => apiGet<any[]>(`${API.BASE_URL}/inventory/transactions`, params).catch(() => []),
  getAlerts: () => apiGet<any[]>(`${API.BASE_URL}/inventory/alerts`).catch(() => []),
}
