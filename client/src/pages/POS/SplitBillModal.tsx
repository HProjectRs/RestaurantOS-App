import { useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { usePOS } from '../../hooks/usePOS'

const SplitBillModal = ({ onClose }) => {
  const { items, total, splitBill } = usePOS()
  const [numSplits, setNumSplits] = useState(2)
  const [mode, setMode] = useState('equal')
  const [customAmounts, setCustomAmounts] = useState([])

  const perPerson = total / numSplits
  const splits = splitBill(numSplits)

  const handleNumChange = (n) => {
    const val = Math.max(2, Math.min(10, n))
    setNumSplits(val)
    if (mode === 'custom') {
      setCustomAmounts(Array.from({ length: val }, () => ''))
    }
  }

  return (
    <Modal onClose={onClose} title="تقسيم الفاتورة">
      <div className="space-y-6">
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">عدد التقسيمات</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNumChange(numSplits - 1)}
              className="w-10 h-10 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-white hover:bg-gray-700"
            >
              -
            </button>
            <span className="text-2xl font-bold text-white w-10 text-center">{numSplits}</span>
            <button
              onClick={() => handleNumChange(numSplits + 1)}
              className="w-10 h-10 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-white hover:bg-gray-700"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setMode('equal')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'equal'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-gray-800 text-gray-400 border border-gray-700'
            }`}
          >
            متساوي
          </button>
          <button
            onClick={() => {
              setMode('custom')
              setCustomAmounts(Array.from({ length: numSplits }, () => ''))
            }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'custom'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-gray-800 text-gray-400 border border-gray-700'
            }`}
          >
            مخصص
          </button>
        </div>

        <div className="space-y-3">
          {splits.map((split, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-white">
                  الشخص {i + 1}
                </span>
                {mode === 'equal' ? (
                  <span className="text-sm font-bold text-amber-400">
                    {perPerson?.toLocaleString()} د.ج
                  </span>
                ) : (
                  <input
                    type="number"
                    value={customAmounts[i] || ''}
                    onChange={(e) => {
                      const next = [...customAmounts]
                      next[i] = e.target.value
                      setCustomAmounts(next)
                    }}
                    className="w-28 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-white text-center"
                    placeholder="المبلغ"
                  />
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {split.items.map((item, j) => (
                  <span
                    key={j}
                    className="px-2 py-0.5 rounded-full bg-gray-700 text-xs text-gray-300"
                  >
                    {item.name} x{item.qty}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Button onClick={onClose} className="w-full py-3">
          تأكيد التقسيم
        </Button>
      </div>
    </Modal>
  )
}

export default SplitBillModal
