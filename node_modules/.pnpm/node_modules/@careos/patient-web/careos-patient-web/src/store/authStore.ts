import { create } from 'zustand'
import type { PatientProfile, PatientUser } from '../types/models'
const TK='careos_patient_token',UK='careos_patient_user',PK='careos_patient_profile'
function read<T>(k:string):T|null{try{const v=localStorage.getItem(k);return v?JSON.parse(v) as T:null}catch{return null}}
type S={token:string|null;user:PatientUser|null;patient:PatientProfile|null;isAuthenticated:boolean;setSession:(s:{token:string;user:PatientUser;patient:PatientProfile})=>void;clearSession:()=>void;restoreSession:()=>void}
export const usePatientAuthStore=create<S>((set)=>({token:localStorage.getItem(TK),user:read(UK),patient:read(PK),isAuthenticated:Boolean(localStorage.getItem(TK)),setSession:({token,user,patient})=>{localStorage.setItem(TK,token);localStorage.setItem(UK,JSON.stringify(user));localStorage.setItem(PK,JSON.stringify(patient));set({token,user,patient,isAuthenticated:true})},clearSession:()=>{localStorage.removeItem(TK);localStorage.removeItem(UK);localStorage.removeItem(PK);set({token:null,user:null,patient:null,isAuthenticated:false})},restoreSession:()=>set({token:localStorage.getItem(TK),user:read(UK),patient:read(PK),isAuthenticated:Boolean(localStorage.getItem(TK))})}))
export const getPatientToken=()=>localStorage.getItem(TK)
export const clearPatientLocalSession=()=>{localStorage.removeItem(TK);localStorage.removeItem(UK);localStorage.removeItem(PK)}
