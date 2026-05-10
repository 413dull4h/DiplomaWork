import type { TeleconsultSession } from '../types/models'

type TeleconsultJoinCardProps = {
  appointmentType?: string
  teleconsultSession?: TeleconsultSession | null
}

export function TeleconsultJoinCard({
  appointmentType,
  teleconsultSession,
}: TeleconsultJoinCardProps) {
  if (appointmentType !== 'TELECONSULT') {
    return null
  }

  if (!teleconsultSession?.joinUrl) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
        <h3 className="text-lg font-bold">Online consultation link pending</h3>
        <p className="mt-1 text-sm">
          The hospital or doctor has not added the meeting link yet. Please check again later.
        </p>
      </div>
    )
  }

  const providerName = teleconsultSession.providerName || 'Online consultation'
  const isEnded = teleconsultSession.status === 'ENDED'

  return (
    <div className="rounded-3xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm dark:border-cyan-500/30 dark:bg-cyan-500/10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
            Teleconsultation
          </p>

          <h3 className="mt-1 text-xl font-black text-slate-950 dark:text-white">
            {providerName}
          </h3>

          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Status: <span className="font-bold">{teleconsultSession.status}</span>
          </p>
        </div>

        <button
          type="button"
          disabled={isEnded}
          onClick={() => {
            window.open(
              teleconsultSession.joinUrl,
              '_blank',
              'noopener,noreferrer'
            )
          }}
          className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
        >
          {isEnded ? 'Consultation ended' : 'Join Consultation'}
        </button>
      </div>
    </div>
  )
}