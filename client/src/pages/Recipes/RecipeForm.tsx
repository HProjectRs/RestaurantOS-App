import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Input, Textarea } from '../../components/forms/FormField'
import FormSelect from '../../components/forms/FormSelect'
import { inventoryService } from '../../services/inventoryService'

const categoryOptions = [
  { value: 'appetizer', label: 'Appetizer' },
  { value: 'main', label: 'Main Course' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'beverage', label: 'Beverage' },
  { value: 'sauce', label: 'Sauce' },
  { value: 'other', label: 'Other' },
]

const RecipeForm = ({ recipe, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: recipe?.name || '',
    category: recipe?.category || '',
    sellingPrice: recipe?.sellingPrice || '',
    emoji: recipe?.emoji || '🍽️',
    description: recipe?.description || '',
    ingredients: recipe?.ingredients?.map((i) => ({ ...i })) || [{ itemId: '', qty: '', unitCost: 0 }],
  })
  const [inventoryItems, setInventoryItems] = useState([])

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res: any = await inventoryService.getItems({})
        setInventoryItems(res?.data || res || [])
      } catch (err) {
        console.error('Failed to load inventory items', err)
      }
    }
    fetchItems()
  }, [])

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleIngredientChange = (index, field) => (e) => {
    const val = e.target.value
    setForm((prev) => {
      const ingredients = [...prev.ingredients]
      ingredients[index] = { ...ingredients[index], [field]: val }
      if (field === 'itemId') {
        const item = inventoryItems.find((i) => i.id === val)
        ingredients[index].unitCost = item?.price || 0
        ingredients[index].itemName = item?.name || ''
      }
      return { ...prev, ingredients }
    })
  }

  const addIngredient = () => {
    setForm((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { itemId: '', qty: '', unitCost: 0 }],
    }))
  }

  const removeIngredient = (index) => {
    setForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }))
  }

  const totalCost = form.ingredients.reduce((sum, ing) => {
    return sum + (Number(ing.qty) || 0) * (Number(ing.unitCost) || 0)
  }, 0)

  const sellingPrice = Number(form.sellingPrice) || 0
  const foodCostPct = sellingPrice > 0 ? (totalCost / sellingPrice) * 100 : 0
  const suggestedPrice28 = totalCost / 0.28
  const suggestedPrice30 = totalCost / 0.30
  const suggestedPrice35 = totalCost / 0.35

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name || !form.category || !form.sellingPrice) {
      alert('Please fill in all required fields.')
      return
    }
    onSave({
      ...form,
      sellingPrice: Number(form.sellingPrice),
      recipeCost: totalCost,
      foodCostPct,
      ingredients: form.ingredients.map((ing) => ({
        ...ing,
        qty: Number(ing.qty),
        unitCost: Number(ing.unitCost),
      })),
    })
  }

  const itemOptions = inventoryItems.map((i) => ({ value: i.id, label: `${i.name} ($${i.price?.toFixed(2) || '0.00'})` }))

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 bg-black/60 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-2xl mx-4 mb-12 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">{recipe ? 'Edit Recipe' : 'New Recipe'}</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Recipe Name" value={form.name} onChange={handleChange('name')} required />
            <FormSelect label="Category" options={categoryOptions} value={form.category} onChange={(v) => setForm((p) => ({ ...p, category: v }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Selling Price" type="number" min="0" step="0.01" value={form.sellingPrice} onChange={handleChange('sellingPrice')} required />
            <Input label="Emoji" value={form.emoji} onChange={handleChange('emoji')} placeholder="🍽️" />
          </div>
          <Textarea label="Description" value={form.description} onChange={handleChange('description')} />

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-300">Ingredients</h3>
              <button type="button" onClick={addIngredient} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Ingredient
              </button>
            </div>
            <div className="space-y-2">
              {form.ingredients.map((ing, idx) => (
                <div key={idx} className="flex items-end gap-2 p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex-1">
                    <FormSelect
                      label="Item"
                      options={itemOptions}
                      value={ing.itemId}
                      onChange={(v) => {
                        const e = { target: { value: v } }
                        handleIngredientChange(idx, 'itemId')(e)
                      }}
                      searchable
                    />
                  </div>
                  <Input label="Qty" type="number" min="0" step="0.01" value={ing.qty} onChange={handleIngredientChange(idx, 'qty')} className="w-24" />
                  <div className="pb-1.5 text-xs text-gray-400 w-16 pt-6">${(Number(ing.unitCost) || 0).toFixed(2)}/u</div>
                  <button type="button" onClick={() => removeIngredient(idx)} className="p-2 text-gray-500 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-gray-800/50 rounded-xl space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total Recipe Cost</span>
              <span className="text-white font-semibold">${totalCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Food Cost %</span>
              <span className={`font-semibold ${foodCostPct <= 28 ? 'text-green-400' : foodCostPct <= 30 ? 'text-blue-400' : foodCostPct <= 35 ? 'text-yellow-400' : 'text-red-400'}`}>
                {foodCostPct.toFixed(1)}%
              </span>
            </div>
            {totalCost > 0 && (
              <div className="pt-2 border-t border-gray-700">
                <p className="text-xs text-gray-500 mb-1.5">Suggested Prices:</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 bg-gray-900/60 rounded-lg text-center">
                    <span className="text-gray-400">28%</span>
                    <p className="text-amber-400 font-medium">${suggestedPrice28.toFixed(2)}</p>
                  </div>
                  <div className="p-2 bg-gray-900/60 rounded-lg text-center">
                    <span className="text-gray-400">30%</span>
                    <p className="text-amber-400 font-medium">${suggestedPrice30.toFixed(2)}</p>
                  </div>
                  <div className="p-2 bg-gray-900/60 rounded-lg text-center">
                    <span className="text-gray-400">35%</span>
                    <p className="text-amber-400 font-medium">${suggestedPrice35.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-black text-sm font-medium rounded-lg transition-colors">
              {recipe ? 'Update Recipe' : 'Create Recipe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RecipeForm
