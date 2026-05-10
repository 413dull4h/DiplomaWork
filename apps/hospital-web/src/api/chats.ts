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
  deletedAt?: string | null
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
  createdByUserId?: string | null
  subject?: string | null
  isClosed: boolean
  lastMessageAt?: string | null
  createdAt: string
  updatedAt: string
  deletedAt?: string | null

  patient?: {
    id: string
    fullName: string
    profileImageUrl?: string | null
    user?: {
      id: string
      email: string
      phone?: string | null
      status: string
    }
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

  hospitalDoctor?: {
    id: string
    isActive: boolean
    department?: {
      id: string
      name: string
    } | null
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

export const hospitalChatsApi = {
  async listThreads() {
    const response = await apiClient.get<{ threads: ChatThread[] }>(
      '/hospital/chats'
    )

    return response.data.threads
  },

  async unreadCount() {
    const response = await apiClient.get<{ unreadCount: number }>(
      '/hospital/chats/unread-count'
    )

    return response.data.unreadCount
  },

  async getMessages(threadId: string) {
    const response = await apiClient.get<{
      thread: ChatThread
      messages: ChatMessage[]
    }>(`/hospital/chats/${threadId}/messages`)

    return response.data
  },

  async sendMessage(threadId: string, body: string) {
    const response = await apiClient.post<{
      message: string
      chatMessage: ChatMessage
    }>(`/hospital/chats/${threadId}/messages`, {
      body,
    })

    return response.data.chatMessage
  },

  async markRead(threadId: string) {
    const response = await apiClient.patch<{
      message: string
      updated: number
    }>(`/hospital/chats/${threadId}/read`)

    return response.data
  },
}