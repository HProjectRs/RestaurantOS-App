import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './httpClient'
import { API } from '../config/api'
import { MenuCategory, MenuItem, MenuModifier } from '../types'

export const menuService = {
  getCategories: (businessId?: string) =>
    apiGet<MenuCategory[]>(API.MENU.CATEGORIES, { businessId }),
  createCategory: (data: { name: string; nameAr?: string; description?: string; sortOrder?: number }) =>
    apiPost<MenuCategory>(API.MENU.CATEGORIES, data),
  updateCategory: (id: string, data: any) =>
    apiPut<MenuCategory>(`${API.MENU.CATEGORIES}/${id}`, data),
  deleteCategory: (id: string) =>
    apiDelete(`${API.MENU.CATEGORIES}/${id}`),
  createItem: (data: any) =>
    apiPost<MenuItem>(API.MENU.ITEMS, data),
  updateItem: (id: string, data: any) =>
    apiPut<MenuItem>(`${API.MENU.ITEMS}/${id}`, data),
  deleteItem: (id: string) =>
    apiDelete(`${API.MENU.ITEMS}/${id}`),
  toggleItem: (id: string) =>
    apiPatch<MenuItem>(`${API.MENU.ITEMS}/${id}/toggle`),
  uploadImage: (id: string, file: File) => {
    const formData = new FormData(); formData.append('image', file)
    return apiPost<MenuItem>(`${API.MENU.ITEMS}/${id}/image`, formData)
  },
  addModifier: (itemId: string, data: any) =>
    apiPost<MenuModifier>(`${API.MENU.ITEMS}/${itemId}/modifiers`, data),
  updateModifier: (id: string, data: any) =>
    apiPut<MenuModifier>(`${API.MENU.MODIFIERS}/${id}`, data),
  deleteModifier: (id: string) =>
    apiDelete(`${API.MENU.MODIFIERS}/${id}`),
}
