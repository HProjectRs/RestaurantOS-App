import Chart from '../../components/data/Chart'
import { DataTable } from '../../components/data/DataTable'

const TopItemsWidget = ({ items = [] }) => {
  const chartData = items.map((item) => ({
    name: item.name,
    qty: item.qty,
    revenue: item.revenue,
  }))

  const columns = [
    { accessor: 'rank', label: '#' },
    { accessor: 'name', label: 'الصنف' },
    { accessor: 'qty', label: 'الكمية' },
    { accessor: 'revenue', label: 'الإيرادات', render: (row) => `${row.revenue?.toLocaleString()} د.ج` },
  ]

  const ranked = items.map((item, i) => ({ ...item, rank: i + 1 }))

  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-4">أفضل العناصر مبيعاً</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Chart
          type="bar"
          data={chartData}
          xKey="name"
          bars={[{ dataKey: 'qty', name: 'الكمية', color: '#f59e0b' }]}
          height={250}
        />
        <DataTable
          columns={columns}
          data={ranked}
          pageSize={5}
          searchable={false}
        />
      </div>
    </div>
  )
}

export default TopItemsWidget
