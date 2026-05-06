import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { AuditLog } from '@/types/models'
import { formatDateTime, metadataPreview } from '@/utils/format'
import { Button } from '@/components/ui/Button'
import { GlassCard } from './GlassCard'
import { StatusBadge } from './StatusBadge'

export function AuditLogItem({ log }: { log: AuditLog }) {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()

  return <GlassCard className="p-4">
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="break-words font-bold">{log.action}</p>
          <StatusBadge status={log.entityType} />
        </div>
        <p className="mt-1 text-sm text-muted">
          {t('audit.entityId')} · {log.entityId ?? '—'} · {formatDateTime(log.createdAt)}
        </p>
        <p className="mt-1 text-sm text-muted">
          {log.user?.email ?? t('audit.system')}{log.user?.primaryRole ? <span className="ms-2"><StatusBadge status={log.user.primaryRole} /></span> : null}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link to={`/audit-logs/${log.id}`}>
          <Button variant="secondary">
            {t('common.details')}
            <ExternalLink size={16} />
          </Button>
        </Link>
        <Button variant="secondary" onClick={() => setOpen((value) => !value)}>
          {t('common.metadata')}
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </Button>
      </div>
    </div>

    {open ? <pre className="mt-4 max-h-96 overflow-auto rounded-2xl bg-slate-950/90 p-4 text-xs text-slate-100">{JSON.stringify(log.metadata ?? {}, null, 2)}</pre> : <p className="mt-3 text-xs text-muted">{metadataPreview(log.metadata)}</p>}
  </GlassCard>
}
