import { useQuery } from '@tanstack/react-query'
import { listLabNotifications, labNotificationsSupported } from '../../api/notifications'

export function useNotifications() {
  return useQuery({
    queryKey: ['lab-notifications'],
    queryFn: listLabNotifications,
    enabled: labNotificationsSupported,
  })
}
