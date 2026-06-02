import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'
import { tableService } from '../../services/tableService'
import { orderService } from '../../services/orderService'
import { Table as TableType } from '../../types'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { DataTable, Column } from '../../components/data/DataTable'
import { useRealtime } from '../../hooks/useRealtime'
import { toast } from 'react-hot-toast'

const statusColors: Record<string, 'success' | 'danger' | 'info' | 'warning'> = {
  AVAILABLE: 'success', OCCUPIED: 'danger', RESERVED: 'warning', MAINTENANCE: 'info',
}
const statusLabels: Record<string, string> = {
  AVAILABLE: 'فارغة', OCCUPIED: 'مشغولة', RESERVED: 'محجوزة', MAINTENANCE: 'صيانة',
}

export default function TablesPage() {
  const [tables, setTables] = useState<TableType[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ number: '', capacity: '4' })
  const [activeOrders, setActiveOrders] = useState<Record<string, any>>({})

  useRealtime('order:new', () => load())
  useRealtime('order:statusUpdate', () => load())

  const load = async () => {
    try {
      const tabs = await tableService.list()
      setTables(tabs)
      const orders: Record<string, any> = {}
      for (const t of tabs) {
        if (t.status === 'OCCUPIED') {
          try { const o = await orderService.getActive(t.id); if (o) orders[t.id] = o } catch {}
        }
      }
      setActiveOrders(orders)
    } catch {} finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const createTable = async (e: React.FormEvent) => {
    e.preventDefault()
    try { await tableService.create({ number: form.number, capacity: parseInt(form.capacity) }); setShowForm(false); setForm({ number: '', capacity: '4' }); load(); toast.success('تمت إضافة الطاولة') }
    catch (err: any) { toast.error(err?.response?.data?.message || 'فشل الإضافة') }
  }

  const columns: Column<TableType>[] = [
    { accessor: 'number', label: 'رقم الطاولة', render: r => <span className="font-bold text-white">طاولة {r.number}</span> },
    { accessor: 'capacity', label: 'السعة', render: r => <span>{r.capacity} أشخاص</span> },
    { accessor: 'status', label: 'الحالة', render: r => <Badge variant={statusColors[r.status]}>{statusLabels[r.status]}</Badge> },
    { label: 'الطلب', render: r => activeOrders[r.id] ? <span className="text-xs text-amber-400">#{activeOrders[r.id].orderNumber} — {formatCurrency(activeOrders[r.id].total)}</span> : '—' },
    { label: 'QR', render: r => r.qrCode ? <a href={r.qrCode} target="_blank" className="text-blue-400 text-xs">عرض</a> : '—' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">إدارة الطاولات</h1>
        <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> إضافة طاولة</Button>
      </div>
      <DataTable columns={columns} data={tables} loading={loading} searchable={false} />
      <Modal open={showForm} onClose={() => setShowForm(false)} title="إضافة طاولة جديدة">
        <form onSubmit={createTable} className="space-y-4">
          <Input label="رقم الطاولة" value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} required />
          <Input label="السعة" type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} required />
          <Button type="submit" className="w-full">إضافة</Button>
        </form>
      </Modal>
    </div>
  )
}
