const stations = [{ id: 'all', label: 'الكل' }, { id: 'grill', label: 'مشويات' }, { id: 'pizza', label: 'بيتزا' }, { id: 'cold', label: 'بارد' }, { id: 'bar', label: 'بار' }, { id: 'dessert', label: 'حلويات' }]

export default function StationFilter({ current, onChange }) {
  return (
    <div className="flex gap-2 px-4 py-3 border-b border-gray-800 overflow-x-auto">
      {stations.map(s => (
        <button key={s.id} onClick={() => onChange(s.id)} className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition ${current === s.id ? 'bg-indigo-600 text-white font-semibold' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>{s.label}</button>
      ))}
    </div>
  )
}
