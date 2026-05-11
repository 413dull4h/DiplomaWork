import { PageHeader } from '../../components/common/PageHeader'
import { GlassCard } from '../../components/common/GlassCard'

export function NotificationsPage() {
  return (
    <div>
      <PageHeader title="Notifications" subtitle="Lab notification routes are not implemented in the current backend." />
      <GlassCard>
        <h3 className="font-black text-slate-950 dark:text-white">Missing backend endpoints</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">This page is intentionally not faked. Add these backend routes to enable Lab notifications:</p>
        <pre className="mt-4 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">{`GET   /lab/notifications
PATCH /lab/notifications/:id/read
PATCH /lab/notifications/read-all`}</pre>
      </GlassCard>
    </div>
  )
}
