import { useState, useEffect } from 'react'
import { orderService } from '../../services/orderService'
import { useRealtime } from '../../hooks/useRealtime'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { formatTime } from '../../utils/formatters'
import { Clock, ChefHat } from 'lucide-react'
import toast from 'react-hot-toast'

export default function KDSPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useRealtime('order:incoming', () => loadOrders())
  useRealtime('order:statusUpdate', () => loadOrders())

  const loadOrders = async () => {
    try { const res = await orderService.list({ status: 'CONFIRMED,PREPARING' }); setOrders(res) } catch {}
    finally { setLoading(false) }
  }
  useEffect(() => { loadOrders() }, [])

  const startPrep = async (orderId: string) => {
    try { await orderService.updateStatus(orderId, 'PREPARING'); loadOrders(); toast.success('بدأ التحضير') } catch { toast.error('فشل') }
  }

  const markReady = async (orderId: string) => {
    try { await orderService.updateStatus(orderId, 'READY'); loadOrders(); toast.success('تم التجهيز') } catch { toast.error('فشل') }
  }

  const markItemDone = async (orderId: string, itemId: string) => {
    try { await orderService.updateItemStatus(orderId, itemId, 'READY'); loadOrders() } catch {}
  }

  if (loading) return <div className="text-center py-20 text-gray-500">جارٍ التحميل...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold flex items-center gap-2"><ChefHat className="w-6 h-6 text-amber-400" /> شاشة الطباخ</h1>
      {orders.length === 0 ? (
        <div className="text-center py-20 text-gray-500">لا توجد طلبات حالياً</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map(order => (
            <div key={order.id} className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-amber-400">#{order.orderNumber}</span>
                <Badge variant={order.status === 'PREPARING' ? 'info' : 'warning'}>{order.status === 'PREPARING' ? 'قيد التحضير' : 'مؤكد'}</Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" /> {formatTime(order.createdAt)}
                {order.table && <span>طاولة {order.table.number}</span>}
                {order.customerName && <span>{order.customerName}</span>}
              </div>
              <div className="space-y-2 border-t border-gray-800 pt-3">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{item.menuItem?.nameAr || item.menuItem?.name}</p>
                      <p className="text-xs text-gray-500">x{item.quantity}</p>
                    </div>
                    <Button size="sm" variant={item.status === 'READY' ? 'outline' : 'secondary'} disabled={item.status === 'READY'} onClick={() => markItemDone(order.id, item.id)}>
                      {item.status === 'READY' ? 'تم' : 'تجهيز'}
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2 border-t border-gray-800">
                {order.status === 'CONFIRMED' && <Button onClick={() => startPrep(order.id)} className="flex-1">بدء التحضير</Button>}
                {order.status === 'PREPARING' && <Button onClick={() => markReady(order.id)} className="flex-1" variant="primary">تجهيز للخدمة</Button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
