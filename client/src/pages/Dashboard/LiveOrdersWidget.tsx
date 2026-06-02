import { useRealtime } from '../../hooks/useRealtime'
import { Clock, ChefHat, CheckCircle } from 'lucide-react'
import { useState } from 'react'

const statusStyles = {
  new: 'bg-blue-900/30 text-blue-300 border-blue-800/40',
  preparing: 'bg-yellow-900/30 text-yellow-300 border-yellow-800/40',
  ready: 'bg-green-900/30 text-green-300 border-green-800/40',
  served: 'bg-gray-800 text-gray-400 border-gray-700',
}

const statusLabels = {
  new: 'جديد',
  preparing: 'قيد التحضير',
  ready: 'جاهز',
  served: 'تم التقديم',
}

const LiveOrdersWidget = ({ orders: initialOrders = [] }) => {
  const [orders, setOrders] = useState(initialOrders)

  useRealtime('order:new', (order) => {
    setOrders((prev) => [order, ...prev])
  })

  useRealtime('order:updated', (updated) => {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
  })

  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-4">الطلبات الحية</h2>
      <div className="space-y-3">
        {orders.length === 0 ? (
          <div className="p-6 rounded-xl bg-gray-900/60 border border-gray-800 text-center text-gray-500 text-sm">
            لا توجد طلبات نشطة
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-white">
                  طلب #{order.orderNumber}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border ${statusStyles[order.status] || statusStyles.new}`}
                >
                  {statusLabels[order.status] || order.status}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-2">
                طاولة {order.table} | {order.items?.length ?? 0} صنف
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3.5 h-3.5" />
                <span>{order.timeAgo || 'الآن'}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default LiveOrdersWidget
