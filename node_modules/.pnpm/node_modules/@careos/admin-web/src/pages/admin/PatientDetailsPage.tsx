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
import { usePatient } from '@/hooks/usePatients'
import { addressSummary, formatDate, formatDateTime } from '@/utils/format'

export function PatientDetailsPage() {
  const { id } = useParams()
  const { t } = useTranslation()
  const patientQuery = usePatient(id)

  if (patientQuery.isLoading) return <LoadingSkeleton rows={6} />
  if (patientQuery.isError) return <ErrorState message={patientQuery.error.message} onRetry={() => patientQuery.refetch()} />
  const patient = patientQuery.data
  if (!patient) return <EmptyState title={t('patients.notFound', 'Patient not found.')} />

  return <div>
    <PageHeader
      title={patient.fullName}
      subtitle={t('patients.detailSubtitle', 'Patient identity, account status, appointments, and medical record summaries.')}
      actions={<><BackButton />{patient.user ? <Link to={`/users/${patient.user.id}`}><Button variant="secondary">{t('users.viewAccount', 'View account')}</Button></Link> : null}</>}
    />

    <div className="grid gap-5 lg:grid-cols-3">
      <GlassCard className="lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">{t('patients.identity', 'Patient identity')}</h2><StatusBadge status={patient.user?.status} /></div>
        <dl className="mt-5 grid gap-4 md:grid-cols-2">
          <Info label={t('patients.name', 'Patient')} value={patient.fullName} />
          <Info label={t('auth.email', 'Email')} value={patient.user?.email} />
          <Info label={t('patients.phone', 'Phone')} value={patient.phone || patient.user?.phone} />
          <Info label={t('patients.gender', 'Gender')} value={patient.gender} />
          <Info label={t('patients.dateOfBirth', 'Date of birth')} value={formatDate(patient.dateOfBirth)} />
          <Info label={t('hospitals.address', 'Address')} value={addressSummary(patient.primaryAddress)} />
          <Info label={t('common.created')} value={formatDateTime(patient.createdAt)} />
          <Info label="ID" value={patient.id} />
        </dl>
      </GlassCard>

      <GlassCard>
        <h2 className="mb-4 text-xl font-bold">{t('patients.medicalBasics', 'Medical basics')}</h2>
        <div className="space-y-4">
          <Info label={t('patients.allergies', 'Allergies')} value={patient.allergies} />
          <Info label={t('patients.currentMedications', 'Current medications')} value={patient.currentMedications} />
          <Info label={t('patients.medicalHistory', 'Medical history')} value={patient.medicalHistory} />
          <Info label={t('patients.emergencyContact', 'Emergency contact')} value={[patient.emergencyContactName, patient.emergencyContactPhone].filter(Boolean).join(' · ')} />
        </div>
      </GlassCard>

      <GlassCard className="lg:col-span-3">
        <h2 className="mb-4 text-xl font-bold">{t('appointments.title', 'Appointments')}</h2>
        {patient.appointments?.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-border text-xs uppercase tracking-wide text-muted"><tr><th className="px-4 py-3">{t('hospitals.name', 'Hospital')}</th><th className="px-4 py-3">{t('appointments.doctor', 'Doctor')}</th><th className="px-4 py-3">{t('appointments.scheduled', 'Scheduled')}</th><th className="px-4 py-3">{t('common.status')}</th><th className="px-4 py-3">{t('appointments.reason', 'Reason')}</th></tr></thead><tbody className="divide-y divide-border">{patient.appointments.map((appointment) => <tr key={appointment.id}><td className="px-4 py-3 font-semibold">{appointment.hospital?.name || '—'}</td><td className="px-4 py-3">{appointment.doctor?.fullName || '—'}</td><td className="px-4 py-3 text-muted">{formatDateTime(appointment.scheduledStart)}</td><td className="px-4 py-3"><StatusBadge status={appointment.status} /></td><td className="px-4 py-3 text-muted">{appointment.reason || '—'}</td></tr>)}</tbody></table></div> : <EmptyState title={t('appointments.empty', 'No appointments found.')} />}
      </GlassCard>

      <GlassCard className="lg:col-span-3">
        <h2 className="mb-4 text-xl font-bold">{t('records.title', 'Medical records')}</h2>
        {patient.encounters?.length ? <div className="grid gap-3 md:grid-cols-2">{patient.encounters.map((encounter) => <div key={encounter.id} className="rounded-2xl bg-white/50 p-4 dark:bg-white/10"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-bold">{encounter.diagnosis || t('records.untitled', 'Encounter record')}</p><p className="text-xs text-muted">{encounter.doctor?.fullName || '—'} · {encounter.hospital?.name || '—'}</p></div><p className="text-xs text-muted">{formatDateTime(encounter.createdAt)}</p></div><p className="mt-3 text-sm text-muted">{encounter.chiefComplaint || encounter.notes || '—'}</p><p className="mt-3 text-sm font-semibold">{encounter.prescription || '—'}</p></div>)}</div> : <EmptyState title={t('records.empty', 'No medical records found.')} />}
      </GlassCard>
    </div>
  </div>
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return <div><dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt><dd className="mt-1 break-words font-semibold">{value || '—'}</dd></div>
}
