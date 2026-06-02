import { useState, useEffect } from 'react'
import { Clock, Check, CookingPot } from 'lucide-react'
import { posService } from '../../services/posService'
import { Badge } from '../../components/ui/Badge'

export default function OrderTicket({ order, onUpdate }) {
  const [elapsed, setElapsed] = useState('')
  useEffect(() => {
    const timer = setInterval(() => {
      const diff = Date.now() - new Date(order.createdAt).getTime()
      const m = Math.floor(diff / 60000)
      setElapsed(m < 60 ? `${m} د` : `${Math.floor(m / 60)}س ${m % 60}د`)
    }, 60000)
    return () => clearInterval(timer)
  }, [order.createdAt])
  const urgency = elapsed.includes('د') && parseInt(elapsed) > 30 ? 'red' : elapsed.includes('د') && parseInt(elapsed) > 15 ? 'orange' : 'yellow'
  const borderColors = { red: 'border-red-500/50', orange: 'border-orange-500/50', yellow: 'border-yellow-500/30' }
  const bgColors = { red: 'bg-red-950/40', orange: 'bg-orange-950/30', yellow: '' }
  return (
    <div className={`rounded-2xl border ${borderColors[urgency]} ${bgColors[urgency]} bg-gray-900 p-5 shadow-lg`}>
      <div className="flex justify-between items-start mb-3">
        <div><h3 className="text-2xl font-bold text-white">#{order.orderNumber}</h3><p className="text-gray-400 text-sm">{order.customer}{order.table ? ` - طاولة ${order.table}` : ''}</p></div>
        <div className="text-right"><div className={`flex items-center gap-1 text-sm ${urgency === 'red' ? 'text-red-400 animate-pulse' : urgency === 'orange' ? 'text-orange-400' : 'text-yellow-400'}`}><Clock size={14} />{elapsed}</div><Badge variant={order.status} className="mt-1">{order.status}</Badge></div>
      </div>
      <div className="border-t border-gray-800 pt-3 space-y-2 mb-4">
        {order.items?.map((item, i) => (
          <div key={i} className="flex justify-between items-center">
            <span className="text-white font-medium text-lg"><span className="text-indigo-400 ml-2">{item.qty}x</span>{item.name}</span>
            {item.modifiers?.length > 0 && <span className="text-xs text-gray-500">{item.modifiers.join(', ')}</span>}
          </div>
        ))}
      </div>
      {order.notes && <div className="text-sm text-yellow-400 bg-yellow-500/10 rounded-lg p-2 mb-3">ملاحظة: {order.notes}</div>}
      <div className="flex gap-2">
        {order.status === 'pending' && <button onClick={() => posService.updateOrderStatus(order.id, 'preparing').then(onUpdate)} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-sm font-semibold transition"><CookingPot size={16} />تحضير</button>}
        {order.status === 'preparing' && <button onClick={() => posService.updateOrderStatus(order.id, 'ready').then(onUpdate)} className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl text-sm font-semibold transition"><Check size={16} />جاهز</button>}
        {order.status === 'ready' && <button onClick={() => posService.updateOrderStatus(order.id, 'served').then(onUpdate)} className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-3 rounded-xl text-sm font-semibold transition">تم التقديم</button>}
      </div>
    </div>
  )
}
