import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { AdminAppointment, RecentAppointment } from '@/types/models'
import { formatDateTime } from '@/utils/format'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from './StatusBadge'

type AppointmentLike = AdminAppointment | RecentAppointment

function getEncounterId(appointment: AppointmentLike) {
  return 'encounter' in appointment ? appointment.encounter?.id : undefined
}

export function AppointmentTable({ appointments, showActions = false }: { appointments: AppointmentLike[]; showActions?: boolean }) {
  const { t } = useTranslation()

  return <div className="table-scroll rounded-3xl border border-border/60 bg-white/35 dark:bg-slate-900/30">
    <table className="w-full min-w-[1100px] text-left text-sm">
      <thead>
        <tr className="border-b border-border/60 text-muted">
          <th className="p-4">{t('appointments.patient')}</th>
          <th className="p-4">{t('appointments.hospital')}</th>
          <th className="p-4">{t('appointments.doctor')}</th>
          <th className="p-4">{t('appointments.department')}</th>
          <th className="p-4">{t('appointments.type')}</th>
          <th className="p-4">{t('appointments.scheduledStart')}</th>
          <th className="p-4">{t('appointments.scheduledEnd')}</th>
          <th className="p-4">{t('common.status')}</th>
          <th className="p-4">{t('appointments.reason')}</th>
          <th className="p-4">{t('appointments.encounter')}</th>
          {showActions ? <th className="p-4 text-right">{t('common.actions')}</th> : null}
        </tr>
      </thead>
      <tbody>
        {appointments.map((appointment) => {
          const encounterId = getEncounterId(appointment)

          return <tr key={appointment.id} className="border-b border-border/40 transition last:border-0 hover:bg-white/40 dark:hover:bg-white/5">
            <td className="p-4">
              <p className="font-semibold">{appointment.patient?.fullName ?? '—'}</p>
              <p className="text-xs text-muted">{(appointment.patient as any)?.user?.email ?? appointment.patient?.phone ?? '—'}</p>
            </td>
            <td className="p-4">{appointment.hospital?.name ?? '—'}</td>
            <td className="p-4">
              <p>{appointment.doctor?.fullName ?? '—'}</p>
              <p className="text-xs text-muted">{appointment.doctor?.specialization ?? '—'}</p>
            </td>
            <td className="p-4">{appointment.department?.name ?? '—'}</td>
            <td className="p-4">{t(`status.${appointment.appointmentType}`, appointment.appointmentType)}</td>
            <td className="p-4">{formatDateTime(appointment.scheduledStart)}</td>
            <td className="p-4">{formatDateTime(appointment.scheduledEnd)}</td>
            <td className="p-4"><StatusBadge status={appointment.status} /></td>
            <td className="max-w-[260px] p-4 text-muted">{appointment.reason || '—'}</td>
            <td className="p-4">{encounterId ? <Link className="font-semibold text-primary hover:underline" to={`/appointments/${appointment.id}`}>{t('appointments.viewEncounter')}</Link> : <span className="text-muted">{t('appointments.noEncounter')}</span>}</td>
            {showActions ? <td className="p-4 text-right"><Link to={`/appointments/${appointment.id}`}><Button variant="secondary">{t('common.view')}</Button></Link></td> : null}
          </tr>
        })}
      </tbody>
    </table>
  </div>
}
