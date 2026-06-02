import { SelectHTMLAttributes, forwardRef } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string; error?: string; options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-300">{label}</label>}
      <select ref={ref}
        className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-sm text-white transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${error ? 'border-red-500' : 'border-gray-700'} ${className}`} {...props}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  ),
)
Select.displayName = 'Select'
