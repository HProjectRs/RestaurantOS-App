import { create } from 'zustand'

interface CartItem {
  id: string
  name: string
  price: number
  qty: number
  modifiers?: string[]
}

interface CartState {
  items: CartItem[]
  customer: string
  table: string | null
  notes: string
  addItem: (item: Omit<CartItem, 'qty'>) => void
  removeItem: (id: string) => void
  updateQty: (id: string, qty: number) => void
  clearCart: () => void
  setCustomer: (customer: string) => void
  setTable: (table: string | null) => void
  setNotes: (notes: string) => void
}

export const useCartStore = create<CartState>()((set) => ({
  items: [],
  customer: '',
  table: null,
  notes: '',
  addItem: (item) =>
    set((state) => {
      const key = (i: CartItem) => `${i.id}-${i.modifiers?.join() || ''}`
      const existing = state.items.find((i) => key(i) === key(item as CartItem))
      if (existing) {
        return { items: state.items.map((i) => (key(i) === key(existing) ? { ...i, qty: i.qty + 1 } : i)) }
      }
      return { items: [...state.items, { ...item, qty: 1 }] }
    }),
  removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
  updateQty: (id, qty) =>
    set((state) => ({
      items: qty <= 0 ? state.items.filter((i) => i.id !== id) : state.items.map((i) => (i.id === id ? { ...i, qty } : i)),
    })),
  clearCart: () => set({ items: [], customer: '', table: null, notes: '' }),
  setCustomer: (customer) => set({ customer }),
  setTable: (table) => set({ table }),
  setNotes: (notes) => set({ notes }),
}))
