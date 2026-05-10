import { useState } from 'react'
import {
  useAppointmentReviewStatus,
  useCreateDoctorReview,
  useCreateHospitalReview,
} from '../../hooks/useReviews'

type ReviewPanelProps = {
  appointmentId: string
}

function RatingSelect({
  label,
  value,
  onChange,
  optional = false,
}: {
  label: string
  value: number | ''
  onChange: (value: number | '') => void
  optional?: boolean
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
        {label}
      </span>

      <select
        className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        value={value}
        onChange={(event) => {
          const next = event.target.value
          onChange(next ? Number(next) : '')
        }}
      >
        {optional ? <option value="">Optional</option> : null}
        <option value={5}>5 — Excellent</option>
        <option value={4}>4 — Good</option>
        <option value={3}>3 — Okay</option>
        <option value={2}>2 — Poor</option>
        <option value={1}>1 — Bad</option>
      </select>
    </label>
  )
}

function MessageBox({
  type,
  children,
}: {
  type: 'success' | 'warning' | 'info' | 'error'
  children: React.ReactNode
}) {
  const classes = {
    success:
      'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
    warning:
      'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200',
    info: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200',
    error:
      'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200',
  }

  return (
    <div className={`rounded-2xl border p-4 text-sm ${classes[type]}`}>
      {children}
    </div>
  )
}

