import { Toaster } from 'react-hot-toast'

export function ToastProvider() {
  return <Toaster position="top-center" toastOptions={{ duration: 3000, style: { background: '#1f2937', color: '#f3f4f6', border: '1px solid #374151', borderRadius: '12px', fontSize: '14px' } }} />
}
