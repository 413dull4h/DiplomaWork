import { apiClient } from './client'

export type NotificationStatus = 'UNREAD' | 'READ' | 'ARCHIVED'

export type NotificationItem = {
  id: string
  recipientUserId: string
  type: string
  title: string
  body: string
  status: NotificationStatus
  channel: string
  entityType?: string | null
  entityId?: string | null
  metadata?: Record<string, unknown> | null
  readAt?: string | null
  createdAt: string
  updatedAt: string
}

export type NotificationsResponse = {
  notifications: NotificationItem[]
}

export type UnreadCountResponse = {
  count: number
}

export async function getHospitalNotifications(status?: NotificationStatus) {
  const response = await apiClient.get<NotificationsResponse>(
    '/hospital/notifications',
    {
      params: {
        status,
      },
    }
  )

  return response.data.notifications
}

export async function getHospitalUnreadNotificationCount() {
  const response = await apiClient.get<UnreadCountResponse>(
    '/hospital/notifications/unread-count'
  )

  return response.data.count
}

export async function markHospitalNotificationRead(id: string) {
  const response = await apiClient.patch(`/hospital/notifications/${id}/read`)
  return response.data
}

export async function markAllHospitalNotificationsRead() {
  const response = await apiClient.patch('/hospital/notifications/read-all')
  return response.data
}