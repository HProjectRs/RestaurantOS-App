import { useState, useMemo, ReactNode } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, Search } from 'lucide-react'
import { Skeleton } from '../ui/Skeleton'

export interface Column<T> {
  accessor?: keyof T; label: string; render?: (row: T) => ReactNode
  sortable?: boolean; width?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]; data: T[]; loading?: boolean; searchable?: boolean
  pageSize?: number; onRowClick?: (row: T) => void
}

export function DataTable<T extends Record<string, any>>({ columns, data, loading, searchable = true, pageSize = 10, onRowClick }: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<keyof T | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    let items = data
    if (search) {
      const q = search.toLowerCase()
      items = items.filter(row => columns.some(col => String(row[col.accessor as string] || '').toLowerCase().includes(q)))
    }
    if (sortKey) {
      items = [...items].sort((a, b) => {
        const aVal = a[sortKey] ?? ''; const bVal = b[sortKey] ?? ''
        const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true })
        return sortDir === 'asc' ? cmp : -cmp
      })
    }
    return items
  }, [data, search, sortKey, sortDir, columns])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize)

  const toggleSort = (key: keyof T) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
    setPage(0)
  }

  return (
    <div className="space-y-3">
      {searchable && (
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} placeholder="بحث..."
            className="w-full pr-10 pl-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-900/80 border-b border-gray-800">
              {columns.map(col => (
                <th key={col.label} className={`px-4 py-3 text-right font-medium text-gray-400 ${col.sortable !== false ? 'cursor-pointer select-none hover:text-white' : ''}`}
                  style={{ width: col.width }}
                  onClick={() => col.sortable !== false && col.accessor && toggleSort(col.accessor)}>
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.accessor && sortKey === col.accessor ? (
                      sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                    ) : col.accessor && <ChevronsUpDown className="w-3.5 h-3.5 text-gray-600" />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length} className="p-4"><Skeleton count={5} className="h-8 mb-2" /></td></tr>
            ) : paged.length === 0 ? (
              <tr><td colSpan={columns.length} className="p-8 text-center text-gray-500">لا توجد بيانات</td></tr>
            ) : paged.map((row, i) => (
              <tr key={row.id || i} onClick={() => onRowClick?.(row)}
                className={`border-b border-gray-800/50 last:border-0 hover:bg-gray-800/40 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}>
                {columns.map(col => (
                  <td key={col.label} className="px-4 py-3 text-gray-300">
                    {col.render?.(row) ?? (col.accessor ? row[col.accessor] : null) ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>{filtered.length} إجمالي</span>
          <div className="flex gap-1">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 rounded bg-gray-800 disabled:opacity-30 hover:bg-gray-700">السابق</button>
            <span className="px-3 py-1">{page + 1} / {totalPages}</span>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 rounded bg-gray-800 disabled:opacity-30 hover:bg-gray-700">التالي</button>
          </div>
        </div>
      )}
    </div>
  )
}
