import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string; value: string | number; icon?: LucideIcon; variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  subtitle?: string; trend?: { value: number; positive: boolean }
}

const iconColors = {
  primary: 'bg-blue-500/20 text-blue-400', success: 'bg-green-500/20 text-green-400',
  warning: 'bg-yellow-500/20 text-yellow-400', danger: 'bg-red-500/20 text-red-400', info: 'bg-amber-500/20 text-amber-400',
}

export function StatCard({ label, value, icon: Icon, variant = 'primary', subtitle, trend }: StatCardProps) {
  return (
    <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          {trend && (
            <p className={`text-xs ${trend.positive ? 'text-green-400' : 'text-red-400'}`}>
              {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${iconColors[variant]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  )
}
