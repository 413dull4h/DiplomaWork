import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopNav } from '@/components/layout/TopNav'

export function AdminShell() {
  return <div className="min-h-screen lg:flex"><Sidebar /><div className="min-w-0 flex-1"><TopNav /><main className="mx-auto max-w-7xl px-4 py-6 lg:px-8"><Outlet /></main></div></div>
}
