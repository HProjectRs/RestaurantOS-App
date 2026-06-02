import { useQuery } from '@tanstack/react-query'
import api from '../../services/base/httpClient'

const CategoryTabs = ({ active, onChange }) => {
  const { data: categories = [] } = useQuery({
    queryKey: ['menu-categories'],
    queryFn: () => api.get('/pos/categories').then((r) => r.data),
    staleTime: 10 * 60 * 1000,
  })

  const tabs = [
    { id: 'all', label: 'الكل' },
    ...categories.map((cat) => ({
      id: cat.id,
      label: cat.name,
    })),
  ]

  return (
    <div className="flex gap-2 px-4 py-3 bg-gray-900/40 border-b border-gray-800 overflow-x-auto scrollbar-none">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
            active === tab.id
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white hover:border-gray-600'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export default CategoryTabs
