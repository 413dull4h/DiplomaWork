import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ApiError } from '../../api/client'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ErrorState } from '../../components/ui/ErrorState'
import { TextArea } from '../../components/ui/Input'
import { LoadingState } from '../../components/ui/LoadingState'
import { formatTimeRange } from './appointmentUi'
import { useCreateDoctorEncounter, useDoctorAppointment } from './useDoctorAppointments'

const encounterSchema = z.object({
  chiefComplaint: z.string().optional(),
  notes: z.string().optional(),
  diagnosis: z.string().optional(),
  prescription: z.string().optional(),
  followUpInstructions: z.string().optional(),
})

type EncounterFormValues = z.infer<typeof encounterSchema>

export function CreateDoctorEncounterPage() {
  const { appointmentId = '' } = useParams()
  const navigate = useNavigate()
  const appointmentQuery = useDoctorAppointment(appointmentId)
  const createMutation = useCreateDoctorEncounter(appointmentId)
  const [submitError, setSubmitError] = useState('')

  const form = useForm<EncounterFormValues>({
    resolver: zodResolver(encounterSchema),
    defaultValues: {
      chiefComplaint: '',
      notes: '',
      diagnosis: '',
      prescription: '',
      followUpInstructions: '',
    },
  })

  async function onSubmit(values: EncounterFormValues) {
    setSubmitError('')
    try {
      await createMutation.mutateAsync(values)
      navigate(`/appointments/${appointmentId}`)
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : 'Could not create encounter.')
    }
  }

  if (appointmentQuery.isLoading) return <LoadingState label="Loading appointment..." />

  if (appointmentQuery.isError) {
    const message = appointmentQuery.error instanceof ApiError ? appointmentQuery.error.message : 'Could not load appointment.'
    return <ErrorState message={message} onRetry={() => appointmentQuery.refetch()} />
  }

  const appointment = appointmentQuery.data

  if (!appointment) return <ErrorState message="Appointment response was empty." />

  if (appointment.encounter) {
    return <ErrorState message="An encounter already exists for this appointment." />
  }

  if (appointment.status !== 'CONFIRMED') {
    return <ErrorState message={`Only CONFIRMED appointments can create an encounter. Current status: ${appointment.status}.`} />
  }

  return (
    <div className="space-y-6">
      <Card glass elevated className="liquid-card">
        <Badge tone="green">Confirmed appointment</Badge>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">
          Create visit note
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          {appointment.patient?.fullName ?? 'Patient'} • {formatTimeRange(appointment.scheduledStart, appointment.scheduledEnd)}
        </p>
      </Card>

      <form className="grid gap-6 xl:grid-cols-[1fr_360px]" onSubmit={form.handleSubmit(onSubmit)}>
        <Card elevated className="space-y-4">
          <TextArea label="Chief complaint" placeholder="Main concern described by patient..." {...form.register('chiefComplaint')} />
          <TextArea label="Clinical notes" placeholder="Observation, history, assessment..." {...form.register('notes')} />
          <TextArea label="Diagnosis" placeholder="Working diagnosis or final diagnosis..." {...form.register('diagnosis')} />
          <TextArea label="Prescription" placeholder="Medication, dosage, timing, duration..." {...form.register('prescription')} />
          <TextArea label="Follow-up instructions" placeholder="Follow-up timing, warning signs, lifestyle advice..." {...form.register('followUpInstructions')} />

          {submitError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
              {submitError}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" isLoading={createMutation.isPending}>Save encounter</Button>
            <Button type="button" variant="secondary" onClick={() => navigate(`/appointments/${appointmentId}`)}>
              Cancel
            </Button>
          </div>
        </Card>

        <Card elevated className="h-fit border-blue-200 bg-blue-50/70 dark:border-blue-900 dark:bg-blue-950/20">
          <Badge tone="blue">Doctor-scoped record</Badge>
          <h2 className="mt-4 text-lg font-black text-blue-950 dark:text-blue-100">What happens after save?</h2>
          <p className="mt-2 text-sm leading-6 text-blue-800 dark:text-blue-200">
            The backend creates an encounter for this appointment and marks the appointment as completed. The patient can then see the medical record in their portal.
          </p>
          <p className="mt-4 text-xs leading-5 text-blue-700/80 dark:text-blue-200/80">
            Do not include unrelated patient data. Only document what belongs to this visit.
          </p>
        </Card>
      </form>
    </div>
  )
}
