import { useState } from 'react'
import { Calendar } from 'lucide-react'
const presets = [
  { label: 'اليوم', getValue: () => ({ start: new Date(), end: new Date() }) },
  { label: 'هذا الأسبوع', getValue: () => { const now = new Date(); const start = new Date(now); start.setDate(now.getDate() - now.getDay()); return { start, end: now } } },
  { label: 'هذا الشهر', getValue: () => { const now = new Date(); const start = new Date(now.getFullYear(), now.getMonth(), 1); return { start, end: now } } },
  { label: 'هذه السنة', getValue: () => { const now = new Date(); const start = new Date(now.getFullYear(), 0, 1); return { start, end: now } } },
]
const toDateInput = (d: any) => { if (!d) return ''; return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
type DateRangePickerProps = { startDate?: any; endDate?: any; onChange?: any; label?: any }
const DateRangePicker = ({ startDate, endDate, onChange, label }: DateRangePickerProps) => {
  const [activePreset, setActivePreset] = useState<any>(null)
  const handleStartChange = (e: any) => { onChange?.({ start: e.target.value ? new Date(e.target.value) : null, end: endDate }); setActivePreset(null) }
  const handleEndChange = (e: any) => { onChange?.({ start: startDate, end: e.target.value ? new Date(e.target.value) : null }); setActivePreset(null) }
  const applyPreset = (preset: any) => { const { start, end } = preset.getValue(); onChange?.({ start, end }); setActivePreset(preset.label) }
  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-gray-300">{label}</label>}
      <div className="flex flex-wrap items-end gap-2">
        <div className="relative flex-1 min-w-[130px]">
          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <input type="date" value={toDateInput(startDate)} onChange={handleStartChange} className="w-full pr-10 pl-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500" />
        </div>
        <span className="text-gray-500 text-sm">إلى</span>
        <div className="relative flex-1 min-w-[130px]">
          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <input type="date" value={toDateInput(endDate)} onChange={handleEndChange} className="w-full pr-10 pl-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500" />
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((preset) => (
          <button key={preset.label} type="button" onClick={() => applyPreset(preset)} className={`px-3 py-1 text-xs rounded-lg border transition-colors ${activePreset === preset.label ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'}`}>{preset.label}</button>
        ))}
      </div>
    </div>
  )
}
export default DateRangePicker
