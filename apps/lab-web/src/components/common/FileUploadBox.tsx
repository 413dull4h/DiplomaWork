import { UploadCloud } from 'lucide-react'
import type { InputHTMLAttributes } from 'react'

export function FileUploadBox({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-cyan-300/70 bg-cyan-50/50 p-6 text-center text-sm transition hover:bg-cyan-50 dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:hover:bg-cyan-400/15 ${className}`}>
      <UploadCloud className="mb-3 h-8 w-8 text-cyan-600 dark:text-cyan-300" />
      <span className="font-black text-slate-900 dark:text-white">Choose report file</span>
      <span className="mt-1 text-xs text-slate-500 dark:text-slate-300">PDF, JPG, PNG, WEBP up to backend limit</span>
      <input type="file" className="sr-only" {...props} />
    </label>
  )
}
