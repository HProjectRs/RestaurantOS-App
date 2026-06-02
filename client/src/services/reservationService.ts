import { apiGet, apiPost, apiPut, apiPatch } from './httpClient'
import { API } from '../config/api'
import { Reservation } from '../types'

export const reservationService = {
  list: (params?: { date?: string; status?: string }) =>
    apiGet<Reservation[]>(API.RESERVATIONS, params),
  create: (data: { customerName: string; customerPhone: string; guests: number; tableId?: string; dateTime: string; notes?: string }) =>
    apiPost<Reservation>(API.RESERVATIONS, data),
  update: (id: string, data: any) =>
    apiPut<Reservation>(`${API.RESERVATIONS}/${id}`, data),
  updateStatus: (id: string, status: string) =>
    apiPatch<Reservation>(`${API.RESERVATIONS}/${id}/status`, { status }),
}
