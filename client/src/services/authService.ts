import { apiPost, apiGet, apiPut } from './httpClient'
import { API } from '../config/api'
import { User, Business } from '../types'

interface LoginResponse {
  accessToken: string; refreshToken: string; token: string
  user: User; business: Business
}

export const authService = {
  login: (email: string, password: string) =>
    apiPost<LoginResponse>(API.AUTH.LOGIN, { email, password }),
  register: (data: { name: string; email: string; password: string; phone?: string; businessName?: string }) =>
    apiPost<{ token: string; user: User; business: Business }>(API.AUTH.REGISTER, data),
  refresh: (refreshToken: string) =>
    apiPost<{ accessToken: string; refreshToken: string }>(API.AUTH.REFRESH, { refreshToken }),
  getMe: () => apiGet<User>(API.AUTH.ME),
  updateProfile: (data: { name?: string; phone?: string }) =>
    apiPut<User>(API.AUTH.PROFILE, data),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiPut<{ message: string }>(API.AUTH.CHANGE_PASSWORD, { currentPassword, newPassword }),
}
