import { Inbox } from 'lucide-react'
import { GlassCard } from './GlassCard'
export function EmptyState({ title, description }: { title: string; description?: string }) {
  return <GlassCard className="flex flex-col items-center justify-center py-12 text-center"><Inbox className="mb-3 text-muted" /><h3 className="font-semibold">{title}</h3>{description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}</GlassCard>
}
