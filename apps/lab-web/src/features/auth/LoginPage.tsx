import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { FlaskConical } from 'lucide-react'
import { loginLab } from '../../api/auth'
import { getErrorMessage } from '../../api/client'
import { useAuthStore } from './authStore'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email.'),
  password: z.string().min(1, 'Password is required.'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const token = useAuthStore((state) => state.token)
  const setSession = useAuthStore((state) => state.setSession)
  const [error, setError] = useState('')

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'lab.admin@careos.com',
      password: 'Lab@12345',
    },
  })

  const mutation = useMutation({
    mutationFn: loginLab,
    onSuccess: (data) => {
      setSession(data)
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
    },
    onError: (err) => setError(getErrorMessage(err)),
  })

  if (token) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden rounded-[2rem] border border-white/70 bg-white/60 p-10 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 lg:block">
          <div className="inline-flex rounded-3xl bg-cyan-600 p-4 text-white shadow-lg shadow-cyan-600/30">
            <FlaskConical className="h-10 w-10" />
          </div>
          <h1 className="mt-8 text-5xl font-black tracking-tight text-slate-950 dark:text-white">careOS Lab</h1>
          <p className="mt-4 max-w-xl text-lg text-slate-600 dark:text-slate-300">
            Diagnostic center operations for test catalogs, lab orders, sample workflow, and report delivery.
          </p>
          <div className="mt-10 grid gap-3 text-sm text-slate-600 dark:text-slate-300">
            <div className="rounded-3xl bg-white/70 p-4 dark:bg-white/10">Real Lab API connection only — no mock orders.</div>
            <div className="rounded-3xl bg-white/70 p-4 dark:bg-white/10">Status workflow: requested → accepted → sample collected → in progress → completed.</div>
            <div className="rounded-3xl bg-white/70 p-4 dark:bg-white/10">Report upload uses the real multipart backend endpoint.</div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80 md:p-10">
          <div className="mb-8">
            <p className="text-sm font-black uppercase tracking-wide text-cyan-600 dark:text-cyan-300">Lab Admin Login</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">Use your lab account to manage diagnostic operations.</p>
          </div>

          <form
            className="space-y-5"
            onSubmit={form.handleSubmit((values) => {
              setError('')
              mutation.mutate(values)
            })}
          >
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">Email</span>
              <Input type="email" autoComplete="email" {...form.register('email')} />
              {form.formState.errors.email ? <p className="mt-2 text-sm text-rose-600">{form.formState.errors.email.message}</p> : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">Password</span>
              <Input type="password" autoComplete="current-password" {...form.register('password')} />
              {form.formState.errors.password ? <p className="mt-2 text-sm text-rose-600">{form.formState.errors.password.message}</p> : null}
            </label>

            {error ? <p className="rounded-2xl bg-rose-500/10 p-3 text-sm font-semibold text-rose-700 dark:text-rose-200">{error}</p> : null}

            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </section>
      </div>
    </main>
  )
}
