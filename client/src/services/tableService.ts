import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './httpClient'
import { API } from '../config/api'
import { Table } from '../types'

export const tableService = {
  list: () => apiGet<Table[]>(API.TABLES),
  create: (data: { number: string; capacity: number }) =>
    apiPost<Table>(API.TABLES, data),
  update: (id: string, data: { number?: string; capacity?: number; status?: string; version: number }) =>
    apiPut<Table>(`${API.TABLES}/${id}`, data),
  delete: (id: string) => apiDelete(`${API.TABLES}/${id}`),
  updateStatus: (id: string, status: string) =>
    apiPatch<Table>(`${API.TABLES}/${id}/status`, { status }),
  regenerateQr: (id: string) =>
    apiPost<Table>(`${API.TABLES}/${id}/regenerate-qr`),
}
