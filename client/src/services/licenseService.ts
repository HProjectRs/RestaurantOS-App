import { apiGet, apiPost, apiPut, apiDelete } from './httpClient'
import { API } from '../config/api'
import { License } from '../types'

export const licenseService = {
  verify: (key: string, businessId?: string) =>
    apiPost<{ valid: boolean; plan: string; maxUsers: number; maxBranches: number; validUntil: string }>(API.LICENSES + '/verify', { key, businessId }),
  get: () => apiGet<License>(API.LICENSES),
  create: (data: { businessId: string; plan?: string; maxUsers?: number; maxBranches?: number; validDays?: number }) =>
    apiPost<License>(API.LICENSES, data),
  update: (id: string, data: any) => apiPut<License>(`${API.LICENSES}/${id}`, data),
}
