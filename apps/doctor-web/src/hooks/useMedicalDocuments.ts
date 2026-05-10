import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    deleteDoctorDocument,
    getDoctorAppointmentDocuments,
    uploadDoctorAppointmentDocument,
    type UploadDoctorDocumentPayload,
} from '../api/medicalDocuments'

export function useDoctorAppointmentDocuments(appointmentId?: string) {
    return useQuery({
        queryKey: ['doctor-appointment-documents', appointmentId],
        queryFn: () => getDoctorAppointmentDocuments(appointmentId!),
        enabled: Boolean(appointmentId),
    })
}

export function useUploadDoctorAppointmentDocument() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: UploadDoctorDocumentPayload) =>
            uploadDoctorAppointmentDocument(payload),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['doctor-appointment-documents', variables.appointmentId],
            })
        },
    })
}

export function useDeleteDoctorDocument(appointmentId?: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (documentId: string) => deleteDoctorDocument(documentId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['doctor-appointment-documents', appointmentId],
            })
        },
    })
}