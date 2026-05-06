import { create } from 'zustand'
type Theme='light'|'dark';const KEY='careos_patient_theme';const initial=(localStorage.getItem(KEY) as Theme)|| (matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')
function apply(t:Theme){document.documentElement.classList.toggle('dark',t==='dark');localStorage.setItem(KEY,t)} apply(initial)
export const useThemeStore=create<{theme:Theme;toggleTheme:()=>void;setTheme:(t:Theme)=>void}>((set,get)=>({theme:initial,setTheme:t=>{apply(t);set({theme:t})},toggleTheme:()=>{const t=get().theme==='dark'?'light':'dark';apply(t);set({theme:t})}}))
