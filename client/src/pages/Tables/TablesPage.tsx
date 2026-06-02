import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import httpClient from '../../services/base/httpClient'
import TableCard from './TableCard'

export default function TablesPage() {
  const queryClient = useQueryClient()
  const { data: tables } = useQuery({ queryKey: ['tables'], queryFn: () => httpClient.get('/tables').then(r => r.data) })
  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => httpClient.patch(`/tables/${id}`, { status }).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tables'] }),
  })
  const statusCycle = { empty: 'occupied', occupied: 'reserved', reserved: 'empty' }
  return (
    <div>
      <div className="flex items-center gap-4 mb-4 text-sm">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500" />فارغ</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500" />مشغول</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500" />محجوز</span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
        {tables?.map(table => <TableCard key={table.id} table={table} onClick={() => updateMutation.mutate({ id: table.id, status: statusCycle[table.status] })} />)}
      </div>
    </div>
  )
}
