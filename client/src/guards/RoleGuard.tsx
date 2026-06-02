import { ReactNode } from 'react'
import { useAuthStore } from '../stores/authStore'

const moduleRoles: Record<string, string[]> = {
  POS: ['CASHIER', 'MANAGER', 'ADMIN'],
  Orders: ['CASHIER', 'MANAGER', 'ADMIN'],
  Tables: ['WAITER', 'MANAGER', 'ADMIN'],
  Inventory: ['MANAGER', 'ADMIN'],
  Recipes: ['MANAGER', 'ADMIN'],
  Suppliers: ['MANAGER', 'ADMIN'],
  HR: ['MANAGER', 'ADMIN'],
  Accounting: ['MANAGER', 'ADMIN'],
  CRM: ['MANAGER', 'ADMIN'],
  Delivery: ['MANAGER', 'ADMIN', 'DRIVER'],
  Reports: ['MANAGER', 'ADMIN'],
  Settings: ['ADMIN'],
  KDS: ['CHEF', 'MANAGER', 'ADMIN'],
}

export function RoleGuard({ children, roles, module }: { children: ReactNode; roles?: string[]; module?: string }) {
  const user = useAuthStore(s => s.user)
  const resolvedRoles = roles || (module ? moduleRoles[module] : undefined)
  if (!resolvedRoles || !resolvedRoles.length) return <>{children}</>
  if (user?.role === 'ADMIN') return <>{children}</>
  if (resolvedRoles.includes(user?.role || '')) return <>{children}</>
  return <div className="p-8 text-center text-gray-500">ليس لديك صلاحية للوصول إلى هذه الصفحة</div>
}
