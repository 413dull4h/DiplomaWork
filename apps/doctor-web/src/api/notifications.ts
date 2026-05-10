import { apiClient } from './client'

export type NotificationStatus = 'UNREAD' | 'READ'

export type DoctorNotification = {
  id: string
  recipientUserId: string
  type: string
  title: string
  body: string
  status: NotificationStatus
  channel: string
  entityType?: string | null
  entityId?: string | null
  metadata?: {
    threadId?: string
    appointmentId?: string
    patientId?: string
    hospitalId?: string
    doctorId?: string
    hospitalDoctorId?: string
    messageId?: string
    senderRole?: string
    [key: string]: unknown
  } | null
  readAt?: string | null
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export const doctorNotificationsApi = {
  async list() {
    const response = await apiClient.get<{
      notifications: DoctorNotification[]
    }>('/hospital/doctor/notifications')

    return response.data.notifications
  },

  async unreadCount() {
    const response = await apiClient.get<{
      unreadCount: number
    }>('/hospital/doctor/notifications/unread-count')

    return response.data.unreadCount
  },

  async markRead(notificationId: string) {
    const response = await apiClient.patch<{
      message: string
      notification: DoctorNotification
    }>(`/hospital/doctor/notifications/${notificationId}/read`)

    return response.data.notification
  },

  async markAllRead() {
    const response = await apiClient.patch<{
      message: string
      updated: number
    }>('/hospital/doctor/notifications/read-all')

    return response.data
  },
}