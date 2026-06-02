import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useOrderNotifications } from '../../hooks/useRealtime'

export function Layout() {
  useOrderNotifications()

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <div className="mr-56">
        <Header />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
