import { useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { usePOS } from '../../hooks/usePOS'
import { useAuthStore } from '../../store/authStore'
import { Percent, DollarSign } from 'lucide-react'

const DiscountModal = ({ onClose }) => {
  const { subtotal, applyDiscount } = usePOS()
  const user = useAuthStore((s) => s.user)
  const [type, setType] = useState('percentage')
  const [value, setValue] = useState('')
  const [reason, setReason] = useState('')

  const discountAmount =
    type === 'percentage'
      ? Math.min(subtotal, subtotal * (parseFloat(value) || 0) / 100)
      : Math.min(subtotal, parseFloat(value) || 0)

  const handleApply = () => {
    applyDiscount(discountAmount)
    onClose()
  }

  return (
    <Modal onClose={onClose} title="خصم">
      <div className="space-y-6">
        <div className="flex gap-2">
          <button
            onClick={() => setType('percentage')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
              type === 'percentage'
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                : 'bg-gray-800 border-gray-700 text-gray-400'
            }`}
          >
            <Percent className="w-5 h-5" />
            <span className="text-sm font-medium">نسبة</span>
          </button>
          <button
            onClick={() => setType('fixed')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
              type === 'fixed'
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                : 'bg-gray-800 border-gray-700 text-gray-400'
            }`}
          >
            <DollarSign className="w-5 h-5" />
            <span className="text-sm font-medium">قيمة</span>
          </button>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">
            {type === 'percentage' ? 'نسبة الخصم (%)' : 'قيمة الخصم'}
          </label>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={type === 'percentage' ? 'مثال: 10' : 'مثال: 500'}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-lg text-white text-center placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
          />
        </div>

        <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50 text-center">
          <p className="text-sm text-gray-400">قيمة الخصم</p>
          <p className="text-2xl font-bold text-green-400">
            {discountAmount?.toLocaleString()} د.ج
          </p>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">السبب</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="سبب الخصم..."
            rows={2}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 resize-none"
          />
        </div>

        <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700/50 text-sm text-gray-400">
          تم بواسطة: {user?.name || 'غير معروف'}
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            إلغاء
          </Button>
          <Button
            onClick={handleApply}
            className="flex-1"
            disabled={!value || parseFloat(value) <= 0}
          >
            تطبيق الخصم
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default DiscountModal
