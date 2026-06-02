import { useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { usePOS } from '../../hooks/usePOS'
import { posService } from '../../services/posService'
import { useSyncStore } from '../../store/syncStore'
import worker from '../../workers/syncWorker'
import { DollarSign, CreditCard, Wallet, CheckCircle, WifiOff } from 'lucide-react'

const paymentOptions = [
  { id: 'cash', label: 'نقداً', icon: DollarSign },
  { id: 'card', label: 'بطاقة', icon: CreditCard },
  { id: 'wallet', label: 'محفظة', icon: Wallet },
]

const PaymentModal = ({ onClose, onSuccess }) => {
  const { total, items, notes, customer, table } = usePOS()
  const [method, setMethod] = useState('cash')
  const [amountReceived, setAmountReceived] = useState('')
  const [processing, setProcessing] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const change = Math.max(0, (parseFloat(amountReceived) || 0) - total)
  const isCash = method === 'cash'

  const isOnline = useSyncStore((s) => s.isOnline)

  const handleConfirm = async () => {
    setProcessing(true)
    try {
      if (isOnline) {
        await posService.createOrder({
          items,
          notes,
          customer,
          table,
          paymentMethod: method,
          total,
          amountReceived: isCash ? parseFloat(amountReceived) : total,
        })
      } else {
        await worker.queueOrder({
          items,
          notes,
          customer,
          table,
          paymentMethod: method,
          total,
          amountReceived: isCash ? parseFloat(amountReceived) : total,
        })
      }
      setConfirmed(true)
      setTimeout(() => {
        onSuccess?.()
      }, 1000)
    } catch (err) {
      console.error('Payment failed', err)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Modal onClose={onClose} title="الدفع">
      {confirmed ? (
        <div className="flex flex-col items-center justify-center py-8">
          <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
          <p className="text-lg font-semibold text-white">تم الدفع بنجاح</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-400">المجموع</p>
            <p className="text-3xl font-bold text-white">{total?.toLocaleString()} د.ج</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {paymentOptions.map((opt) => {
              const Icon = opt.icon
              const active = method === opt.id
              return (
                <button
                  key={opt.id}
                  onClick={() => setMethod(opt.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                    active
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs font-medium">{opt.label}</span>
                </button>
              )
            })}
          </div>

          {isCash && (
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">المبلغ المستلم</label>
              <input
                type="number"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-xl text-white text-center placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
              />
              {change > 0 && (
                <p className="text-center text-sm text-green-400 mt-2">
                  الباقي: {change?.toLocaleString()} د.ج
                </p>
              )}
            </div>
          )}

          <Button
            onClick={handleConfirm}
            loading={processing}
            className="w-full py-3"
            disabled={isCash && (!amountReceived || parseFloat(amountReceived) < total)}
          >
            {processing ? 'جاري المعالجة...' : 'تأكيد الدفع'}
          </Button>
        </div>
      )}
    </Modal>
  )
}

export default PaymentModal
