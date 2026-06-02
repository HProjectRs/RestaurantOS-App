import { useAuthStore } from '../../stores/authStore'
import { LogOut, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'

export function Header() {
  const user = useAuthStore(s => s.user)
  const business = useAuthStore(s => s.business)
  const logout = useAuthStore(s => s.logout)
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-20 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="text-sm text-gray-400">
          {business && <span className="text-white font-medium ml-2">{business.nameAr || business.name}</span>}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-left">
            <p className="text-sm text-white font-medium">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.role === 'ADMIN' ? 'مدير' : user?.role}</p>
          </div>
          <button onClick={() => navigate(ROUTES.SETTINGS)} className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800">
            <User className="w-4 h-4" />
          </button>
          <button onClick={logout} className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-gray-800">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
