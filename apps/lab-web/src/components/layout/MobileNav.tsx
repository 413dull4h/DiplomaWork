import { X } from 'lucide-react'
import { Sidebar } from './Sidebar'

export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" aria-label="Close menu" onClick={onClose} />
      <div className="relative h-full w-80 max-w-[85vw] border-r border-white/20 bg-slate-50/95 p-5 shadow-2xl dark:bg-slate-950/95">
        <button className="mb-5 rounded-2xl p-2 text-slate-600 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-white/10" onClick={onClose}>
          <X className="h-5 w-5" />
        </button>
        <Sidebar onNavigate={onClose} />
      </div>
    </div>
  )
}
