import { useState } from 'react'

const periods = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'custom', label: 'Custom' },
]

const categoryData = [
  { name: 'Sandwiches', value: 35, color: 'bg-blue-500' },
  { name: 'Pizza', value: 25, color: 'bg-green-500' },
  { name: 'Drinks', value: 20, color: 'bg-yellow-500' },
  { name: 'Desserts', value: 12, color: 'bg-purple-500' },
  { name: 'Sides', value: 8, color: 'bg-orange-500' },
]

const paymentMethods = [
  { method: 'Cash', amount: '5,200,000 DA', percentage: 40 },
  { method: 'Card (CIB)', amount: '3,900,000 DA', percentage: 30 },
  { method: 'Mobile Money', amount: '2,600,000 DA', percentage: 20 },
  { method: 'Other', amount: '1,300,000 DA', percentage: 10 },
]

const hourlySales = [
  { hour: '10AM', sales: 120000 },
  { hour: '11AM', sales: 250000 },
  { hour: '12PM', sales: 580000 },
  { hour: '1PM', sales: 890000 },
  { hour: '2PM', sales: 650000 },
  { hour: '3PM', sales: 300000 },
  { hour: '4PM', sales: 180000 },
  { hour: '5PM', sales: 220000 },
  { hour: '6PM', sales: 550000 },
  { hour: '7PM', sales: 920000 },
  { hour: '8PM', sales: 780000 },
  { hour: '9PM', sales: 410000 },
]

const maxHourly = Math.max(...hourlySales.map((h) => h.sales))

export default function SalesReportPage() {
  const [period, setPeriod] = useState('month')

  return (
    <div className="space-y-6" dir="ltr">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {periods.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                period === p.id ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto">
          <button className="border border-gray-300 text-gray-700 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-50">
            Export Excel
          </button>
          <button className="border border-gray-300 text-gray-700 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-50">
            Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Sales</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">12,847,500.00 DA</p>
          <p className="text-xs text-green-600 mt-1">+12.5% vs last period</p>
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">1,284</p>
          <p className="text-xs text-green-600 mt-1">+8.3% vs last period</p>
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <p className="text-sm text-gray-500">Average Order</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">10,006.00 DA</p>
          <p className="text-xs text-green-600 mt-1">+3.2% vs last period</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Sales by Category</h3>
          <div className="space-y-3">
            {categoryData.map((cat) => (
              <div key={cat.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{cat.name}</span>
                  <span className="text-gray-500">{cat.value}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div className={`h-2.5 rounded-full ${cat.color}`} style={{ width: `${cat.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Sales by Payment Method</h3>
          <div className="space-y-4">
            {paymentMethods.map((pm) => (
              <div key={pm.method} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{pm.method}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-100 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${pm.percentage}%` }} />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-28 text-right">{pm.amount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Hourly Sales</h3>
        <div className="flex items-end gap-2 h-48">
          {hourlySales.map((h) => (
            <div key={h.hour} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-blue-500 rounded-t transition-all"
                style={{ height: `${(h.sales / maxHourly) * 100}%`, minHeight: '4px' }}
              />
              <span className="text-xs text-gray-500">{h.hour}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
