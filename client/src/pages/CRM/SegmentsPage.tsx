import { useState, useEffect, useCallback } from 'react'
import { Users, TrendingUp, Clock, UserPlus, DollarSign, Award } from 'lucide-react'
import { getCustomers, getSegments } from '../../services/crmService'

const SEGMENT_DEFS = [
  { id: 'high_spenders', label: 'High Spenders', icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10', minSpent: 50000 },
  { id: 'frequent', label: 'Frequent Visitors', icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10', minOrders: 10 },
  { id: 'inactive', label: 'Inactive', icon: Clock, color: 'text-red-400', bg: 'bg-red-500/10', maxDays: 90 },
  { id: 'new', label: 'New Customers', icon: UserPlus, color: 'text-amber-400', bg: 'bg-amber-500/10', maxDaysSinceReg: 30 },
  { id: 'vip', label: 'VIP (Gold+)', icon: Award, color: 'text-purple-400', bg: 'bg-purple-500/10', tiers: ['gold', 'platinum'] },
]

const SegmentsPage = () => {
  const [customers, setCustomers] = useState([])
  const [segments, setSegments] = useState({})
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [custRes, segRes] = await Promise.all([
        getCustomers({}),
        getSegments(),
      ])
      setCustomers(custRes.data || [])
      setSegments(segRes.data || {})
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const computeSegmentCount = (def) => {
    if (segments[def.id]?.count != null) return segments[def.id].count

    return customers.filter(c => {
      if (def.minSpent && (Number(c.totalSpent) || 0) < def.minSpent) return false
      if (def.minOrders && (c.ordersCount || 0) < def.minOrders) return false
      if (def.maxDays && c.lastOrderDate) {
        const daysSince = (Date.now() - new Date(c.lastOrderDate).getTime()) / 86400000
        if (daysSince < def.maxDays) return false
      }
      if (def.maxDaysSinceReg && c.createdAt) {
        const daysSinceReg = (Date.now() - new Date(c.createdAt).getTime()) / 86400000
        if (daysSinceReg > def.maxDaysSinceReg) return false
      }
      if (def.tiers && !def.tiers.includes(c.tier)) return false
      return true
    }).length
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading segments...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Customer Segments</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SEGMENT_DEFS.map(def => {
            const count = computeSegmentCount(def)
            const percentage = customers.length ? ((count / customers.length) * 100).toFixed(1) : 0
            const Icon = def.icon

            return (
              <div key={def.id} className="p-5 rounded-xl bg-gray-900/60 border border-gray-800 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2.5 rounded-lg ${def.bg}`}>
                    <Icon className={`w-5 h-5 ${def.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-200">{def.label}</p>
                    <p className={`text-xs ${def.color}`}>
                      {def.minSpent ? `>${def.minSpent.toLocaleString()} DZD` : ''}
                      {def.minOrders ? `>${def.minOrders} orders` : ''}
                      {def.maxDays ? `>${def.maxDays}d inactive` : ''}
                      {def.maxDaysSinceReg ? `<${def.maxDaysSinceReg}d old` : ''}
                      {def.tiers ? def.tiers.join('/') : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">{count}</p>
                    <p className="text-xs text-gray-500">customers</p>
                  </div>
                  <span className="text-sm text-gray-400">{percentage}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-800 rounded-full mt-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${def.bg.replace('/10', '/30')}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default SegmentsPage
