import { apiClient } from './client'
import type { Encounter } from '../types/models'
export const recordsApi={list:async()=>(await apiClient.get<{encounters:Encounter[]}>('/patient/records')).data.encounters,get:async(id:string)=>(await apiClient.get<{encounter:Encounter}>(`/patient/records/${id}`)).data.encounter}
