import { useState } from 'react'
import { Download, Printer, QrCode } from 'lucide-react'
import { Button } from '../../components/ui/Button'

export default function QROrderPage() {
  const [tableNum, setTableNum] = useState(1)
  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}/menu?table=` : '/menu?table='
  const qrUrl = `${baseUrl}${tableNum}`
  return (
    <div>
      <h2 className="text-lg font-bold mb-4">QR Code للطلب من الطاولة</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <label className="block text-sm font-medium text-gray-300 mb-2">رقم الطاولة</label>
          <div className="flex gap-3 items-center">
            <input type="number" min="1" max="99" value={tableNum} onChange={e => setTableNum(parseInt(e.target.value) || 1)} className="w-24 bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <span className="text-gray-400 text-sm">رابط الطاولة {tableNum}:</span>
          </div>
          <div className="mt-4 p-3 bg-white rounded-xl inline-block"><QrCode size={200} /></div>
          <div className="mt-4 flex gap-3"><Button variant="secondary" onClick={() => {}}><Download size={16} /> تحميل QR</Button><Button onClick={() => window.print()}><Printer size={16} /> طباعة</Button></div>
        </div>
        <div className="space-y-4">
          <h3 className="font-bold">جميع روابط الطاولات</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-96 overflow-y-auto">
            {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
              <div key={n} className="flex items-center justify-between bg-gray-900 rounded-xl p-3 border border-gray-800 text-sm" dir="ltr">
                <span className="font-bold text-indigo-400">T{n}</span>
                <button onClick={() => { navigator.clipboard?.writeText(`${baseUrl}${n}`) }} className="text-gray-500 hover:text-white transition text-xs">نسخ</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
