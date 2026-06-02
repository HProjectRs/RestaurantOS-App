import { ReactNode, useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open?: boolean; onClose: () => void; title?: string; children: ReactNode; maxWidth?: string; size?: string; footer?: ReactNode
}

export function Modal({ open = true, onClose, title, children, maxWidth = 'max-w-lg', size, footer }: ModalProps) {
  if (size) maxWidth = size === 'md' ? 'max-w-xl' : size === 'lg' ? 'max-w-3xl' : 'max-w-lg'
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) { document.addEventListener('keydown', handleKey); document.body.style.overflow = 'hidden' }
    return () => { document.removeEventListener('keydown', handleKey); document.body.style.overflow = '' }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div ref={ref} onClick={e => e.stopPropagation()}
        className={`w-full ${maxWidth} bg-gray-900 border border-gray-800 rounded-2xl shadow-xl max-h-[85vh] overflow-y-auto`}>
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <button onClick={onClose} className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800"><X className="w-5 h-5" /></button>
          </div>
        )}
        <div className="p-5">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-gray-800">{footer}</div>}
      </div>
    </div>
  )
}
