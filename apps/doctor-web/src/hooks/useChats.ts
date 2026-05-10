import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { doctorChatsApi } from '../api/chats'

export function useDoctorChatThreads() {
  return useQuery({
    queryKey: ['doctor-chat-threads'],
    queryFn: doctorChatsApi.listThreads,
    refetchInterval: 10000,
  })
}

export function useDoctorChatUnreadCount() {
  return useQuery({
    queryKey: ['doctor-chat-unread-count'],
    queryFn: doctorChatsApi.unreadCount,
    refetchInterval: 10000,
  })
}

export function useDoctorChatMessages(threadId?: string) {
  return useQuery({
    queryKey: ['doctor-chat-messages', threadId],
    queryFn: () => doctorChatsApi.getMessages(threadId as string),
    enabled: Boolean(threadId),
    refetchInterval: 8000,
  })
}

export function useSendDoctorChatMessage(threadId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: string) =>
      doctorChatsApi.sendMessage(threadId as string, body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['doctor-chat-messages', threadId],
      })

      queryClient.invalidateQueries({
        queryKey: ['doctor-chat-threads'],
      })

      queryClient.invalidateQueries({
        queryKey: ['doctor-chat-unread-count'],
      })
    },
  })
}

export function useMarkDoctorChatRead(threadId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => doctorChatsApi.markRead(threadId as string),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['doctor-chat-messages', threadId],
      })

      queryClient.invalidateQueries({
        queryKey: ['doctor-chat-threads'],
      })

      queryClient.invalidateQueries({
        queryKey: ['doctor-chat-unread-count'],
      })
    },
  })
}