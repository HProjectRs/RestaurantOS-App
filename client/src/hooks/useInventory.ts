import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../constants/queryKeys';
import api from '../services/base/httpClient';

export function useInventory(filters = {}) {
  const queryClient = useQueryClient();

  const inventoryQuery = useQuery({
    queryKey: queryKeys.inventory.list(filters),
    queryFn: () => api.get('/inventory', { params: filters }).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/inventory', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => api.put(`/inventory/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/inventory/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all }),
  });

  return {
    items: inventoryQuery.data ?? [],
    isLoading: inventoryQuery.isLoading,
    error: inventoryQuery.error,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
    refetch: inventoryQuery.refetch,
  };
}
