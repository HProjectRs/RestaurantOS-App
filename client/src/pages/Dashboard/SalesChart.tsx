import { useState } from 'react'
import Chart from '../../components/data/Chart'

const SalesChart = ({ data = [] }) => {
  const [range, setRange] = useState('7')

  const filtered = data
    .filter((d) => d.day)
    .slice(range === '7' ? -7 : -30)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">المبيعات</h2>
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setRange('7')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              range === '7' ? 'bg-amber-500/20 text-amber-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            7 أيام
          </button>
          <button
            onClick={() => setRange('30')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              range === '30' ? 'bg-amber-500/20 text-amber-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            30 يوم
          </button>
        </div>
      </div>
      <Chart
        type="line"
        data={filtered}
        xKey="day"
        lines={[
          { dataKey: 'revenue', name: 'الإيرادات', color: '#f59e0b' },
          { dataKey: 'orders', name: 'الطلبات', color: '#3b82f6' },
        ]}
        height={300}
      />
    </div>
  )
}

export default SalesChart
