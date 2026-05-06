import { apiClient } from './client'
import type { PatientProfile } from '../types/models'
export const patientApi={getProfile:async()=>(await apiClient.get<{patient:PatientProfile}>('/patient/profile')).data.patient,updateProfile:async(p:any)=>(await apiClient.patch<{message:string;patient:PatientProfile}>('/patient/profile',p)).data}
