import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BackButton } from '@/components/common/BackButton'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { GlassCard } from '@/components/common/GlassCard'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/Button'
import { useAppointment } from '@/hooks/useAppointments'
import { addressSummary, formatDateTime } from '@/utils/format'

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return <div>
    <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
    <p className="mt-1 break-words font-semibold">{value || '—'}</p>
  </div>
}

export function AppointmentDetailsPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const appointmentQuery = useAppointment(id)

  if (appointmentQuery.isLoading) return <LoadingSkeleton rows={6} />
  if (appointmentQuery.isError) return <ErrorState message={appointmentQuery.error.message} onRetry={() => appointmentQuery.refetch()} />

  const appointment = appointmentQuery.data
  if (!appointment) return <EmptyState title={t('appointments.notFound')} />

  return <div>
    <PageHeader
      title={t('appointments.detailTitle')}
      subtitle={appointment.id}
      actions={<div className="flex flex-wrap gap-2"><BackButton /><Button variant="secondary" onClick={() => appointmentQuery.refetch()}>{t('common.refresh')}</Button></div>}
    />

    <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
      <div className="space-y-5">
        <GlassCard>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">{t('appointments.appointmentInfo')}</h2>
              <p className="text-sm text-muted">{t('appointments.readOnlyNotice')}</p>
            </div>
            <StatusBadge status={appointment.status} />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field label={t('appointments.type')} value={t(`status.${appointment.appointmentType}`, appointment.appointmentType)} />
            <Field label={t('appointments.scheduledStart')} value={formatDateTime(appointment.scheduledStart)} />
            <Field label={t('appointments.scheduledEnd')} value={formatDateTime(appointment.scheduledEnd)} />
            <Field label={t('appointments.reason')} value={appointment.reason} />
            <Field label={t('appointments.cancellationReason')} value={appointment.cancellationReason} />
            <Field label={t('common.created')} value={formatDateTime(appointment.createdAt)} />
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="mb-4 text-xl font-bold">{t('appointments.participants')}</h2>
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-3xl border border-border/60 bg-white/35 p-4 dark:bg-slate-900/30">
              <p className="mb-3 text-xs uppercase tracking-wide text-muted">{t('appointments.patient')}</p>
              <h3 className="text-lg font-bold">{appointment.patient?.fullName ?? '—'}</h3>
              <p className="text-sm text-muted">{appointment.patient?.user?.email ?? '—'}</p>
              <p className="mt-1 text-sm text-muted">{appointment.patient?.phone ?? appointment.patient?.user?.phone ?? '—'}</p>
              {appointment.patient?.id ? <Link to={`/patients/${appointment.patient.id}`} className="mt-4 inline-block"><Button variant="secondary">{t('patients.viewPatient', 'View patient')}</Button></Link> : null}
            </div>

            <div className="rounded-3xl border border-border/60 bg-white/35 p-4 dark:bg-slate-900/30">
              <p className="mb-3 text-xs uppercase tracking-wide text-muted">{t('appointments.hospital')}</p>
              <h3 className="text-lg font-bold">{appointment.hospital?.name ?? '—'}</h3>
              <p className="text-sm text-muted">{appointment.hospital?.contactEmail ?? '—'}</p>
              <p className="mt-1 text-sm text-muted">{addressSummary(appointment.hospital?.address)}</p>
              {appointment.hospital?.id ? <Link to={`/hospitals/${appointment.hospital.id}`} className="mt-4 inline-block"><Button variant="secondary">{t('hospitals.viewDetails', 'View hospital')}</Button></Link> : null}
            </div>

            <div className="rounded-3xl border border-border/60 bg-white/35 p-4 dark:bg-slate-900/30">
              <p className="mb-3 text-xs uppercase tracking-wide text-muted">{t('appointments.doctor')}</p>
              <h3 className="text-lg font-bold">{appointment.doctor?.fullName ?? '—'}</h3>
              <p className="text-sm text-muted">{appointment.doctor?.specialization ?? '—'}</p>
              <p className="mt-1 text-sm text-muted">{appointment.doctor?.licenseNumber ?? '—'}</p>
            </div>

            <div className="rounded-3xl border border-border/60 bg-white/35 p-4 dark:bg-slate-900/30">
              <p className="mb-3 text-xs uppercase tracking-wide text-muted">{t('appointments.department')}</p>
              <h3 className="text-lg font-bold">{appointment.department?.name ?? '—'}</h3>
              <p className="text-sm text-muted">{appointment.department?.description ?? '—'}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="space-y-5">
        <GlassCard>
          <h2 className="mb-4 text-xl font-bold">{t('appointments.linkedEncounter')}</h2>
          {appointment.encounter ? <div className="space-y-4">
            <Field label={t('records.diagnosis', 'Diagnosis')} value={appointment.encounter.diagnosis} />
            <Field label={t('records.chiefComplaint', 'Chief complaint')} value={appointment.encounter.chiefComplaint} />
            <Field label={t('records.prescription', 'Prescription')} value={appointment.encounter.prescription} />
            <Field label={t('records.followUpInstructions', 'Follow-up instructions')} value={appointment.encounter.followUpInstructions} />
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">{t('records.notes', 'Notes')}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted">{appointment.encounter.notes || '—'}</p>
            </div>
          </div> : <EmptyState title={t('appointments.noEncounter')} />}
        </GlassCard>

        <GlassCard>
          <h2 className="mb-4 text-xl font-bold">{t('appointments.rawIdentifiers')}</h2>
          <div className="space-y-3 text-sm">
            <Field label="appointmentId" value={appointment.id} />
            <Field label="patientId" value={appointment.patientId} />
            <Field label="hospitalId" value={appointment.hospitalId} />
            <Field label="hospitalDoctorId" value={appointment.hospitalDoctorId} />
            <Field label="doctorId" value={appointment.doctorId} />
            <Field label="departmentId" value={appointment.departmentId} />
          </div>
        </GlassCard>
      </div>
    </div>
  </div>
}
