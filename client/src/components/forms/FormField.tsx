import { forwardRef } from 'react'
type FormFieldProps = { label?: any; error?: any; helperText?: any; children?: any; className?: string; required?: boolean; [key: string]: any }
const FormField = forwardRef<any, FormFieldProps>(({ label, error, helperText, children, className = '', required, ...props }, ref) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <label className="block text-sm font-medium text-gray-300">{label}{required && <span className="text-red-400 mr-0.5">*</span>}</label>}
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
      {helperText && !error && <p className="text-xs text-gray-500">{helperText}</p>}
    </div>
  )
})
FormField.displayName = 'FormField'
type InputProps = { label?: any; error?: any; helperText?: any; className?: string; [key: string]: any }
const Input = forwardRef<any, InputProps>(({ label, error, helperText, className = '', ...props }, ref) => (
  <FormField label={label} error={error} helperText={helperText}>
    <input ref={ref} className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors ${error ? 'border-red-500' : 'border-gray-700'} ${className}`} {...props} />
  </FormField>
))
Input.displayName = 'Input'
const Textarea = forwardRef<any, any>(({ label, error, helperText, className = '', ...props }, ref) => (
  <FormField label={label} error={error} helperText={helperText}>
    <textarea ref={ref} className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors resize-y min-h-[80px] ${error ? 'border-red-500' : 'border-gray-700'} ${className}`} {...props} />
  </FormField>
))
Textarea.displayName = 'Textarea'
export { FormField as default, Input, Textarea }
