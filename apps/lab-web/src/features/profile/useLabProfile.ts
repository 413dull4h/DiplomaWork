import { useQuery } from '@tanstack/react-query'
import { getLabProfile } from '../../api/labProfile'

export function useLabProfile() {
  return useQuery({
    queryKey: ['lab-profile'],
    queryFn: getLabProfile,
  })
}
