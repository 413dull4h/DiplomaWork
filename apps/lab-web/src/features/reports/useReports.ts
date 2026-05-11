import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getLabReport, listLabReports, listOrderReports, uploadLabReport, type ReportUploadPayload } from '../../api/reports'

export function useReports() {
  return useQuery({ queryKey: ['lab-reports'], queryFn: listLabReports })
}

export function useReport(id?: string) {
  return useQuery({
    queryKey: ['lab-reports', id],
    queryFn: () => getLabReport(id!),
    enabled: Boolean(id),
  })
}

export function useOrderReports(orderId?: string) {
  return useQuery({
    queryKey: ['lab-orders', orderId, 'reports'],
    queryFn: () => listOrderReports(orderId!),
    enabled: Boolean(orderId),
  })
}

export function useUploadReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ReportUploadPayload) => uploadLabReport(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lab-orders'] })
      queryClient.invalidateQueries({ queryKey: ['lab-orders', variables.orderId] })
      queryClient.invalidateQueries({ queryKey: ['lab-orders', variables.orderId, 'reports'] })
      queryClient.invalidateQueries({ queryKey: ['lab-reports'] })
      queryClient.invalidateQueries({ queryKey: ['lab-dashboard'] })
    },
  })
}
