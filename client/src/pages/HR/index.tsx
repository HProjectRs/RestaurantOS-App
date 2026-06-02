import { useState, useEffect } from 'react'
import { Plus, Clock, UserPlus } from 'lucide-react'
import { employeeService } from '../../services/employeeService'
import { User } from '../../types'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { DataTable, Column } from '../../components/data/DataTable'
import { roleColors, roleLabels } from '../../utils/permissions'
import { toast } from 'react-hot-toast'

export default function HRPage() {
  const [employees, setEmployees] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'WAITER' })

  useEffect(() => { load() }, [])
  const load = async () => { try { const res = await employeeService.list(); setEmployees(res) } catch {} finally { setLoading(false) } }

  const createEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    try { await employeeService.create(form); setShowForm(false); setForm({ name: '', email: '', password: '', phone: '', role: 'WAITER' }); load(); toast.success('تمت الإضافة') }
    catch (err: any) { toast.error(err?.response?.data?.message || 'فشل') }
  }

  const columns: Column<User>[] = [
    { accessor: 'name', label: 'الاسم', render: r => <span className="font-medium">{r.name}</span> },
    { accessor: 'email', label: 'البريد' },
    { accessor: 'phone', label: 'الهاتف' },
    { accessor: 'role', label: 'الصلاحية', render: r => <Badge className={roleColors[r.role]}>{roleLabels[r.role]}</Badge> },
    { accessor: 'isActive', label: 'الحالة', render: r => <Badge variant={r.isActive ? 'success' : 'danger'}>{r.isActive ? 'نشط' : 'غير نشط'}</Badge> },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h1 className="text-xl font-bold">الموارد البشرية</h1><Button onClick={() => setShowForm(true)}><UserPlus className="w-4 h-4" /> إضافة موظف</Button></div>
      <DataTable columns={columns} data={employees} loading={loading} />
      <Modal open={showForm} onClose={() => setShowForm(false)} title="إضافة موظف جديد">
        <form onSubmit={createEmployee} className="space-y-4">
          <Input label="الاسم" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <Input label="البريد الإلكتروني" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          <Input label="كلمة المرور" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          <Input label="رقم الهاتف" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          <Select label="الصلاحية" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} options={[
            { value: 'ADMIN', label: 'مدير' }, { value: 'MANAGER', label: 'مشرف' }, { value: 'CASHIER', label: 'كاشير' }, { value: 'WAITER', label: 'نادل' }, { value: 'CHEF', label: 'طباخ' },
          ]} />
          <Button type="submit" className="w-full">حفظ</Button>
        </form>
      </Modal>
    </div>
  )
}
