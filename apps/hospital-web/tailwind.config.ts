import type { Config } from 'tailwindcss'
export default { darkMode:'class', content:['./index.html','./src/**/*.{ts,tsx}'], theme:{ extend:{ fontFamily:{ sans:['Inter','ui-sans-serif','system-ui'] }, boxShadow:{ glass:'0 24px 80px rgba(15,23,42,.16)' }, borderRadius:{ '3xl':'1.75rem' } } }, plugins:[] } satisfies Config
