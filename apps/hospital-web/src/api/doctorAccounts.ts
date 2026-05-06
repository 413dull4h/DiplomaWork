import { apiClient } from './client'
import type {
  CreateDoctorAccountPayload,
  DoctorAccountResponse,
} from '../types/doctorAccount'

export const doctorAccountsApi = {
  createDoctorAccount(hospitalDoctorId: string, payload: CreateDoctorAccountPayload) {
    return apiClient
      .post<DoctorAccountResponse>(`/hospital/doctors/${hospitalDoctorId}/account`, payload)
      .then((response) => response.data)
  },
}
