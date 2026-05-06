import { zodResolver } from '@hookform/resolvers/zod'
import { Activity } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import { z } from 'zod'
import { parseApiError } from '../../api/client'
import { GlassCard, Field } from '../../components/common/Basic'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useHospitalLogin } from '../../hooks/useHospitalSession'
import { useAuthStore } from '../../store/authStore'

export function LoginPage() {
  const { t } = useTranslation(); const token = useAuthStore(s => s.token); const login = useHospitalLogin()
  const schema = z.object({ email: z.string().email(t('validation.email')), password: z.string().min(1, t('validation.password')) })
  const f = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { email: 'hospital.admin@careos.com', password: 'Hospital@12345' } })
  if (token) return <Navigate to="/dashboard" replace />
  return <main className="liquid-bg flex min-h-screen items-center justify-center p-4"><GlassCard className="w-full max-w-md p-8"><div className="mb-8 text-center"><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-cyan-600 text-white shadow-lg shadow-cyan-600/25"><Activity className="h-7 w-7" /></div><h1 className="text-3xl font-black text-slate-950 dark:text-white">{t('auth.signIn')}</h1><p className="mt-2 text-sm text-slate-500">careOS Hospital</p></div><form className="space-y-4" onSubmit={f.handleSubmit(v => login.mutate(v))}><Field label={t('auth.email')} error={f.formState.errors.email?.message}><Input autoComplete="email" {...f.register('email')} /></Field><Field label={t('auth.password')} error={f.formState.errors.password?.message}><Input type="password" autoComplete="current-password" {...f.register('password')} /></Field>{login.error && <p className="rounded-2xl bg-rose-500/10 p-3 text-sm text-rose-700">{parseApiError(login.error).message}</p>}<Button className="w-full" disabled={login.isPending}>{login.isPending ? t('auth.loggingIn') : t('auth.login')}</Button></form></GlassCard></main>
}
