import { useQuery } from '@tanstack/react-query'
import { usePOS } from '../../hooks/usePOS'
import { Skeleton } from '../../components/ui/Skeleton'
import api from '../../services/base/httpClient'

const emojis = ['🍔', '🥗', '🍕', '🥩', '🍝', '🥤', '🍰', '🍣', '🌮', '🥪', '🍜', '🥟']

const MenuGrid = ({ category }) => {
  const { addItem } = usePOS()

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['menu-items', category],
    queryFn: () =>
      api
        .get('/pos/menu', { params: category !== 'all' ? { category } : {} })
        .then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {Array.from({ length: 10 }, (_, i) => (
          <Skeleton key={i} height={130} rounded="xl" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        لا توجد أصناف في هذه الفئة
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {items.map((item, i) => (
        <button
          key={item.id}
          onClick={() => addItem(item)}
          className="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-900/60 border border-gray-800 hover:border-amber-500/50 hover:bg-gray-800/60 transition-all active:scale-95"
        >
          <span className="text-3xl mb-2">{item.emoji || emojis[i % emojis.length]}</span>
          <span className="text-sm font-medium text-white text-center leading-tight">
            {item.name}
          </span>
          <span className="text-xs text-amber-400 mt-1">
            {item.price?.toLocaleString()} د.ج
          </span>
        </button>
      ))}
    </div>
  )
}

export default MenuGrid
