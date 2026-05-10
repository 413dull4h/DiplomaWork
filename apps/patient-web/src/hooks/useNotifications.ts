import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getPatientNotifications,
  getPatientUnreadNotificationCount,
  markAllPatientNotificationsRead,
  markPatientNotificationRead,
  type NotificationStatus,
} from '../api/notifications'

export function usePatientNotifications(status?: NotificationStatus) {
  return useQuery({
    queryKey: ['patient-notifications', status],
    queryFn: () => getPatientNotifications(status),
  })
}

export function usePatientUnreadNotificationCount() {
  return useQuery({
    queryKey: ['patient-notifications-unread-count'],
    queryFn: getPatientUnreadNotificationCount,
    refetchInterval: 30000,
  })
}

export function useMarkPatientNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markPatientNotificationRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['patient-notifications'],
      })
      await queryClient.invalidateQueries({
        queryKey: ['patient-notifications-unread-count'],
      })
    },
  })
}

export function useMarkAllPatientNotificationsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markAllPatientNotificationsRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['patient-notifications'],
      })
      await queryClient.invalidateQueries({
        queryKey: ['patient-notifications-unread-count'],
      })
    },
  })
}