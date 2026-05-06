import { useMutation, useQueryClient } from '@tanstack/react-query'
import { doctorAccountsApi } from '../api/doctorAccounts'
import type { CreateDoctorAccountPayload } from '../types/doctorAccount'

export function useCreateDoctorAccount(hospitalDoctorId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateDoctorAccountPayload) =>
      doctorAccountsApi.createDoctorAccount(hospitalDoctorId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['hospital-doctors'] }),
        queryClient.invalidateQueries({ queryKey: ['hospital-doctor', hospitalDoctorId] }),
        queryClient.invalidateQueries({ queryKey: ['doctors'] }),
        queryClient.invalidateQueries({ queryKey: ['doctor', hospitalDoctorId] }),
      ])
    },
  })
}
