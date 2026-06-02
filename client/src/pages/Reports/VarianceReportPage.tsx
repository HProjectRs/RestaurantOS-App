import { useState } from 'react'

const varianceItems = [
  {
    name: 'Margherita Pizza',
    theoretical: 245,
    actual: 278,
    variance: 33,
    variancePercent: 13.5,
    costImpact: '49,500 DA',
    status: 'over',
  },
  {
    name: 'Caesar Salad',
    theoretical: 180,
    actual: 195,
    variance: 15,
    variancePercent: 8.3,
    costImpact: '12,750 DA',
    status: 'over',
  },
  {
    name: 'Grilled Chicken',
    theoretical: 120,
    actual: 118,
    variance: -2,
    variancePercent: -1.7,
    costImpact: '-1,200 DA',
    status: 'under',
  },
  {
    name: 'Classic Burger',
    theoretical: 300,
    actual: 345,
    variance: 45,
    variancePercent: 15.0,
    costImpact: '31,500 DA',
    status: 'over',
  },
  {
    name: 'French Fries',
    theoretical: 400,
    actual: 410,
    variance: 10,
    variancePercent: 2.5,
    costImpact: '3,000 DA',
    status: 'over',
  },
  {
    name: 'Soft Drinks',
    theoretical: 500,
    actual: 480,
    variance: -20,
    variancePercent: -4.0,
    costImpact: '-5,000 DA',
    status: 'under',
  },
]

const summaryTotals = {
  totalTheoretical: '3,850,000 DA',
  totalActual: '4,295,000 DA',
  totalVariance: '445,000 DA',
  overallVariancePercent: 11.6,
}

export default function VarianceReportPage() {
  const [sortBy, setSortBy] = useState('variancePercent')
  const [sortDir, setSortDir] = useState('desc')

  const sorted = [...varianceItems].sort((a, b) =>
    sortDir === 'desc' ? b[sortBy] - a[sortBy] : a[sortBy] - b[sortBy]
  )

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortBy(field)
      setSortDir('desc')
    }
  }

  return (
    <div className="space-y-6" dir="ltr">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <p className="text-sm text-gray-500">Theoretical Cost</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{summaryTotals.totalTheoretical}</p>
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <p className="text-sm text-gray-500">Actual Cost</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{summaryTotals.totalActual}</p>
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Variance</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{summaryTotals.totalVariance}</p>
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <p className="text-sm text-gray-500">Variance %</p>
          <p className={`text-2xl font-bold mt-1 ${summaryTotals.overallVariancePercent > 5 ? 'text-red-600' : 'text-green-600'}`}>
            {summaryTotals.overallVariancePercent}%
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-900">Variance by Item</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Item</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 cursor-pointer" onClick={() => handleSort('theoretical')}>
                  Theoretical {sortBy === 'theoretical' && (sortDir === 'desc' ? '↓' : '↑')}
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 cursor-pointer" onClick={() => handleSort('actual')}>
                  Actual {sortBy === 'actual' && (sortDir === 'desc' ? '↓' : '↑')}
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 cursor-pointer" onClick={() => handleSort('variance')}>
                  Variance {sortBy === 'variance' && (sortDir === 'desc' ? '↓' : '↑')}
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 cursor-pointer" onClick={() => handleSort('variancePercent')}>
                  Variance % {sortBy === 'variancePercent' && (sortDir === 'desc' ? '↓' : '↑')}
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Cost Impact</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((item) => (
                <tr key={item.name} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{item.theoretical}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{item.actual}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {item.variance > 0 ? '+' : ''}{item.variance}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={item.variancePercent > 0 ? 'text-red-600' : 'text-green-600'}>
                      {item.variancePercent > 0 ? '+' : ''}{item.variancePercent}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">{item.costImpact}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      item.status === 'over' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {item.status === 'over' ? 'Over' : 'Under'}
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
