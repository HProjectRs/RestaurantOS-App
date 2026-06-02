import { useState } from 'react'
import { UserPlus, Users, Clock, Phone, Check, X } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'

export default function WaitlistPage() {
  const [list, setList] = useState([])
  const [form, setForm] = useState({ name: '', phone: '', partySize: 2 })
  const addToWaitlist = () => {
    if (!form.name) return
    setList([...list, { ...form, id: Date.now(), addedAt: new Date(), status: 'waiting' }])
    setForm({ name: '', phone: '', partySize: 2 })
  }
  const seatCustomer = (id) => setList(list.map(l => l.id === id ? { ...l, status: 'seated' } : l))
  const removeCustomer = (id) => setList(list.filter(l => l.id !== id))
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <h2 className="text-lg font-bold mb-4">قائمة الانتظار ({list.filter(l => l.status === 'waiting').length})</h2>
        <div className="space-y-3">
          {list.filter(l => l.status === 'waiting').map(c => (
            <div key={c.id} className="flex items-center justify-between bg-gray-900 rounded-2xl p-4 border border-gray-800">
              <div><div className="font-bold text-white">{c.name}</div><div className="text-sm text-gray-400 flex items-center gap-3 mt-1"><span className="flex items-center gap-1"><Users size={14} />{c.partySize}</span>{c.phone && <span className="flex items-center gap-1"><Phone size={14} />{c.phone}</span>}<span className="flex items-center gap-1"><Clock size={14} />{Math.floor((Date.now() - c.addedAt) / 60000)} د</span></div></div>
              <div className="flex gap-2"><Button size="sm" onClick={() => seatCustomer(c.id)} className="bg-green-600 hover:bg-green-500 text-white"><Check size={14} /> جلوس</Button><Button size="sm" variant="ghost" onClick={() => removeCustomer(c.id)}><X size={14} /></Button></div>
            </div>
          ))}
          {list.filter(l => l.status === 'waiting').length === 0 && <div className="text-center text-gray-500 py-12">لا يوجد زبائن في الانتظار</div>}
        </div>
        {list.filter(l => l.status === 'seated').length > 0 && <><h3 className="font-bold mt-6 mb-3 text-gray-400">تم جلوسهم</h3><div className="space-y-2">{list.filter(l => l.status === 'seated').map(c => <div key={c.id} className="flex justify-between items-center bg-gray-900/50 rounded-xl p-3 text-sm"><span className="line-through text-gray-500">{c.name}</span><Badge variant="success">تم</Badge></div>)}</div></>}
      </div>
      <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 h-fit">
        <h3 className="font-bold mb-4 flex items-center gap-2"><UserPlus size={18} />إضافة إلى الانتظار</h3>
        <div className="space-y-3">
          <Input placeholder="اسم الزبون" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="رقم الهاتف (اختياري)" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          <Input label="عدد الأشخاص" type="number" min="1" value={form.partySize} onChange={e => setForm({ ...form, partySize: parseInt(e.target.value) })} />
          <Button className="w-full" onClick={addToWaitlist} disabled={!form.name}>إضافة</Button>
        </div>
      </div>
    </div>
  )
}
