export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  ordersCount: number
  totalSpent: number
  points?: number
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum'
  lastOrder?: string
  createdAt: string
}

export interface LoyaltyTransaction {
  id: string
  customerId: string
  type: 'earn' | 'redeem'
  points: number
  reference?: string
  createdAt: string
}

export const CustomerTiers = {
  BRONZE: 'bronze',
  SILVER: 'silver',
  GOLD: 'gold',
  PLATINUM: 'platinum',
}
