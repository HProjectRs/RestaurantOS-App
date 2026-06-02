import { apiGet } from './httpClient'
import { API } from '../config/api'

export const reportService = {
  dashboard: () => apiGet<any>(API.REPORTS.DASHBOARD),
  sales: (params?: { from?: string; to?: string; groupBy?: string }) =>
    apiGet<any[]>(API.REPORTS.SALES, params),
  categories: (params?: { from?: string; to?: string }) =>
    apiGet<any[]>(API.REPORTS.CATEGORIES, params),
  employees: (params?: { from?: string; to?: string }) =>
    apiGet<any[]>(API.REPORTS.EMPLOYEES, params),
  itemsPerformance: (params?: { from?: string; to?: string }) =>
    apiGet<any[]>(API.REPORTS.ITEMS_PERFORMANCE, params),
  peakHours: (params?: { from?: string; to?: string }) =>
    apiGet<any>(API.REPORTS.PEAK_HOURS, params),
  paymentMethods: (params?: { from?: string; to?: string }) =>
    apiGet<Record<string, { count: number; revenue: number }>>(API.REPORTS.PAYMENT_METHODS, params),
}
