import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { hospitalChatsApi } from '../api/chats'

export function useHospitalChatThreads() {
  return useQuery({
    queryKey: ['hospital-chat-threads'],
    queryFn: hospitalChatsApi.listThreads,
    refetchInterval: 10000,
  })
}

export function useHospitalChatUnreadCount() {
  return useQuery({
    queryKey: ['hospital-chat-unread-count'],
    queryFn: hospitalChatsApi.unreadCount,
    refetchInterval: 10000,
  })
}

export function useHospitalChatMessages(threadId?: string) {
  return useQuery({
    queryKey: ['hospital-chat-messages', threadId],
    queryFn: () => hospitalChatsApi.getMessages(threadId as string),
    enabled: Boolean(threadId),
    refetchInterval: 8000,
  })
}

export function useSendHospitalChatMessage(threadId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: string) =>
      hospitalChatsApi.sendMessage(threadId as string, body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['hospital-chat-messages', threadId],
      })

      queryClient.invalidateQueries({
        queryKey: ['hospital-chat-threads'],
      })

      queryClient.invalidateQueries({
        queryKey: ['hospital-chat-unread-count'],
      })
    },
  })
}

export function useMarkHospitalChatRead(threadId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => hospitalChatsApi.markRead(threadId as string),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['hospital-chat-messages', threadId],
      })

      queryClient.invalidateQueries({
        queryKey: ['hospital-chat-threads'],
      })

      queryClient.invalidateQueries({
        queryKey: ['hospital-chat-unread-count'],
      })
    },
  })
}