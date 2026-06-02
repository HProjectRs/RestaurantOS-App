import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { API } from '../config/api'
import { useAuthStore } from '../stores/authStore'

const httpClient = axios.create({ baseURL: API.BASE_URL, timeout: 30000 })

httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

httpClient.interceptors.response.use(
  res => res,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default httpClient

export function handleError(error: any): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as any
    return data?.message || data?.error || error.message
  }
  return error?.message || 'An unexpected error occurred'
}

export async function apiGet<T = any>(url: string, params?: Record<string, any>): Promise<T> {
  const res = await httpClient.get(url, { params })
  return res.data
}

export async function apiPost<T = any>(url: string, data?: any): Promise<T> {
  const res = await httpClient.post(url, data)
  return res.data
}

export async function apiPut<T = any>(url: string, data?: any): Promise<T> {
  const res = await httpClient.put(url, data)
  return res.data
}

export async function apiPatch<T = any>(url: string, data?: any): Promise<T> {
  const res = await httpClient.patch(url, data)
  return res.data
}

export async function apiDelete<T = any>(url: string): Promise<T> {
  const res = await httpClient.delete(url)
  return res.data
}
