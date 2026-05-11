import { useMemo, useState } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { SearchInput } from '../../components/common/SearchInput'
import { Select } from '../../components/ui/Select'
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton'
import { ErrorState } from '../../components/common/ErrorState'
import { EmptyState } from '../../components/common/EmptyState'
import { OrderCard } from '../../components/cards/OrderCard'
import { useOrders } from './useOrders'
import type { LabOrderStatus } from '../../types/models'

const statuses: Array<'ALL' | LabOrderStatus> = ['ALL', 'REQUESTED', 'ACCEPTED', 'SAMPLE_COLLECTED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED', 'MISSED']

export function OrdersPage() {
  const orders = useOrders()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'ALL' | LabOrderStatus>('ALL')

  const filtered = useMemo(() => {
    return (orders.data ?? []).filter((order) => {
      const haystack = `${order.id} ${order.patient?.fullName ?? ''} ${order.doctor?.fullName ?? ''} ${order.hospital?.name ?? ''} ${order.items.map((item) => item.testName).join(' ')}`.toLowerCase()
      return haystack.includes(search.toLowerCase()) && (status === 'ALL' || order.status === status)
    })
  }, [orders.data, search, status])

  if (orders.isLoading) return <LoadingSkeleton />
  if (orders.error) return <ErrorState onRetry={() => void orders.refetch()} />

  return (
    <div>
      <PageHeader title="Lab Orders" subtitle="Incoming and processed diagnostic orders from careOS clinical workflows." />
      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_240px]">
        <SearchInput value={search} onChange={setSearch} placeholder="Search patient, doctor, hospital, test, or ID" />
        <Select value={status} onChange={(event) => setStatus(event.target.value as 'ALL' | LabOrderStatus)}>
          {statuses.map((item) => <option key={item} value={item}>{item.replace(/_/g, ' ')}</option>)}
        </Select>
      </div>
      {filtered.length ? <div className="grid gap-4">{filtered.map((order) => <OrderCard key={order.id} order={order} />)}</div> : <EmptyState title="No orders found" message="No lab orders match the current filter." />}
    </div>
  )
}
