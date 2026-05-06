import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { AuditLog } from '@/types/models'
import { formatDateTime, metadataPreview } from '@/utils/format'
import { Button } from '@/components/ui/Button'
import { GlassCard } from './GlassCard'
import { StatusBadge } from './StatusBadge'

export function AuditLogItem({ log }: { log: AuditLog }) {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()
  return <GlassCard className="p-4"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><p className="font-bold">{log.action}</p><p className="text-sm text-muted">{log.entityType} · {log.entityId ?? '—'} · {formatDateTime(log.createdAt)}</p><p className="mt-1 text-sm text-muted">{log.user?.email ?? 'System'} {log.user?.primaryRole ? <StatusBadge status={log.user.primaryRole} /> : null}</p></div><Button variant="secondary" onClick={() => setOpen((v) => !v)}>{t('common.metadata')} {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</Button></div>{open ? <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950/90 p-4 text-xs text-slate-100">{JSON.stringify(log.metadata ?? {}, null, 2)}</pre> : <p className="mt-3 text-xs text-muted">{metadataPreview(log.metadata)}</p>}</GlassCard>
}
