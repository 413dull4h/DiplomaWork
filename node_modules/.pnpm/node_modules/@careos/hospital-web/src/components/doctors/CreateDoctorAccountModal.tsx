import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, ShieldCheck, Loader2 } from 'lucide-react'
import { useCreateDoctorAccount } from '../../hooks/useDoctorAccounts'
import type { HospitalDoctorForAccount } from '../../types/doctorAccount'

const createDoctorAccountSchema = z.object({
  email: z.string().email('Enter a valid doctor email.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  phone: z.string().optional(),
})

type CreateDoctorAccountForm = z.infer<typeof createDoctorAccountSchema>

type Props = {
  open: boolean
  hospitalDoctor: HospitalDoctorForAccount
  onClose: () => void
  onCreated?: () => void
}

function getApiErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response
    return response?.data?.message || 'Could not create doctor account.'
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Could not create doctor account.'
}

export function CreateDoctorAccountModal({
  open,
  hospitalDoctor,
  onClose,
  onCreated,
}: Props) {
  const mutation = useCreateDoctorAccount(hospitalDoctor.id)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateDoctorAccountForm>({
    resolver: zodResolver(createDoctorAccountSchema),
    defaultValues: {
      email: '',
      password: 'Doctor@12345',
      phone: '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        email: '',
        password: 'Doctor@12345',
        phone: '',
      })
      mutation.reset()
    }
  }, [open])

  if (!open) {
    return null
  }

  const doctorName = hospitalDoctor.doctor?.fullName || 'Doctor'

  const onSubmit = async (values: CreateDoctorAccountForm) => {
    const result = await mutation.mutateAsync({
      email: values.email.trim().toLowerCase(),
      password: values.password,
      phone: values.phone?.trim() || undefined,
    })

    onCreated?.()
    onClose()

    return result
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/50 bg-white/90 shadow-2xl shadow-slate-900/20 backdrop-blur-2xl dark:border-slate-700/80 dark:bg-slate-950/90">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200/70 px-6 py-5 dark:border-slate-800">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/50 dark:text-blue-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              Hospital-scoped doctor login
            </div>
            <h2 className="text-xl font-bold text-slate-950 dark:text-white">
              Create login for {doctorName}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              This creates a DOCTOR user account linked to this hospital-managed doctor record.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white"
            aria-label="Close create doctor account modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-6 py-6">
          {mutation.isError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
              {getApiErrorMessage(mutation.error)}
            </div>
          ) : null}

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Doctor email
            </span>
            <input
              type="email"
              autoComplete="email"
              placeholder="doctor.name@careos.com"
              className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-950 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-white dark:focus:ring-blue-950/60"
              {...register('email')}
            />
            {errors.email ? (
              <span className="mt-2 block text-xs font-semibold text-rose-600">
                {errors.email.message}
              </span>
            ) : null}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Temporary password
            </span>
            <input
              type="text"
              autoComplete="new-password"
              className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-950 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-white dark:focus:ring-blue-950/60"
              {...register('password')}
            />
            {errors.password ? (
              <span className="mt-2 block text-xs font-semibold text-rose-600">
                {errors.password.message}
              </span>
            ) : (
              <span className="mt-2 block text-xs text-slate-500 dark:text-slate-400">
                Share this securely with the doctor. They should change it later when password reset exists.
              </span>
            )}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Phone optional
            </span>
            <input
              type="tel"
              autoComplete="tel"
              placeholder="+88017..."
              className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-950 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-white dark:focus:ring-blue-950/60"
              {...register('phone')}
            />
          </label>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            This does not create an independent marketplace doctor. It only lets this doctor log in under this hospital scope.
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Create doctor login
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
