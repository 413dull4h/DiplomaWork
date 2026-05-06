import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LanguageSwitcher } from '../../components/layout/LanguageSwitcher'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { useAuthStore } from '../auth/authStore'
import { languageOptions, useLanguageStore } from './languageStore'

export function DoctorSettingsPage() {
  const navigate = useNavigate()
  const clearSession = useAuthStore((state) => state.clearSession)
  const language = useLanguageStore((state) => state.language)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('careos-doctor-theme') === 'dark')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('careos-doctor-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  function logout() {
    clearSession()
    navigate('/login', { replace: true })
  }

  const activeLanguage = languageOptions.find((option) => option.code === language)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-600">Settings</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">Doctor settings</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Manage local app preferences, language, and session controls.</p>
      </div>

      <Card elevated>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-950 dark:text-white">Appearance</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Enable a darker interface for low-light use.</p>
          </div>
          <Button type="button" variant="secondary" onClick={() => setDarkMode((value) => !value)}>
            {darkMode ? 'Use light mode' : 'Use dark mode'}
          </Button>
        </div>
      </Card>

      <Card elevated>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-950 dark:text-white">Language</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Current language: <span className="font-bold">{activeLanguage?.nativeLabel ?? 'English'}</span>. This controls the doctor portal language preference and navigation labels.
            </p>
          </div>
          <LanguageSwitcher />
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {languageOptions.map((option) => (
            <div
              key={option.code}
              className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900/70"
            >
              <span className="font-black text-slate-950 dark:text-white">{option.nativeLabel}</span>
              <span className="ml-2 text-xs font-semibold text-slate-500 dark:text-slate-400">{option.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card elevated className="border-rose-200 dark:border-rose-900">
        <h2 className="text-lg font-black text-slate-950 dark:text-white">Session</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Log out safely from this browser. Your token will be removed from local storage.</p>
        <Button type="button" variant="danger" className="mt-5" onClick={logout}>
          Logout
        </Button>
      </Card>
    </div>
  )
}
