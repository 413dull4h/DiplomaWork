import { Link } from 'react-router-dom'
import type { LabOrder } from '../../types/models'
import { formatDateTime, titleCase } from '../../utils/format'
import { GlassCard } from '../common/GlassCard'
import { StatusBadge } from '../common/StatusBadge'

export function OrderCard({ order }: { order: LabOrder }) {
  return (
    <GlassCard>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge value={order.status} />
            <StatusBadge value={order.source} />
          </div>
          <h3 className="mt-3 text-lg font-black text-slate-950 dark:text-white">{order.patient?.fullName || 'Unknown patient'}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
            {order.doctor?.fullName || 'No doctor'} · {order.hospital?.name || 'No hospital'}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {titleCase(order.collectionType)} · {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <p className="text-xs text-slate-500 dark:text-slate-400">{order.items.length} requested test(s)</p>
          <Link to={`/orders/${order.id}`} className="rounded-2xl bg-cyan-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-cyan-600/20 hover:bg-cyan-700">
            View order
          </Link>
        </div>
      </div>
    </GlassCard>
  )
}
