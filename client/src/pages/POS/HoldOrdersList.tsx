import { Clock, Play } from 'lucide-react'
import { usePOSStore } from '../../store/posStore'

export default function HoldOrdersList({ onResume }) {
  const heldOrders = usePOSStore(s => s.heldOrders)
  const resumeOrder = usePOSStore(s => s.resumeOrder)
  if (!heldOrders?.length) return null
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2"><Clock size={14} />الطلبات المعلقة ({heldOrders.length})</h3>
      <div className="space-y-2">
        {heldOrders.map(order => {
          const total = order.items.reduce((s, i) => s + i.price * i.qty, 0)
          return (
            <div key={order.id} className="flex items-center justify-between bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
              <div>
                <div className="text-sm font-bold text-white">#{order.id.toString().slice(-4)} - {order.customer?.name || 'عميل'}</div>
                <div className="text-xs text-gray-400">{order.items.length} صنف - ${total.toFixed(2)}</div>
              </div>
              <button onClick={() => { resumeOrder(order.id); onResume?.() }} className="flex items-center gap-1 bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1.5 rounded-lg text-xs transition"><Play size={12} />استئناف</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
