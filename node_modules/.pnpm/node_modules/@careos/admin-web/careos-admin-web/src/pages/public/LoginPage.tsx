import { zodResolver } from '@hookform/resolvers/zod'
import { Activity } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { GlassCard } from '@/components/common/GlassCard'
import { FormFieldWrapper } from '@/components/common/FormFieldWrapper'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { isAdminRole, useLogin } from '@/hooks/useAdminSession'

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const login = useLogin()
  const schema = z.object({ email: z.string().email(t('validation.email')), password: z.string().min(1, t('validation.required')) })
  type FormValues = z.infer<typeof schema>
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: 'admin@careos.com', password: 'Admin@12345' } })

  useEffect(() => {
    if (login.data?.user) {
      if (isAdminRole(login.data.user.primaryRole)) navigate('/dashboard', { replace: true })
      else navigate('/unauthorized', { replace: true })
    }
  }, [login.data, navigate])

  return <main className="grid min-h-screen place-items-center p-4"><div className="absolute right-4 top-4 flex gap-2"><LanguageSwitcher /><ThemeToggle /></div><GlassCard className="w-full max-w-md"><div className="mb-8 text-center"><div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-3xl bg-gradient-to-br from-sky-400 to-emerald-400 text-white shadow-glow"><Activity /></div><h1 className="text-2xl font-black">{t('auth.signIn')}</h1><p className="mt-2 text-sm text-muted">{t('auth.subtitle')}</p></div><form className="space-y-4" onSubmit={form.handleSubmit((values) => login.mutate(values))}><FormFieldWrapper label={t('auth.email')} error={form.formState.errors.email?.message}><Input type="email" autoComplete="email" {...form.register('email')} /></FormFieldWrapper><FormFieldWrapper label={t('auth.password')} error={form.formState.errors.password?.message}><Input type="password" autoComplete="current-password" {...form.register('password')} /></FormFieldWrapper>{login.error ? <p className="rounded-2xl bg-red-500/10 p-3 text-sm text-danger">{login.error.message || t('auth.invalid')}</p> : null}<Button className="w-full" disabled={login.isPending}>{login.isPending ? t('common.loading') : t('auth.signInButton')}</Button></form></GlassCard></main>
}
