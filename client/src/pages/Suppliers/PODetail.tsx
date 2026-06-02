import { useState } from 'react'
import { ArrowLeft, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { suppliersService } from '../../services/suppliersService'

const threeWayStatus = {
  matched: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-900/20', label: 'Matched' },
  partial: { icon: AlertCircle, color: 'text-yellow-400', bg: 'bg-yellow-900/20', label: 'Partial Match' },
  mismatch: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-900/20', label: 'Mismatch' },
  pending: { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-800', label: 'Pending' },
}

const ThreeWayMatchRow = ({ label, po, receiving, invoice, status }) => {
  const s = threeWayStatus[status] || threeWayStatus.pending
  const Icon = s.icon

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${s.bg} ${status === 'pending' ? 'border-gray-700' : 'border-gray-700'}`}>
      <Icon className={`w-5 h-5 ${s.color}`} />
      <div className="flex-1">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className={`text-xs ${s.color}`}>{s.label}</p>
      </div>
      {status === 'matched' && <span className="text-xs text-green-400"><CheckCircle className="w-4 h-4" /></span>}
    </div>
  )
}

const PODetail = ({ po, onBack }) => {
  const [receivingHistory] = useState(po.receivingHistory || [])
  const [invoiceMatch] = useState(po.invoiceMatch || null)

  const threeWayMatch = (() => {
    if (po.threeWayMatch) return po.threeWayMatch
    if (receivingHistory.length > 0 && invoiceMatch) return 'matched'
    if (receivingHistory.length > 0) return 'partial'
    return 'pending'
  })()

  const matchStatuses = [
    { label: 'PO vs Receiving', po: true, receiving: receivingHistory.length > 0, invoice: false, status: receivingHistory.length > 0 ? 'matched' : 'pending' },
    { label: 'PO vs Invoice', po: true, receiving: false, invoice: !!invoiceMatch, status: invoiceMatch ? 'matched' : 'pending' },
    { label: 'Receiving vs Invoice', po: false, receiving: receivingHistory.length > 0, invoice: !!invoiceMatch, status: (receivingHistory.length > 0 && invoiceMatch) ? 'matched' : receivingHistory.length > 0 ? 'partial' : 'pending' },
  ]

  const handleVerify = async () => {
    try {
      await suppliersService.verifyThreeWayMatch(po.id, receivingHistory[0]?.id, invoiceMatch?.id)
      alert('3-Way Match verified successfully.')
    } catch (err) {
      console.error('Verification failed', err)
    }
  }

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Purchase Orders
      </button>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800">
          <p className="text-xs text-gray-500 mb-1">PO #</p>
          <p className="text-lg font-bold text-white">#{po.id}</p>
        </div>
        <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800">
          <p className="text-xs text-gray-500 mb-1">Supplier</p>
          <p className="text-lg font-bold text-white">{po.supplierName || 'N/A'}</p>
        </div>
        <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800">
          <p className="text-xs text-gray-500 mb-1">Date</p>
          <p className="text-lg font-bold text-white">{po.date ? new Date(po.date).toLocaleDateString() : '-'}</p>
        </div>
        <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800">
          <p className="text-xs text-gray-500 mb-1">Status</p>
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
            po.status === 'received' ? 'bg-green-900/30 text-green-400 border-green-700' :
            po.status === 'sent' ? 'bg-blue-900/30 text-blue-400 border-blue-700' :
            po.status === 'cancelled' ? 'bg-red-900/30 text-red-400 border-red-700' :
            'bg-gray-800 text-gray-400 border-gray-700'
          }`}>{po.status}</span>
        </div>
      </div>

      <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-white">Items</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Item</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Qty</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Unit Price</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {(po.items || []).length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">No items</td>
              </tr>
            ) : (
              po.items.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-800/50">
                  <td className="px-4 py-3 text-gray-300">{item.itemName || 'Unknown'}</td>
                  <td className="px-4 py-3 text-gray-300">{item.qty}</td>
                  <td className="px-4 py-3 text-gray-300">${(Number(item.unitPrice) || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-300">${((Number(item.qty) || 0) * (Number(item.unitPrice) || 0)).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">3-Way Match</h3>
          <button
            onClick={handleVerify}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
          >
            Verify Match
          </button>
        </div>
        <div className="space-y-3">
          {matchStatuses.map((ms) => (
            <ThreeWayMatchRow key={ms.label} label={ms.label} po={ms.po} receiving={ms.receiving} invoice={ms.invoice} status={ms.status} />
          ))}
        </div>
      </div>

      {receivingHistory.length > 0 && (
        <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-white">Receiving History</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Date</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Item</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Qty Received</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Quality</th>
              </tr>
            </thead>
            <tbody>
              {receivingHistory.map((r, idx) => (
                <tr key={idx} className="border-b border-gray-800/50">
                  <td className="px-4 py-3 text-gray-300">{r.date ? new Date(r.date).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3 text-gray-300">{r.itemName || 'Unknown'}</td>
                  <td className="px-4 py-3 text-gray-300">{r.qty}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                      r.quality === 'pass' ? 'bg-green-900/30 text-green-400 border-green-700' :
                      'bg-red-900/30 text-red-400 border-red-700'
                    }`}>{r.quality || 'pass'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {invoiceMatch && (
        <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800">
          <h3 className="text-sm font-semibold text-white mb-2">Invoice Match</h3>
          <p className="text-sm text-gray-400">
            Invoice #{invoiceMatch.id} — ${(invoiceMatch.amount || 0).toFixed(2)}
            {invoiceMatch.status === 'matched' && <span className="mr-2 text-green-400">✓ Matched</span>}
          </p>
        </div>
      )}

      {po.notes && (
        <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800">
          <h3 className="text-sm font-semibold text-white mb-1">Notes</h3>
          <p className="text-sm text-gray-400">{po.notes}</p>
        </div>
      )}
    </div>
  )
}

export default PODetail
