import { useState, useEffect } from 'react'
import { Plus, AlertTriangle, ClipboardList } from 'lucide-react'
import { inventoryService } from '../../services/inventoryService'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { DataTable, Column } from '../../components/data/DataTable'
import { StatCard } from '../../components/data/StatCard'
import { toast } from 'react-hot-toast'

interface InventoryItem { id: string; name: string; nameAr?: string; sku?: string; category: string; unit: string; currentStock: number; minStock: number; price: number; isActive: boolean }

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', nameAr: '', category: 'مواد خام', unit: 'كجم', currentStock: '0', minStock: '10', price: '0' })

  useEffect(() => { load() }, [])
  const load = async () => { try { const res = await inventoryService.getItems(); setItems(res) } catch {} finally { setLoading(false) } }

  const createItem = async (e: React.FormEvent) => {
    e.preventDefault()
    try { await inventoryService.createItem({ ...form, currentStock: Number(form.currentStock), minStock: Number(form.minStock), price: Number(form.price) }); setShowForm(false); setForm({ name: '', nameAr: '', category: 'مواد خام', unit: 'كجم', currentStock: '0', minStock: '10', price: '0' }); load(); toast.success('تمت الإضافة') }
    catch (err: any) { toast.error(err?.response?.data?.message || 'فشل') }
  }

  const lowStock = items.filter(i => i.currentStock <= i.minStock)
  const columns: Column<InventoryItem>[] = [
    { accessor: 'name', label: 'الصنف', render: r => <span className="font-medium">{r.nameAr || r.name}</span> },
    { accessor: 'category', label: 'التصنيف' },
    { accessor: 'currentStock', label: 'المخزون', render: r => <span className={r.currentStock <= r.minStock ? 'text-red-400 font-medium' : ''}>{r.currentStock} {r.unit}</span> },
    { accessor: 'minStock', label: 'الحد الأدنى', render: r => <span className="text-gray-500">{r.minStock}</span> },
    { accessor: 'price', label: 'السعر', render: r => <span>{r.price.toLocaleString()} د.ج</span> },
    { accessor: 'isActive', label: 'الحالة', render: r => <Badge variant={r.isActive ? 'success' : 'default'}>{r.isActive ? 'نشط' : 'غير نشط'}</Badge> },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h1 className="text-xl font-bold">المخزون</h1><Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> إضافة صنف</Button></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="إجمالي الأصناف" value={items.length} icon={ClipboardList} variant="primary" />
        <StatCard label="مخزون منخفض" value={lowStock.length} icon={AlertTriangle} variant={lowStock.length > 0 ? 'danger' : 'success'} />
        <StatCard label="قيمة المخزون" value={items.reduce((s, i) => s + i.currentStock * i.price, 0).toLocaleString() + ' د.ج'} icon={ClipboardList} variant="info" />
      </div>
      <DataTable columns={columns} data={items} loading={loading} />
      <Modal open={showForm} onClose={() => setShowForm(false)} title="إضافة صنف جديد">
        <form onSubmit={createItem} className="space-y-4">
          <Input label="الاسم" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <Input label="الاسم (عربي)" value={form.nameAr} onChange={e => setForm(f => ({ ...f, nameAr: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="التصنيف" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
            <Input label="الوحدة" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="المخزون الحالي" type="number" value={form.currentStock} onChange={e => setForm(f => ({ ...f, currentStock: e.target.value }))} />
            <Input label="الحد الأدنى" type="number" value={form.minStock} onChange={e => setForm(f => ({ ...f, minStock: e.target.value }))} />
            <Input label="سعر الوحدة" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
          </div>
          <Button type="submit" className="w-full">حفظ</Button>
        </form>
      </Modal>
    </div>
  )
}
