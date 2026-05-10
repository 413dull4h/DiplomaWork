import { getImageUrl } from '../../utils/image'

type AvatarProps = {
  name?: string | null
  email?: string | null
  imageUrl?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
}

function getInitials(name?: string | null, email?: string | null) {
  const source = name || email || 'User'

  const parts = source
    .replace('@', ' ')
    .replace('.', ' ')
    .split(' ')
    .filter(Boolean)

  const first = parts[0]?.[0] || 'U'
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
      className={`${sizeClasses[size]} overflow-hidden rounded-2xl border border-white/40 bg-gradient-to-br from-cyan-100 to-blue-100 shadow-sm dark:border-white/10 dark:from-slate-800 dark:to-slate-900 ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={name || email || 'User avatar'}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-black text-slate-700 dark:text-white">
          {getInitials(name, email)}
        </div>
      )}
    </div>
  )
}