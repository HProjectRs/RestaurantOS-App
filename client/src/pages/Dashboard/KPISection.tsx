import { StatCard } from '../../components/data/StatCard'
import KPICard from '../../components/data/KPICard'
import { DollarSign, ShoppingCart, Users, TrendingUp, Clock, Percent } from 'lucide-react'

const KPISection = ({ data }) => {
  if (!data) return null

  const cards: { label: string; value: any; icon: any; variant: 'primary' | 'success' | 'warning' | 'danger' | 'info'; trend?: any; trendValue?: any }[] = [
    {
      label: 'الإيرادات',
      value: `${data.revenue?.toLocaleString() ?? 0} د.ج`,
      icon: DollarSign,
      variant: 'success',
      trend: data.revenueTrend,
      trendValue: data.revenueTrendValue,
    },
    {
      label: 'طلبات اليوم',
      value: data.ordersToday ?? 0,
      icon: ShoppingCart,
      variant: 'primary',
      trend: data.ordersTrend,
      trendValue: data.ordersTrendValue,
    },
    {
      label: 'متوسط الطلب',
      value: `${data.avgOrder?.toLocaleString() ?? 0} د.ج`,
      icon: TrendingUp,
      variant: 'info',
    },
  ]

  const kpiCards = [
    {
      label: 'تكلفة الطعام',
      value: `${data.foodCostPercent ?? 0}%`,
      percentage: data.foodCostPercent ?? 0,
      progressColor: data.foodCostPercent > 30 ? 'bg-red-500' : 'bg-green-500',
      comparisonText: data.foodCostPercent > 30 ? 'مرتفع' : 'جيد',
    },
    {
      label: 'تكلفة العمالة',
      value: `${data.laborCostPercent ?? 0}%`,
      percentage: data.laborCostPercent ?? 0,
      progressColor: data.laborCostPercent > 25 ? 'bg-red-500' : 'bg-green-500',
      comparisonText: data.laborCostPercent > 25 ? 'مرتفع' : 'جيد',
    },
    {
      label: 'الربح',
      value: `${data.profit?.toLocaleString() ?? 0} د.ج`,
      percentage: data.profitPercent ?? 0,
      progressColor: 'bg-amber-500',
      comparisonText: data.profitPercent > 0 ? 'مربح' : 'خسارة',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <StatCard key={i} {...card} />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiCards.map((card, i) => (
          <KPICard key={i} {...card} />
        ))}
      </div>
    </div>
  )
}

export default KPISection
