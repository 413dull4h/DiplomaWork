import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, X } from 'lucide-react'
import {
  useMarkAllPatientNotificationsRead,
  useMarkPatientNotificationRead,
  usePatientNotifications,
  usePatientUnreadNotificationCount,
} from '../../hooks/useNotifications'

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getMetadataValue(
  metadata: unknown,
  key: string
): string | undefined {
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

  const notificationsQuery = usePatientNotifications()
  const unreadCountQuery = usePatientUnreadNotificationCount()
  const markRead = useMarkPatientNotificationRead()
  const markAllRead = useMarkAllPatientNotificationsRead()

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
    const documentId =
      getMetadataValue(item.metadata, 'documentId') || item.entityId

    if (item.entityType === 'CHAT_THREAD' && threadId) {
      navigate(`/app/chats/${threadId}`)
      return
    }

    if (item.entityType === 'APPOINTMENT' && appointmentId) {
      navigate(`/app/appointments/${appointmentId}`)
      return
    }

    if (item.entityType === 'MEDICAL_DOCUMENT' && documentId) {
      navigate('/app/documents')
      return
    }
  }

  const panel = open
    ? createPortal(
        <>
          <div
            className="fixed inset-0 z-[9998] bg-slate-950/20 backdrop-blur-[1px]"
            onClick={() => setOpen(false)}
          />

          <div
            ref={panelRef}
            className="fixed left-4 right-4 top-24 z-[9999] overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl sm:left-auto sm:right-8 sm:w-[420px]"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <div>
                <h3 className="text-lg font-black text-white">Notifications</h3>
                <p className="text-sm text-slate-400">{unreadCount} unread</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending || unreadCount === 0}
                  className="inline-flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-bold text-cyan-300 hover:bg-cyan-400/10 disabled:opacity-40"
                >
                  <CheckCheck className="h-4 w-4" />
                  Read all
                </button>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-300 hover:bg-white/10"
                  aria-label="Close notifications"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-3">
              {notificationsQuery.isLoading ? (
                <p className="p-4 text-sm text-slate-400">Loading...</p>
              ) : notifications.length === 0 ? (
                <p className="p-4 text-sm text-slate-400">
                  No notifications yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {notifications.slice(0, 10).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => void openNotification(item)}
                      className={`w-full rounded-2xl p-4 text-left transition ${
                        item.status === 'UNREAD'
                          ? 'bg-slate-900 hover:bg-slate-800'
                          : 'bg-slate-900/50 hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="break-words text-sm font-black text-white">
                            {item.title}
                          </p>

                          <p className="mt-1 break-words text-sm leading-6 text-slate-300">
                            {item.body}
                          </p>

                          <p className="mt-2 text-xs text-slate-500">
                            {formatDate(item.createdAt)}
                          </p>
                        </div>

                        {item.status === 'UNREAD' ? (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-400" />
                        ) : null}
                      </div>
                    </button>
                  ))}
                </div>
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
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-slate-900/70 text-white shadow-sm backdrop-blur transition hover:bg-slate-800 dark:border-white/10 dark:bg-slate-900"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />

        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-black text-white shadow-lg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {panel}
    </>
  )
}