import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  acceptLabOrder,
  completeLabOrder,
  getLabOrder,
  listLabOrders,
  markInProgress,
  markSampleCollected,
  rejectLabOrder,
} from '../../api/orders'

export function useOrders() {
  return useQuery({ queryKey: ['lab-orders'], queryFn: () => listLabOrders() })
}

export function useOrder(id?: string) {
  return useQuery({
    queryKey: ['lab-orders', id],
    queryFn: () => getLabOrder(id!),
    enabled: Boolean(id),
  })
}

function useOrderAction(mutationFn: (id: string) => Promise<unknown>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['lab-orders'] })
      queryClient.invalidateQueries({ queryKey: ['lab-orders', id] })
      queryClient.invalidateQueries({ queryKey: ['lab-dashboard'] })
    },
  })
}

export function useAcceptOrder() {
  return useOrderAction(acceptLabOrder)
}

export function useSampleCollectedOrder() {
  return useOrderAction(markSampleCollected)
}

export function useInProgressOrder() {
  return useOrderAction(markInProgress)
}

export function useCompleteOrder() {
  return useOrderAction(completeLabOrder)
}

export function useRejectOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, rejectionReason }: { id: string; rejectionReason?: string }) => rejectLabOrder(id, rejectionReason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lab-orders'] })
      queryClient.invalidateQueries({ queryKey: ['lab-orders', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['lab-dashboard'] })
    },
  })
}
