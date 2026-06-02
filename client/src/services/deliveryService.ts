import { apiGet, apiPost, apiPut, apiPatch } from './httpClient'
import { API } from '../config/api'
import { DeliveryDriver, DeliveryZone, Delivery } from '../types'

export const deliveryService = {
  getDrivers: (status?: string) => apiGet<DeliveryDriver[]>(API.DELIVERY.DRIVERS, { status }),
  getDriver: (id: string) => apiGet<DeliveryDriver>(`${API.DELIVERY.DRIVERS}/${id}`),
  createDriver: (data: { name: string; phone: string; vehicle?: string; vehiclePlate?: string }) =>
    apiPost<DeliveryDriver>(API.DELIVERY.DRIVERS, data),
  updateDriver: (id: string, data: any) =>
    apiPut<DeliveryDriver>(`${API.DELIVERY.DRIVERS}/${id}`, data),
  toggleDriver: (id: string) =>
    apiPatch<DeliveryDriver>(`${API.DELIVERY.DRIVERS}/${id}/toggle`),
  getZones: () => apiGet<DeliveryZone[]>(API.DELIVERY.ZONES),
  getZone: (id: string) => apiGet<DeliveryZone>(`${API.DELIVERY.ZONES}/${id}`),
  createZone: (data: Partial<DeliveryZone>) =>
    apiPost<DeliveryZone>(API.DELIVERY.ZONES, data),
  updateZone: (id: string, data: any) =>
    apiPut<DeliveryZone>(`${API.DELIVERY.ZONES}/${id}`, data),
  getDeliveries: (params?: { status?: string; driverId?: string; dateFrom?: string; dateTo?: string }) =>
    apiGet<Delivery[]>(API.DELIVERY.DELIVERIES, params),
  createDelivery: (data: any) => apiPost<Delivery>(API.DELIVERY.DELIVERIES, data),
  assignDriver: (id: string, driverId: string) =>
    apiPatch<Delivery>(`${API.DELIVERY.DELIVERIES}/${id}/assign`, { driverId }),
  autoAssign: (id: string) =>
    apiPatch<Delivery>(`${API.DELIVERY.DELIVERIES}/${id}/auto-assign`),
  updateStatus: (id: string, status: string, location?: { lat: number; lng: number }) =>
    apiPatch<Delivery>(`${API.DELIVERY.DELIVERIES}/${id}/status`, { status, location }),
}
