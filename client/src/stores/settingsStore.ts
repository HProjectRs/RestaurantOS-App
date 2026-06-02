import { create } from 'zustand'
import { Business } from '../types'
import { apiGet, apiPut } from '../services/httpClient'
import { API } from '../config/api'

interface SettingsState {
  business: Business | null
  loading: boolean
  fetch: () => Promise<void>
  update: (data: Partial<Business>) => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  business: null, loading: false,
  fetch: async () => {
    set({ loading: true })
    try { const res = await apiGet<Business>(API.SETTINGS.BASE); set({ business: res }) } catch { /* ignore */ }
    finally { set({ loading: false }) }
  },
  update: async (data) => {
    const res = await apiPut<Business>(API.SETTINGS.BASE, data)
    set({ business: res })
  },
}))
