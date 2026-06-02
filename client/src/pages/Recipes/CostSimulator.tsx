import { useState, useEffect, useMemo } from 'react'
import { Calculator, ArrowLeft, Plus, Trash2 } from 'lucide-react'
import EmptyState from '../../components/data/EmptyState'
import FormSelect from '../../components/forms/FormSelect'
import { recipesService } from '../../services/recipesService'
import { inventoryService } from '../../services/inventoryService'

const CostSimulator = () => {
  const [recipes, setRecipes] = useState([])
  const [items, setItems] = useState([])
  const [selectedRecipeId, setSelectedRecipeId] = useState('')
  const [scenarios, setScenarios] = useState({})

  useEffect(() => {
    recipesService.getRecipes({}).then((r: any) => setRecipes(r?.data || r || [])).catch(() => {})
    inventoryService.getItems({}).then((r: any) => setItems(r?.data || r || [])).catch(() => {})
  }, [])

  const selectedRecipe = recipes.find((r) => r.id === selectedRecipeId)

  const originalCost = useMemo(() => {
    if (!selectedRecipe) return 0
    return (selectedRecipe.ingredients || []).reduce((s, ing) => s + (Number(ing.qty) || 0) * (Number(ing.unitCost) || 0), 0)
  }, [selectedRecipe])

  const simulatedCost = useMemo(() => {
    if (!selectedRecipe) return 0
    return (selectedRecipe.ingredients || []).reduce((sum, ing) => {
      const adj = scenarios[ing.itemId] || {}
      const qty = adj.qty !== undefined ? Number(adj.qty) : (Number(ing.qty) || 0)
      const price = adj.price !== undefined ? Number(adj.price) : (Number(ing.unitCost) || 0)
      return sum + qty * price
    }, 0)
  }, [selectedRecipe, scenarios])

  const sellingPrice = selectedRecipe?.sellingPrice || 0
  const originalPct = sellingPrice > 0 ? (originalCost / sellingPrice) * 100 : 0
  const simulatedPct = sellingPrice > 0 ? (simulatedCost / sellingPrice) * 100 : 0
  const originalMargin = sellingPrice - originalCost
  const simulatedMargin = sellingPrice - simulatedCost
  const suggestedPrice28 = simulatedCost / 0.28
  const suggestedPrice30 = simulatedCost / 0.30
  const suggestedPrice35 = simulatedCost / 0.35

  const handleScenarioChange = (itemId, field) => (e) => {
    const val = e.target.value
    setScenarios((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: val === '' ? undefined : Number(val) },
    }))
  }

  const resetScenario = (itemId) => {
    setScenarios((prev) => {
      const copy = { ...prev }
      delete copy[itemId]
      return copy
    })
  }

  const resetAll = () => setScenarios({})

  const recipeOptions = recipes.map((r) => ({ value: r.id, label: r.name }))

  if (recipes.length === 0) {
    return <EmptyState icon={Calculator} title="No recipes" description="Create recipes first to simulate costs." />
  }

  return (
    <div className="space-y-6">
      <FormSelect
        label="Select Recipe"
        options={recipeOptions}
        value={selectedRecipeId}
        onChange={setSelectedRecipeId}
        searchable
        placeholder="Choose a recipe..."
      />

      {selectedRecipe && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800">
              <p className="text-xs text-gray-500 mb-1">Original Cost</p>
              <p className="text-lg font-bold text-white">${originalCost.toFixed(2)}</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800">
              <p className="text-xs text-gray-500 mb-1">Simulated Cost</p>
              <p className={`text-lg font-bold ${simulatedCost !== originalCost ? 'text-amber-400' : 'text-white'}`}>
                ${simulatedCost.toFixed(2)}
                {simulatedCost !== originalCost && (
                  <span className={`text-sm mr-2 ${simulatedCost > originalCost ? 'text-red-400' : 'text-green-400'}`}>
                    ({simulatedCost > originalCost ? '+' : ''}{(simulatedCost - originalCost).toFixed(2)})
                  </span>
                )}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800">
              <p className="text-xs text-gray-500 mb-1">Food Cost %</p>
              <p className={`text-lg font-bold ${simulatedPct <= 28 ? 'text-green-400' : simulatedPct <= 30 ? 'text-blue-400' : simulatedPct <= 35 ? 'text-yellow-400' : 'text-red-400'}`}>
                {simulatedPct.toFixed(1)}%
                {simulatedPct !== originalPct && (
                  <span className={`text-sm mr-2 ${simulatedPct > originalPct ? 'text-red-400' : 'text-green-400'}`}>
                    ({simulatedPct > originalPct ? '+' : ''}{(simulatedPct - originalPct).toFixed(1)}%)
                  </span>
                )}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800">
              <p className="text-xs text-gray-500 mb-1">Profit Margin</p>
              <p className="text-lg font-bold text-white">${simulatedMargin.toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Ingredients — Adjust Qty/Price</h3>
              <button onClick={resetAll} className="text-xs text-gray-500 hover:text-white transition-colors">Reset All</button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Item</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Original Qty</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Adjusted Qty</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Original Price</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Adjusted Price</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Subtotal</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {(selectedRecipe.ingredients || []).map((ing, idx) => {
                  const adj = scenarios[ing.itemId] || {}
                  const adjQty = adj.qty ?? (Number(ing.qty) || 0)
                  const adjPrice = adj.price ?? (Number(ing.unitCost) || 0)
                  const subtotal = adjQty * adjPrice
                  const origSubtotal = (Number(ing.qty) || 0) * (Number(ing.unitCost) || 0)
                  return (
                    <tr key={idx} className="border-b border-gray-800/50">
                      <td className="px-4 py-3 text-gray-300">{ing.itemName || 'Unknown'}</td>
                      <td className="px-4 py-3 text-gray-500">{ing.qty}</td>
                      <td className="px-4 py-3">
                        <input type="number" min="0" step="0.01" value={adj.qty ?? ''} onChange={handleScenarioChange(ing.itemId, 'qty')} placeholder={String(ing.qty)} className="w-20 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500" />
                      </td>
                      <td className="px-4 py-3 text-gray-500">${(Number(ing.unitCost) || 0).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <input type="number" min="0" step="0.01" value={adj.price ?? ''} onChange={handleScenarioChange(ing.itemId, 'price')} placeholder={(Number(ing.unitCost) || 0).toFixed(2)} className="w-22 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500" />
                      </td>
                      <td className={`px-4 py-3 font-medium ${subtotal !== origSubtotal ? 'text-amber-400' : 'text-gray-300'}`}>
                        ${subtotal.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        {scenarios[ing.itemId] && (
                          <button onClick={() => resetScenario(ing.itemId)} className="text-xs text-gray-500 hover:text-white">Reset</button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Suggested Prices (at simulated cost)</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: '28% Food Cost', price: suggestedPrice28, pct: '28%' },
                { label: '30% Food Cost', price: suggestedPrice30, pct: '30%' },
                { label: '35% Food Cost', price: suggestedPrice35, pct: '35%' },
              ].map((s) => (
                <div key={s.label} className="p-4 bg-gray-800/50 rounded-xl text-center">
                  <p className="text-xs text-gray-500 mb-2">{s.label}</p>
                  <p className="text-xl font-bold text-amber-400">${s.price.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-2">Margin: ${(s.price - simulatedCost).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Comparison: Original vs Simulated</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-500 mb-2">Original</p>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${originalPct <= 28 ? 'bg-green-500' : originalPct <= 30 ? 'bg-blue-500' : originalPct <= 35 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(originalPct, 100)}%` }}
                  />
                </div>
                <p className="text-sm text-gray-400 mt-1">Cost: ${originalCost.toFixed(2)} • {originalPct.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">Simulated</p>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${simulatedPct <= 28 ? 'bg-green-500' : simulatedPct <= 30 ? 'bg-blue-500' : simulatedPct <= 35 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(simulatedPct, 100)}%` }}
                  />
                </div>
                <p className="text-sm text-gray-400 mt-1">Cost: ${simulatedCost.toFixed(2)} • {simulatedPct.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default CostSimulator
