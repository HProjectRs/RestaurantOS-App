import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string; error?: string; icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-300">{label}</label>}
      <input ref={ref}
        className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-sm text-white placeholder-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${error ? 'border-red-500' : 'border-gray-700'} ${className}`} {...props} />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  ),
)
Input.displayName = 'Input'
