import type { ReactNode } from 'react'
export function FormFieldWrapper({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-semibold text-foreground">{label}</span>{children}{error ? <span className="mt-1 block text-xs font-medium text-danger">{error}</span> : null}</label>
}
