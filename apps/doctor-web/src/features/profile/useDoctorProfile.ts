import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getDoctorMe } from '../../api/doctorAuth'
import { getDoctorProfile, updateDoctorProfile } from '../../api/doctorProfile'
import type { UpdateDoctorProfilePayload } from '../../types/models'

export function useDoctorMe() {
  return useQuery({
    queryKey: ['doctor-me'],
    queryFn: getDoctorMe,
  })
}

export function useDoctorProfile() {
  return useQuery({
    queryKey: ['doctor-profile'],
    queryFn: getDoctorProfile,
  })
}

export function useUpdateDoctorProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateDoctorProfilePayload) => updateDoctorProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-profile'] })
      queryClient.invalidateQueries({ queryKey: ['doctor-me'] })
    },
  })
}
