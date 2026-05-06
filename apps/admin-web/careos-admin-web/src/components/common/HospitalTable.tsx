import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Hospital } from '@/types/models'
import { addressSummary, formatDate } from '@/utils/format'
import { StatusBadge } from './StatusBadge'
import { Button } from '@/components/ui/Button'

export function HospitalTable({ hospitals, onAction }: { hospitals: Hospital[]; onAction?: (id: string, action: 'approve' | 'suspend' | 'reject') => void }) {
  const { t } = useTranslation()
  return <div className="table-scroll rounded-3xl border border-border/60 bg-white/35 dark:bg-slate-900/30"><table className="w-full text-left text-sm"><thead><tr className="border-b border-border/60 text-muted"><th className="p-4">{t('hospitals.name')}</th><th className="p-4">{t('hospitals.contact')}</th><th className="p-4">{t('hospitals.licenseNumber')}</th><th className="p-4">{t('hospitals.address')}</th><th className="p-4">{t('common.status')}</th><th className="p-4">{t('common.created')}</th><th className="p-4">{t('common.actions')}</th></tr></thead><tbody>{hospitals.map((h) => <tr key={h.id} className="border-b border-border/40 last:border-0"><td className="p-4"><p className="font-bold">{h.name}</p><p className="text-xs text-muted">{h.legalName}</p></td><td className="p-4"><p>{h.contactEmail ?? '—'}</p><p className="text-xs text-muted">{h.contactPhone ?? '—'}</p></td><td className="p-4">{h.licenseNumber ?? '—'}</td><td className="p-4 max-w-xs">{addressSummary(h.address)}</td><td className="p-4"><StatusBadge status={h.status} /></td><td className="p-4">{formatDate(h.createdAt)}</td><td className="p-4"><div className="flex flex-wrap gap-2"><Link to={`/hospitals/${h.id}`}><Button variant="secondary">{t('common.view')}</Button></Link>{onAction ? <><Button variant="success" onClick={() => onAction(h.id, 'approve')}>{t('common.approve')}</Button><Button variant="secondary" onClick={() => onAction(h.id, 'suspend')}>{t('common.suspend')}</Button><Button variant="danger" onClick={() => onAction(h.id, 'reject')}>{t('common.reject')}</Button></> : null}</div></td></tr>)}</tbody></table></div>
}
