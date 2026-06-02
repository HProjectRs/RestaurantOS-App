import { useState, useEffect, useMemo } from 'react'
import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react'
import EmptyState from '../../components/data/EmptyState'
import FormSelect from '../../components/forms/FormSelect'
import { inventoryService } from '../../services/inventoryService'
import { suppliersService } from '../../services/suppliersService'

const PriceComparisonPage = () => {
  const [items, setItems] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [selectedItemId, setSelectedItemId] = useState('')
  const [priceHistory, setPriceHistory] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    inventoryService.getItems({}).then((r: any) => setItems(r?.data || r || [])).catch(() => {})
    suppliersService.getSuppliers({ active: true } as any).then((r) => setSuppliers(r.data || [])).catch(() => {})
  }, [])

  const handleItemSelect = async (itemId) => {
    setSelectedItemId(itemId)
    if (!itemId) return
    try {
      setLoading(true)
      const results = await Promise.all(
        suppliers.map((s) =>
          suppliersService.comparePrices(s.id, [itemId])
            .then((r) => ({ supplierId: s.id, supplierName: s.name, prices: r.data || [] }))
            .catch(() => ({ supplierId: s.id, supplierName: s.name, prices: [] }))
        )
      )
      setPriceHistory(results)
    } catch (err) {
      console.error('Failed to compare prices', err)
    } finally {
      setLoading(false)
    }
  }

  const selectedItem = items.find((i) => i.id === selectedItemId)

  const bestPrice = useMemo(() => {
    let min = Infinity
    priceHistory.forEach((ph) => {
      ph.prices.forEach((p) => {
        if (p.price && p.price < min) min = p.price
      })
    })
    return min === Infinity ? null : min
  }, [priceHistory])

  const itemOptions = items.map((i) => ({ value: i.id, label: `${i.name} (${i.unit || ''})` }))

  return (
    <div className="space-y-6">
      <FormSelect
        label="Select Item to Compare"
        options={itemOptions}
        value={selectedItemId}
        onChange={handleItemSelect}
        searchable
        placeholder="Choose an item..."
      />

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => <div key={i} className="h-16 bg-gray-800 rounded-lg animate-pulse" />)}
        </div>
      )}

      {!loading && selectedItem && priceHistory.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-gray-900/60 border border-gray-800">
              <p className="text-sm text-gray-400 mb-1">{selectedItem.name}</p>
              <p className="text-2xl font-bold text-white">{selectedItem.qty} {selectedItem.unit}</p>
            </div>
            {bestPrice !== null && (
              <div className="p-5 rounded-xl bg-green-900/20 border border-green-800/40">
                <p className="text-sm text-green-400 mb-1">Best Price</p>
                <p className="text-2xl font-bold text-green-400">${bestPrice.toFixed(2)}</p>
              </div>
            )}
            <div className="p-5 rounded-xl bg-gray-900/60 border border-gray-800">
              <p className="text-sm text-gray-400 mb-1">Suppliers Compared</p>
              <p className="text-2xl font-bold text-white">{priceHistory.length}</p>
            </div>
          </div>

          <div className="space-y-3">
            {priceHistory.map((ph) => {
              const priceData = ph.prices[0]
              const isBest = priceData?.price === bestPrice
              return (
                <div
                  key={ph.supplierId}
                  className={`p-4 rounded-xl border backdrop-blur-sm transition-all ${
                    isBest ? 'bg-green-900/20 border-green-700' : 'bg-gray-900/60 border-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-sm font-medium text-white">{ph.supplierName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{selectedItem.unit}</p>
                      </div>
                      {isBest && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-700">
                          Best Price
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${isBest ? 'text-green-400' : 'text-white'}`}>
                        ${(priceData?.price || 0).toFixed(2)}
                      </p>
                      {priceData?.previousPrice && (
                        <div className={`flex items-center gap-1 text-xs mt-0.5 ${
                          priceData.price < priceData.previousPrice ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {priceData.price < priceData.previousPrice ? (
                            <TrendingDown className="w-3 h-3" />
                          ) : (
                            <TrendingUp className="w-3 h-3" />
                          )}
                          <span>{Math.abs(((priceData.price - priceData.previousPrice) / priceData.previousPrice) * 100).toFixed(1)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {!loading && selectedItem && priceHistory.length > 0 && selectedItem.priceHistory && (
        <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Price History</h3>
          <div className="space-y-2">
            {selectedItem.priceHistory.map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <span className="text-sm text-gray-400">{new Date(entry.date).toLocaleDateString()}</span>
                <span className="text-sm font-medium text-white">${(entry.price || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !selectedItem && (
        <EmptyState icon={DollarSign} title="Select an item" description="Choose an inventory item to compare prices across suppliers." />
      )}
    </div>
  )
}

export default PriceComparisonPage
