import { forwardRef, useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, Search } from 'lucide-react'
import FormField from './FormField'
type Option = { value: string; label: string }
type FormSelectProps = { label?: any; error?: any; helperText?: any; options?: Option[]; value?: any; onChange?: any; placeholder?: string; searchable?: boolean; required?: boolean; className?: string }
const FormSelect = forwardRef<any, FormSelectProps>(({ label, error, helperText, options = [], value, onChange, placeholder = 'اختر...', searchable = false, required, className = '' }, ref) => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<any>(null)
  useEffect(() => {
    const handleClick = (e: any) => { if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])
  const filtered = searchable && search ? options.filter((opt: any) => (opt.label || opt).toString().toLowerCase().includes(search.toLowerCase())) : options
  const found = options.find((opt: any) => (opt.value ?? opt) === value)
  const selectedLabel = found ? String(found.label ?? found) : placeholder
  return (
    <FormField label={label} error={error} helperText={helperText} required={required} className={className}>
      <div className="relative" ref={containerRef}>
        <button type="button" onClick={() => setOpen(!open)} className={`w-full flex items-center justify-between px-3 py-2 bg-gray-800 border rounded-lg text-sm transition-colors ${error ? 'border-red-500' : 'border-gray-700'} ${value ? 'text-white' : 'text-gray-500'}`}>
          <span className="truncate">{selectedLabel}</span>
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className="absolute z-50 top-full mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-hidden">
            {searchable && (
              <div className="p-2 border-b border-gray-700">
                <div className="relative">
                  <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pr-8 pl-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500" placeholder="بحث..." autoFocus />
                </div>
              </div>
            )}
            <div className="overflow-y-auto max-h-48">
              {filtered.length === 0 ? (<div className="p-3 text-center text-sm text-gray-500">لا توجد خيارات</div>) : (
                filtered.map((opt: any) => {
                  const val = opt.value ?? opt; const lbl = opt.label ?? opt; const isSelected = val === value
                  return (
                    <button key={val} type="button" onClick={() => { onChange?.(val); setOpen(false); setSearch('') }} className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${isSelected ? 'bg-amber-500/20 text-amber-400' : 'text-gray-300 hover:bg-gray-700'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-400' : 'bg-transparent'}`} />
                      <span className="truncate">{lbl}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 mr-auto" />}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
    </FormField>
  )
})
FormSelect.displayName = 'FormSelect'
export default FormSelect
