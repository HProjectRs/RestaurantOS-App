import CostSimulator from './CostSimulator'
import RecipeForm from './RecipeForm'
import RecipeDetail from './RecipeDetail'
import { useState } from 'react'
import { ChefHat, Calculator, Plus, ArrowLeft } from 'lucide-react'
import { Button } from '../../components/ui/Button'

const RecipesIndex = () => {
  const [view, setView] = useState<'list' | 'form' | 'detail'>('list')
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)

  if (view === 'detail' && selectedRecipe) {
    return <RecipeDetail recipe={selectedRecipe} onBack={() => { setView('list'); setSelectedRecipe(null) }} />
  }

  if (showForm) {
    return <RecipeForm recipe={null} onClose={() => setShowForm(false)} onSave={() => {}} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Recipe Management</h1>
        <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> New Recipe</Button>
      </div>
      <div className="flex gap-1 p-1 bg-gray-900/80 border border-gray-800 rounded-xl w-fit">
        {[
          { key: 'costSimulator', label: 'Cost Simulator', icon: Calculator },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-amber-500/20 text-amber-400 shadow-sm">
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>
      <CostSimulator />
    </div>
  )
}

export default RecipesIndex