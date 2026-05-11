import { Link } from 'react-router-dom'
import type { LabReport } from '../../types/models'
import { formatBytes, formatDateTime } from '../../utils/format'
import { toAbsoluteFileUrl } from '../../utils/fileUrl'
import { GlassCard } from '../common/GlassCard'
import { StatusBadge } from '../common/StatusBadge'

export function ReportCard({ report }: { report: LabReport }) {
  const fileUrl = toAbsoluteFileUrl(report.fileUrl)

  return (
    <GlassCard>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <StatusBadge value={report.status} />
          <h3 className="mt-3 text-lg font-black text-slate-950 dark:text-white">{report.title}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{report.patient?.fullName || 'Unknown patient'} · {report.doctor?.fullName || 'No doctor'}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatDateTime(report.createdAt)} · {formatBytes(report.sizeBytes)}</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/reports/${report.id}`} className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-2 text-sm font-black text-slate-800 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white">
            Details
          </Link>
          {fileUrl ? (
            <a href={fileUrl} target="_blank" rel="noreferrer" className="rounded-2xl bg-cyan-600 px-4 py-2 text-sm font-black text-white hover:bg-cyan-700">
              Open
            </a>
          ) : null}
        </div>
      </div>
    </GlassCard>
  )
}
