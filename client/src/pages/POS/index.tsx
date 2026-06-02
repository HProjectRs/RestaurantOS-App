import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, Plus, Minus, X, Search, DollarSign, Percent, User } from 'lucide-react'
import { menuService } from '../../services/menuService'
import { orderService } from '../../services/orderService'
import { tableService } from '../../services/tableService'
import { MenuItem, MenuCategory, Table as TableType } from '../../types'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { toast } from 'react-hot-toast'
import { formatCurrency } from '../../utils/formatters'

interface CartItem {
  menuItem: MenuItem; quantity: number; selectedModifiers: Record<string, string[]>
  unitPrice: number; notes?: string
}

export default function POSPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [activeCat, setActiveCat] = useState('')
  const [tables, setTables] = useState<TableType[]>([])
  const [selectedTable, setSelectedTable] = useState<TableType | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([menuService.getCategories(), tableService.list()])
      .then(([cats, tabs]) => { setCategories(cats); if (cats[0]) setActiveCat(cats[0].id); setTables(tabs) })
      .catch(() => {}).finally(() => setLoading(false))
  }, [])

  const activeItems = categories.find(c => c.id === activeCat)?.items?.filter(i => i.isAvailable) || []
  const filteredItems = activeItems.filter(i => (i.nameAr || i.name).includes(search))
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)
  const cartTotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0)

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.findIndex(i => i.menuItem.id === item.id)
      if (existing >= 0) {
        const next = [...prev]; next[existing] = { ...next[existing], quantity: next[existing].quantity + 1 }
        return next
      }
      return [...prev, { menuItem: item, quantity: 1, selectedModifiers: {}, unitPrice: item.discountPrice || item.price }]
    })
    toast.success(`تمت الإضافة: ${item.nameAr || item.name}`)
  }

  const updateQty = (index: number, delta: number) => {
    setCart(prev => {
      const next = [...prev]; next[index] = { ...next[index], quantity: Math.max(1, next[index].quantity + delta) }
      return next
    })
  }

  const removeFromCart = (index: number) => setCart(prev => prev.filter((_, i) => i !== index))

  const submitOrder = async () => {
    if (cart.length === 0) { toast.error('السلة فارغة'); return }
    try {
      const res = await orderService.create({
        items: cart.map(i => ({ menuItemId: i.menuItem.id, quantity: i.quantity, price: i.unitPrice, selectedModifiers: i.selectedModifiers, notes: i.notes })),
        tableId: selectedTable?.id, type: selectedTable ? 'DINE_IN' : 'TAKEAWAY',
      })
      toast.success(`تم إنشاء الطلب #${res.orderNumber}`)
      setCart([]); setShowCart(false)
    } catch (err: any) { toast.error(err?.response?.data?.message || 'فشل إنشاء الطلب') }
  }

  return (
    <div className="h-[calc(100vh-5rem)] flex gap-4" dir="rtl">
      {/* Menu panel */}
      <div className="flex-1 flex flex-col bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 p-3 border-b border-gray-800">
          <Search className="w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث عن صنف..."
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none" />
        </div>
        <div className="flex gap-1 p-2 overflow-x-auto border-b border-gray-800">
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveCat(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap ${activeCat === cat.id ? 'bg-amber-500/20 text-amber-400' : 'text-gray-400 hover:text-white'}`}>
              {cat.nameAr || cat.name}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {filteredItems.map(item => (
              <button key={item.id} onClick={() => addToCart(item)}
                className="p-3 bg-gray-800 rounded-xl border border-gray-700 hover:border-amber-500/30 text-right transition-colors">
                {item.image && <img src={item.image} alt="" className="w-full h-16 object-cover rounded-lg mb-2" />}
                <p className="text-xs font-medium truncate">{item.nameAr || item.name}</p>
                <p className="text-amber-400 font-bold text-xs mt-1">{formatCurrency(item.discountPrice || item.price)}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cart sidebar */}
      <div className="w-80 bg-gray-900/60 border border-gray-800 rounded-xl flex flex-col">
        <div className="p-3 border-b border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-sm">الطلبية</h3>
            <Badge variant="amber">{cartCount} صنف</Badge>
          </div>
          <select value={selectedTable?.id || ''} onChange={e => setSelectedTable(tables.find(t => t.id === e.target.value) || null)}
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white">
            <option value="">طلبات خارجية</option>
            {tables.filter(t => t.isActive).map(t => (
              <option key={t.id} value={t.id}>طاولة {t.number} ({t.status === 'AVAILABLE' ? 'فارغة' : 'مشغولة'})</option>
            ))}
          </select>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.map((item, i) => (
            <div key={i} className="flex items-center gap-2 bg-gray-800 rounded-lg p-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{item.menuItem.nameAr || item.menuItem.name}</p>
                <p className="text-amber-400 text-xs">{formatCurrency(item.unitPrice)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => updateQty(i, -1)} className="p-1 rounded bg-gray-700 text-gray-300"><Minus className="w-3 h-3" /></button>
                <span className="text-xs font-bold w-5 text-center">{item.quantity}</span>
                <button onClick={() => updateQty(i, 1)} className="p-1 rounded bg-amber-500 text-black"><Plus className="w-3 h-3" /></button>
              </div>
              <button onClick={() => removeFromCart(i)} className="p-1 text-gray-500 hover:text-red-400"><X className="w-3 h-3" /></button>
            </div>
          ))}
          {cart.length === 0 && <p className="text-center text-gray-500 text-sm py-8">السلة فارغة</p>}
        </div>
        <div className="p-3 border-t border-gray-800 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">الإجمالي</span>
            <span className="font-bold text-amber-400">{formatCurrency(cartTotal)}</span>
          </div>
          <Button onClick={submitOrder} className="w-full" size="lg">إرسال الطلب</Button>
        </div>
      </div>
    </div>
  )
}
