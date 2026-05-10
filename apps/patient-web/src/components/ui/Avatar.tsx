import { getImageUrl } from '../../utils/image'

type AvatarProps = {
  name?: string | null
  email?: string | null
  imageUrl?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-16 w-16 text-base',
  xl: 'h-24 w-24 text-xl',
}

function getInitials(name?: string | null, email?: string | null) {
  const source = name || email || 'Patient'

  const parts = source
    .replace('@', ' ')
    .replace('.', ' ')
    .split(' ')
    .filter(Boolean)

  const first = parts[0]?.[0] || 'P'
  const second = parts[1]?.[0] || ''

  return `${first}${second}`.toUpperCase()
}

export function Avatar({
  name,
  email,
  imageUrl,
  size = 'md',
  className = '',
}: AvatarProps) {
  const src = getImageUrl(imageUrl)

  return (
    <div
      className={`${sizeClasses[size]} overflow-hidden rounded-3xl border border-white/40 bg-white/70 shadow-lg dark:border-white/10 dark:bg-white/10 ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={name || email || 'Patient avatar'}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cyan-100 to-blue-100 font-black text-slate-700 dark:from-slate-800 dark:to-slate-900 dark:text-white">
          {getInitials(name, email)}
        </div>
      )}
    </div>
  )
}