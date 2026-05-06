import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/Input'
export function SearchInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { t } = useTranslation()
  return <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} /><Input aria-label={t('common.search')} className="pl-11" placeholder={t('common.search')} value={value} onChange={(event) => onChange(event.target.value)} /></div>
}
