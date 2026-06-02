import { useState, useEffect, useCallback } from 'react'
import { Plus, ChevronRight, ChevronDown, FolderOpen, FileText } from 'lucide-react'
import { getChartOfAccounts, createAccount } from '../../services/accountingService'

const typeColors = {
  asset: 'bg-blue-500/20 text-blue-400',
  liability: 'bg-amber-500/20 text-amber-400',
  equity: 'bg-green-500/20 text-green-400',
  revenue: 'bg-emerald-500/20 text-emerald-400',
  expense: 'bg-red-500/20 text-red-400',
}

const ChartOfAccountsPage = () => {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState({})
  const [form, setForm] = useState({
    code: '', name: '', type: 'asset', parentId: '',
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getChartOfAccounts()
      setAccounts(res.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await createAccount(form)
      setShowForm(false)
      setForm({ code: '', name: '', type: 'asset', parentId: '' })
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const getBalance = (account) => {
    const self = Number(account.balance) || 0
    const children = accounts.filter(a => a.parentId === account.id)
    return children.reduce((s, c) => s + getBalance(c), self)
  }

  const renderAccountTree = (parentId = null, depth = 0) => {
    const children = accounts.filter(a => a.parentId === parentId)
    if (children.length === 0) return null

    return children.map(account => {
      const hasChildren = accounts.some(a => a.parentId === account.id)
      const isExpanded = expanded[account.id]
      const balance = getBalance(account)

      return (
        <div key={account.id}>
          <div
            className="flex items-center gap-2 px-3 py-2.5 hover:bg-gray-800/40 cursor-pointer border-b border-gray-800/50 transition-colors"
            style={{ paddingLeft: `${24 + depth * 20}px` }}
            onClick={() => hasChildren && toggleExpand(account.id)}
          >
            <div className="flex-shrink-0 w-4">
              {hasChildren ? (
                isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />
              ) : (
                <FileText className="w-4 h-4 text-gray-600" />
              )}
            </div>
            {hasChildren && <FolderOpen className="w-4 h-4 text-gray-500" />}
            <span className="text-xs font-mono text-gray-500 w-16">{account.code}</span>
            <span className="text-sm text-gray-200 flex-1">{account.name}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[account.type] || ''}`}>
              {account.type}
            </span>
            <span className="text-sm text-gray-300 w-32 text-right font-mono">
              {Number(balance).toLocaleString()} DZD
            </span>
          </div>
          {isExpanded && renderAccountTree(account.id, depth + 1)}
        </div>
      )
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Chart of Accounts</h2>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Account
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-5 rounded-xl bg-gray-900/60 border border-gray-800 backdrop-blur-sm space-y-4">
          <h3 className="text-sm font-semibold text-gray-200">New Account</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input type="text" value={form.code}
              onChange={(e) => setForm(f => ({ ...f, code: e.target.value }))}
              placeholder="Account Code" required
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500" />
            <input type="text" value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Account Name" required
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500" />
            <select value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white">
              <option value="asset">Asset</option>
              <option value="liability">Liability</option>
              <option value="equity">Equity</option>
              <option value="revenue">Revenue</option>
              <option value="expense">Expense</option>
            </select>
            <select value={form.parentId} onChange={(e) => setForm(f => ({ ...f, parentId: e.target.value }))}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white">
              <option value="">No Parent (Root)</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
            <button type="submit"
              className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-lg text-sm font-medium">Create</button>
          </div>
        </form>
      )}

      <div className="bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : accounts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No accounts yet. Add your first account.</div>
        ) : (
          renderAccountTree()
        )}
      </div>
    </div>
  )
}

export default ChartOfAccountsPage
