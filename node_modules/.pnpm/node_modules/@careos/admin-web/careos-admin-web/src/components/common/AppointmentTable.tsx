import { useTranslation } from 'react-i18next'
import type { RecentAppointment } from '@/types/models'
import { formatDateTime } from '@/utils/format'
import { StatusBadge } from './StatusBadge'

export function AppointmentTable({ appointments }: { appointments: RecentAppointment[] }) {
  const { t } = useTranslation()
  return <div className="table-scroll rounded-3xl border border-border/60 bg-white/35 dark:bg-slate-900/30"><table className="w-full text-left text-sm"><thead><tr className="border-b border-border/60 text-muted"><th className="p-4">{t('appointments.patient')}</th><th className="p-4">{t('appointments.hospital')}</th><th className="p-4">{t('appointments.doctor')}</th><th className="p-4">{t('appointments.department')}</th><th className="p-4">{t('appointments.type')}</th><th className="p-4">{t('appointments.scheduled')}</th><th className="p-4">{t('common.status')}</th></tr></thead><tbody>{appointments.map((a) => <tr key={a.id} className="border-b border-border/40 last:border-0"><td className="p-4 font-semibold">{a.patient?.fullName ?? '—'}</td><td className="p-4">{a.hospital?.name ?? '—'}</td><td className="p-4">{a.doctor?.fullName ?? '—'}</td><td className="p-4">{a.department?.name ?? '—'}</td><td className="p-4">{t(`status.${a.appointmentType}`, a.appointmentType)}</td><td className="p-4"><p>{formatDateTime(a.scheduledStart)}</p><p className="text-xs text-muted">{formatDateTime(a.scheduledEnd)}</p></td><td className="p-4"><StatusBadge status={a.status} /></td></tr>)}</tbody></table></div>
}
