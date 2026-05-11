import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../../components/common/PageHeader'
import { GlassCard } from '../../components/common/GlassCard'
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton'
import { ErrorState } from '../../components/common/ErrorState'
import { StatusBadge } from '../../components/common/StatusBadge'
import { Button } from '../../components/ui/Button'
import { formatDateTime, formatMoney, titleCase } from '../../utils/format'
import { useTest, useUpdateTest } from './useTests'

function Info({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <dt className="text-sm text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-1 font-black text-slate-950 dark:text-white">{value || '—'}</dd>
    </div>
  )
}

export function TestDetailPage() {
  const { id } = useParams()
  const test = useTest(id)
  const update = useUpdateTest()

  if (test.isLoading) return <LoadingSkeleton />
  if (test.error || !test.data) return <ErrorState />

  const item = test.data

  return (
    <div>
      <PageHeader
        title={item.name}
        subtitle="Test catalog detail"
        actions={
          <>
            <Link to={`/tests/${item.id}/edit`}><Button>Edit</Button></Link>
            <Button variant="secondary" disabled={update.isPending} onClick={() => update.mutate({ id: item.id, payload: { isActive: !item.isActive } })}>
              {item.isActive ? 'Disable' : 'Enable'}
            </Button>
          </>
        }
      />
      <GlassCard>
        <div className="mb-5 flex flex-wrap gap-2"><StatusBadge value={item.isActive ? 'ACTIVE' : 'INACTIVE'} /><StatusBadge value={item.category} /><StatusBadge value={item.sampleType} /></div>
        <dl className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <Info label="Code" value={item.code} />
          <Info label="Category" value={titleCase(item.category)} />
          <Info label="Sample type" value={titleCase(item.sampleType)} />
          <Info label="Price" value={formatMoney(item.price)} />
          <Info label="Turnaround" value={item.turnaroundTimeHours ? `${item.turnaroundTimeHours} hours` : null} />
          <Info label="Updated" value={formatDateTime(item.updatedAt)} />
        </dl>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Info label="Patient instructions" value={item.patientInstructions} />
          <Info label="Description" value={item.description} />
        </div>
      </GlassCard>
    </div>
  )
}
