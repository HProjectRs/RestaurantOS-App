import { UserRole } from '../types'

const modulePermissions: Record<string, string[]> = {
  dashboard: ['ADMIN', 'MANAGER', 'CASHIER'],
  pos: ['ADMIN', 'MANAGER', 'CASHIER'],
  orders: ['ADMIN', 'MANAGER', 'CASHIER', 'WAITER'],
  tables: ['ADMIN', 'MANAGER', 'WAITER'],
  menu: ['ADMIN', 'MANAGER'],
  inventory: ['ADMIN', 'MANAGER'],
  recipes: ['ADMIN', 'MANAGER'],
  suppliers: ['ADMIN', 'MANAGER'],
  kds: ['ADMIN', 'MANAGER', 'CHEF'],
  hr: ['ADMIN', 'MANAGER'],
  accounting: ['ADMIN', 'MANAGER'],
  crm: ['ADMIN', 'MANAGER'],
  delivery: ['ADMIN', 'MANAGER', 'DRIVER'],
  reports: ['ADMIN', 'MANAGER', 'CASHIER'],
  settings: ['ADMIN'],
}

const validActions = ['view', 'create', 'edit', 'delete']

export function canAccess(role: string | null | undefined, module: string | null | undefined, action: string = 'view'): boolean {
  if (!role || !module) return false
  if (!validActions.includes(action)) return false
  const allowedRoles = modulePermissions[module.toLowerCase()]
  if (!allowedRoles) return false
  return allowedRoles.includes(role)
}

const roleHierarchy: Record<UserRole, number> = {
  ADMIN: 100, MANAGER: 80, CASHIER: 60, WAITER: 40, CHEF: 20,
}

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

export const roleLabels: Record<UserRole, string> = {
  ADMIN: 'مدير', MANAGER: 'مشرف', CASHIER: 'كاشير', WAITER: 'نادل', CHEF: 'طباخ',
}

export const roleColors: Record<UserRole, string> = {
  ADMIN: 'bg-red-500/20 text-red-400', MANAGER: 'bg-blue-500/20 text-blue-400',
  CASHIER: 'bg-green-500/20 text-green-400', WAITER: 'bg-amber-500/20 text-amber-400',
  CHEF: 'bg-purple-500/20 text-purple-400',
}
