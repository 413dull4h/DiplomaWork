import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { BackButton } from '@/components/common/BackButton'
import { FormFieldWrapper } from '@/components/common/FormFieldWrapper'
import { GlassCard } from '@/components/common/GlassCard'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useCreateHospitalAdmin } from '@/hooks/useHospitals'

export function CreateHospitalAdminPage() {
  const { id = '' } = useParams(); const { t } = useTranslation(); const navigate = useNavigate(); const createAdmin = useCreateHospitalAdmin(id)
  const schema = z.object({ email: z.string().email(t('validation.email')), password: z.string().min(8, t('validation.passwordMin')), phone: z.string().optional() })
  type FormValues = z.infer<typeof schema>; const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '', phone: '' } })
  const submit = (values: FormValues) => createAdmin.mutate(values, { onSuccess: () => navigate(`/hospitals/${id}`) })
  return <div><PageHeader title={t('hospitals.createAdmin')} actions={<BackButton />} /><GlassCard className="max-w-2xl"><form className="space-y-4" onSubmit={form.handleSubmit(submit)}><FormFieldWrapper label={t('hospitals.adminEmail')} error={form.formState.errors.email?.message}><Input type="email" {...form.register('email')} /></FormFieldWrapper><FormFieldWrapper label={t('hospitals.adminPassword')} error={form.formState.errors.password?.message}><Input type="password" {...form.register('password')} /></FormFieldWrapper><FormFieldWrapper label={t('hospitals.adminPhone')} error={form.formState.errors.phone?.message}><Input {...form.register('phone')} /></FormFieldWrapper>{createAdmin.error ? <p className="rounded-2xl bg-red-500/10 p-3 text-sm text-danger">{createAdmin.error.message}</p> : null}<Button disabled={createAdmin.isPending}>{createAdmin.isPending ? t('common.loading') : t('common.create')}</Button></form></GlassCard></div>
}
