import { useQuery } from '@tanstack/react-query'
import { getPatientDocument, getPatientDocuments } from '../api/documents'

export function usePatientDocuments() {
  return useQuery({
    queryKey: ['patient-documents'],
    queryFn: getPatientDocuments,
  })
}

export function usePatientDocument(id?: string) {
  return useQuery({
    queryKey: ['patient-document', id],
    queryFn: () => getPatientDocument(id!),
    enabled: Boolean(id),
  })
}