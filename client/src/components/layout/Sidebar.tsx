import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingCart, UtensilsCrossed, Table, ClipboardList, Package,
  ChefHat, Truck, BookOpen, Users, Wallet, UsersRound, BarChart3, Settings, ChevronLeft, Menu
} from 'lucide-react'
import { ROUTES } from '../../constants/routes'

interface NavItem { label: string; icon: any; path: string; badge?: string | number }

const navItems: NavItem[] = [
  { label: 'لوحة التحكم', icon: LayoutDashboard, path: ROUTES.DASHBOARD },
  { label: 'نقطة البيع', icon: ShoppingCart, path: ROUTES.POS },
  { label: 'الطلبات', icon: ClipboardList, path: ROUTES.ORDERS },
  { label: 'الطاولات', icon: Table, path: ROUTES.TABLES },
  { label: 'قائمة الطعام', icon: UtensilsCrossed, path: ROUTES.MENU },
  { label: 'المخزون', icon: Package, path: ROUTES.INVENTORY },
  { label: 'الوصفات', icon: ChefHat, path: ROUTES.RECIPES },
  { label: 'الموردين', icon: Truck, path: ROUTES.SUPPLIERS },
  { label: 'التوصيل', icon: Truck, path: ROUTES.DELIVERY },
  { label: 'شاشة الطباخ', icon: ChefHat, path: ROUTES.KDS },
  { label: 'الموارد البشرية', icon: Users, path: ROUTES.HR },
  { label: 'المحاسبة', icon: Wallet, path: ROUTES.ACCOUNTING },
  { label: 'العملاء', icon: UsersRound, path: ROUTES.CRM },
  { label: 'التقارير', icon: BarChart3, path: ROUTES.REPORTS },
  { label: 'الإعدادات', icon: Settings, path: ROUTES.SETTINGS },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={`fixed right-0 top-0 bottom-0 z-30 bg-gray-950 border-l border-gray-800 transition-all duration-300 ${collapsed ? 'w-16' : 'w-56'} overflow-y-auto`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        {!collapsed && <span className="font-bold text-amber-400">RestaurantOS</span>}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800">
          {collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
      <nav className="p-2 space-y-1">
        {navItems.map(item => (
          <NavLink key={item.path} to={item.path} end={item.path === ROUTES.DASHBOARD}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-amber-500/20 text-amber-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`
            }>
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
            {item.badge && !collapsed && <span className="mr-auto text-xs bg-amber-500 text-black px-1.5 py-0.5 rounded-full">{item.badge}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
