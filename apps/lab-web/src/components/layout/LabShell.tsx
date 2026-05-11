import type { ReactNode } from 'react'
import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { MobileNav } from './MobileNav'

export function LabShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100">
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <div className="hidden border-r border-white/70 bg-white/60 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/50 lg:block">
          <Sidebar />
        </div>
        <main className="min-w-0">
          <Topbar onOpenMobileNav={() => setMobileOpen(true)} />
          <div className="px-4 pb-10 md:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
