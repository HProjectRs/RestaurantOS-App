import { apiGet, apiPost, apiPut, apiDelete } from './httpClient'
import { API } from '../config/api'
import { Expense } from '../types'

export const expenseService = {
  list: () => apiGet<Expense[]>(API.EXPENSES),
  create: (data: { description: string; amount: number; category?: string; notes?: string; date?: string }) =>
    apiPost<Expense>(API.EXPENSES, data),
  update: (id: string, data: any) => apiPut<Expense>(`${API.EXPENSES}/${id}`, data),
  delete: (id: string) => apiDelete(`${API.EXPENSES}/${id}`),
}
