import { useState, useEffect } from 'react'
import { ShoppingBag, TrendingUp, Clock, DollarSign, UtensilsCrossed } from 'lucide-react'
import { StatCard } from '../../components/data/StatCard'
import { DataTable, Column } from '../../components/data/DataTable'
import { reportService } from '../../services/reportService'
import { orderService } from '../../services/orderService'
import { useRealtime } from '../../hooks/useRealtime'
import { formatCurrency, formatTime } from '../../utils/formatters'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'

export default function Dashboard() {
  const [data, setData] = useState<any>({})
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([reportService.dashboard(), orderService.list({ limit: 10 })]).then(([d, o]) => {
      setData(d); setOrders(o)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useRealtime('order:incoming', () => reportService.dashboard().then(setData).catch(() => {}))

  if (loading) return <Spinner className="py-20" />

  const orderColumns: Column<any>[] = [
    { accessor: 'orderNumber', label: '#', render: r => <span className="font-medium text-amber-400">#{r.orderNumber}</span> },
    { accessor: 'type', label: 'النوع', render: r => <Badge variant={r.type === 'DINE_IN' ? 'info' : 'warning'}>{r.type === 'DINE_IN' ? 'داخلي' : r.type}</Badge> },
    { accessor: 'status', label: 'الحالة', render: r => <Badge variant={r.status === 'PENDING' ? 'warning' : r.status === 'PREPARING' ? 'info' : 'success'}>{r.status}</Badge> },
    { accessor: 'total', label: 'المجموع', render: r => <span className="font-medium">{formatCurrency(r.total)}</span> },
    { accessor: 'createdAt', label: 'الوقت', render: r => <span className="text-gray-500">{formatTime(r.createdAt)}</span> },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">لوحة التحكم</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="طلبات اليوم" value={data?.todayOrders || 0} icon={ShoppingBag} variant="primary" />
        <StatCard label="إيرادات اليوم" value={formatCurrency(data?.todayRevenue || 0)} icon={DollarSign} variant="success" />
        <StatCard label="طلبات معلقة" value={data?.pendingOrders || 0} icon={Clock} variant="warning" />
        <StatCard label="طاولات نشطة" value={data?.activeTables || 0} icon={UtensilsCrossed} variant="info" />
        <StatCard label="أصناف في القائمة" value={data?.totalItems || 0} icon={TrendingUp} variant="primary" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-200 mb-4">آخر الطلبات</h2>
          <DataTable columns={orderColumns} data={orders} searchable={false} pageSize={5} />
        </div>
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-200 mb-4">الأصناف الأكثر مبيعاً</h2>
          {data?.topSellingItems?.length > 0 ? (
            <div className="space-y-3">
              {data.topSellingItems.slice(0, 8).map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-5">{i + 1}</span>
                    <span className="text-sm text-gray-200">{item.nameAr || item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-amber-400">x{item.quantity || item.count}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-500 text-sm">لا توجد بيانات</p>}
        </div>
      </div>
    </div>
  )
}
