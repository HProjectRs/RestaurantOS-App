import { AlertTriangle, Package, Clock, AlertCircle } from 'lucide-react'

const alertIcons = {
  low_stock: Package,
  expiring: Clock,
  pending: AlertCircle,
}

const alertVariants = {
  low_stock: 'border-red-800/40 bg-red-900/20 text-red-300',
  expiring: 'border-yellow-800/40 bg-yellow-900/20 text-yellow-300',
  pending: 'border-blue-800/40 bg-blue-900/20 text-blue-300',
}

const AlertsWidget = ({ alerts = [] }) => {
  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-4">التنبيهات</h2>
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="p-6 rounded-xl bg-gray-900/60 border border-gray-800 text-center text-gray-500 text-sm">
            لا توجد تنبيهات
          </div>
        ) : (
          alerts.map((alert) => {
            const Icon = alertIcons[alert.type] || AlertTriangle
            const variant = alertVariants[alert.type] || alertVariants.pending
            return (
              <div
                key={alert.id}
                className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-sm ${variant}`}
              >
                <Icon className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{alert.title}</p>
                  <p className="text-xs opacity-80 mt-0.5">{alert.message}</p>
                  {alert.time && (
                    <p className="text-xs opacity-60 mt-1">{alert.time}</p>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default AlertsWidget
