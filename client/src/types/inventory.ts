export interface InventoryItem {
  id: string
  name: string
  category: string
  unit: string
  qty: number
  minStock?: number
  price: number
  supplier?: string
  expiryDate?: string
}

export interface StockTransaction {
  id: string
  itemId: string
  type: 'in' | 'out' | 'adjust'
  qty: number
  reference?: string
  note?: string
  createdAt: string
}

export const TransactionTypes = {
  IN: 'in',
  OUT: 'out',
  ADJUST: 'adjust',
}
