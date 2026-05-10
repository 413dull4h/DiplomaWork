import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  useChatMessages,
  useChatThreads,
  useMarkChatRead,
  useSendChatMessage,
} from '../hooks/useChats'
import { usePatientSession } from '../hooks'
import { Badge, Button, Card, Empty, ErrorBox, Loading, Page, Textarea } from '../components/ui'
import { dt } from '../utils/format'
import type { ChatMessage, ChatThread } from '../api/chats'

function lastMessage(thread: ChatThread) {
  return thread.messages?.[0]
}

function displayTitle(thread: ChatThread) {
  if (thread.doctor?.fullName && thread.hospital?.name) {
    return `${thread.doctor.fullName} · ${thread.hospital.name}`
  }

  if (thread.hospital?.name) {
    return thread.hospital.name
  }

  return thread.subject || 'Appointment chat'
}

function displaySubtitle(thread: ChatThread) {
  const parts = [
    thread.appointment?.appointmentType,
    thread.appointment?.status,
    thread.appointment?.scheduledStart
      ? dt(thread.appointment.scheduledStart)
      : null,
  ].filter(Boolean)

  return parts.join(' · ')
}

function roleLabel(role?: string) {
  if (role === 'PATIENT') return 'You'
  if (role === 'DOCTOR') return 'Doctor'
  if (role === 'HOSPITAL_STAFF') return 'Hospital'
  if (role === 'PLATFORM_ADMIN') return 'Admin'
  return role || 'System'
}

function MessageBubble({
  message,
  currentUserId,
}: {
  message: ChatMessage
  currentUserId?: string
}) {
  const mine = message.senderUserId === currentUserId

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
          <span className={mine ? 'text-xs font-black text-sky-100' : 'text-xs font-black text-slate-500'}>
            {mine ? 'You' : roleLabel(message.senderRole)}
          </span>

          <span className={mine ? 'text-[11px] text-sky-100' : 'text-[11px] text-slate-400'}>
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
  const q = useChatThreads()

  const sorted = useMemo(() => {
    return [...(q.data || [])].sort((a, b) => {
      const ax = new Date(a.lastMessageAt || a.createdAt).getTime()
      const bx = new Date(b.lastMessageAt || b.createdAt).getTime()
      return bx - ax
    })
  }, [q.data])

  return (
    <Page
      title="Chats"
      subtitle="Appointment conversations with your doctor and hospital."
    >
      {q.isLoading ? (
        <Loading />
      ) : q.isError ? (
        <ErrorBox text="Could not load chats." />
      ) : sorted.length ? (
        <div className="space-y-4">
          {sorted.map((thread) => {
            const msg = lastMessage(thread)

            return (
              <Link key={thread.id} to={`/app/chats/${thread.id}`}>
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
        <Empty text="No chats yet. Open an appointment and start a chat." />
      )}
    </Page>
  )
}

export function ChatDetailPage() {
  const { threadId } = useParams()
  const { user } = usePatientSession()
  const q = useChatMessages(threadId)
  const send = useSendChatMessage(threadId)
  const read = useMarkChatRead(threadId)
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
    return <Loading />
  }

  if (q.isError || !q.data) {
    return <ErrorBox text="Could not load chat." />
  }

  const { thread, messages } = q.data

  return (
    <Page
      title={displayTitle(thread)}
      subtitle={displaySubtitle(thread)}
      actions={
        <Link to="/app/chats">
          <Button variant="secondary">All chats</Button>
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="flex min-h-[68vh] flex-col gap-4">
          <div className="flex-1 space-y-3 overflow-y-auto rounded-3xl bg-slate-50/70 p-3 dark:bg-slate-950/30">
            {messages.length ? (
              messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  currentUserId={user?.id}
                />
              ))
            ) : (
              <div className="grid h-full place-items-center text-center">
                <p className="text-sm text-slate-500">
                  No messages yet. Start the conversation.
                </p>
              </div>
            )}
          </div>

          <div className="grid gap-3">
            <Textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Write your message..."
              className="min-h-24"
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
              <dt className="text-slate-500">Hospital</dt>
              <dd className="font-bold dark:text-white">
                {thread.hospital?.name || '—'}
              </dd>
            </div>

            <div>
              <dt className="text-slate-500">Doctor</dt>
              <dd className="font-bold dark:text-white">
                {thread.doctor?.fullName || '—'}
              </dd>
            </div>

            <div>
              <dt className="text-slate-500">Specialization</dt>
              <dd className="font-bold dark:text-white">
                {thread.doctor?.specialization || '—'}
              </dd>
            </div>

            <div>
              <dt className="text-slate-500">Reason</dt>
              <dd className="font-bold dark:text-white">
                {thread.appointment?.reason || '—'}
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
    </Page>
  )
}