import { apiClient } from './client'
import type { AuthResponse, MeResponse } from '../types/models'
export const authApi={register:async(p:any)=>(await apiClient.post<AuthResponse>('/patient/auth/register',p)).data,login:async(p:any)=>(await apiClient.post<AuthResponse>('/patient/auth/login',p)).data,me:async()=>(await apiClient.get<MeResponse>('/patient/auth/me')).data}
