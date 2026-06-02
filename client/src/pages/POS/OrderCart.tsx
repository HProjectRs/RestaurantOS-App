import { useState } from 'react'
import { usePOS } from '../../hooks/usePOS'
import { Button } from '../../components/ui/Button'
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react'

const OrderCart = () => {
  const {
    items, notes, subtotal, tax, total, discount,
    updateQty, removeItem, setNotes, holdOrder, clearOrder,
  } = usePOS()
  const [localNotes, setLocalNotes] = useState(notes || '')

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-amber-400" />
          <span className="text-sm font-semibold text-white">الطلب</span>
          <span className="text-xs text-gray-500">({items.length})</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={holdOrder}
            disabled={items.length === 0}
            className="px-2 py-1 text-xs rounded bg-gray-800 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            تعليق
          </button>
          <button
            onClick={clearOrder}
            disabled={items.length === 0}
            className="px-2 py-1 text-xs rounded bg-gray-800 text-gray-400 hover:text-red-400 disabled:opacity-30 transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm py-12">
            <ShoppingCart className="w-12 h-12 mb-3 opacity-30" />
            <p>الطلب فارغ</p>
            <p className="text-xs mt-1">اختر الأصناف من القائمة</p>
          </div>
        ) : (
          items.map((item, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-gray-800/50 border border-gray-700/50"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{item.name}</p>
                  <p className="text-xs text-amber-400 mt-0.5">
                    {item.price?.toLocaleString()} د.ج
                  </p>
                </div>
                <button
                  onClick={() => removeItem(i)}
                  className="p-1 rounded hover:bg-red-900/30 text-gray-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQty(i, item.qty - 1)}
                    className="w-7 h-7 rounded-lg bg-gray-700 flex items-center justify-center hover:bg-gray-600 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5 text-white" />
                  </button>
                  <span className="text-sm font-semibold text-white w-6 text-center">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => updateQty(i, item.qty + 1)}
                    className="w-7 h-7 rounded-lg bg-gray-700 flex items-center justify-center hover:bg-gray-600 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
                <span className="text-sm font-semibold text-white">
                  {(item.price * item.qty)?.toLocaleString()} د.ج
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-gray-800 p-4 space-y-4">
        <textarea
          value={localNotes}
          onChange={(e) => {
            setLocalNotes(e.target.value)
            setNotes(e.target.value)
          }}
          placeholder="ملاحظات..."
          rows={2}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 resize-none"
        />

        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-400">
            <span>المجموع الفرعي</span>
            <span>{subtotal?.toLocaleString()} د.ج</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>الضريبة</span>
            <span>{tax?.toLocaleString()} د.ج</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-green-400">
              <span>الخصم</span>
              <span>-{discount?.toLocaleString()} د.ج</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold text-white pt-1 border-t border-gray-700">
            <span>المجموع</span>
            <span>{total?.toLocaleString()} د.ج</span>
          </div>
        </div>

        <Button
          className="w-full py-3"
          disabled={items.length === 0}
        >
          إرسال الطلب ({items.length})
        </Button>
      </div>
    </div>
  )
}

export default OrderCart
