import { Building2 } from 'lucide-react'
import { getImageUrl } from '../../utils/image'

type HospitalLogoProps = {
  name?: string | null
  logoUrl?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: 'h-9 w-9 rounded-2xl',
  md: 'h-12 w-12 rounded-2xl',
  lg: 'h-16 w-16 rounded-3xl',
  xl: 'h-24 w-24 rounded-[2rem]',
}

function getInitials(name?: string | null) {
  if (!name) {
    return 'H'
  }

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function HospitalLogo({
  name,
  logoUrl,
  size = 'md',
  className = '',
}: HospitalLogoProps) {
  const src = getImageUrl(logoUrl)

  return (
    <div
      className={`${sizeClasses[size]} overflow-hidden border border-white/40 bg-white/70 shadow-lg dark:border-white/10 dark:bg-white/10 ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={name ? `${name} logo` : 'Hospital logo'}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cyan-100 to-blue-100 font-black text-slate-700 dark:from-slate-800 dark:to-slate-900 dark:text-white">
          {name ? getInitials(name) : <Building2 className="h-5 w-5" />}
        </div>
      )}
    </div>
  )
}