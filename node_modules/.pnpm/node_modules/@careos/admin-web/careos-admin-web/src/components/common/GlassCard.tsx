import type { HTMLAttributes, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

export function GlassCard({ className, children, ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return <div className={cn('glass-surface rounded-glass p-5', className)} {...props}>{children}</div>
}

export function MotionGlassCard({ className, children }: { className?: string; children: ReactNode }) {
  return <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }} className={cn('glass-surface rounded-glass p-5', className)}>{children}</motion.div>
}
