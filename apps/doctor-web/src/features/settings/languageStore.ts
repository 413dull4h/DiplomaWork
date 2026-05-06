import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AppLanguage = 'en' | 'bn' | 'ru' | 'ar' | 'zh' | 'fr' | 'de' | 'es'

export const languageOptions: Array<{ code: AppLanguage; label: string; nativeLabel: string }> = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'bn', label: 'Bangla', nativeLabel: 'বাংলা' },
  { code: 'ru', label: 'Russian', nativeLabel: 'Русский' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية' },
  { code: 'zh', label: 'Chinese', nativeLabel: '中文' },
  { code: 'fr', label: 'French', nativeLabel: 'Français' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
]

type LanguageState = {
  language: AppLanguage
  setLanguage: (language: AppLanguage) => void
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (language) => {
        document.documentElement.lang = language
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
        set({ language })
      },
    }),
    {
      name: 'careos-doctor-language',
      onRehydrateStorage: () => (state) => {
        const language = state?.language ?? 'en'
        document.documentElement.lang = language
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
      },
    },
  ),
)

type Copy = {
  dashboard: string
  appointments: string
  profile: string
  schedule: string
  settings: string
  editProfile: string
  logout: string
  language: string
}

export const languageCopy: Record<AppLanguage, Copy> = {
  en: {
    dashboard: 'Dashboard',
    appointments: 'Appointments',
    profile: 'Profile',
    schedule: 'Schedule',
    settings: 'Settings',
    editProfile: 'Edit Profile',
    logout: 'Logout',
    language: 'Language',
  },
  bn: {
    dashboard: 'ড্যাশবোর্ড',
    appointments: 'অ্যাপয়েন্টমেন্ট',
    profile: 'প্রোফাইল',
    schedule: 'সময়সূচি',
    settings: 'সেটিংস',
    editProfile: 'প্রোফাইল সম্পাদনা',
    logout: 'লগআউট',
    language: 'ভাষা',
  },
  ru: {
    dashboard: 'Панель',
    appointments: 'Приёмы',
    profile: 'Профиль',
    schedule: 'Расписание',
    settings: 'Настройки',
    editProfile: 'Изменить профиль',
    logout: 'Выйти',
    language: 'Язык',
  },
  ar: {
    dashboard: 'لوحة التحكم',
    appointments: 'المواعيد',
    profile: 'الملف الشخصي',
    schedule: 'الجدول',
    settings: 'الإعدادات',
    editProfile: 'تعديل الملف',
    logout: 'تسجيل الخروج',
    language: 'اللغة',
  },
  zh: {
    dashboard: '仪表盘',
    appointments: '预约',
    profile: '个人资料',
    schedule: '日程',
    settings: '设置',
    editProfile: '编辑资料',
    logout: '退出',
    language: '语言',
  },
  fr: {
    dashboard: 'Tableau',
    appointments: 'Rendez-vous',
    profile: 'Profil',
    schedule: 'Planning',
    settings: 'Paramètres',
    editProfile: 'Modifier',
    logout: 'Déconnexion',
    language: 'Langue',
  },
  de: {
    dashboard: 'Übersicht',
    appointments: 'Termine',
    profile: 'Profil',
    schedule: 'Zeitplan',
    settings: 'Einstellungen',
    editProfile: 'Profil bearbeiten',
    logout: 'Abmelden',
    language: 'Sprache',
  },
  es: {
    dashboard: 'Panel',
    appointments: 'Citas',
    profile: 'Perfil',
    schedule: 'Horario',
    settings: 'Ajustes',
    editProfile: 'Editar perfil',
    logout: 'Cerrar sesión',
    language: 'Idioma',
  },
}
