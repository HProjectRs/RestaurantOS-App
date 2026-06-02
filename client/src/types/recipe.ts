export interface Ingredient {
  inventoryId: string
  name: string
  qty: number
  unit: string
  unitPrice: number
  cost: number
}

export interface Recipe {
  id: string
  name: string
  category: string
  sellingPrice: number
  ingredients: Ingredient[]
  totalCost: number
  foodCostPercent: number
  profitMargin: number
  yield?: number
}

export interface CostBreakdown {
  totalCost: number
  foodCostPercent: number
  profitPerUnit: number
  suggestedPrices?: number[]
  health: 'healthy' | 'warning' | 'critical'
}
