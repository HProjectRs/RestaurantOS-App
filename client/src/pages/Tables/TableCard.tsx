import { Users } from 'lucide-react'

const statusColors = { empty: 'border-green-500/50 bg-green-500/10', occupied: 'border-yellow-500/50 bg-yellow-500/10', reserved: 'border-red-500/50 bg-red-500/10' }
const statusLabels = { empty: 'فارغ', occupied: 'مشغول', reserved: 'محجوز' }

export default function TableCard({ table, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all hover:scale-105 ${statusColors[table.status] || 'border-gray-700 bg-gray-900'}`}>
      <span className="text-2xl font-bold text-white">{table.label}</span>
      <div className="flex items-center gap-1 mt-2 text-gray-400 text-sm"><Users size={14} /><span>{table.seats}</span></div>
      <span className={`mt-2 text-xs font-semibold px-2 py-0.5 rounded-full ${table.status === 'empty' ? 'text-green-400 bg-green-500/20' : table.status === 'occupied' ? 'text-yellow-400 bg-yellow-500/20' : 'text-red-400 bg-red-500/20'}`}>{statusLabels[table.status]}</span>
    </button>
  )
}
