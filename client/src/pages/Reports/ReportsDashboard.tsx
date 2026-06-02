import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DollarSign, ShoppingCart, BarChart3, TrendingUp } from 'lucide-react'

const summaryCards = [
  {
    label: 'Total Sales',
    value: '12,847,500.00 DA',
    change: '+12.5%',
    icon: DollarSign,
    color: 'bg-green-50 text-green-600',
  },
  {
    label: 'Total Orders',
    value: '1,284',
    change: '+8.3%',
    icon: ShoppingCart,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    label: 'Avg Check',
    value: '10,006.00 DA',
    change: '+3.2%',
    icon: BarChart3,
    color: 'bg-purple-50 text-purple-600',
  },
  {
    label: 'Peak Hour Sales',
    value: '1,340,000.00 DA',
    change: '+18.7%',
    icon: TrendingUp,
    color: 'bg-orange-50 text-orange-600',
  },
]

const quickLinks = [
  { label: 'Sales Report', path: 'sales', description: 'Daily, weekly, monthly sales breakdown' },
  { label: 'Inventory Report', path: 'inventory', description: 'Stock values, movement, waste' },
  { label: 'HR Report', path: 'hr', description: 'Labor costs, attendance, payroll' },
  { label: 'Menu Engineering', path: 'menu-engineering', description: 'Miller Matrix analysis' },
  { label: 'Variance Report', path: 'variance', description: 'Theoretical vs actual costs' },
]

export default function ReportsDashboard() {
  const navigate = useNavigate()
  const [dateRange, setDateRange] = useState({ from: '', to: '' })

  return (
    <div className="space-y-6" dir="ltr">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">From:</label>
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange((p) => ({ ...p, from: e.target.value }))}
            className="border rounded-lg px-3 py-1.5 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">To:</label>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange((p) => ({ ...p, to: e.target.value }))}
            className="border rounded-lg px-3 py-1.5 text-sm"
          />
        </div>
        <button className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition-colors">
          Export All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className={`p-2.5 rounded-lg ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-green-600">{card.change}</span>
            </div>
            <p className="text-2xl font-bold mt-3 text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold text-gray-800 mt-8 mb-3">Quick Reports</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickLinks.map((link) => (
          <button
            key={link.path}
            onClick={() => navigate(link.path)}
            className="bg-white rounded-xl border p-5 text-left hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold text-gray-900">{link.label}</h3>
            <p className="text-sm text-gray-500 mt-1">{link.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
