import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, TrendingDown, ArrowUpDown, Calendar } from 'lucide-react'
import { getCashFlow } from '../../services/accountingService'

const CashFlowPage = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('2025-12')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getCashFlow({ period })
      setData(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => { loadData() }, [loadData])

  const SectionCard = ({ title, items, icon: Icon, color }) => {
    const total = items?.reduce((s, i) => s + (Number(i.amount) || 0), 0) || 0
    return (
      <div className="p-5 rounded-xl bg-gray-900/60 border border-gray-800 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <Icon className={`w-5 h-5 ${color}`} />
          <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
        </div>
        <div className="space-y-2">
          {items?.map((item, i) => (
            <div key={i} className="flex justify-between py-1.5 border-b border-gray-800/50 last:border-0">
              <span className="text-sm text-gray-300">{item.label}</span>
              <span className={`text-sm font-mono ${Number(item.amount) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {Number(item.amount).toLocaleString()} DZD
              </span>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-3 pt-3 border-t border-gray-700 font-semibold">
          <span className="text-sm text-gray-200">Total</span>
          <span className={`text-sm font-mono ${total >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {total.toLocaleString()} DZD
          </span>
        </div>
      </div>
    )
  }

  const operating = data?.operating || []
  const investing = data?.investing || []
  const financing = data?.financing || []
  const opTotal = operating.reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const invTotal = investing.reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const finTotal = financing.reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const netCashFlow = opTotal + invTotal + finTotal

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calendar className="w-5 h-5 text-gray-400" />
        <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-gray-900/60 border border-gray-800 text-center">
          <p className="text-sm text-gray-400 mb-1">Net Cash Flow</p>
          <p className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {netCashFlow.toLocaleString()} DZD
          </p>
        </div>
        <div className="p-5 rounded-xl bg-gray-900/60 border border-gray-800 text-center">
          <p className="text-sm text-gray-400 mb-1">Operating</p>
          <p className={`text-lg font-bold ${opTotal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {opTotal.toLocaleString()} DZD
          </p>
        </div>
        <div className="p-5 rounded-xl bg-gray-900/60 border border-gray-800 text-center">
          <p className="text-sm text-gray-400 mb-1">Investing</p>
          <p className={`text-lg font-bold ${invTotal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {invTotal.toLocaleString()} DZD
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SectionCard
          title="Operating Activities"
          items={operating}
          icon={TrendingUp}
          color="text-blue-400"
        />
        <SectionCard
          title="Investing Activities"
          items={investing}
          icon={TrendingDown}
          color="text-amber-400"
        />
        <SectionCard
          title="Financing Activities"
          items={financing}
          icon={ArrowUpDown}
          color="text-purple-400"
        />
      </div>
    </div>
  )
}

export default CashFlowPage
