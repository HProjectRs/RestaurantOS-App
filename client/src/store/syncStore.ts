import { create } from 'zustand'

interface SyncFailure {
  id: number
  operation: string
  error: string
  createdAt: string
}

interface SyncState {
  isOnline: boolean
  pendingCount: number
  failures: SyncFailure[]
  setOnline: (online: boolean) => void
  addFailure: (failure: SyncFailure) => void
  removeFailure: (id: number) => void
  clearFailures: () => void
  setPendingCount: (count: number) => void
}

export const useSyncStore = create<SyncState>((set) => ({
  isOnline: navigator.onLine,
  pendingCount: 0,
  failures: [],
  setOnline: (online) => set({ isOnline: online }),
  addFailure: (failure) =>
    set((state) => ({ failures: [...state.failures.slice(-9), failure] })),
  removeFailure: (id) =>
    set((state) => ({ failures: state.failures.filter((f) => f.id !== id) })),
  clearFailures: () => set({ failures: [] }),
  setPendingCount: (count) => set({ pendingCount: count }),
}))
