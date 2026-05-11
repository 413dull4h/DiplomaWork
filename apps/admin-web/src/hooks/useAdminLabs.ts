import { useQuery } from '@tanstack/react-query'
import {
  getAdminLabOrder,
  getAdminLabOrders,
  getAdminLabReport,
  getAdminLabReports,
} from '../api/labs'

export function useAdminLabOrders() {
  return useQuery({
    queryKey: ['admin-lab-orders'],
    queryFn: getAdminLabOrders,
  })
}

export function useAdminLabOrder(id?: string) {
  return useQuery({
    queryKey: ['admin-lab-order', id],
    queryFn: () => getAdminLabOrder(id!),
    enabled: Boolean(id),
  })
}

export function useAdminLabReports() {
  return useQuery({
    queryKey: ['admin-lab-reports'],
    queryFn: getAdminLabReports,
  })
}

export function useAdminLabReport(id?: string) {
  return useQuery({
    queryKey: ['admin-lab-report', id],
    queryFn: () => getAdminLabReport(id!),
    enabled: Boolean(id),
  })
}
