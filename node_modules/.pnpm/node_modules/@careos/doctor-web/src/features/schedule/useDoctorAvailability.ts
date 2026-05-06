import { useQuery } from '@tanstack/react-query'
import { getDoctorAvailability } from '../../api/doctorProfile'

export function useDoctorAvailability() {
  return useQuery({
    queryKey: ['doctor-availability'],
    queryFn: getDoctorAvailability,
    retry: false,
  })
}
