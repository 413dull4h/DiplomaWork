import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, X } from 'lucide-react'
import {
  useHospitalNotifications,
  useHospitalUnreadNotificationCount,
  useMarkAllHospitalNotificationsRead,
  useMarkHospitalNotificationRead,
} from '../../hooks/useNotifications'

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getMetadataValue(metadata: unknown, key: string): string | undefined {
  if (!metadata || typeof metadata !== 'object') {
    return undefined
  }

  const value = (metadata as Record<string, unknown>)[key]

  return typeof value === 'string' ? value : undefined
}

export function NotificationBell() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)

  const notificationsQuery = useHospitalNotifications()
  const unreadCountQuery = useHospitalUnreadNotificationCount()
  const markRead = useMarkHospitalNotificationRead()
  const markAllRead = useMarkAllHospitalNotificationsRead()

  const notifications = notificationsQuery.data ?? []
  const unreadCount = unreadCountQuery.data ?? 0

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    function onMouseDown(event: MouseEvent) {
      const target = event.target as Node

      if (buttonRef.current?.contains(target)) {
        return
      }

      if (panelRef.current?.contains(target)) {
        return
      }

      setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onMouseDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onMouseDown)
    }
  }, [open])

  async function openNotification(item: (typeof notifications)[number]) {
    if (item.status === 'UNREAD') {
      await markRead.mutateAsync(item.id)
    }

    setOpen(false)

    const threadId = getMetadataValue(item.metadata, 'threadId')
    const appointmentId =
      getMetadataValue(item.metadata, 'appointmentId') || item.entityId
    const patientId = getMetadataValue(item.metadata, 'patientId')

    if (item.entityType === 'CHAT_THREAD' && threadId) {
      navigate(`/chats/${threadId}`)
      return
    }

    if (item.entityType === 'APPOINTMENT' && appointmentId) {
      navigate(`/appointments/${appointmentId}`)
      return
    }

    if (item.entityType === 'MEDICAL_DOCUMENT') {
      if (patientId) {
        navigate(`/patients/${patientId}/records`)
        return
      }

      navigate('/appointments')
    }
  }

  const panel = open
    ? createPortal(
        <>
          <div
            className="fixed inset-0 z-[9998] bg-slate-950/25 backdrop-blur-[1px]"
            onClick={() => setOpen(false)}
          />

          <div
            ref={panelRef}
            className="fixed left-3 right-3 top-20 z-[9999] max-h-[78vh] overflow-hidden rounded-3xl border border-white/40 bg-white shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-950 sm:left-auto sm:right-6 sm:top-20 sm:w-[420px]"
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-200/70 px-4 py-3 dark:border-white/10">
              <div className="min-w-0">
                <h3 className="truncate font-black text-slate-900 dark:text-white">
                  Notifications
                </h3>

                <p className="text-xs text-slate-500">{unreadCount} unread</p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending || unreadCount === 0}
                  className="inline-flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-bold text-cyan-700 hover:bg-cyan-50 disabled:opacity-50 dark:text-cyan-300 dark:hover:bg-cyan-950"
                >
                  <CheckCheck className="h-4 w-4" />
                  Read all
                </button>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
                  aria-label="Close notifications"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[calc(78vh-72px)] overflow-y-auto p-2">
              {notificationsQuery.isLoading ? (
                <p className="p-4 text-sm text-slate-500">Loading...</p>
              ) : notifications.length === 0 ? (
                <p className="p-4 text-sm text-slate-500">
                  No notifications yet.
                </p>
              ) : (
                notifications.slice(0, 10).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => void openNotification(item)}
                    className={`mb-2 w-full rounded-2xl p-3 text-left transition ${
                      item.status === 'UNREAD'
                        ? 'bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/40 dark:hover:bg-cyan-950/70'
                        : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words text-sm font-black text-slate-900 dark:text-white">
                          {item.title}
                        </p>

                        <p className="mt-1 break-words text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {item.body}
                        </p>

                        <p className="mt-2 text-xs text-slate-400">
                          {formatDate(item.createdAt)}
                        </p>
                      </div>

                      {item.status === 'UNREAD' ? (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-500" />
                      ) : null}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>,
        document.body
      )
    : null

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-2xl border border-white/40 bg-white/70 p-3 text-slate-700 shadow-sm backdrop-blur transition hover:bg-white dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-100"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />

        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-black text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {panel}
    </>
  )
}