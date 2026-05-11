import { useMemo, useState } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { SearchInput } from '../../components/common/SearchInput'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton'
import { ReportCard } from '../../components/cards/ReportCard'
import { useReports } from './useReports'

export function ReportsPage() {
  const reports = useReports()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return (reports.data ?? []).filter((report) =>
      `${report.title} ${report.summary ?? ''} ${report.patient?.fullName ?? ''} ${report.doctor?.fullName ?? ''}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
  }, [reports.data, search])

  if (reports.isLoading) return <LoadingSkeleton />
  if (reports.error) return <ErrorState onRetry={() => void reports.refetch()} />

  return (
    <div>
      <PageHeader title="Reports" subtitle="Reports are derived from real /lab/orders data because the current backend does not expose GET /lab/reports." />
      <div className="mb-5 max-w-xl">
        <SearchInput value={search} onChange={setSearch} placeholder="Search report, patient, or doctor" />
      </div>
      {filtered.length ? <div className="grid gap-4">{filtered.map((report) => <ReportCard key={report.id} report={report} />)}</div> : <EmptyState title="No reports found" message="Uploaded lab reports will appear here." />}
    </div>
  )
}
