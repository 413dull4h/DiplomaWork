import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  useDoctorChatMessages,
  useDoctorChatThreads,
  useMarkDoctorChatRead,
  useSendDoctorChatMessage,
} from '../hooks/useChats'
import type { ChatMessage, ChatThread } from '../api/chats'

function dt(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

function lastMessage(thread: ChatThread) {
  return thread.messages?.[0]
}

function displayTitle(thread: ChatThread) {
  if (thread.patient?.fullName) {
    return thread.patient.fullName
  }

  return thread.subject || 'Appointment chat'
}

function displaySubtitle(thread: ChatThread) {
  const parts = [
    thread.hospital?.name,
    thread.appointment?.appointmentType,
    thread.appointment?.status,
    thread.appointment?.scheduledStart
      ? dt(thread.appointment.scheduledStart)
      : null,
  ].filter(Boolean)

  return parts.join(' · ')
}

function roleLabel(role?: string) {
  if (role === 'DOCTOR') return 'You'
  if (role === 'PATIENT') return 'Patient'
  if (role === 'HOSPITAL_STAFF') return 'Hospital'
  if (role === 'PLATFORM_ADMIN') return 'Admin'
  return role || 'System'
}

function Badge({ value }: { value?: string | null }) {
  if (!value) return null

  return (
    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200 dark:bg-white/10 dark:text-slate-200 dark:ring-white/10">
      {value}
    </span>
  )
}

function Card({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-3xl border border-white/60 bg-white/75 p-5 shadow-xl shadow-slate-950/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[.07] ${className}`}
    >
      {children}
    </div>
  )
}

function Button({
  children,
  className = '',
  variant = 'primary',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary'
}) {
  const styles =
    variant === 'primary'
      ? 'bg-sky-600 text-white hover:bg-sky-700'
      : 'bg-white/80 text-slate-900 ring-1 ring-slate-200 hover:bg-white dark:bg-white/10 dark:text-white dark:ring-white/10'

  return (
    <button
      {...props}
      className={`inline-flex min-h-11 items-center justify-center rounded-2xl px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${styles} ${className}`}
    >
      {children}
    </button>
  )
}

function MessageBubble({
  message,
  currentRole = 'DOCTOR',
}: {
  message: ChatMessage
  currentRole?: string
}) {
  const mine = message.senderRole === currentRole

  return (
    <div className={mine ? 'flex justify-end' : 'flex justify-start'}>
      <div
        className={
          mine
            ? 'max-w-[82%] rounded-3xl bg-sky-600 px-4 py-3 text-white shadow-lg shadow-sky-600/20'
            : 'max-w-[82%] rounded-3xl bg-white/80 px-4 py-3 text-slate-800 ring-1 ring-slate-200 dark:bg-white/10 dark:text-slate-100 dark:ring-white/10'
        }
      >
        <div className="mb-1 flex items-center justify-between gap-4">
          <span
            className={
              mine
                ? 'text-xs font-black text-sky-100'
                : 'text-xs font-black text-slate-500'
            }
          >
            {mine ? 'You' : roleLabel(message.senderRole)}
          </span>

          <span
            className={
              mine ? 'text-[11px] text-sky-100' : 'text-[11px] text-slate-400'
            }
          >
            {dt(message.createdAt)}
          </span>
        </div>

        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.body}
        </p>

        {mine ? (
          <p className="mt-1 text-right text-[11px] text-sky-100">
            {message.status === 'READ' ? 'Read' : 'Sent'}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export function ChatsPage() {
  const q = useDoctorChatThreads()

  const sorted = useMemo(() => {
    return [...(q.data || [])].sort((a, b) => {
      const ax = new Date(a.lastMessageAt || a.createdAt).getTime()
      const bx = new Date(b.lastMessageAt || b.createdAt).getTime()
      return bx - ax
    })
  }, [q.data])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-950 dark:text-white">
          Chats
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Appointment conversations with patients and hospital staff.
        </p>
      </div>

      {q.isLoading ? (
        <div className="space-y-3">
          <div className="h-24 animate-pulse rounded-3xl bg-white/60 dark:bg-white/10" />
          <div className="h-24 animate-pulse rounded-3xl bg-white/60 dark:bg-white/10" />
        </div>
      ) : q.isError ? (
        <Card>
          <p className="text-sm font-bold text-rose-600">
            Could not load chats.
          </p>
        </Card>
      ) : sorted.length ? (
        <div className="space-y-4">
          {sorted.map((thread) => {
            const msg = lastMessage(thread)

            return (
              <Link key={thread.id} to={`/chats/${thread.id}`}>
                <Card className="transition hover:-translate-y-0.5 hover:bg-white/90 dark:hover:bg-white/10">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Badge value={thread.appointment?.status} />
                        <Badge value={thread.appointment?.appointmentType} />
                      </div>

                      <h3 className="mt-3 text-lg font-black text-slate-950 dark:text-white">
                        {displayTitle(thread)}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {displaySubtitle(thread)}
                      </p>

                      <p className="mt-3 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                        {msg
                          ? `${roleLabel(msg.senderRole)}: ${msg.body}`
                          : 'No messages yet.'}
                      </p>
                    </div>

                    <p className="text-xs text-slate-400">
                      {thread.lastMessageAt
                        ? dt(thread.lastMessageAt)
                        : dt(thread.createdAt)}
                    </p>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <Card>
          <p className="text-sm text-slate-500">
            No chats yet. Patients can start chats from their appointments.
          </p>
        </Card>
      )}
    </div>
  )
}

export function ChatDetailPage() {
  const { threadId } = useParams()
  const q = useDoctorChatMessages(threadId)
  const send = useSendDoctorChatMessage(threadId)
  const read = useMarkDoctorChatRead(threadId)
  const [body, setBody] = useState('')

  useEffect(() => {
    if (threadId && q.data?.messages?.length) {
      read.mutate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, q.data?.messages?.length])

  async function submit() {
    const clean = body.trim()

    if (!clean || send.isPending) {
      return
    }

    await send.mutateAsync(clean)
    setBody('')
  }

  if (q.isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-24 animate-pulse rounded-3xl bg-white/60 dark:bg-white/10" />
        <div className="h-96 animate-pulse rounded-3xl bg-white/60 dark:bg-white/10" />
      </div>
    )
  }

  if (q.isError || !q.data) {
    return (
      <Card>
        <p className="text-sm font-bold text-rose-600">Could not load chat.</p>
      </Card>
    )
  }

  const { thread, messages } = q.data

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-950 dark:text-white">
            {displayTitle(thread)}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {displaySubtitle(thread)}
          </p>
        </div>

        <Link to="/chats">
          <Button variant="secondary">All chats</Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="flex min-h-[68vh] flex-col gap-4">
          <div className="flex-1 space-y-3 overflow-y-auto rounded-3xl bg-slate-50/70 p-3 dark:bg-slate-950/30">
            {messages.length ? (
              messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))
            ) : (
              <div className="grid h-full place-items-center text-center">
                <p className="text-sm text-slate-500">
                  No messages yet. Reply when the patient starts the
                  conversation.
                </p>
              </div>
            )}
          </div>

          <div className="grid gap-3">
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Write your reply..."
              className="min-h-24 w-full rounded-2xl border border-slate-200/80 bg-white/75 px-4 py-3 text-sm shadow-sm backdrop-blur focus:outline-none focus:ring-2 focus:ring-sky-300/50 dark:border-white/10 dark:bg-white/10 dark:text-white"
              onKeyDown={(event) => {
                if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                  event.preventDefault()
                  void submit()
                }
              }}
            />

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Press Ctrl + Enter to send.
              </p>

              <Button disabled={!body.trim() || send.isPending} onClick={submit}>
                {send.isPending ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="h-fit">
          <h3 className="font-black text-slate-950 dark:text-white">
            Appointment Info
          </h3>

          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Patient</dt>
              <dd className="font-bold dark:text-white">
                {thread.patient?.fullName || '—'}
              </dd>
            </div>

            <div>
              <dt className="text-slate-500">Hospital</dt>
              <dd className="font-bold dark:text-white">
                {thread.hospital?.name || '—'}
              </dd>
            </div>

            <div>
              <dt className="text-slate-500">Reason</dt>
              <dd className="font-bold dark:text-white">
                {thread.appointment?.reason || '—'}
              </dd>
            </div>

            <div>
              <dt className="text-slate-500">Appointment</dt>
              <dd className="font-bold dark:text-white">
                {thread.appointment?.scheduledStart
                  ? dt(thread.appointment.scheduledStart)
                  : '—'}
              </dd>
            </div>

            <div>
              <dt className="text-slate-500">Status</dt>
              <dd className="mt-1">
                <Badge value={thread.appointment?.status} />
              </dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  )
}