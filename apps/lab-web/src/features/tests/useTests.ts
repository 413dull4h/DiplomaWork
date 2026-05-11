import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createLabTest, getLabTest, listLabTests, updateLabTest, type TestPayload } from '../../api/tests'

export function useTests() {
  return useQuery({ queryKey: ['lab-tests'], queryFn: listLabTests })
}

export function useTest(id?: string) {
  return useQuery({
    queryKey: ['lab-tests', id],
    queryFn: () => getLabTest(id!),
    enabled: Boolean(id),
  })
}

export function useCreateTest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: TestPayload) => createLabTest(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lab-tests'] }),
  })
}

export function useUpdateTest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<TestPayload> }) => updateLabTest(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lab-tests'] })
      queryClient.invalidateQueries({ queryKey: ['lab-tests', variables.id] })
    },
  })
}
