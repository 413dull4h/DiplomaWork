import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  approveHospital,
  createHospital,
  createHospitalAdmin,
  getHospital,
  getHospitals,
  rejectHospital,
  suspendHospital,
} from '@/api/hospitals'
import type { CreateHospitalAdminInput, CreateHospitalInput } from '@/types/models'

export function useHospitals() {
  return useQuery({ queryKey: ['hospitals'], queryFn: getHospitals })
}

export function useHospital(id?: string) {
  return useQuery({
    queryKey: ['hospital', id],
    queryFn: () => getHospital(id!),
    enabled: Boolean(id),
  })
}

export function useCreateHospital() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateHospitalInput) => createHospital(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hospitals'] }),
  })
}

function useHospitalStatusMutation(action: (id: string) => Promise<unknown>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: action,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['hospitals'] })
      queryClient.invalidateQueries({ queryKey: ['hospital', id] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
    },
  })
}

export function useApproveHospital() { return useHospitalStatusMutation(approveHospital) }
export function useSuspendHospital() { return useHospitalStatusMutation(suspendHospital) }
export function useRejectHospital() { return useHospitalStatusMutation(rejectHospital) }

export function useCreateHospitalAdmin(hospitalId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateHospitalAdminInput) => createHospitalAdmin(hospitalId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospital', hospitalId] })
      queryClient.invalidateQueries({ queryKey: ['hospitals'] })
    },
  })
}
