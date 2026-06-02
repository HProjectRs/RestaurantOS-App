import { ArrowLeft, ChefHat } from 'lucide-react'
import { usePermissions } from '../../hooks/usePermissions'

const healthIndicator = (costPct) => {
  if (costPct <= 28) return { color: 'text-green-400', bg: 'bg-green-900/20', border: 'border-green-800', label: 'Excellent', barColor: 'bg-green-500' }
  if (costPct <= 30) return { color: 'text-blue-400', bg: 'bg-blue-900/20', border: 'border-blue-800', label: 'Good', barColor: 'bg-blue-500' }
  if (costPct <= 35) return { color: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-800', label: 'Average', barColor: 'bg-yellow-500' }
  return { color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-800', label: 'High', barColor: 'bg-red-500' }
}

const RecipeDetail = ({ recipe, onBack }) => {
  const recipeCost = recipe.recipeCost || 0
  const sellingPrice = recipe.sellingPrice || 0
  const foodCostPct = recipe.foodCostPct || (sellingPrice > 0 ? (recipeCost / sellingPrice) * 100 : 0)
  const profitMargin = recipe.profitMargin || (sellingPrice - recipeCost)
  const health = healthIndicator(foodCostPct)

  const suggestedPrice28 = recipeCost / 0.28
  const suggestedPrice30 = recipeCost / 0.30
  const suggestedPrice35 = recipeCost / 0.35

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Recipes
      </button>

      <div className={`p-6 rounded-xl border backdrop-blur-sm ${health.bg} ${health.border}`}>
        <div className="flex items-start gap-4">
          <span className="text-4xl">{recipe.emoji || '🍽️'}</span>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">{recipe.name}</h2>
            <p className="text-sm text-gray-400 mt-1">{recipe.category} • {recipe.description}</p>
          </div>
          <div className={`px-3 py-1.5 rounded-lg border ${health.bg} ${health.border}`}>
            <span className={`text-sm font-medium ${health.color}`}>{health.label}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800">
          <p className="text-xs text-gray-500 mb-1">Total Cost</p>
          <p className="text-xl font-bold text-white">${recipeCost.toFixed(2)}</p>
        </div>
        <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800">
          <p className="text-xs text-gray-500 mb-1">Selling Price</p>
          <p className="text-xl font-bold text-white">${sellingPrice.toFixed(2)}</p>
        </div>
        <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800">
          <p className="text-xs text-gray-500 mb-1">Food Cost %</p>
          <p className={`text-xl font-bold ${health.color}`}>{foodCostPct.toFixed(1)}%</p>
        </div>
        <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800">
          <p className="text-xs text-gray-500 mb-1">Profit Margin</p>
          <p className="text-xl font-bold text-white">${profitMargin.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-white">Ingredients</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Item</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Qty</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Unit Cost</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {(recipe.ingredients || []).length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">No ingredients</td>
              </tr>
            ) : (
              recipe.ingredients.map((ing, idx) => {
                const subtotal = (Number(ing.qty) || 0) * (Number(ing.unitCost) || 0)
                return (
                  <tr key={idx} className="border-b border-gray-800/50">
                    <td className="px-4 py-3 text-gray-300">{ing.itemName || 'Unknown'}</td>
                    <td className="px-4 py-3 text-gray-300">{ing.qty}</td>
                    <td className="px-4 py-3 text-gray-300">${(Number(ing.unitCost) || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-300">${subtotal.toFixed(2)}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Suggested Prices</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: '28% Food Cost', price: suggestedPrice28, bar: '28%' },
            { label: '30% Food Cost', price: suggestedPrice30, bar: '30%' },
            { label: '35% Food Cost', price: suggestedPrice35, bar: '35%' },
          ].map((item) => (
            <div key={item.label} className="p-4 bg-gray-800/50 rounded-xl text-center">
              <p className="text-xs text-gray-500 mb-2">{item.label}</p>
              <p className="text-xl font-bold text-amber-400">${item.price.toFixed(2)}</p>
              <div className="w-full h-1.5 bg-gray-800 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: item.bar }} />
              </div>
              <p className="text-xs text-gray-500 mt-2">Margin: ${(item.price - recipeCost).toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Food Cost Health</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${health.barColor}`} style={{ width: `${Math.min(foodCostPct, 100)}%` }} />
          </div>
          <span className={`text-sm font-medium ${health.color}`}>{foodCostPct.toFixed(1)}%</span>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>0%</span>
          <span className="text-green-400">28%</span>
          <span className="text-yellow-400">35%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  )
}

export default RecipeDetail
