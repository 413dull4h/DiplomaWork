import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { Navigate, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { loginDoctor } from '../../api/doctorAuth'
import { ApiError } from '../../api/client'
import { CareOSMark } from '../../components/brand/CareOSMark'
import { LanguageSwitcher } from '../../components/layout/LanguageSwitcher'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { useAuthStore } from './authStore'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const session = useAuthStore((state) => state.session)
  const setSession = useAuthStore((state) => state.setSession)

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const mutation = useMutation({
    mutationFn: loginDoctor,
    onSuccess: (data) => {
      setSession({
        token: data.token,
        user: data.user,
        doctor: data.doctor,
        hospital: data.hospital,
        department: data.department,
        hospitalDoctorId: data.hospitalDoctorId,
      })
      navigate('/profile', { replace: true })
    },
  })

  if (session?.token) {
    return <Navigate to="/profile" replace />
  }

  const errorMessage = mutation.error instanceof ApiError ? mutation.error.message : undefined

  return (
    <div className="soft-grid flex min-h-screen items-center justify-center px-4 py-10">
      <div className="absolute right-5 top-5">
        <LanguageSwitcher />
      </div>
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="w-full max-w-md">
        <Card glass elevated className="liquid-card p-7">
          <div className="mb-8">
            <CareOSMark size="lg" subtitle="Doctor Portal" />
            <h1 className="mt-7 text-3xl font-black tracking-tight text-slate-950 dark:text-white">Doctor sign in</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Access your hospital-scoped doctor profile, schedule, and professional settings.</p>
          </div>

          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="doctor.ahmed@careos.com"
              error={form.formState.errors.email?.message}
              {...form.register('email')}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              error={form.formState.errors.password?.message}
              {...form.register('password')}
            />

            {errorMessage ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
                {errorMessage}
              </div>
            ) : null}

            <Button type="submit" className="w-full" isLoading={mutation.isPending}>
              Sign in
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}
