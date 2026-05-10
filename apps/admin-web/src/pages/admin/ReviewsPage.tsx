import { useState } from 'react'
import {
  useAdminDoctorReviews,
  useAdminHospitalReviews,
  useAdminPatientFeedback,
  useAdminReviewSummary,
  useApproveDoctorReview,
  useApproveHospitalReview,
  useRejectDoctorReview,
  useRejectHospitalReview,
} from '../../hooks/useReviews'
import type { ReviewStatus } from '../../api/reviews'

type StatusFilter = '' | ReviewStatus

function StatusBadge({ value }: { value: string }) {
  const className =
    value === 'APPROVED'
      ? 'bg-emerald-100 text-emerald-700'
      : value === 'REJECTED'
        ? 'bg-rose-100 text-rose-700'
        : value === 'PENDING'
          ? 'bg-amber-100 text-amber-700'
          : 'bg-slate-100 text-slate-700'

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${className}`}>
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
      className={`rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 ${className}`}
    >
      {children}
    </div>
  )
}

function RatingLine({
  label,
  value,
}: {
  label: string
  value?: number | null
}) {
  return (
    <p className="text-sm text-slate-600 dark:text-slate-300">
      <span className="font-bold">{label}:</span>{' '}
      {typeof value === 'number' ? `${value}/5` : '—'}
    </p>
  )
}

function ReviewModerationCard({
  review,
  type,
}: {
  review: any
  type: 'hospital' | 'doctor'
}) {
  const [note, setNote] = useState(review.moderationNote || '')

  const approveHospital = useApproveHospitalReview()
  const rejectHospital = useRejectHospitalReview()
  const approveDoctor = useApproveDoctorReview()
  const rejectDoctor = useRejectDoctorReview()

  const isPending =
    approveHospital.isPending ||
    rejectHospital.isPending ||
    approveDoctor.isPending ||
    rejectDoctor.isPending

  function approve() {
    const payload = {
      moderationNote: note.trim() || undefined,
    }

    if (type === 'hospital') {
      approveHospital.mutate({
        id: review.id,
        payload,
      })
    } else {
      approveDoctor.mutate({
        id: review.id,
        payload,
      })
    }
  }

  function reject() {
    const payload = {
      moderationNote: note.trim() || undefined,
    }

    if (type === 'hospital') {
      rejectHospital.mutate({
        id: review.id,
        payload,
      })
    } else {
      rejectDoctor.mutate({
        id: review.id,
        payload,
      })
    }
  }

  return (
    <Card>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge value={review.status} />
            <StatusBadge value={type === 'hospital' ? 'HOSPITAL' : 'DOCTOR'} />
          </div>

          <h3 className="mt-3 text-lg font-black text-slate-900 dark:text-white">
            {type === 'hospital'
              ? review.hospital?.name || 'Hospital review'
              : review.doctor?.fullName || 'Doctor review'}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Patient: {review.patient?.fullName || '—'}
          </p>

          <p className="text-sm text-slate-500">
            Hospital: {review.hospital?.name || '—'}
          </p>

          <p className="break-all text-xs text-slate-400">
            Appointment: {review.appointmentId}
          </p>
        </div>

        <div className="text-left xl:text-right">
          <p className="text-4xl font-black text-slate-900 dark:text-white">
            {review.overallRating}/5
          </p>
          <p className="text-xs text-slate-500">Overall rating</p>
        </div>
      </div>

      <div className="mt-5 grid gap-2 md:grid-cols-2">
        {type === 'hospital' ? (
          <>
            <RatingLine label="Staff" value={review.staffRating} />
            <RatingLine label="Cleanliness" value={review.cleanlinessRating} />
            <RatingLine label="Waiting time" value={review.waitingTimeRating} />
            <RatingLine label="Service" value={review.serviceRating} />
          </>
        ) : (
          <>
            <RatingLine
              label="Communication"
              value={review.communicationRating}
            />
            <RatingLine
              label="Professionalism"
              value={review.professionalismRating}
            />
            <RatingLine label="Helpfulness" value={review.helpfulnessRating} />
            <p className="text-sm text-slate-600 dark:text-slate-300">
              <span className="font-bold">Would recommend:</span>{' '}
              {review.wouldRecommend === true
                ? 'Yes'
                : review.wouldRecommend === false
                  ? 'No'
                  : '—'}
            </p>
          </>
        )}
      </div>

      {review.comment ? (
        <div className="mt-5 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {review.comment}
        </div>
      ) : null}

      <div className="mt-5">
        <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
          Moderation note
        </label>

        <textarea
          className="mt-2 min-h-20 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Optional note for moderation/audit trail..."
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={approve}
          disabled={isPending}
          className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Approve
        </button>

        <button
          type="button"
          onClick={reject}
          disabled={isPending}
          className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Reject
        </button>
      </div>
    </Card>
  )
}

function FeedbackCard({ feedback }: { feedback: any }) {
  return (
    <Card>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge value="INTERNAL" />
            {feedback.wasNoShow ? <StatusBadge value="NO_SHOW" /> : null}
          </div>

          <h3 className="mt-3 font-black text-slate-900 dark:text-white">
            {feedback.patient?.fullName || 'Patient feedback'}
          </h3>

          <p className="text-sm text-slate-500">
            Hospital: {feedback.hospital?.name || '—'}
          </p>

          <p className="text-sm text-slate-500">
            Doctor: {feedback.doctor?.fullName || '—'}
          </p>

          <p className="text-sm text-slate-500">
            Created by: {feedback.createdByUser?.email || '—'}
          </p>
        </div>

        <p className="text-xs text-slate-500">
          {feedback.createdAt
            ? new Date(feedback.createdAt).toLocaleString()
            : '—'}
        </p>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          <span className="font-bold">Arrived on time:</span>{' '}
          {feedback.arrivedOnTime === true
            ? 'Yes'
            : feedback.arrivedOnTime === false
              ? 'No'
              : '—'}
        </p>

        <p className="text-sm text-slate-600 dark:text-slate-300">
          <span className="font-bold">No-show:</span>{' '}
          {feedback.wasNoShow === true
            ? 'Yes'
            : feedback.wasNoShow === false
              ? 'No'
              : '—'}
        </p>

        <p className="text-sm text-slate-600 dark:text-slate-300">
          <span className="font-bold">Followed instructions:</span>{' '}
          {feedback.followedInstructions === true
            ? 'Yes'
            : feedback.followedInstructions === false
              ? 'No'
              : '—'}
        </p>

        <p className="text-sm text-slate-600 dark:text-slate-300">
          <span className="font-bold">Follow-up needed:</span>{' '}
          {feedback.followUpNeeded === true
            ? 'Yes'
            : feedback.followUpNeeded === false
              ? 'No'
              : '—'}
        </p>
      </div>

      {feedback.communicationNote ? (
        <div className="mt-4 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <span className="font-bold">Communication note:</span>{' '}
          {feedback.communicationNote}
        </div>
      ) : null}

      {feedback.internalNote ? (
        <div className="mt-3 rounded-2xl bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
          <span className="font-bold">Internal note:</span>{' '}
          {feedback.internalNote}
        </div>
      ) : null}
    </Card>
  )
}

export function ReviewsPage() {
  const [status, setStatus] = useState<StatusFilter>('')

  const summary = useAdminReviewSummary()
  const hospitalReviews = useAdminHospitalReviews(status)
  const doctorReviews = useAdminDoctorReviews(status)
  const feedback = useAdminPatientFeedback()

  if (
    summary.isLoading ||
    hospitalReviews.isLoading ||
    doctorReviews.isLoading ||
    feedback.isLoading
  ) {
    return (
      <main className="p-6">
        <p className="text-sm text-slate-500">Loading reviews...</p>
      </main>
    )
  }

  if (
    summary.error ||
    hospitalReviews.error ||
    doctorReviews.error ||
    feedback.error
  ) {
    return (
      <main className="p-6">
        <Card>
          <p className="text-sm text-rose-600">
            Failed to load review moderation data.
          </p>
        </Card>
      </main>
    )
  }

  const hospitalRows = hospitalReviews.data ?? []
  const doctorRows = doctorReviews.data ?? []
  const feedbackRows = feedback.data ?? []

  return (
    <main className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">
          Review Moderation
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Approve or reject hospital and doctor reviews before they become
          public.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Hospital reviews</p>
          <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
            {summary.data?.hospitalReviews.approved ?? 0}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Pending: {summary.data?.hospitalReviews.pending ?? 0} · Rejected:{' '}
            {summary.data?.hospitalReviews.rejected ?? 0}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-slate-500">Doctor reviews</p>
          <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
            {summary.data?.doctorReviews.approved ?? 0}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Pending: {summary.data?.doctorReviews.pending ?? 0} · Rejected:{' '}
            {summary.data?.doctorReviews.rejected ?? 0}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-slate-500">Internal patient feedback</p>
          <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
            {summary.data?.patientVisitFeedback.total ?? 0}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Internal only. Not public ratings.
          </p>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-black text-slate-900 dark:text-white">
              Filter
            </h2>
            <p className="text-sm text-slate-500">
              Focus on pending, approved, or rejected reviews.
            </p>
          </div>

          <select
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            value={status}
            onChange={(event) => setStatus(event.target.value as StatusFilter)}
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </Card>

      <section>
        <h2 className="mb-3 text-xl font-black text-slate-900 dark:text-white">
          Hospital Reviews
        </h2>

        {hospitalRows.length ? (
          <div className="space-y-4">
            {hospitalRows.map((review) => (
              <ReviewModerationCard
                key={review.id}
                review={review}
                type="hospital"
              />
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-sm text-slate-500">No hospital reviews found.</p>
          </Card>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-black text-slate-900 dark:text-white">
          Doctor Reviews
        </h2>

        {doctorRows.length ? (
          <div className="space-y-4">
            {doctorRows.map((review) => (
              <ReviewModerationCard
                key={review.id}
                review={review}
                type="doctor"
              />
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-sm text-slate-500">No doctor reviews found.</p>
          </Card>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-black text-slate-900 dark:text-white">
          Internal Patient Feedback
        </h2>

        {feedbackRows.length ? (
          <div className="space-y-4">
            {feedbackRows.map((item) => (
              <FeedbackCard key={item.id} feedback={item} />
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-sm text-slate-500">
              No internal patient feedback found.
            </p>
          </Card>
        )}
      </section>
    </main>
  )
}