import { useTranslation } from 'react-i18next'
import i18n, { languageLabels, supportedLanguages, type SupportedLanguage } from '@/i18n'
import { Select } from '@/components/ui/Select'

export function LanguageSwitcher() {
  const { t } = useTranslation()
  const current = (i18n.language?.split('-')[0] || 'en') as SupportedLanguage
  return <Select aria-label={t('settings.language')} className="max-w-44" value={current} onChange={(event) => void i18n.changeLanguage(event.target.value)}>
    {supportedLanguages.map((lang) => <option key={lang} value={lang}>{languageLabels[lang]}</option>)}
  </Select>
}
