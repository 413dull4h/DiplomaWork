import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { activateUser, getUser, getUsers, suspendUser, type UsersQuery } from '@/api/users'

export function useUsers(filters: UsersQuery) {
  return useQuery({
    queryKey: ['admin-users', filters],
    queryFn: () => getUsers(filters),
  })
}

export function useUser(id?: string) {
  return useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => getUser(id!),
    enabled: Boolean(id),
  })
}

export function useSuspendUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => suspendUser(id, reason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-user', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
    },
  })
}

export function useActivateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => activateUser(id, reason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-user', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
    },
  })
}
