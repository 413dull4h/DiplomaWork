import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { doctorNotificationsApi } from '../api/notifications'

export function useDoctorNotifications() {
  return useQuery({
    queryKey: ['doctor-notifications'],
    queryFn: doctorNotificationsApi.list,
    refetchInterval: 10000,
  })
}

export function useDoctorNotificationUnreadCount() {
  return useQuery({
    queryKey: ['doctor-notification-unread-count'],
    queryFn: doctorNotificationsApi.unreadCount,
    refetchInterval: 10000,
  })
}

export function useMarkDoctorNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) =>
      doctorNotificationsApi.markRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['doctor-notifications'],
      })

      queryClient.invalidateQueries({
        queryKey: ['doctor-notification-unread-count'],
      })
    },
  })
}

export function useMarkAllDoctorNotificationsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: doctorNotificationsApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['doctor-notifications'],
      })

      queryClient.invalidateQueries({
        queryKey: ['doctor-notification-unread-count'],
      })
    },
  })
}