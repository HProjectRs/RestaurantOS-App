import {
  ResponsiveContainer,
  LineChart as ReLineChart,
  BarChart as ReBarChart,
  PieChart as RePieChart,
  Line, Bar, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
} from 'recharts'

const darkTooltipStyle = {
  contentStyle: {
    backgroundColor: '#1f2937',
    border: '1px solid #374151',
    borderRadius: '8px',
    color: '#f3f4f6',
    fontSize: '13px',
  },
  labelStyle: { color: '#9ca3af' },
}

const renderLegend = (props) => {
  const { payload } = props
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-2 text-xs text-gray-400">
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }} />
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

const Chart = ({ type = 'line', data = [], lines = [], bars = [], pie = undefined, xKey = 'name', height = 300 }) => {
  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <ReLineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey={xKey} tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#374151' }} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#374151' }} />
            <Tooltip {...darkTooltipStyle} />
            <Legend content={renderLegend} />
            {lines?.map((line, i) => (
              <Line
                key={i}
                type="monotone"
                dataKey={line.dataKey}
                stroke={line.color || '#f59e0b'}
                strokeWidth={2}
                dot={{ fill: line.color || '#f59e0b', r: 3 }}
                activeDot={{ r: 5 }}
                name={line.name || line.dataKey}
              />
            ))}
          </ReLineChart>
        )

      case 'bar':
        return (
          <ReBarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey={xKey} tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#374151' }} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#374151' }} />
            <Tooltip {...darkTooltipStyle} />
            <Legend content={renderLegend} />
            {bars?.map((bar, i) => (
              <Bar
                key={i}
                dataKey={bar.dataKey}
                fill={bar.color || '#f59e0b'}
                radius={[4, 4, 0, 0]}
                name={bar.name || bar.dataKey}
              />
            ))}
          </ReBarChart>
        )

      case 'pie':
        return (
          <RePieChart>
            <Pie
              data={data}
              dataKey={pie?.dataKey || 'value'}
              nameKey={pie?.nameKey || 'name'}
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={pie?.donut ? 60 : 0}
              paddingAngle={2}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={{ stroke: '#6b7280' }}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color || ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899'][i % 6]} />
              ))}
            </Pie>
            <Tooltip {...darkTooltipStyle} />
            <Legend content={renderLegend} />
          </RePieChart>
        )

      default:
        return null
    }
  }

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  )
}

export default Chart
