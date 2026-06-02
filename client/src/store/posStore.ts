import { create } from 'zustand'

interface OrderItem {
  id: string
  name: string
  price: number
  qty: number
  modifiers?: string[]
}

interface CustomerInfo {
  name: string
}

interface Order {
  items: OrderItem[]
  customer: CustomerInfo | null
  table: string | null
  notes: string
  discount: number
}

interface HeldOrder extends Order {
  id: number
  heldAt: string
}

interface POSState {
  currentOrder: Order
  heldOrders: HeldOrder[]
  paymentMethod: string | null
  addItem: (item: OrderItem) => void
  removeItem: (index: number) => void
  updateQty: (index: number, qty: number) => void
  setCustomer: (customer: CustomerInfo | null) => void
  setTable: (table: string | null) => void
  setNotes: (notes: string) => void
  setPaymentMethod: (pm: string | null) => void
  holdOrder: () => void
  resumeOrder: (id: number) => void
  clearOrder: () => void
}

const initialOrder: Order = { items: [], customer: null, table: null, notes: '', discount: 0 }

export const usePOSStore = create<POSState>()((set, get) => ({
  currentOrder: { ...initialOrder },
  heldOrders: [],
  paymentMethod: null,

  addItem: (item) =>
    set((state) => {
      const existing = state.currentOrder.items.find(
        (i) => i.id === item.id && i.modifiers?.join() === item.modifiers?.join(),
      )
      if (existing) {
        return {
          currentOrder: {
            ...state.currentOrder,
            items: state.currentOrder.items.map((i) =>
              i.id === item.id && i.modifiers?.join() === item.modifiers?.join() ? { ...i, qty: i.qty + 1 } : i,
            ),
          },
        }
      }
      return { currentOrder: { ...state.currentOrder, items: [...state.currentOrder.items, { ...item, qty: 1 }] } }
    }),

  removeItem: (index) =>
    set((state) => ({
      currentOrder: { ...state.currentOrder, items: state.currentOrder.items.filter((_, i) => i !== index) },
    })),

  updateQty: (index, qty) =>
    set((state) => ({
      currentOrder: {
        ...state.currentOrder,
        items:
          qty <= 0
            ? state.currentOrder.items.filter((_, i) => i !== index)
            : state.currentOrder.items.map((item, i) => (i === index ? { ...item, qty } : item)),
      },
    })),

  setCustomer: (customer) => set((state) => ({ currentOrder: { ...state.currentOrder, customer } })),
  setTable: (table) => set((state) => ({ currentOrder: { ...state.currentOrder, table } })),
  setNotes: (notes) => set((state) => ({ currentOrder: { ...state.currentOrder, notes } })),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),

  holdOrder: () =>
    set((state) => {
      if (!state.currentOrder.items.length) return state
      const held: HeldOrder = { ...state.currentOrder, id: Date.now(), heldAt: new Date().toISOString() }
      return { heldOrders: [...state.heldOrders, held], currentOrder: { ...initialOrder } }
    }),

  resumeOrder: (id) =>
    set((state) => {
      const order = state.heldOrders.find((o) => o.id === id)
      if (!order) return state
      return { currentOrder: { ...order }, heldOrders: state.heldOrders.filter((o) => o.id !== id) }
    }),

  clearOrder: () => set({ currentOrder: { ...initialOrder }, paymentMethod: null }),
}))
