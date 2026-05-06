import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import en from './resources/en.json'
import ru from './resources/ru.json'
import ar from './resources/ar.json'
import bn from './resources/bn.json'
import zh from './resources/zh.json'
import fr from './resources/fr.json'
import de from './resources/de.json'
import es from './resources/es.json'

export const supportedLanguages = ['en', 'ru', 'ar', 'bn', 'zh', 'fr', 'de', 'es'] as const
export type SupportedLanguage = (typeof supportedLanguages)[number]

export const languageLabels: Record<SupportedLanguage, string> = {
  en: 'English', ru: 'Русский', ar: 'العربية', bn: 'বাংলা', zh: '中文', fr: 'Français', de: 'Deutsch', es: 'Español',
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, ru: { translation: ru }, ar: { translation: ar }, bn: { translation: bn }, zh: { translation: zh }, fr: { translation: fr }, de: { translation: de }, es: { translation: es } },
    fallbackLng: 'en',
    supportedLngs: supportedLanguages,
    interpolation: { escapeValue: false },
    detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'], lookupLocalStorage: 'careos.admin.language' },
  })

function applyDirection(language: string) {
  const code = language.split('-')[0]
  document.documentElement.lang = code
  document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr'
}

i18n.on('languageChanged', applyDirection)
applyDirection(i18n.language || 'en')

export default i18n
