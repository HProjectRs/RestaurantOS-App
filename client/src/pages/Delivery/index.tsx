import { useState, useEffect } from 'react'
import { Truck, Users, Map, BarChart3 } from 'lucide-react'
import { deliveryService } from '../../services/deliveryService'
import { Delivery, DeliveryDriver, DeliveryZone } from '../../types'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { DataTable, Column } from '../../components/data/DataTable'
import { StatCard } from '../../components/data/StatCard'
import { useRealtime } from '../../hooks/useRealtime'
import { toast } from 'react-hot-toast'

export default function DeliveryPage() {
  const [tab, setTab] = useState('board')
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([])
  const [zones, setZones] = useState<DeliveryZone[]>([])
  const [loading, setLoading] = useState(true)

  useRealtime('delivery:new', () => load())
  useRealtime('delivery:statusUpdate', () => load())

  const load = async () => { try { const [d, dr, z] = await Promise.all([deliveryService.getDeliveries(), deliveryService.getDrivers(), deliveryService.getZones()]); setDeliveries(d); setDrivers(dr); setZones(z) } catch {} finally { setLoading(false) } }
  useEffect(() => { load() }, [])

  const statusColors: Record<string, 'default' | 'info' | 'success' | 'danger' | 'warning'> = {
    pending: 'warning', assigned: 'info', picked_up: 'info', in_transit: 'info', delivered: 'success', failed: 'danger',
  }
  const statusLabels: Record<string, string> = { pending: 'معلق', assigned: 'تم التعيين', picked_up: 'تم الاستلام', in_transit: 'قيد التوصيل', delivered: 'تم التوصيل', failed: 'فشل' }

  const tabs = [
    { key: 'board', label: 'لوحة التوصيل', icon: Truck },
    { key: 'drivers', label: 'السائقين', icon: Users },
    { key: 'zones', label: 'المناطق', icon: Map },
    { key: 'stats', label: 'إحصائيات', icon: BarChart3 },
  ]

  const delCols: Column<Delivery>[] = [
    { accessor: 'customerName', label: 'العميل', render: r => <span className="font-medium">{r.customerName}</span> },
    { accessor: 'customerAddress', label: 'العنوان', render: r => <span className="text-xs text-gray-400">{r.customerAddress || '—'}</span> },
    { accessor: 'driver', label: 'السائق', render: r => <span>{r.driver?.name || '—'}</span> },
    { accessor: 'status', label: 'الحالة', render: r => <Badge variant={statusColors[r.status]}>{statusLabels[r.status]}</Badge> },
    { accessor: 'deliveryFee', label: 'الرسوم', render: r => <span>{r.deliveryFee.toLocaleString()} د.ج</span> },
  ]

  const drvCols: Column<DeliveryDriver>[] = [
    { accessor: 'name', label: 'الاسم', render: r => <span className="font-medium">{r.name}</span> },
    { accessor: 'phone', label: 'الهاتف' },
    { accessor: 'vehicle', label: 'المركبة', render: r => <span className="text-gray-400">{r.vehicle || '—'}</span> },
    { accessor: 'status', label: 'الحالة', render: r => <Badge variant={r.status === 'online' ? 'success' : r.status === 'busy' ? 'warning' : 'default'}>{r.status === 'online' ? 'متصل' : r.status === 'busy' ? 'مشغول' : 'غير متصل'}</Badge> },
    { accessor: 'totalDeliveries', label: 'التوصيلات', render: r => <span>{r.totalDeliveries}</span> },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold flex items-center gap-2"><Truck className="w-6 h-6 text-amber-400" /> التوصيل</h1>
      <div className="flex gap-1 p-1 bg-gray-900/80 border border-gray-800 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${tab === t.key ? 'bg-amber-500/20 text-amber-400' : 'text-gray-400 hover:text-white'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>
      {tab === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 min-h-[400px]">
          {['pending', 'assigned', 'picked_up', 'in_transit', 'delivered'].map(status => (
            <div key={status} className="bg-gray-900/40 border border-gray-800 rounded-xl p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold uppercase text-gray-400">{statusLabels[status]}</h3>
                <span className="text-xs text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">{deliveries.filter(d => d.status === status).length}</span>
              </div>
              <div className="space-y-2">
                {deliveries.filter(d => d.status === status).map(del => (
                  <div key={del.id} className="p-3 rounded-lg bg-gray-800/80 border border-gray-700 space-y-2">
                    <div className="flex items-center justify-between"><span className="text-xs font-medium text-amber-400">طلب #{del.order?.orderNumber || '—'}</span></div>
                    <p className="text-xs text-gray-300">{del.customerName}</p>
                    <p className="text-xs text-gray-500">{del.customerAddress}</p>
                    {del.driver && <p className="text-xs text-blue-400">{del.driver.name}</p>}
                  </div>
                ))}
                {deliveries.filter(d => d.status === status).length === 0 && <p className="text-center py-8 text-gray-600 text-xs">لا يوجد</p>}
              </div>
            </div>
          ))}
        </div>
      )}
      {tab === 'drivers' && <DataTable<DeliveryDriver> columns={drvCols} data={drivers} loading={loading} />}
      {tab === 'zones' && (
        <DataTable<DeliveryZone> columns={[
          { accessor: 'name', label: 'المنطقة', render: r => <span className="font-medium">{r.name}</span> },
          { accessor: 'deliveryFee', label: 'رسوم التوصيل', render: r => <span>{r.deliveryFee.toLocaleString()} د.ج</span> },
          { accessor: 'minOrder', label: 'أقل طلب', render: r => <span className="text-gray-400">{r.minOrder.toLocaleString()} د.ج</span> },
          { accessor: 'estimatedTime', label: 'الوقت التقريبي', render: r => <span>{r.estimatedTime} دقيقة</span> },
        ]} data={zones} loading={loading} />
      )}
      {tab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="إجمالي التوصيلات" value={deliveries.length} icon={Truck} variant="primary" />
          <StatCard label="سائقين نشطين" value={drivers.filter(d => d.status === 'online' || d.status === 'busy').length} icon={Users} variant="success" />
          <StatCard label="مناطق التوصيل" value={zones.length} icon={Map} variant="info" />
          <StatCard label="قيد التوصيل" value={deliveries.filter(d => d.status === 'in_transit').length} icon={Truck} variant="warning" />
        </div>
      )}
    </div>
  )
}
