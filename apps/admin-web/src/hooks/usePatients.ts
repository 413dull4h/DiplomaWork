import { useQuery } from '@tanstack/react-query'
import { getPatient, getPatients, type PatientsQuery } from '@/api/patients'

export function usePatients(filters: PatientsQuery) {
  return useQuery({
    queryKey: ['admin-patients', filters],
    queryFn: () => getPatients(filters),
  })
}

export function usePatient(id?: string) {
  return useQuery({
    queryKey: ['admin-patient', id],
    queryFn: () => getPatient(id!),
    enabled: Boolean(id),
  })
}
