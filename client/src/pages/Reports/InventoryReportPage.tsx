import { useState } from 'react'

const stockValueSummary = {
  totalValue: '8,450,000.00 DA',
  totalItems: 342,
  lowStockItems: 18,
  outOfStock: 5,
}

const stockMovement = [
  { type: 'Received', quantity: 245, value: '3,200,000 DA' },
  { type: 'Used', quantity: 189, value: '2,450,000 DA' },
  { type: 'Waste', quantity: 12, value: '185,000 DA' },
  { type: 'Transferred', quantity: 8, value: '95,000 DA' },
]

const topUsedItems = [
  { name: 'Tomato Paste', usage: 45, unit: 'kg' },
  { name: 'Cooking Oil', usage: 38, unit: 'L' },
  { name: 'Flour', usage: 32, unit: 'kg' },
  { name: 'Chicken Breast', usage: 28, unit: 'kg' },
  { name: 'Mozzarella', usage: 25, unit: 'kg' },
]

const lowStock = [
  { name: 'Olive Oil', current: 2, min: 10, unit: 'L' },
  { name: 'Basil', current: 0, min: 5, unit: 'kg' },
  { name: 'Parmesan', current: 1, min: 8, unit: 'kg' },
  { name: 'Napkins', current: 50, min: 200, unit: 'pcs' },
  { name: 'Takeaway Boxes', current: 15, min: 100, unit: 'pcs' },
]

export default function InventoryReportPage() {
  const [activeSection, setActiveSection] = useState('overview')

  return (
    <div className="space-y-6" dir="ltr">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <p className="text-sm text-gray-500">Stock Value</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stockValueSummary.totalValue}</p>
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Items</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stockValueSummary.totalItems}</p>
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <p className="text-sm text-gray-500">Low Stock Items</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stockValueSummary.lowStockItems}</p>
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <p className="text-sm text-gray-500">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stockValueSummary.outOfStock}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Stock Movement</h3>
        <div className="space-y-3">
          {stockMovement.map((m) => (
            <div key={m.type} className="flex items-center justify-between py-2 border-b last:border-0">
              <span className="text-sm text-gray-700">{m.type}</span>
              <div className="flex items-center gap-6">
                <span className="text-sm text-gray-500">{m.quantity} movements</span>
                <span className="text-sm font-medium text-gray-900">{m.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Top Used Items</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2 font-medium">Item</th>
                <th className="pb-2 font-medium">Usage</th>
              </tr>
            </thead>
            <tbody>
              {topUsedItems.map((item) => (
                <tr key={item.name} className="border-b last:border-0">
                  <td className="py-2 text-gray-700">{item.name}</td>
                  <td className="py-2 text-gray-900 font-medium">{item.usage} {item.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Low Stock Items</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2 font-medium">Item</th>
                <th className="pb-2 font-medium">Current</th>
                <th className="pb-2 font-medium">Min</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.map((item) => (
                <tr key={item.name} className="border-b last:border-0">
                  <td className="py-2 text-gray-700">{item.name}</td>
                  <td className="py-2 text-gray-900">{item.current} {item.unit}</td>
                  <td className="py-2 text-gray-500">{item.min} {item.unit}</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      item.current === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {item.current === 0 ? 'Out of Stock' : 'Low Stock'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
