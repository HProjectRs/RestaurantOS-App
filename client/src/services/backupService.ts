import { apiGet, apiPost } from './httpClient'
import { API } from '../config/api'

export const backupService = {
  list: () => apiGet<{ files: any[]; logs: any[] }>(API.BACKUPS),
  create: () => apiPost<{ fileName: string; fileSize: number; message: string }>(API.BACKUPS),
  restore: (fileName: string) => apiPost<{ message: string }>(`${API.BACKUPS}/restore`, { fileName }),
  settings: () => apiGet(API.BACKUPS + '/settings'),
}
