import { apiClient } from './client'

export type ChatSenderRole =
  | 'PATIENT'
  | 'DOCTOR'
  | 'HOSPITAL_STAFF'
  | 'PLATFORM_ADMIN'
  | 'SYSTEM'

export type ChatMessageStatus = 'SENT' | 'READ' | 'DELETED'

export type ChatMessage = {
  id: string
  threadId: string
  senderUserId: string
  senderRole: ChatSenderRole
  body: string
  status: ChatMessageStatus
  readAt?: string | null
  createdAt: string
  updatedAt: string
  senderUser?: {
    id: string
    email: string
    primaryRole: string
  }
}

export type ChatThread = {
  id: string
  type: string
  appointmentId?: string | null
  patientId: string
  hospitalId: string
  doctorId?: string | null
  hospitalDoctorId?: string | null
  subject?: string | null
  isClosed: boolean
  lastMessageAt?: string | null
  createdAt: string
  updatedAt: string

  patient?: {
    id: string
    fullName: string
    profileImageUrl?: string | null
  }

  hospital?: {
    id: string
    name: string
    logoUrl?: string | null
  }

  doctor?: {
    id: string
    fullName: string
    specialization?: string | null
    profileImageUrl?: string | null
  }

  appointment?: {
    id: string
    status: string
    appointmentType: string
    scheduledStart: string
    scheduledEnd: string
    reason?: string | null
  }

  messages?: ChatMessage[]
}

export const patientChatsApi = {
  async listThreads() {
    const response = await apiClient.get<{ threads: ChatThread[] }>(
      '/patient/chats'
    )

    return response.data.threads
  },

  async unreadCount() {
    const response = await apiClient.get<{ unreadCount: number }>(
      '/patient/chats/unread-count'
    )

    return response.data.unreadCount
  },

  async createAppointmentThread(appointmentId: string) {
    const response = await apiClient.post<{
      message: string
      thread: ChatThread
    }>(`/patient/chats/appointments/${appointmentId}/thread`)

    return response.data.thread
  },

  async getMessages(threadId: string) {
    const response = await apiClient.get<{
      thread: ChatThread
      messages: ChatMessage[]
    }>(`/patient/chats/${threadId}/messages`)

    return response.data
  },

  async sendMessage(threadId: string, body: string) {
    const response = await apiClient.post<{
      message: string
      chatMessage: ChatMessage
    }>(`/patient/chats/${threadId}/messages`, {
      body,
    })

    return response.data.chatMessage
  },

  async markRead(threadId: string) {
    const response = await apiClient.patch<{
      message: string
      updated: number
    }>(`/patient/chats/${threadId}/read`)

    return response.data
  },
}