import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface Props {
  children?: React.ReactNode
}

export default function GuestRoute({ children }: Props) {
  const { user, token } = useAuthStore()

  if (user && token) {
    return <Navigate to="/admin" replace />
  }

  return children ? <>{children}</> : <Outlet />
}
