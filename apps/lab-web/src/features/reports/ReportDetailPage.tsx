import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../../components/common/PageHeader'
import { GlassCard } from '../../components/common/GlassCard'
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton'
import { ErrorState } from '../../components/common/ErrorState'
import { StatusBadge } from '../../components/common/StatusBadge'
import { Button } from '../../components/ui/Button'
import { formatBytes, formatDateTime } from '../../utils/format'
import { toAbsoluteFileUrl } from '../../utils/fileUrl'
import { getErrorMessage } from '../../api/client'
import { useReport } from './useReports'

function Info({ label, value }: { label: string; value?: string | number | null }) {
  return <div><dt className="text-sm text-slate-500 dark:text-slate-400">{label}</dt><dd className="mt-1 font-black text-slate-950 dark:text-white">{value || '—'}</dd></div>
}

export function ReportDetailPage() {
  const { id } = useParams()
  const report = useReport(id)

  if (report.isLoading) return <LoadingSkeleton />
  if (report.error || !report.data) return <ErrorState message={getErrorMessage(report.error)} />

  const item = report.data
  const url = toAbsoluteFileUrl(item.fileUrl)

  return (
    <div>
      <PageHeader title={item.title} subtitle="Lab report detail" actions={<><Link to="/reports"><Button variant="secondary">Back</Button></Link>{url ? <a href={url} target="_blank" rel="noreferrer"><Button>Open Report</Button></a> : null}</>} />
      <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <GlassCard>
          <div className="mb-5 flex flex-wrap gap-2"><StatusBadge value={item.status} /></div>
          <dl className="grid gap-5 md:grid-cols-2">
            <Info label="Patient" value={item.patient?.fullName} />
            <Info label="Doctor" value={item.doctor?.fullName} />
            <Info label="Hospital" value={item.hospital?.name} />
            <Info label="Lab" value={item.lab?.name} />
            <Info label="Uploaded" value={formatDateTime(item.createdAt)} />
            <Info label="Finalized" value={formatDateTime(item.finalizedAt)} />
            <Info label="Original file" value={item.originalName} />
            <Info label="File size" value={formatBytes(item.sizeBytes)} />
          </dl>
          <div className="mt-6"><Info label="Summary" value={item.summary} /></div>
        </GlassCard>
        <GlassCard>
          <h3 className="mb-4 text-lg font-black text-slate-950 dark:text-white">Requested tests</h3>
          <div className="space-y-3">
            {item.labOrder?.items?.map((test) => <div key={test.id} className="rounded-2xl bg-slate-100 p-4 dark:bg-white/10"><p className="font-black text-slate-950 dark:text-white">{test.testName}</p><p className="text-sm text-slate-500 dark:text-slate-300">{test.testCode || 'No code'}</p></div>)}
          </div>
          {item.resultData ? <pre className="mt-5 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify(item.resultData, null, 2)}</pre> : null}
        </GlassCard>
      </div>
    </div>
  )
}
