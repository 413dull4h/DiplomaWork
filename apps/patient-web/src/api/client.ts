import axios,{AxiosError} from 'axios'
import { clearPatientLocalSession,getPatientToken } from '../store/authStore'
import type { ApiError } from '../types/models'
export const apiClient=axios.create({baseURL:import.meta.env.VITE_PATIENT_API_URL||'http://localhost:4003',headers:{'Content-Type':'application/json'}})
apiClient.interceptors.request.use(c=>{const t=getPatientToken();if(t)c.headers.Authorization=`Bearer ${t}`;return c})
apiClient.interceptors.response.use(r=>r,(e:AxiosError<{message?:string;errors?:unknown}>)=>{if(e.response?.status===401){clearPatientLocalSession();if(!location.pathname.startsWith('/login')) location.assign('/login')}return Promise.reject(e)})
export function parseApiError(e:unknown):ApiError{if(axios.isAxiosError<{message?:string;errors?:unknown}>(e))return{message:e.response?.data?.message||e.message||'Something went wrong.',status:e.response?.status,errors:e.response?.data?.errors};return e instanceof Error?{message:e.message}:{message:'Something went wrong.'}}
