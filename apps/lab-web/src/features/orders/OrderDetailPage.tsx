import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PageHeader } from '../../components/common/PageHeader'
import { GlassCard } from '../../components/common/GlassCard'
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton'
import { ErrorState } from '../../components/common/ErrorState'
import { StatusBadge } from '../../components/common/StatusBadge'
import { FileUploadBox } from '../../components/common/FileUploadBox'
import { Button } from '../../components/ui/Button'
import { Textarea } from '../../components/ui/Textarea'
import { Input } from '../../components/ui/Input'
import { formatDateTime, formatMoney, titleCase } from '../../utils/format'
import { toAbsoluteFileUrl } from '../../utils/fileUrl'
import { getErrorMessage } from '../../api/client'
import {
  useAcceptOrder,
  useCompleteOrder,
  useInProgressOrder,
  useOrder,
  useRejectOrder,
  useSampleCollectedOrder,
} from './useOrders'
import { rejectOrderSchema, reportUploadSchema, type RejectOrderFormValues, type ReportUploadFormValues } from './orderSchemas'
import { useUploadReport } from '../reports/useReports'

function Info({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <dt className="text-sm text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-1 font-black text-slate-950 dark:text-white">{value || '—'}</dd>
    </div>
  )
}

export function OrderDetailPage() {
  const { id } = useParams()
  const order = useOrder(id)
  const accept = useAcceptOrder()
  const reject = useRejectOrder()
  const sample = useSampleCollectedOrder()
  const progress = useInProgressOrder()
  const complete = useCompleteOrder()
  const upload = useUploadReport()
  const [file, setFile] = useState<File | null>(null)
  const [success, setSuccess] = useState('')

  const rejectForm = useForm<RejectOrderFormValues>({ resolver: zodResolver(rejectOrderSchema), defaultValues: { rejectionReason: '' } })
  const reportForm = useForm<ReportUploadFormValues>({ resolver: zodResolver(reportUploadSchema), defaultValues: { title: '', summary: '', status: 'FINAL', resultData: '' } })

  if (order.isLoading) return <LoadingSkeleton />
  if (order.error || !order.data) return <ErrorState message={getErrorMessage(order.error)} />

  const item = order.data
  const anyPending = accept.isPending || reject.isPending || sample.isPending || progress.isPending || complete.isPending || upload.isPending

  const runOrderAction = (run: () => void) => {
    setSuccess('')
    run()
  }

  return (
    <div>
      <PageHeader title={`Order ${item.id.slice(0, 8)}`} subtitle="Lab order detail and workflow actions." actions={<Link to="/orders"><Button variant="secondary">Back to orders</Button></Link>} />
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <GlassCard>
            <div className="flex flex-wrap gap-2"><StatusBadge value={item.status} /><StatusBadge value={item.source} /><StatusBadge value={item.collectionType} /></div>
            <dl className="mt-5 grid gap-5 md:grid-cols-2">
              <Info label="Patient" value={item.patient?.fullName} />
              <Info label="Doctor" value={item.doctor?.fullName} />
              <Info label="Hospital" value={item.hospital?.name} />
              <Info label="Created" value={formatDateTime(item.createdAt)} />
              <Info label="Reason" value={item.reason} />
              <Info label="Clinical notes" value={item.clinicalNotes} />
              <Info label="Sample collected" value={formatDateTime(item.sampleCollectedAt)} />
              <Info label="Completed" value={formatDateTime(item.completedAt)} />
            </dl>
          </GlassCard>

          <GlassCard>
            <h3 className="mb-4 text-lg font-black text-slate-950 dark:text-white">Requested tests</h3>
            <div className="space-y-3">
              {item.items.map((test) => (
                <div key={test.id} className="rounded-2xl bg-slate-100 p-4 dark:bg-white/10">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-black text-slate-950 dark:text-white">{test.testName}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-300">{test.testCode || 'No code'} · {titleCase(test.labTest?.sampleType)}</p>
                      {test.labTest?.patientInstructions ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{test.labTest.patientInstructions}</p> : null}
                    </div>
                    <p className="font-black text-slate-950 dark:text-white">{formatMoney(test.price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="mb-4 text-lg font-black text-slate-950 dark:text-white">Reports</h3>
            {item.reports?.length ? (
              <div className="space-y-3">
                {item.reports.map((report) => (
                  <div key={report.id} className="flex flex-col gap-3 rounded-2xl bg-slate-100 p-4 dark:bg-white/10 md:flex-row md:items-center md:justify-between">
                    <div><p className="font-black text-slate-950 dark:text-white">{report.title}</p><p className="text-sm text-slate-500 dark:text-slate-300">{formatDateTime(report.createdAt)}</p></div>
                    <div className="flex gap-2"><Link to={`/reports/${report.id}`}><Button variant="secondary">Details</Button></Link>{report.fileUrl ? <a href={toAbsoluteFileUrl(report.fileUrl)} target="_blank" rel="noreferrer"><Button>Open</Button></a> : null}</div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-slate-500 dark:text-slate-300">No report uploaded yet.</p>}
          </GlassCard>
        </div>

        <div className="space-y-5">
          <GlassCard>
            <h3 className="text-lg font-black text-slate-950 dark:text-white">Order actions</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {item.status === 'REQUESTED' || item.status === 'NEW' ? <Button disabled={anyPending} onClick={() => runOrderAction(() => accept.mutate(item.id, { onSuccess: () => setSuccess('Order updated successfully.') }))}>Accept</Button> : null}
              {item.status === 'ACCEPTED' || item.status === 'SCHEDULED' ? <Button disabled={anyPending} onClick={() => runOrderAction(() => sample.mutate(item.id, { onSuccess: () => setSuccess('Order updated successfully.') }))}>Sample collected</Button> : null}
              {item.status === 'SAMPLE_COLLECTED' ? <Button disabled={anyPending} onClick={() => runOrderAction(() => progress.mutate(item.id, { onSuccess: () => setSuccess('Order updated successfully.') }))}>In progress</Button> : null}
              {item.status === 'IN_PROGRESS' ? <Button disabled={anyPending} onClick={() => runOrderAction(() => complete.mutate(item.id, { onSuccess: () => setSuccess('Order updated successfully.') }))}>Complete</Button> : null}
            </div>
            {(item.status === 'REQUESTED' || item.status === 'NEW') ? (
              <form className="mt-5 space-y-3" onSubmit={rejectForm.handleSubmit((values) => reject.mutate({ id: item.id, rejectionReason: values.rejectionReason }, { onSuccess: () => setSuccess('Order rejected.') }))}>
                <Textarea placeholder="Rejection reason" {...rejectForm.register('rejectionReason')} />
                {rejectForm.formState.errors.rejectionReason ? <p className="text-sm text-rose-600">{rejectForm.formState.errors.rejectionReason.message}</p> : null}
                <Button variant="danger" disabled={anyPending}>Reject order</Button>
              </form>
            ) : null}
            {success ? <p className="mt-4 rounded-2xl bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-700 dark:text-emerald-200">{success}</p> : null}
            {(accept.error || reject.error || sample.error || progress.error || complete.error) ? <p className="mt-4 rounded-2xl bg-rose-500/10 p-3 text-sm text-rose-700">{getErrorMessage(accept.error || reject.error || sample.error || progress.error || complete.error)}</p> : null}
          </GlassCard>

          <GlassCard>
            <h3 className="text-lg font-black text-slate-950 dark:text-white">Upload report</h3>
            {item.status !== 'COMPLETED' ? <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">Backend allows report upload only after order is COMPLETED.</p> : null}
            <form className="mt-4 space-y-4" onSubmit={reportForm.handleSubmit((values) => {
              if (!file) return
              upload.mutate({ orderId: item.id, file, ...values }, { onSuccess: () => { setSuccess('Report uploaded successfully.'); reportForm.reset({ title: '', summary: '', status: 'FINAL', resultData: '' }); setFile(null) } })
            })}>
              <Input placeholder="Report title" {...reportForm.register('title')} disabled={item.status !== 'COMPLETED'} />
              <Textarea placeholder="Summary / notes" {...reportForm.register('summary')} disabled={item.status !== 'COMPLETED'} />
              <Textarea placeholder='Optional JSON result data, e.g. {"cbc":"normal"}' {...reportForm.register('resultData')} disabled={item.status !== 'COMPLETED'} />
              <FileUploadBox accept="application/pdf,image/jpeg,image/png,image/webp" disabled={item.status !== 'COMPLETED'} onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
              {file ? <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Selected: {file.name}</p> : null}
              <Button type="submit" disabled={item.status !== 'COMPLETED' || !file || upload.isPending}>{upload.isPending ? 'Uploading...' : 'Upload report'}</Button>
              {upload.error ? <p className="rounded-2xl bg-rose-500/10 p-3 text-sm text-rose-700">{getErrorMessage(upload.error)}</p> : null}
            </form>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
