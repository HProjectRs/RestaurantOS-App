import { useEffect } from 'react'

export default function Drawer({ open, onClose, title, children, side = 'right' }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])
  const sideClasses = { right: 'right-0', left: 'left-0' }
  return (
    <div className={`fixed inset-0 z-50 ${open ? 'visible' : 'invisible'}`}>
      <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
      <div className={`fixed top-0 bottom-0 w-96 max-w-[90vw] bg-gray-900 border-l border-gray-800 shadow-2xl transition-transform ${open ? 'translate-x-0' : side === 'right' ? 'translate-x-full' : '-translate-x-full'} ${sideClasses[side]}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800"><h2 className="text-lg font-bold">{title}</h2><button onClick={onClose} className="text-gray-400 hover:text-white text-xl">&times;</button></div>
        <div className="p-6 overflow-y-auto h-[calc(100%-64px)]">{children}</div>
      </div>
    </div>
  )
}
