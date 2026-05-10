import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Camera, Trash2, Upload } from 'lucide-react'

import { PageHeader } from '@/components/common/PageHeader'
import { GlassCard } from '@/components/common/GlassCard'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { useAuthStore } from '@/store/authStore'
import { formatDateTime } from '@/utils/format'
import { getImageUrl } from '@/utils/image'

const API_URL = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:4001'

export function AccountPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const clearSession = useAuthStore((s) => s.clearSession)

  const [avatarUrl, setAvatarUrl] = useState<string | null | undefined>(
    user?.avatarUrl
  )
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const logout = () => {
    clearSession()
    navigate('/login')
  }

  const onChooseFile = (file?: File | null) => {
    setMessage('')
    setError('')

    if (!file) {
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

    if (!allowedTypes.includes(file.type)) {
      setError('Only JPG, PNG, and WEBP images are allowed.')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be 2 MB or smaller.')
      return
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const uploadAvatar = async () => {
    if (!selectedFile) {
      setError('Choose an image first.')
      return
    }

    if (!token) {
      setError('Missing admin token. Please log in again.')
      return
    }

    try {
      setIsUploading(true)
      setError('')
      setMessage('')

      const formData = new FormData()
      formData.append('avatar', selectedFile)

      const response = await fetch(`${API_URL}/admin/profile/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.message || 'Avatar upload failed.')
      }

      setAvatarUrl(data.avatarUrl)
      setSelectedFile(null)
      setPreviewUrl(null)
      setMessage('Profile picture uploaded successfully. Refresh if sidebar does not update immediately.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Avatar upload failed.')
    } finally {
      setIsUploading(false)
    }
  }

  const deleteAvatar = async () => {
    if (!token) {
      setError('Missing admin token. Please log in again.')
      return
    }

    try {
      setIsDeleting(true)
      setError('')
      setMessage('')

      const response = await fetch(`${API_URL}/admin/profile/avatar`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.message || 'Avatar removal failed.')
      }

      setAvatarUrl(null)
      setSelectedFile(null)
      setPreviewUrl(null)
      setMessage('Profile picture removed successfully. Refresh if sidebar does not update immediately.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Avatar removal failed.')
    } finally {
      setIsDeleting(false)
    }
  }

  const shownImage = previewUrl || getImageUrl(avatarUrl)

  return (
    <div>
      <PageHeader title={t('nav.account')} subtitle={t('auth.session')} />

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <GlassCard>
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              {shownImage ? (
                <div className="h-28 w-28 overflow-hidden rounded-[2rem] border border-white/40 bg-white/60 shadow-glow dark:border-white/10 dark:bg-white/10">
                  <img
                    src={shownImage}
                    alt="Admin profile"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <Avatar
                  email={user?.email}
                  imageUrl={avatarUrl}
                  size="xl"
                />
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 grid h-10 w-10 place-items-center rounded-2xl bg-primary text-white shadow-glow"
                aria-label="Choose profile picture"
              >
                <Camera size={18} />
              </button>
            </div>

            <h2 className="mt-5 text-xl font-black">
              {user?.email || 'Admin'}
            </h2>

            <p className="mt-1 text-sm text-muted">
              {user?.primaryRole || 'PLATFORM_ADMIN'}
            </p>

            <div className="mt-5 w-full rounded-3xl border border-white/40 bg-white/50 p-4 text-left dark:border-white/10 dark:bg-white/5">
              <p className="text-sm font-black">Profile Picture</p>
              <p className="mt-1 text-xs text-muted">
                JPG, PNG, or WEBP. Maximum 2 MB.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => onChooseFile(event.target.files?.[0])}
              />

              {selectedFile ? (
                <p className="mt-3 truncate text-xs text-muted">
                  Selected: {selectedFile.name}
                </p>
              ) : null}

              {message ? (
                <p className="mt-3 rounded-2xl bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  {message}
                </p>
              ) : null}

              {error ? (
                <p className="mt-3 rounded-2xl bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-700 dark:text-red-300">
                  {error}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  variant="secondary"
                >
                  <Camera className="h-4 w-4" />
                  Choose Image
                </Button>

                <Button
                  type="button"
                  onClick={uploadAvatar}
                  disabled={!selectedFile || isUploading}
                >
                  <Upload className="h-4 w-4" />
                  {isUploading ? 'Uploading...' : 'Upload'}
                </Button>

                <Button
                  type="button"
                  variant="danger"
                  onClick={deleteAvatar}
                  disabled={!avatarUrl || isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                  {isDeleting ? 'Removing...' : 'Remove'}
                </Button>
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="max-w-2xl">
          <dl className="grid gap-4 md:grid-cols-2">
            <Info label={t('auth.email')} value={user?.email} />

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                {t('common.status')}
              </dt>
              <dd className="mt-1">
                <StatusBadge status={user?.status} />
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                {t('audit.role')}
              </dt>
              <dd className="mt-1">
                <StatusBadge status={user?.primaryRole} />
              </dd>
            </div>

            <Info label={t('common.created')} value={formatDateTime(user?.createdAt)} />
            <Info label="Avatar URL" value={avatarUrl} />
            <Info label="ID" value={user?.id} />
          </dl>

          <Button className="mt-6" variant="danger" onClick={logout}>
            {t('nav.logout')}
          </Button>
        </GlassCard>
      </div>
    </div>
  )
}

function Info({
  label,
  value,
}: {
  label: string
  value?: string | null
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </dt>
      <dd className="mt-1 break-all font-semibold">{value || '—'}</dd>
    </div>
  )
}