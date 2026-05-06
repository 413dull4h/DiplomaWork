import { create } from 'zustand'; import { persist } from 'zustand/middleware'
type Theme='light'|'dark'; const apply=(t:Theme)=>document.documentElement.classList.toggle('dark',t==='dark')
export const useThemeStore=create<{theme:Theme;toggleTheme:()=>void;setTheme:(t:Theme)=>void}>()(persist((set,get)=>({theme:'light',setTheme:t=>{apply(t);set({theme:t})},toggleTheme:()=>{const n=get().theme==='dark'?'light':'dark';apply(n);set({theme:n})}}),{name:'careos-hospital-theme',onRehydrateStorage:()=>s=>apply(s?.theme||'light')})); apply(useThemeStore.getState().theme)
