export interface JournalLine {
  accountId: string
  debit: number
  credit: number
}

export interface JournalEntry {
  id: string
  date: string
  reference: string
  description: string
  entries: JournalLine[]
  createdAt: string
}

export interface Account {
  id: string
  code: string
  name: string
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  balance: number
}

export interface PLRatios {
  grossMargin: number
  netMargin: number
  operatingExpenseRatio: number
}

export interface PLStatement {
  revenue: number
  cogs: number
  grossProfit: number
  expenses: number
  netProfit: number
  ratios: PLRatios
}

export const AccountTypes = {
  ASSET: 'asset',
  LIABILITY: 'liability',
  EQUITY: 'equity',
  REVENUE: 'revenue',
  EXPENSE: 'expense',
}
