import { useQuery } from '@tanstack/react-query'
import {
  getPatientLabOrder,
  getPatientLabOrders,
  getPatientLabReport,
  getPatientLabReports,
} from '../api/labs'

export function usePatientLabOrders() {
  return useQuery({
    queryKey: ['patient-lab-orders'],
    queryFn: getPatientLabOrders,
  })
}

export function usePatientLabOrder(id?: string) {
  return useQuery({
    queryKey: ['patient-lab-order', id],
    queryFn: () => getPatientLabOrder(id!),
    enabled: Boolean(id),
  })
}

export function usePatientLabReports() {
  return useQuery({
    queryKey: ['patient-lab-reports'],
    queryFn: getPatientLabReports,
  })
}

export function usePatientLabReport(id?: string) {
  return useQuery({
    queryKey: ['patient-lab-report', id],
    queryFn: () => getPatientLabReport(id!),
    enabled: Boolean(id),
  })
}