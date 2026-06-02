import { useState, useEffect } from 'react'
import { PackageCheck, CheckCircle, XCircle } from 'lucide-react'
import EmptyState from '../../components/data/EmptyState'
import FormSelect from '../../components/forms/FormSelect'
import { suppliersService } from '../../services/suppliersService'

const ReceivingPage = () => {
  const [pos, setPos] = useState([])
  const [selectedPOId, setSelectedPOId] = useState('')
  const [receivingData, setReceivingData] = useState({})
  const [qualityData, setQualityData] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    suppliersService.getPurchaseOrders({ status: 'sent' }).then((r) => setPos(r.data || [])).catch(() => {})
  }, [])

  const selectedPO = pos.find((p) => p.id === selectedPOId)

  const handleQtyChange = (itemId, value) => {
    setReceivingData((prev) => ({ ...prev, [itemId]: Number(value) }))
  }

  const handleQualityChange = (itemId, value) => {
    setQualityData((prev) => ({ ...prev, [itemId]: value }))
  }

  const handleReceive = async () => {
    if (!selectedPO) return
    try {
      setSubmitting(true)
      const items = (selectedPO.items || []).map((item) => ({
        itemId: item.itemId || item.id,
        expectedQty: Number(item.qty) || 0,
        receivedQty: receivingData[item.itemId || item.id] || 0,
        quality: qualityData[item.itemId || item.id] || 'pass',
      }))
      await suppliersService.receivePO(selectedPO.id, { items })
      alert('Receiving recorded successfully. Inventory has been updated.')
      setSelectedPOId('')
      setReceivingData({})
      setQualityData({})
      const res = await suppliersService.getPurchaseOrders({ status: 'sent' })
      setPos(res.data || [])
    } catch (err) {
      console.error('Failed to receive PO', err)
    } finally {
      setSubmitting(false)
    }
  }

  const poOptions = pos.map((p) => ({
    value: p.id,
    label: `#${p.id} — ${p.supplierName || 'Unknown'} (${(p.items || []).length} items)`,
  }))

  return (
    <div className="space-y-6">
      <FormSelect
        label="Select Purchase Order to Receive"
        options={poOptions}
        value={selectedPOId}
        onChange={setSelectedPOId}
        searchable
        placeholder={pos.length === 0 ? 'No pending POs' : 'Choose a PO...'}
      />

      {!selectedPO && (
        <EmptyState
          icon={PackageCheck}
          title={pos.length === 0 ? 'No pending receipts' : 'Select a PO'}
          description={pos.length === 0 ? 'All sent purchase orders have been received.' : 'Choose a purchase order from the dropdown to start receiving goods.'}
        />
      )}

      {selectedPO && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800">
              <p className="text-xs text-gray-500 mb-1">PO #</p>
              <p className="text-lg font-bold text-white">#{selectedPO.id}</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800">
              <p className="text-xs text-gray-500 mb-1">Supplier</p>
              <p className="text-lg font-bold text-white">{selectedPO.supplierName || 'N/A'}</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800">
              <p className="text-xs text-gray-500 mb-1">Items</p>
              <p className="text-lg font-bold text-white">{(selectedPO.items || []).length}</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800">
              <p className="text-xs text-gray-500 mb-1">Total</p>
              <p className="text-lg font-bold text-white">${(selectedPO.total || 0).toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-white">Receive Items</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Item</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Ordered</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Received</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Quality</th>
                </tr>
              </thead>
              <tbody>
                {(selectedPO.items || []).map((item) => {
                  const itemId = item.itemId || item.id
                  const ordered = Number(item.qty) || 0
                  const received = receivingData[itemId] || 0
                  const diff = ordered - received
                  return (
                    <tr key={itemId} className="border-b border-gray-800/50 hover:bg-gray-800/40 transition-colors">
                      <td className="px-4 py-3 text-gray-300">{item.itemName || 'Unknown'}</td>
                      <td className="px-4 py-3 text-gray-300">{ordered}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          max={ordered}
                          value={receivingData[itemId] ?? ''}
                          onChange={(e) => handleQtyChange(itemId, e.target.value)}
                          placeholder="0"
                          className="w-24 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        />
                        {received > 0 && (
                          <span className={`mr-2 text-xs ${diff === 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                            {diff > 0 ? `${diff} remaining` : 'Complete'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleQualityChange(itemId, 'pass')}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                              qualityData[itemId] === 'pass' || !qualityData[itemId]
                                ? 'bg-green-900/30 text-green-400 border-green-700'
                                : 'border-gray-700 text-gray-500 hover:border-gray-600'
                            }`}
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Pass
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQualityChange(itemId, 'fail')}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                              qualityData[itemId] === 'fail'
                                ? 'bg-red-900/30 text-red-400 border-red-700'
                                : 'border-gray-700 text-gray-500 hover:border-gray-600'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" /> Fail
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleReceive}
              disabled={submitting || Object.keys(receivingData).length === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-700 disabled:text-gray-500 text-black text-sm font-medium rounded-lg transition-colors"
            >
              <PackageCheck className="w-4 h-4" />
              {submitting ? 'Processing...' : 'Receive & Update Inventory'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default ReceivingPage
