import { useEffect, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PageHeader } from '../../components/common/PageHeader'
import { GlassCard } from '../../components/common/GlassCard'
import { ErrorState } from '../../components/common/ErrorState'
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { getErrorMessage } from '../../api/client'
import { sampleTypes, testCategories, testSchema, type TestFormValues } from './testSchemas'
import { useCreateTest, useTest, useUpdateTest } from './useTests'

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">{label}</span>
      {children}
      {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
    </label>
  )
}

export function TestFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate()
  const params = useParams()
  const test = useTest(mode === 'edit' ? params.id : undefined)
  const create = useCreateTest()
  const update = useUpdateTest()

  const form = useForm<TestFormValues>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      name: '',
      code: '',
      category: 'GENERAL',
      sampleType: 'BLOOD',
      patientInstructions: '',
      description: '',
      isActive: true,
    },
  })

  useEffect(() => {
    if (test.data && mode === 'edit') {
      form.reset({
        name: test.data.name,
        code: test.data.code,
        category: test.data.category,
        sampleType: test.data.sampleType,
        price: test.data.price ? Number(test.data.price) : undefined,
        turnaroundTimeHours: test.data.turnaroundTimeHours ?? undefined,
        patientInstructions: test.data.patientInstructions ?? '',
        description: test.data.description ?? '',
        isActive: test.data.isActive,
      })
    }
  }, [test.data, mode, form])

  if (mode === 'edit' && test.isLoading) return <LoadingSkeleton />
  if (mode === 'edit' && test.error) return <ErrorState message={getErrorMessage(test.error)} />

  const onSubmit = (values: TestFormValues) => {
    const payload = {
      ...values,
      price: values.price === undefined ? undefined : Number(values.price),
      turnaroundTimeHours:
        values.turnaroundTimeHours === undefined ? undefined : Number(values.turnaroundTimeHours),
    }

    if (mode === 'create') {
      create.mutate(payload, { onSuccess: (created) => navigate(`/tests/${created.id}`) })
    } else if (params.id) {
      update.mutate({ id: params.id, payload }, { onSuccess: () => navigate(`/tests/${params.id}`) })
    }
  }

  const error = create.error || update.error

  return (
    <div>
      <PageHeader title={mode === 'create' ? 'Add test' : 'Edit test'} subtitle="Use the real Lab API test catalog endpoints." />
      <GlassCard className="max-w-3xl">
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Test name" error={form.formState.errors.name?.message}><Input {...form.register('name')} /></Field>
            <Field label="Code" error={form.formState.errors.code?.message}><Input {...form.register('code')} /></Field>
            <Field label="Category"><Select {...form.register('category')}>{testCategories.map((item) => <option key={item} value={item}>{item.replace(/_/g, ' ')}</option>)}</Select></Field>
            <Field label="Sample type"><Select {...form.register('sampleType')}>{sampleTypes.map((item) => <option key={item} value={item}>{item.replace(/_/g, ' ')}</option>)}</Select></Field>
            <Field label="Price"><Input type="number" min="0" step="1" {...form.register('price')} /></Field>
            <Field label="Turnaround time hours"><Input type="number" min="1" step="1" {...form.register('turnaroundTimeHours')} /></Field>
          </div>

          <Field label="Patient instructions"><Textarea {...form.register('patientInstructions')} /></Field>
          <Field label="Description"><Textarea {...form.register('description')} /></Field>

          {mode === 'edit' ? (
            <label className="flex items-center gap-3 rounded-2xl bg-slate-100 p-4 text-sm font-bold dark:bg-white/10">
              <input type="checkbox" {...form.register('isActive')} /> Active test
            </label>
          ) : null}

          {error ? <p className="rounded-2xl bg-rose-500/10 p-3 text-sm font-semibold text-rose-700">{getErrorMessage(error)}</p> : null}

          <div className="flex gap-2">
            <Button type="submit" disabled={create.isPending || update.isPending}>{mode === 'create' ? 'Create test' : 'Save changes'}</Button>
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
          </div>
        </form>
      </GlassCard>
    </div>
  )
}
