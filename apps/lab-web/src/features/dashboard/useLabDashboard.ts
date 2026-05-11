import { useQuery } from '@tanstack/react-query'
import { getLabDashboardSummary } from '../../api/dashboard'

export function useLabDashboard() {
  return useQuery({
    queryKey: ['lab-dashboard'],
    queryFn: getLabDashboardSummary,
  })
}
