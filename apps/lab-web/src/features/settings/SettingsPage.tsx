import { useNavigate } from 'react-router-dom'
import { LAB_API_URL } from '../../api/client'
import { PageHeader } from '../../components/common/PageHeader'
import { GlassCard } from '../../components/common/GlassCard'
import { Button } from '../../components/ui/Button'
import { useAuthStore } from '../auth/authStore'

export function SettingsPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const lab = useAuthStore((state) => state.lab)
  const clearSession = useAuthStore((state) => state.clearSession)

  return (
    <div>
      <PageHeader title="Settings" subtitle="Session and environment settings." />
      <div className="grid gap-5 lg:grid-cols-2">
        <GlassCard>
          <h3 className="font-black text-slate-950 dark:text-white">Current session</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div><dt className="text-slate-500">Email</dt><dd className="font-bold text-slate-950 dark:text-white">{user?.email}</dd></div>
            <div><dt className="text-slate-500">Role</dt><dd className="font-bold text-slate-950 dark:text-white">{user?.primaryRole}</dd></div>
            <div><dt className="text-slate-500">Lab</dt><dd className="font-bold text-slate-950 dark:text-white">{lab?.name}</dd></div>
          </dl>
          <Button className="mt-6" variant="danger" onClick={() => { clearSession(); navigate('/login', { replace: true }) }}>Logout</Button>
        </GlassCard>
        <GlassCard>
          <h3 className="font-black text-slate-950 dark:text-white">API environment</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">VITE_LAB_API_URL</p>
          <pre className="mt-4 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">{LAB_API_URL}</pre>
        </GlassCard>
      </div>
    </div>
  )
}
