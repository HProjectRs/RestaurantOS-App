import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, CreditCard, Clock } from 'lucide-react'
import { reportService } from '../../services/reportService'
import { StatCard } from '../../components/data/StatCard'
import { DataTable, Column } from '../../components/data/DataTable'
import { Spinner } from '../../components/ui/Spinner'
import { formatCurrency } from '../../utils/formatters'

export default function ReportsPage() {
  const [sales, setSales] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [payments, setPayments] = useState<Record<string, any>>({})
  const [peak, setPeak] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      reportService.sales({ groupBy: 'day' }), reportService.categories(), reportService.paymentMethods(), reportService.peakHours(),
    ]).then(([s, c, p, pk]) => { setSales(s); setCategories(c); setPayments(p); setPeak(pk) }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner className="py-20" />

  const totalSales = sales.reduce((s, d: any) => s + Number(d.total), 0)
  const totalOrders = sales.reduce((s, d: any) => s + Number(d.count), 0)

  const salesCols: Column<any>[] = [
    { accessor: 'date', label: 'التاريخ', render: r => new Date(r.date).toLocaleDateString('ar-SA') },
    { accessor: 'count', label: 'الطلبات' },
    { accessor: 'total', label: 'الإيرادات', render: r => <span className="font-medium text-green-400">{formatCurrency(Number(r.total))}</span> },
  ]

  const catCols: Column<any>[] = [
    { accessor: 'nameAr', label: 'التصنيف', render: r => <span className="font-medium">{r.nameAr || r.name}</span> },
    { accessor: 'totalSold', label: 'المبيعات' },
    { accessor: 'revenue', label: 'الإيرادات', render: r => <span className="font-medium">{formatCurrency(Number(r.revenue))}</span> },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">التقارير</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="إجمالي الإيرادات" value={formatCurrency(totalSales)} icon={TrendingUp} variant="success" />
        <StatCard label="إجمالي الطلبات" value={totalOrders} icon={BarChart3} variant="primary" />
        <StatCard label="طرق الدفع" value={Object.keys(payments).length} icon={CreditCard} variant="info" />
        <StatCard label="أكثر ساعة ازدحاماً" value={peak?.hourly?.reduce?.((a: any, b: any) => a.count > b.count ? a : b, { hour: 0 })?.hour + ':00' || '—'} icon={Clock} variant="warning" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-200 mb-4">المبيعات اليومية</h2>
          <DataTable columns={salesCols} data={sales} searchable={false} pageSize={7} />
        </div>
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-200 mb-4">المبيعات حسب التصنيف</h2>
          <DataTable columns={catCols} data={categories} searchable={false} pageSize={7} />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-200 mb-4">طرق الدفع</h2>
          <div className="space-y-3">
            {Object.entries(payments).map(([method, data]: [string, any]) => (
              <div key={method} className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0">
                <span className="text-sm">{method === 'CASH' ? 'نقداً' : method === 'CARD' ? 'بطاقة' : method === 'STRIPE' ? 'Stripe' : method}</span>
                <div className="text-left"><span className="font-medium">{formatCurrency(data.revenue)}</span><span className="text-xs text-gray-500 mr-2">({data.count} عملية)</span></div>
              </div>
            ))}
            {Object.keys(payments).length === 0 && <p className="text-gray-500 text-sm">لا توجد بيانات</p>}
          </div>
        </div>
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-200 mb-4">أوقات الذروة</h2>
          <div className="space-y-1">
            {peak?.hourly?.slice(0, 12).map((h: any) => (
              <div key={h.hour} className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 w-10">{h.hour}:00</span>
                <div className="flex-1 h-4 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500/50 rounded-full" style={{ width: `${Math.min(100, (h.count / Math.max(...peak.hourly.map((x: any) => x.count), 1)) * 100)}%` }} />
                </div>
                <span className="text-xs text-gray-400 w-16 text-left">{h.count} طلب</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
