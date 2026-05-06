import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ErrorState } from '../../components/ui/ErrorState'
import { Input, TextArea } from '../../components/ui/Input'
import { LoadingState } from '../../components/ui/LoadingState'
import { editDoctorProfileSchema, type EditDoctorProfileForm } from './profileSchema'
import { useDoctorMe, useDoctorProfile, useUpdateDoctorProfile } from './useDoctorProfile'

function toNumber(value: string | number | null | undefined) {
  const parsed = Number(value ?? 0)
  return Number.isNaN(parsed) ? 0 : parsed
}

export function EditDoctorProfilePage() {
  const navigate = useNavigate()
  const [success, setSuccess] = useState<string | null>(null)
  const profileQuery = useDoctorProfile()
  const meQuery = useDoctorMe()
  const updateMutation = useUpdateDoctorProfile()

  const form = useForm<EditDoctorProfileForm>({
    resolver: zodResolver(editDoctorProfileSchema),
    defaultValues: {
      fullName: '',
      bio: '',
      yearsExperience: 0,
      consultationFee: 0,
    },
  })

  useEffect(() => {
    if (profileQuery.data?.doctor) {
      form.reset({
        fullName: profileQuery.data.doctor.fullName ?? '',
        bio: profileQuery.data.doctor.bio ?? '',
        yearsExperience: profileQuery.data.doctor.yearsExperience ?? 0,
        consultationFee: toNumber(profileQuery.data.doctor.consultationFee),
      })
    }
  }, [profileQuery.data, form])

  if (profileQuery.isLoading) return <LoadingState label="Loading editable profile..." />

  if (profileQuery.isError) {
    const message = profileQuery.error instanceof ApiError ? profileQuery.error.message : 'Could not load profile.'
    return <ErrorState message={message} onRetry={() => profileQuery.refetch()} />
  }

  const data = profileQuery.data
  if (!data) return <ErrorState message="Profile response was empty." />

  const { doctor, hospital, department } = data
  const user = doctor.user ?? meQuery.data?.user ?? null
  const errorMessage = updateMutation.error instanceof ApiError ? updateMutation.error.message : undefined

  async function onSubmit(values: EditDoctorProfileForm) {
    setSuccess(null)
    await updateMutation.mutateAsync({
      fullName: values.fullName,
      bio: values.bio || undefined,
      yearsExperience: values.yearsExperience,
      consultationFee: values.consultationFee,
    })
    setSuccess('Doctor profile updated successfully.')
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-600">Profile</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">Edit doctor profile</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Only hospital-approved editable fields are enabled.</p>
        </div>
        <Link to="/profile">
          <Button type="button" variant="secondary">Cancel</Button>
        </Link>
      </div>

      <form className="grid gap-6 lg:grid-cols-3" onSubmit={form.handleSubmit(onSubmit)}>
        <Card elevated className="space-y-5 lg:col-span-2">
          <h2 className="text-lg font-black text-slate-950 dark:text-white">Editable Fields</h2>
          <Input label="Full name" error={form.formState.errors.fullName?.message} {...form.register('fullName')} />
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Years experience"
              type="number"
              min={0}
              max={70}
              error={form.formState.errors.yearsExperience?.message}
              {...form.register('yearsExperience', { valueAsNumber: true })}
            />
            <Input
              label="Consultation fee"
              type="number"
              min={0}
              step="0.01"
              error={form.formState.errors.consultationFee?.message}
              {...form.register('consultationFee', { valueAsNumber: true })}
            />
          </div>
          <TextArea
            label="Bio"
            placeholder="Write a short professional summary..."
            error={form.formState.errors.bio?.message}
            {...form.register('bio')}
          />

          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
              {errorMessage}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
              {success}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" isLoading={updateMutation.isPending}>Save changes</Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/profile')}>Back to profile</Button>
          </div>
        </Card>

        <Card elevated className="space-y-5">
          <h2 className="text-lg font-black text-slate-950 dark:text-white">Locked Fields</h2>
          <DisabledField label="Email" value={user?.email} />
          <DisabledField label="Phone" value={user?.phone} hint="TODO: Add backend support if doctors should edit account phone." />
          <DisabledField label="Specialization" value={doctor.specialization} />
          <DisabledField label="License number" value={doctor.licenseNumber} />
          <DisabledField label="Languages" value={Array.isArray(doctor.languages) ? doctor.languages.join(', ') : doctor.languages} hint="Visible when backend supports doctor languages. Not submitted by this form yet." />
          <DisabledField label="Qualifications" value={Array.isArray(doctor.qualifications) ? doctor.qualifications.join(', ') : doctor.qualifications} hint="Visible when backend supports qualifications. Not submitted by this form yet." />
          <DisabledField label="Hospital" value={hospital.name} />
          <DisabledField label="Department" value={department?.name} />
          <DisabledField label="Role" value={user?.primaryRole ?? 'DOCTOR'} />
          <DisabledField label="Account status" value={user?.status ?? 'ACTIVE'} />
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/70">
            <Badge tone="amber">Admin controlled</Badge>
            <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Hospital assignment, department, license number, role, account status, phone, languages, and qualifications are not submitted unless backend support is explicitly added.
            </p>
          </div>
        </Card>
      </form>
    </div>
  )
}

function DisabledField({ label, value, hint }: { label: string; value: unknown; hint?: string }) {
  return (
    <div>
      <Input label={label} value={value ? String(value) : '—'} disabled readOnly />
      {hint ? <p className="mt-1 text-xs text-amber-600 dark:text-amber-300">{hint}</p> : null}
    </div>
  )
}
