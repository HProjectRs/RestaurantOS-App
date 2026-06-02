import { useCallback } from 'react'
import { useAuthStore, User } from '../store/authStore'
import httpClient from '../services/base/httpClient'

export function useAuth() {
  const { user, token, isAuthenticated, loading, setUser, setToken, logout: storeLogout } = useAuthStore()

  const login = useCallback(async (email: string, password: string) => {
    const res = await httpClient.post<{ token: string; user: Record<string, unknown> }>('/auth/login', { email, password })
    const { token: newToken, user: userData } = res.data
    localStorage.setItem('token', newToken)
    setToken(newToken)
    setUser(userData as unknown as User)
    return userData
  }, [setToken, setUser])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    storeLogout()
  }, [storeLogout])

  const me = useCallback(async () => {
    const res = await httpClient.get<Record<string, unknown>>('/auth/me')
    setUser(res.data as unknown as User)
    return res.data
  }, [setUser])

  return { user, isAuthenticated, loading, login, logout, me }
}
