import { ReactNode } from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'amber'

interface BadgeProps {
  variant?: BadgeVariant; children: ReactNode; className?: string
}

const colors: Record<BadgeVariant, string> = {
  default: 'bg-gray-700 text-gray-300',
  success: 'bg-green-500/20 text-green-400',
  warning: 'bg-yellow-500/20 text-yellow-400',
  danger: 'bg-red-500/20 text-red-400',
  info: 'bg-blue-500/20 text-blue-400',
  amber: 'bg-amber-500/20 text-amber-400',
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[variant]} ${className}`}>{children}</span>
}
