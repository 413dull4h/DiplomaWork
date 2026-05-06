import { useState } from 'react'
import { CheckCircle2, KeyRound, ShieldCheck, UserRoundCheck } from 'lucide-react'
import { CreateDoctorAccountModal } from './CreateDoctorAccountModal'
import type { HospitalDoctorForAccount } from '../../types/doctorAccount'

type Props = {
  hospitalDoctor: HospitalDoctorForAccount
  onCreated?: () => void
  className?: string
}

export function DoctorAccountPanel({ hospitalDoctor, onCreated, className = '' }: Props) {
  const [open, setOpen] = useState(false)
  const doctor = hospitalDoctor.doctor
  const hasAccount = Boolean(doctor?.userId)

  return (
    <section
      className={`rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-xl shadow-slate-900/5 backdrop-blur-2xl dark:border-slate-700/70 dark:bg-slate-950/70 ${className}`}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            {hasAccount ? <UserRoundCheck className="h-6 w-6" /> : <KeyRound className="h-6 w-6" />}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                Doctor login account
              </h3>
              {hasAccount ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                  Not created
                </span>
              )}
            </div>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              {hasAccount
                ? 'This doctor can log in to Doctor Web and access only their hospital-scoped profile, schedule, assigned appointments, and allowed clinical workflows.'
                : 'Create a hospital-scoped doctor login so this doctor can use Doctor Web without receiving hospital admin access.'}
            </p>

            <div className="mt-4 grid gap-3 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50">
                <span className="block text-xs font-bold uppercase tracking-wide text-slate-400">
                  Doctor
                </span>
                <span className="mt-1 block font-semibold text-slate-900 dark:text-white">
                  {doctor?.fullName || 'Unknown doctor'}
                </span>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50">
                <span className="block text-xs font-bold uppercase tracking-wide text-slate-400">
                  Department
                </span>
                <span className="mt-1 block font-semibold text-slate-900 dark:text-white">
                  {hospitalDoctor.department?.name || 'No department'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
          {hasAccount ? (
            <div className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
              <ShieldCheck className="h-4 w-4" />
              Login already active
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
            >
              <KeyRound className="h-4 w-4" />
              Create doctor login
            </button>
          )}
        </div>
      </div>

      <CreateDoctorAccountModal
        open={open}
        hospitalDoctor={hospitalDoctor}
        onClose={() => setOpen(false)}
        onCreated={onCreated}
      />
    </section>
  )
}
