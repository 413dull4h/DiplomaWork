import { Select } from '@/components/ui/Select'
export function FilterSelect({ value, onChange, options, ariaLabel }: { value: string; onChange: (v: string) => void; options: Array<{ value: string; label: string }>; ariaLabel: string }) {
  return <Select aria-label={ariaLabel} value={value} onChange={(e) => onChange(e.target.value)}>{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>
}
