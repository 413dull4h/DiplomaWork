import { Link } from 'react-router-dom'
import { GlassCard } from '../../components/common/Basic'
import { Button } from '../../components/ui/Button'
export function NotFoundPage() { return <main className="liquid-bg flex min-h-screen items-center justify-center p-4"><GlassCard className="text-center"><h1 className="text-4xl font-black dark:text-white">404</h1><p className="mt-2 text-slate-600 dark:text-slate-300">Page not found.</p><Link to="/dashboard"><Button className="mt-6">Dashboard</Button></Link></GlassCard></main> }
