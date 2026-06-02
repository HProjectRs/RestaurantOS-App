import { useState } from 'react'
import { DollarSign, PackageCheck } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import PriceComparisonPage from './PriceComparisonPage'
import ReceivingPage from './ReceivingPage'

const tabs = [
  { key: 'priceComparison', label: 'Price Comparison', icon: DollarSign },
  { key: 'receiving', label: 'Receiving', icon: PackageCheck },
]

const SuppliersIndex = () => {
  const [activeTab, setActiveTab] = useState('priceComparison')

  const renderTab = () => {
    switch (activeTab) {
      case 'priceComparison': return <PriceComparisonPage />
      case 'receiving': return <ReceivingPage />
      default: return <PriceComparisonPage />
    }
  }

  return (
    <PageWrapper title="Supplier Management">
      <div className="flex gap-1 p-1 bg-gray-900/80 border border-gray-800 rounded-xl w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === key
                ? 'bg-amber-500/20 text-amber-400 shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>
      <div className="mt-6">{renderTab()}</div>
    </PageWrapper>
  )
}

export default SuppliersIndex