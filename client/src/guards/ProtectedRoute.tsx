import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { ROUTES } from '../constants/routes'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  return <>{children}</>
}
