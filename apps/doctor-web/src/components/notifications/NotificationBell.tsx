import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import {
  useDoctorNotificationUnreadCount,
  useDoctorNotifications,
  useMarkAllDoctorNotificationsRead,
  useMarkDoctorNotificationRead,
} from '../../hooks/useDoctorNotifications'

function formatTime(value?: string | null) {
  if (!value) return '—'

  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  } catch {
    return value
  }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const notificationsQuery = useDoctorNotifications()
  const unreadCountQuery = useDoctorNotificationUnreadCount()
  const markRead = useMarkDoctorNotificationRead()
  const markAllRead = useMarkAllDoctorNotificationsRead()

  const notifications = notificationsQuery.data || []
  const unreadCount = unreadCountQuery.data || 0

  const latest = useMemo(() => notifications.slice(0, 8), [notifications])

  async function openNotification(notificationId: string) {
    const notification = notifications.find((item) => item.id === notificationId)

    if (!notification) {
      return
    }

    if (notification.status === 'UNREAD') {
      await markRead.mutateAsync(notification.id)
    }

    setOpen(false)

    if (
      notification.entityType === 'CHAT_THREAD' &&
      notification.metadata?.threadId
    ) {
      navigate(`/chats/${notification.metadata.threadId}`)
      return
    }

    if (
      notification.entityType === 'APPOINTMENT' &&
      notification.metadata?.appointmentId
    ) {
      navigate(`/appointments/${notification.metadata.appointmentId}`)
      return
    }

    if (
      notification.entityType === 'MEDICAL_DOCUMENT' &&
      notification.metadata?.patientId
    ) {
      navigate(`/patients/${notification.metadata.patientId}/records`)
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative grid h-11 w-11 place-items-center rounded-2xl border border-white/70 bg-white/70 text-slate-700 shadow-sm backdrop-blur-xl transition hover:bg-white dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-900"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />

        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[11px] font-black text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-3 w-[min(92vw,380px)] overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
            <div>
              <p className="font-black text-slate-950 dark:text-white">
                Notifications
              </p>
              <p className="text-xs text-slate-500">
                {unreadCount} unread
              </p>
            </div>

            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              className="rounded-xl px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
            >
              Mark all read
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto p-2">
            {notificationsQuery.isLoading ? (
              <div className="p-4 text-sm text-slate-500">Loading...</div>
            ) : latest.length ? (
              latest.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => void openNotification(notification.id)}
                  className="block w-full rounded-2xl p-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-950 dark:text-white">
                        {notification.title}
                      </p>

                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
                        {notification.body}
                      </p>

                      <p className="mt-2 text-[11px] font-semibold text-slate-400">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>

                    {notification.status === 'UNREAD' ? (
                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-rose-600" />
                    ) : null}
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-sm text-slate-500">
                No notifications yet.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}