import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createHospitalLab,
  createHospitalLabAdmin,
  deleteHospitalLabDocument,
  getHospitalLab,
  getHospitalLabDocuments,
  getHospitalLabs,
  updateHospitalLab,
  uploadHospitalLabDocument,
  type CreateLabAdminPayload,
  type CreateLabPayload,
  type UpdateLabPayload,
  type UploadLabDocumentPayload,
} from '../api/labs'

export function useHospitalLabs() {
  return useQuery({
    queryKey: ['hospital-labs'],
    queryFn: getHospitalLabs,
  })
}

export function useHospitalLab(id?: string) {
  return useQuery({
    queryKey: ['hospital-lab', id],
    queryFn: () => getHospitalLab(id as string),
    enabled: Boolean(id),
  })
}

export function useCreateHospitalLab() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateLabPayload) => createHospitalLab(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['hospital-labs'] })
    },
  })
}

export function useUpdateHospitalLab(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateLabPayload) => updateHospitalLab(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['hospital-labs'] })
      void queryClient.invalidateQueries({ queryKey: ['hospital-lab', id] })
    },
  })
}

export function useCreateHospitalLabAdmin(labId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateLabAdminPayload) =>
      createHospitalLabAdmin(labId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['hospital-lab', labId] })
      void queryClient.invalidateQueries({ queryKey: ['hospital-labs'] })
    },
  })
}

export function useHospitalLabDocuments(labId?: string) {
  return useQuery({
    queryKey: ['hospital-lab-documents', labId],
    queryFn: () => getHospitalLabDocuments(labId as string),
    enabled: Boolean(labId),
  })
}

export function useUploadHospitalLabDocument(labId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UploadLabDocumentPayload) =>
      uploadHospitalLabDocument(labId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['hospital-lab', labId] })
      void queryClient.invalidateQueries({
        queryKey: ['hospital-lab-documents', labId],
      })
      void queryClient.invalidateQueries({ queryKey: ['hospital-labs'] })
    },
  })
}

export function useDeleteHospitalLabDocument(labId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (documentId: string) => deleteHospitalLabDocument(labId, documentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['hospital-lab', labId] })
      void queryClient.invalidateQueries({
        queryKey: ['hospital-lab-documents', labId],
      })
      void queryClient.invalidateQueries({ queryKey: ['hospital-labs'] })
    },
  })
}