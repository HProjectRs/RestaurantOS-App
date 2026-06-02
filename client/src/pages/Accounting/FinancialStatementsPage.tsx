import { useState, useEffect, useCallback } from 'react'
import { Download, Calendar } from 'lucide-react'
import { getPLStatement, getBalanceSheet } from '../../services/accountingService'
import { useExport } from '../../hooks/useExport'

const FinancialStatementsPage = () => {
  const [activeTab, setActiveTab] = useState('pl')
  const [plData, setPlData] = useState(null)
  const [balanceSheet, setBalanceSheet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('2025-12')
  const { exportPDF, exporting } = useExport()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      if (activeTab === 'pl') {
        const res = await getPLStatement({ period })
        setPlData(res.data)
      } else {
        const res = await getBalanceSheet({ period })
        setBalanceSheet(res.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [activeTab, period])

  useEffect(() => { loadData() }, [loadData])

  const PnLSection = ({ label, value, isTotal, isNegative }: { label: string; value: any; isTotal?: boolean; isNegative?: boolean }) => (
    <div className={`flex justify-between py-2 ${isTotal ? 'border-t-2 border-gray-700 font-bold text-white' : 'border-b border-gray-800/50'}`}>
      <span className={`text-sm ${isTotal ? 'text-white' : 'text-gray-300'}`}>{label}</span>
      <span className={`text-sm font-mono ${isNegative && Number(value) < 0 ? 'text-red-400' : 'text-gray-200'}`}>
        {Number(value || 0).toLocaleString()} DZD
      </span>
    </div>
  )

  const renderPL = () => {
    if (!plData) return <div className="text-center py-12 text-gray-500">No data for this period</div>
    const grossProfit = (plData.revenue || 0) - (plData.cogs || 0)
    const netProfit = grossProfit - (plData.expenses || 0)

    return (
      <div className="max-w-2xl">
        <PnLSection label="Revenue" value={plData.revenue} />
        <PnLSection label="COGS" value={plData.cogs} isNegative />
        <PnLSection label="Gross Profit" value={grossProfit} isTotal />
        <PnLSection label="Total Expenses" value={plData.expenses} isNegative />
        <PnLSection label="Net Profit" value={netProfit} isTotal />
      </div>
    )
  }

  const renderBalanceSheet = () => {
    if (!balanceSheet) return <div className="text-center py-12 text-gray-500">No data for this period</div>
    const totalAssets = (balanceSheet.currentAssets || 0) + (balanceSheet.fixedAssets || 0)
    const totalLiabilities = (balanceSheet.currentLiabilities || 0) + (balanceSheet.longTermLiabilities || 0)
    const totalEquity = totalAssets - totalLiabilities

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-sm font-semibold text-gray-200 mb-3">Assets</h3>
          <PnLSection label="Current Assets" value={balanceSheet.currentAssets} />
          <PnLSection label="Fixed Assets" value={balanceSheet.fixedAssets} />
          <PnLSection label="Total Assets" value={totalAssets} isTotal />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-200 mb-3">Liabilities & Equity</h3>
          <PnLSection label="Current Liabilities" value={balanceSheet.currentLiabilities} />
          <PnLSection label="Long-term Liabilities" value={balanceSheet.longTermLiabilities} />
          <PnLSection label="Total Liabilities" value={totalLiabilities} isTotal />
          <PnLSection label="Equity" value={totalEquity} isTotal />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {[
            { key: 'pl', label: 'Profit & Loss' },
            { key: 'balance', label: 'Balance Sheet' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <Calendar className="w-5 h-5 text-gray-400 ml-4" />
          <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white" />
        </div>
        <button
          onClick={() => exportPDF('financial-statement', `Financial_Statement_${period}`)}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm disabled:opacity-50">
          <Download className="w-4 h-4" /> Export PDF
        </button>
      </div>

      <div id="financial-statement" className="p-6 rounded-xl bg-gray-900/60 border border-gray-800">
        <div className="text-center mb-6">
          <h2 className="text-lg font-bold text-white">
            {activeTab === 'pl' ? 'Profit & Loss Statement' : 'Balance Sheet'}
          </h2>
          <p className="text-sm text-gray-400">Period: {period}</p>
        </div>
        {activeTab === 'pl' ? renderPL() : renderBalanceSheet()}
      </div>
    </div>
  )
}

export default FinancialStatementsPage
