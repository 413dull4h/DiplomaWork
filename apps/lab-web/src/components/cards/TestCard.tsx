import { Link } from 'react-router-dom'
import type { TestCatalogItem } from '../../types/models'
import { formatMoney, titleCase } from '../../utils/format'
import { StatusBadge } from '../common/StatusBadge'
import { GlassCard } from '../common/GlassCard'

export function TestCard({ test }: { test: TestCatalogItem }) {
  return (
    <GlassCard>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-cyan-600 dark:text-cyan-300">{test.code}</p>
          <h3 className="mt-1 text-lg font-black text-slate-950 dark:text-white">{test.name}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
            {titleCase(test.category)} · {titleCase(test.sampleType)}
          </p>
        </div>
        <StatusBadge value={test.isActive ? 'ACTIVE' : 'INACTIVE'} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-slate-500 dark:text-slate-400">Price</p>
          <p className="font-bold text-slate-900 dark:text-white">{formatMoney(test.price)}</p>
        </div>
        <div>
          <p className="text-slate-500 dark:text-slate-400">Turnaround</p>
          <p className="font-bold text-slate-900 dark:text-white">{test.turnaroundTimeHours ? `${test.turnaroundTimeHours}h` : '—'}</p>
        </div>
      </div>
      <Link to={`/tests/${test.id}`} className="mt-4 inline-flex text-sm font-black text-cyan-700 hover:text-cyan-800 dark:text-cyan-300">
        View test →
      </Link>
    </GlassCard>
  )
}
