import { apiGet, apiPost, apiPatch } from './httpClient'
import { API } from '../config/api'
import { WifiQrCode, WifiSession } from '../types'

export const wifiService = {
  listQrCodes: () => apiGet<WifiQrCode[]>(API.WIFI.QR_CODES),
  createQrCode: (data: { label?: string; durationMinutes?: number; maxSessions?: number }) =>
    apiPost<WifiQrCode & { qrImage: string; qrUrl: string }>(API.WIFI.QR_CODES, data),
  toggleQrCode: (id: string) => apiPatch<WifiQrCode>(`${API.WIFI.QR_CODES}/${id}/toggle`),
  connect: (code: string, data?: { phoneNumber?: string; macAddress?: string }) =>
    apiPost<{ success: boolean; session: WifiSession }>(API.WIFI.CONNECT, { code, ...data }),
  sessions: () => apiGet<WifiSession[]>(API.WIFI.SESSIONS),
  disconnectSession: (id: string) => apiPatch(`${API.WIFI.SESSIONS}/${id}/disconnect`),
}
