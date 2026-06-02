import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar, Clock, Phone, User, Check, X } from 'lucide-react'
import { DataTable } from '../../components/data/DataTable'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'

export default function ReservationsPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ customer: '', phone: '', date: '', time: '', guests: 2, table: '' })
  const { data: reservations } = useQuery({ queryKey: ['reservations'], queryFn: () => [], refetchInterval: 30000 })
  const createMutation = useMutation({ mutationFn: () => Promise.resolve(), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['reservations'] }); setShowForm(false) } })
  return (
    <div>
      <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold">الحجوزات</h2><Button onClick={() => setShowForm(true)}>+ حجز جديد</Button></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reservations?.length === 0 && <div className="col-span-full text-center text-gray-500 py-12">لا توجد حجوزات اليوم</div>}
      </div>
      <Modal open={showForm} onClose={() => setShowForm(false)} title="حجز جديد" size="md" footer={<><Button variant="secondary" onClick={() => setShowForm(false)}>إلغاء</Button><Button onClick={() => createMutation.mutate()} loading={createMutation.isPending}>تأكيد الحجز</Button></>}>
        <div className="space-y-4">
          <Input label="اسم العميل" value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })} icon={<User size={16} />} />
          <Input label="رقم الهاتف" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} icon={<Phone size={16} />} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="التاريخ" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} icon={<Calendar size={16} />} />
            <Input label="الوقت" type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} icon={<Clock size={16} />} />
          </div>
          <Input label="عدد الضيوف" type="number" min="1" value={form.guests} onChange={e => setForm({ ...form, guests: parseInt(e.target.value) })} />
        </div>
      </Modal>
    </div>
  )
}
