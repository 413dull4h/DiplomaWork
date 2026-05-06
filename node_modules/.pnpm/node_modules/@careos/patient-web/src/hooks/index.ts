import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query';import { authApi } from '../api/auth';import { patientApi } from '../api/patient';import { discoveryApi } from '../api/discovery';import { appointmentsApi } from '../api/appointments';import { recordsApi } from '../api/records';import { healthApi } from '../api/health';import { usePatientAuthStore } from '../store/authStore';import type { AppointmentType, CreateAppointmentInput } from '../types/models';
export const usePatientSession=()=>usePatientAuthStore();
export function usePatientLogin(){const qc=useQueryClient();const set=usePatientAuthStore(s=>s.setSession);return useMutation({mutationFn:authApi.login,onSuccess:d=>{set({token:d.token,user:d.user,patient:d.patient});qc.invalidateQueries({queryKey:['me']})}})}
export function usePatientRegister(){const qc=useQueryClient();const set=usePatientAuthStore(s=>s.setSession);return useMutation({mutationFn:authApi.register,onSuccess:d=>{set({token:d.token,user:d.user,patient:d.patient});qc.invalidateQueries({queryKey:['me']})}})}
export const usePatientMe=(enabled=true)=>useQuery({queryKey:['me'],queryFn:authApi.me,enabled,retry:false})
export const usePatientProfile=()=>useQuery({queryKey:['profile'],queryFn:patientApi.getProfile})
export function useUpdatePatientProfile(){const qc=useQueryClient();return useMutation({mutationFn:patientApi.updateProfile,onSuccess:()=>{qc.invalidateQueries({queryKey:['profile']});qc.invalidateQueries({queryKey:['me']})}})}
export const useHospitals=()=>useQuery({queryKey:['hospitals'],queryFn:discoveryApi.getHospitals})
export const useHospitalDoctors=(id?:string)=>useQuery({queryKey:['hospitalDoctors',id],queryFn:()=>discoveryApi.getHospitalDoctors(id!),enabled:Boolean(id)})
export const useDoctorSlots=(id?:string,date?:string,type:AppointmentType='IN_PERSON')=>useQuery({queryKey:['slots',id,date,type],queryFn:()=>discoveryApi.getDoctorSlots(id!,date!,type),enabled:Boolean(id&&date)})
export function useCreateAppointment(){const qc=useQueryClient();return useMutation({mutationFn:(p:CreateAppointmentInput)=>appointmentsApi.create(p),onSuccess:()=>{qc.invalidateQueries({queryKey:['appointments']});qc.invalidateQueries({queryKey:['slots']})}})}
export const usePatientAppointments=()=>useQuery({queryKey:['appointments'],queryFn:appointmentsApi.list})
export const usePatientAppointment=(id?:string)=>useQuery({queryKey:['appointment',id],queryFn:()=>appointmentsApi.get(id!),enabled:Boolean(id)})
export function useCancelAppointment(){const qc=useQueryClient();return useMutation({mutationFn:({id,cancellationReason}:{id:string;cancellationReason?:string})=>appointmentsApi.cancel(id,cancellationReason),onSuccess:(_d,v)=>{qc.invalidateQueries({queryKey:['appointments']});qc.invalidateQueries({queryKey:['appointment',v.id]})}})}
export const usePatientRecords=()=>useQuery({queryKey:['records'],queryFn:recordsApi.list})
export const usePatientRecord=(id?:string)=>useQuery({queryKey:['record',id],queryFn:()=>recordsApi.get(id!),enabled:Boolean(id)})
export const useHealth=()=>useQuery({queryKey:['health'],queryFn:healthApi.getHealth,retry:1})
