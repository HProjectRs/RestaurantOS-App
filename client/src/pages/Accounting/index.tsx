import { useState, useEffect } from 'react'
import { Plus, DollarSign, TrendingDown, TrendingUp } from 'lucide-react'
import { expenseService } from '../../services/expenseService'
import { reportService } from '../../services/reportService'
import { Expense } from '../../types'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { DataTable, Column } from '../../components/data/DataTable'
import { StatCard } from '../../components/data/StatCard'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { toast } from 'react-hot-toast'

export default function AccountingPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ description: '', amount: '', category: 'أخرى', notes: '' })

  useEffect(() => {
    Promise.all([expenseService.list(), reportService.sales({ groupBy: 'day' })]).then(([e, s]) => { setExpenses(e); setSales(s) }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const totalSales = sales.reduce((s, d: any) => s + Number(d.total), 0)

  const createExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    try { await expenseService.create({ ...form, amount: Number(form.amount) }); setShowForm(false); setForm({ description: '', amount: '', category: 'أخرى', notes: '' }); const res = await expenseService.list(); setExpenses(res); toast.success('تمت الإضافة') }
    catch (err: any) { toast.error(err?.response?.data?.message || 'فشل') }
  }

  const columns: Column<Expense>[] = [
    { accessor: 'description', label: 'الوصف' },
    { accessor: 'category', label: 'التصنيف', render: r => <span className="text-gray-400">{r.category}</span> },
    { accessor: 'amount', label: 'المبلغ', render: r => <span className="font-medium text-red-400">{formatCurrency(r.amount)}</span> },
    { accessor: 'date', label: 'التاريخ', render: r => <span className="text-gray-500">{formatDate(r.date)}</span> },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">المحاسبة</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="إجمالي المبيعات" value={formatCurrency(totalSales)} icon={TrendingUp} variant="success" />
        <StatCard label="إجمالي المصروفات" value={formatCurrency(totalExpenses)} icon={TrendingDown} variant="danger" />
        <StatCard label="صافي الربح" value={formatCurrency(totalSales - totalExpenses)} icon={DollarSign} variant={totalSales > totalExpenses ? 'success' : 'danger'} />
      </div>
      <div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-gray-200">المصروفات</h2><Button onClick={() => setShowForm(true)} size="sm"><Plus className="w-4 h-4" /> إضافة مصروف</Button></div>
      <DataTable columns={columns} data={expenses} loading={loading} />
      <Modal open={showForm} onClose={() => setShowForm(false)} title="إضافة مصروف">
        <form onSubmit={createExpense} className="space-y-4">
          <Input label="الوصف" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="المبلغ" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
            <Input label="التصنيف" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
          </div>
          <Input label="ملاحظات" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <Button type="submit" className="w-full">حفظ</Button>
        </form>
      </Modal>
    </div>
  )
}
