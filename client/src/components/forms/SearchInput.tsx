import { useState, useEffect, useRef, forwardRef } from 'react'
import { Search, X } from 'lucide-react'
type SearchInputProps = { value?: string; onChange?: any; placeholder?: string; debounce?: number; className?: string; [key: string]: any }
const SearchInput = forwardRef<any, SearchInputProps>(({ value = '', onChange, placeholder = 'بحث...', debounce = 300, className = '', ...props }, ref) => {
  const [local, setLocal] = useState(value)
  const timer = useRef<any>(null)
  useEffect(() => { setLocal(value) }, [value])
  const handleChange = (e: any) => {
    const v = e.target.value; setLocal(v); clearTimeout(timer.current)
    timer.current = setTimeout(() => onChange?.(v), debounce)
  }
  const clear = () => { setLocal(''); clearTimeout(timer.current); onChange?.('') }
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
      <input ref={ref} type="text" value={local} onChange={handleChange} placeholder={placeholder} className="w-full pr-10 pl-10 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors" {...props} />
      {local && <button type="button" onClick={clear} className="absolute left-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>}
    </div>
  )
})
SearchInput.displayName = 'SearchInput'
export default SearchInput
