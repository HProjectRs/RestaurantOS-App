import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, Business } from '../types'

interface AuthState {
  user: User | null
  business: Business | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  loading: boolean
  setUser: (user: User) => void
  setBusiness: (business: Business) => void
  setTokens: (token: string, refreshToken?: string) => void
  logout: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null, business: null, token: null, refreshToken: null,
      isAuthenticated: false, loading: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
      setBusiness: (business) => set({ business }),
      setTokens: (token, refreshToken) => set({ token, refreshToken, isAuthenticated: true }),
      logout: () => set({ user: null, business: null, token: null, refreshToken: null, isAuthenticated: false }),
      setLoading: (loading) => set({ loading }),
    }),
    { name: 'auth-storage', partialize: (state) => ({ user: state.user, token: state.token, refreshToken: state.refreshToken, business: state.business, isAuthenticated: state.isAuthenticated }) },
  ),
)
