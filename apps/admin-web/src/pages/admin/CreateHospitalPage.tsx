import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { BackButton } from '@/components/common/BackButton'
import { FormFieldWrapper } from '@/components/common/FormFieldWrapper'
import { GlassCard } from '@/components/common/GlassCard'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useCreateHospital } from '@/hooks/useHospitals'

export function CreateHospitalPage() {
  const { t } = useTranslation(); const navigate = useNavigate(); const createHospital = useCreateHospital()
  const schema = z.object({ name: z.string().min(2, t('validation.required')), legalName: z.string().optional(), contactEmail: z.string().email(t('validation.email')).optional().or(z.literal('')), contactPhone: z.string().optional(), licenseNumber: z.string().optional(), timeZone: z.string().optional(), address: z.object({ line1: z.string().min(1, t('validation.required')), line2: z.string().optional(), city: z.string().min(1, t('validation.required')), state: z.string().optional(), postalCode: z.string().optional(), country: z.string().min(1, t('validation.required')) }) })
  type FormValues = z.infer<typeof schema>
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name:'', legalName:'', contactEmail:'', contactPhone:'', licenseNumber:'', timeZone:'Asia/Dhaka', address:{ line1:'', line2:'', city:'', state:'', postalCode:'', country:'Bangladesh'} } })
  const submit = (values: FormValues) => createHospital.mutate(values, { onSuccess: (hospital) => navigate(`/hospitals/${hospital.id}`) })
  const field = (name: keyof FormValues | `address.${keyof FormValues['address']}`, label: string) => <FormFieldWrapper label={label} error={(form.formState.errors as any)?.[name]?.message}><Input {...form.register(name as any)} /></FormFieldWrapper>
  return <div><PageHeader title={t('hospitals.createTitle')} actions={<BackButton />} /><GlassCard><form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(submit)}>{field('name', t('hospitals.name'))}{field('legalName', t('hospitals.legalName'))}{field('contactEmail', t('hospitals.contactEmail'))}{field('contactPhone', t('hospitals.contactPhone'))}{field('licenseNumber', t('hospitals.licenseNumber'))}{field('timeZone', t('hospitals.timeZone'))}<div className="md:col-span-2"><h2 className="mb-3 text-lg font-bold">{t('hospitals.address')}</h2></div>{field('address.line1', t('hospitals.line1'))}{field('address.line2', t('hospitals.line2'))}{field('address.city', t('hospitals.city'))}{field('address.state', t('hospitals.state'))}{field('address.postalCode', t('hospitals.postalCode'))}{field('address.country', t('hospitals.country'))}{createHospital.error ? <p className="md:col-span-2 rounded-2xl bg-red-500/10 p-3 text-sm text-danger">{createHospital.error.message}</p> : null}<div className="md:col-span-2"><Button disabled={createHospital.isPending}>{createHospital.isPending ? t('common.loading') : t('common.save')}</Button></div></form></GlassCard></div>
}
