import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Minus, ShoppingCart, Check, ChevronLeft } from 'lucide-react'
import { menuService } from '../../services/menuService'
import { orderService } from '../../services/orderService'
import { MenuItem, MenuCategory } from '../../types'
import { Button } from '../../components/ui/Button'
import { formatCurrency } from '../../utils/formatters'
import toast from 'react-hot-toast'

export default function MenuPage() {
  const [params] = useSearchParams()
  const tableNum = params.get('table') || ''
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [activeCat, setActiveCat] = useState('')
  const [cart, setCart] = useState<{ item: MenuItem; qty: number }[]>([])
  const [showCart, setShowCart] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    menuService.getCategories().then(cats => { setCategories(cats); if (cats[0]) setActiveCat(cats[0].id) }).catch(() => {})
  }, [])

  const items = categories.find(c => c.id === activeCat)?.items?.filter(i => i.isAvailable) || []
  const cartCount = cart.reduce((s, i) => s + i.qty, 0)
  const cartTotal = cart.reduce((s, i) => s + (i.item.discountPrice || i.item.price) * i.qty, 0)

  const addItem = (item: MenuItem) => setCart(prev => { const ex = prev.findIndex(i => i.item.id === item.id); return ex >= 0 ? (prev[ex] = { ...prev[ex], qty: prev[ex].qty + 1 }, [...prev]) : [...prev, { item, qty: 1 }] })
  const updateQty = (index: number, d: number) => setCart(prev => { const next = [...prev]; next[index].qty = Math.max(1, next[index].qty + d); return next })

  const submitOrder = async () => {
    if (!name || !phone) { toast.error('يرجى إدخال الاسم ورقم الهاتف'); return }
    setSubmitting(true)
    try {
      await orderService.create({ items: cart.map(i => ({ menuItemId: i.item.id, quantity: i.qty, price: i.item.discountPrice || i.item.price })), tableId: tableNum || undefined, customerName: name, customerPhone: phone, type: tableNum ? 'DINE_IN' : 'TAKEAWAY' })
      setSuccess(true); setCart([]); setName(''); setPhone('')
      setTimeout(() => setSuccess(false), 8000)
    } catch { toast.error('فشل إرسال الطلب') } finally { setSubmitting(false) }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white" dir="rtl">
      <header className="sticky top-0 z-40 bg-gray-900/95 border-b border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="font-bold">{tableNum ? `طاولة ${tableNum}` : 'طلبات خارجية'}</h1>
          <button onClick={() => setShowCart(true)} className="relative p-2 rounded-full bg-amber-500/20 text-amber-400">
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-black text-xs font-bold rounded-full flex items-center justify-center">{cartCount}</span>}
          </button>
        </div>
        <div className="flex gap-1 px-4 pb-3 overflow-x-auto scrollbar-none">
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveCat(cat.id)} className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap ${activeCat === cat.id ? 'bg-amber-500 text-black font-medium' : 'bg-gray-800 text-gray-300'}`}>{cat.nameAr || cat.name}</button>
          ))}
        </div>
      </header>
      <main className="px-4 py-4 pb-32">
        {success && <div className="mb-4 p-4 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 text-sm flex items-center gap-2"><Check className="w-5 h-5" /> تم استلام طلبك بنجاح!</div>}
        <div className="grid grid-cols-2 gap-3">
          {items.map(item => (
            <button key={item.id} onClick={() => addItem(item)} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden text-right hover:border-amber-500/30">
              {item.image && <div className="aspect-video bg-gray-800"><img src={item.image} alt="" className="w-full h-full object-cover" /></div>}
              <div className="p-3"><h3 className="font-medium text-sm">{item.nameAr || item.name}</h3><p className="text-amber-400 font-bold mt-1">{formatCurrency(item.discountPrice || item.price)}</p></div>
            </button>
          ))}
        </div>
      </main>
      {showCart && (
        <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setShowCart(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-full max-w-md bg-gray-900 flex flex-col" onClick={e => e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between p-4 border-b border-gray-800"><button onClick={() => setShowCart(false)}><ChevronLeft className="w-5 h-5" /></button><h2 className="font-bold">الطلبية ({cartCount})</h2><button onClick={() => setCart([])} className="text-red-400 text-sm">تفريغ</button></div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.map((item, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-800 rounded-xl p-3">
                  <div><p className="text-sm font-medium">{item.item.nameAr || item.item.name}</p><p className="text-amber-400 text-sm">{formatCurrency((item.item.discountPrice || item.item.price) * item.qty)}</p></div>
                  <div className="flex items-center gap-3"><button onClick={() => updateQty(i, -1)} className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center"><Minus className="w-3 h-3" /></button><span className="font-bold">{item.qty}</span><button onClick={() => updateQty(i, 1)} className="w-8 h-8 rounded-full bg-amber-500 text-black flex items-center justify-center"><Plus className="w-3 h-3" /></button></div>
                </div>
              ))}
              {cart.length === 0 && <p className="text-center text-gray-500 py-8">السلة فارغة</p>}
            </div>
            <div className="border-t border-gray-800 p-4 space-y-3">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="الاسم" className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500" />
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="رقم الهاتف" type="tel" className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500" />
              <div className="flex justify-between text-sm"><span>الإجمالي</span><span className="text-lg font-bold text-amber-400">{formatCurrency(cartTotal)}</span></div>
              <Button onClick={submitOrder} loading={submitting} className="w-full">إرسال الطلب</Button>
            </div>
          </div>
        </div>
      )}
      <style>{`.scrollbar-none::-webkit-scrollbar{display:none}.scrollbar-none{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </div>
  )
}
