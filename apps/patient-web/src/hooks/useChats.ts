import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { patientChatsApi } from '../api/chats'

export function useChatThreads() {
  return useQuery({
    queryKey: ['patient-chat-threads'],
    queryFn: patientChatsApi.listThreads,
    refetchInterval: 10000,
  })
}

export function useChatUnreadCount() {
  return useQuery({
    queryKey: ['patient-chat-unread-count'],
    queryFn: patientChatsApi.unreadCount,
    refetchInterval: 10000,
  })
}

export function useChatMessages(threadId?: string) {
  return useQuery({
    queryKey: ['patient-chat-messages', threadId],
    queryFn: () => patientChatsApi.getMessages(threadId as string),
    enabled: Boolean(threadId),
    refetchInterval: 8000,
  })
}

export function useCreateAppointmentChatThread() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (appointmentId: string) =>
      patientChatsApi.createAppointmentThread(appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['patient-chat-threads'],
      })

      queryClient.invalidateQueries({
        queryKey: ['patient-chat-unread-count'],
      })
    },
  })
}

export function useSendChatMessage(threadId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: string) =>
      patientChatsApi.sendMessage(threadId as string, body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['patient-chat-messages', threadId],
      })

      queryClient.invalidateQueries({
        queryKey: ['patient-chat-threads'],
      })

      queryClient.invalidateQueries({
        queryKey: ['patient-chat-unread-count'],
      })
    },
  })
}

export function useMarkChatRead(threadId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => patientChatsApi.markRead(threadId as string),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['patient-chat-messages', threadId],
      })

      queryClient.invalidateQueries({
        queryKey: ['patient-chat-threads'],
      })

      queryClient.invalidateQueries({
        queryKey: ['patient-chat-unread-count'],
      })
    },
  })
}