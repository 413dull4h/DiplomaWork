import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getHospitalNotifications,
  getHospitalUnreadNotificationCount,
  markAllHospitalNotificationsRead,
  markHospitalNotificationRead,
  type NotificationStatus,
} from '../api/notifications'

export function useHospitalNotifications(status?: NotificationStatus) {
  return useQuery({
    queryKey: ['hospital-notifications', status],
    queryFn: () => getHospitalNotifications(status),
  })
}

export function useHospitalUnreadNotificationCount() {
  return useQuery({
    queryKey: ['hospital-notifications-unread-count'],
    queryFn: getHospitalUnreadNotificationCount,
    refetchInterval: 30000,
  })
}

export function useMarkHospitalNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markHospitalNotificationRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['hospital-notifications'],
      })
      await queryClient.invalidateQueries({
        queryKey: ['hospital-notifications-unread-count'],
      })
    },
  })
}

export function useMarkAllHospitalNotificationsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markAllHospitalNotificationsRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['hospital-notifications'],
      })
      await queryClient.invalidateQueries({
        queryKey: ['hospital-notifications-unread-count'],
      })
    },
  })
}