export function ReviewPanel({ appointmentId }: ReviewPanelProps) {
  const statusQuery = useAppointmentReviewStatus(appointmentId)
  const hospitalMutation = useCreateHospitalReview()
  const doctorMutation = useCreateDoctorReview()

  const [hospitalForm, setHospitalForm] = useState({
    overallRating: 5,
    staffRating: 5 as number | '',
    cleanlinessRating: 5 as number | '',
    waitingTimeRating: 5 as number | '',
    serviceRating: 5 as number | '',
    comment: '',
  })

  const [doctorForm, setDoctorForm] = useState({
    overallRating: 5,
    communicationRating: 5 as number | '',
    professionalismRating: 5 as number | '',
    helpfulnessRating: 5 as number | '',
    wouldRecommend: true,
    comment: '',
  })

  const status = statusQuery.data

  if (statusQuery.isLoading) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <p className="text-sm text-slate-500">Checking review availability...</p>
      </section>
    )
  }

  if (statusQuery.error || !status) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <MessageBox type="error">Could not load review status.</MessageBox>
      </section>
    )
  }

  if (!status.canReview) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Review appointment
        </h2>

        <div className="mt-3">
          <MessageBox type="info">
            Reviews are available only after the appointment is completed.
            Current status: <strong>{status.status}</strong>
          </MessageBox>
        </div>
      </section>
    )
  }

  const hospitalDone = status.hospitalReviewSubmitted
  const doctorDone = status.doctorReviewSubmitted

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Review your visit
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Reviews are submitted for moderation before becoming public.
        </p>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 p-4 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white">
            Hospital review
          </h3>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {status.hospital?.name || 'Hospital'}
          </p>

          {hospitalDone ? (
            <div className="mt-4">
              <MessageBox type="success">
                Hospital review already submitted. It may be pending moderation.
              </MessageBox>
            </div>
          ) : (
            <form
              className="mt-4 space-y-4"
              onSubmit={(event) => {
                event.preventDefault()

                hospitalMutation.mutate({
                  appointmentId,
                  overallRating: hospitalForm.overallRating,
                  staffRating:
                    hospitalForm.staffRating === ''
                      ? undefined
                      : hospitalForm.staffRating,
                  cleanlinessRating:
                    hospitalForm.cleanlinessRating === ''
                      ? undefined
                      : hospitalForm.cleanlinessRating,
                  waitingTimeRating:
                    hospitalForm.waitingTimeRating === ''
                      ? undefined
                      : hospitalForm.waitingTimeRating,
                  serviceRating:
                    hospitalForm.serviceRating === ''
                      ? undefined
                      : hospitalForm.serviceRating,
                  comment: hospitalForm.comment.trim() || undefined,
                })
              }}
            >
              <RatingSelect
                label="Overall rating"
                value={hospitalForm.overallRating}
                onChange={(value) =>
                  value !== '' &&
                  setHospitalForm((current) => ({
                    ...current,
                    overallRating: value,
                  }))
                }
              />

              <RatingSelect
                label="Staff behavior"
                value={hospitalForm.staffRating}
                optional
                onChange={(value) =>
                  setHospitalForm((current) => ({
                    ...current,
                    staffRating: value,
                  }))
                }
              />

              <RatingSelect
                label="Cleanliness"
                value={hospitalForm.cleanlinessRating}
                optional
                onChange={(value) =>
                  setHospitalForm((current) => ({
                    ...current,
                    cleanlinessRating: value,
                  }))
                }
              />

              <RatingSelect
                label="Waiting time"
                value={hospitalForm.waitingTimeRating}
                optional
                onChange={(value) =>
                  setHospitalForm((current) => ({
                    ...current,
                    waitingTimeRating: value,
                  }))
                }
              />

              <RatingSelect
                label="Service quality"
                value={hospitalForm.serviceRating}
                optional
                onChange={(value) =>
                  setHospitalForm((current) => ({
                    ...current,
                    serviceRating: value,
                  }))
                }
              />

              <label className="block">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Comment
                </span>
                <textarea
                  className="mt-1 min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  value={hospitalForm.comment}
                  onChange={(event) =>
                    setHospitalForm((current) => ({
                      ...current,
                      comment: event.target.value,
                    }))
                  }
                  placeholder="Share your experience..."
                />
              </label>

              {hospitalMutation.error ? (
                <MessageBox type="error">
                  Failed to submit hospital review.
                </MessageBox>
              ) : null}

              {hospitalMutation.isSuccess ? (
                <MessageBox type="success">
                  Hospital review submitted. Status: pending moderation.
                </MessageBox>
              ) : null}

              <button
                type="submit"
                disabled={hospitalMutation.isPending}
                className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {hospitalMutation.isPending
                  ? 'Submitting...'
                  : 'Submit hospital review'}
              </button>
            </form>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 p-4 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white">
            Doctor review
          </h3>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {status.doctor?.fullName || 'Doctor'}
            {status.doctor?.specialization
              ? ` · ${status.doctor.specialization}`
              : ''}
          </p>

          {doctorDone ? (
            <div className="mt-4">
              <MessageBox type="success">
                Doctor review already submitted. It may be pending moderation.
              </MessageBox>
            </div>
          ) : (
            <form
              className="mt-4 space-y-4"
              onSubmit={(event) => {
                event.preventDefault()

                doctorMutation.mutate({
                  appointmentId,
                  overallRating: doctorForm.overallRating,
                  communicationRating:
                    doctorForm.communicationRating === ''
                      ? undefined
                      : doctorForm.communicationRating,
                  professionalismRating:
                    doctorForm.professionalismRating === ''
                      ? undefined
                      : doctorForm.professionalismRating,
                  helpfulnessRating:
                    doctorForm.helpfulnessRating === ''
                      ? undefined
                      : doctorForm.helpfulnessRating,
                  wouldRecommend: doctorForm.wouldRecommend,
                  comment: doctorForm.comment.trim() || undefined,
                })
              }}
            >
              <RatingSelect
                label="Overall rating"
                value={doctorForm.overallRating}
                onChange={(value) =>
                  value !== '' &&
                  setDoctorForm((current) => ({
                    ...current,
                    overallRating: value,
                  }))
                }
              />

              <RatingSelect
                label="Communication"
                value={doctorForm.communicationRating}
                optional
                onChange={(value) =>
                  setDoctorForm((current) => ({
                    ...current,
                    communicationRating: value,
                  }))
                }
              />

              <RatingSelect
                label="Professionalism"
                value={doctorForm.professionalismRating}
                optional
                onChange={(value) =>
                  setDoctorForm((current) => ({
                    ...current,
                    professionalismRating: value,
                  }))
                }
              />

              <RatingSelect
                label="Helpfulness"
                value={doctorForm.helpfulnessRating}
                optional
                onChange={(value) =>
                  setDoctorForm((current) => ({
                    ...current,
                    helpfulnessRating: value,
                  }))
                }
              />

              <label className="block">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Would recommend?
                </span>

                <select
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  value={doctorForm.wouldRecommend ? 'yes' : 'no'}
                  onChange={(event) =>
                    setDoctorForm((current) => ({
                      ...current,
                      wouldRecommend: event.target.value === 'yes',
                    }))
                  }
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Comment
                </span>
                <textarea
                  className="mt-1 min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  value={doctorForm.comment}
                  onChange={(event) =>
                    setDoctorForm((current) => ({
                      ...current,
                      comment: event.target.value,
                    }))
                  }
                  placeholder="Share your experience..."
                />
              </label>

              {doctorMutation.error ? (
                <MessageBox type="error">Failed to submit doctor review.</MessageBox>
              ) : null}

              {doctorMutation.isSuccess ? (
                <MessageBox type="success">
                  Doctor review submitted. Status: pending moderation.
                </MessageBox>
              ) : null}

              <button
                type="submit"
                disabled={doctorMutation.isPending}
                className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {doctorMutation.isPending
                  ? 'Submitting...'
                  : 'Submit doctor review'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}