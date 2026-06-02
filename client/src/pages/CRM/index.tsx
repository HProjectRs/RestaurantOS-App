import { useState, useEffect } from 'react'
import { Search, Plus, Star, Users } from 'lucide-react'
import { loyaltyService } from '../../services/loyaltyService'
import { LoyaltyCustomer } from '../../types'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { DataTable, Column } from '../../components/data/DataTable'
import { StatCard } from '../../components/data/StatCard'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { toast } from 'react-hot-toast'

export default function CRMPage() {
  const [customers, setCustomers] = useState<LoyaltyCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchPhone, setSearchPhone] = useState('')
  const [searchResult, setSearchResult] = useState<LoyaltyCustomer & { transactions?: any[] } | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ phone: '', name: '' })

  useEffect(() => { load() }, [])
  const load = async () => { try { const res = await loyaltyService.listCustomers(); setCustomers(res) } catch {} finally { setLoading(false) } }

  const searchCustomer = async () => {
    if (!searchPhone) return
    try { const res = await loyaltyService.searchCustomer(searchPhone); setSearchResult(res) }
    catch { toast.error('لم يتم العثور على العميل') }
  }

  const addCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    try { await loyaltyService.createCustomer(addForm); setShowAdd(false); setAddForm({ phone: '', name: '' }); load(); toast.success('تمت الإضافة') }
    catch (err: any) { toast.error(err?.response?.data?.message || 'فشل') }
  }

  const totalPoints = customers.reduce((s, c) => s + c.totalPoints, 0)
  const totalSpent = customers.reduce((s, c) => s + Number(c.totalSpent), 0)

  const columns: Column<LoyaltyCustomer>[] = [
    { accessor: 'name', label: 'الاسم', render: r => <span className="font-medium">{r.name || '—'}</span> },
    { accessor: 'phone', label: 'الهاتف' },
    { accessor: 'totalPoints', label: 'النقاط', render: r => <Badge variant="amber">{r.totalPoints}</Badge> },
    { accessor: 'totalSpent', label: 'الإجمالي', render: r => <span>{formatCurrency(Number(r.totalSpent))}</span> },
    { accessor: 'visitCount', label: 'الزيارات', render: r => <span className="text-gray-500">{r.visitCount}</span> },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">إدارة العملاء</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="إجمالي العملاء" value={customers.length} icon={Users} variant="primary" />
        <StatCard label="إجمالي النقاط" value={totalPoints.toLocaleString()} icon={Star} variant="info" />
        <StatCard label="إجمالي الإنفاق" value={formatCurrency(totalSpent)} icon={Star} variant="success" />
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 flex gap-2">
          <Input value={searchPhone} onChange={e => setSearchPhone(e.target.value)} placeholder="بحث برقم الهاتف..." />
          <Button onClick={searchCustomer} variant="secondary">بحث</Button>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> إضافة عميل</Button>
      </div>
      {searchResult && (
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div><p className="font-medium">{searchResult.name || 'عميل'}</p><p className="text-sm text-gray-500">{searchResult.phone}</p></div>
            <Badge variant="amber">{searchResult.totalPoints} نقطة</Badge>
          </div>
          <div className="text-xs text-gray-400">{searchResult.visitCount} زيارة | آخر زيارة: {searchResult.lastVisit ? formatDate(searchResult.lastVisit) : '—'}</div>
        </div>
      )}
      <DataTable columns={columns} data={customers} loading={loading} />
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="إضافة عميل">
        <form onSubmit={addCustomer} className="space-y-4">
          <Input label="رقم الهاتف" value={addForm.phone} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))} required />
          <Input label="الاسم" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} />
          <Button type="submit" className="w-full">حفظ</Button>
        </form>
      </Modal>
    </div>
  )
}
