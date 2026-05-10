import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteHospitalMedicalDocument,
  getHospitalPatientDocuments,
  uploadHospitalPatientDocument,
  type UploadMedicalDocumentPayload,
} from '../api/medicalDocuments'

export function useHospitalPatientDocuments(patientId?: string) {
  return useQuery({
    queryKey: ['hospital-patient-documents', patientId],
    queryFn: () => getHospitalPatientDocuments(patientId!),
    enabled: Boolean(patientId),
  })
}

export function useUploadHospitalPatientDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UploadMedicalDocumentPayload) =>
      uploadHospitalPatientDocument(payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['hospital-patient-documents', variables.patientId],
      })

      void queryClient.invalidateQueries({
        queryKey: ['hospital-appointment', variables.appointmentId],
      })

      void queryClient.invalidateQueries({
        queryKey: ['hospital-appointments'],
      })
    },
  })
}

export function useDeleteHospitalMedicalDocument(patientId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteHospitalMedicalDocument,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['hospital-patient-documents', patientId],
      })
    },
  })
}
