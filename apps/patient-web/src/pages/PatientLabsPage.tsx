import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  ClipboardList,
  Download,
  FileText,
  FlaskConical,
  Hospital,
  Microscope,
  UserRound,
} from 'lucide-react'

import {
  patientApiFileUrl,
  type AnyRecord,
  type PatientLabOrder,
  type PatientLabReport,
} from '../api/labs'
import {
  usePatientLabOrder,
  usePatientLabOrders,
  usePatientLabReport,
  usePatientLabReports,
} from '../hooks/usePatientLabs'

function formatDate(value?: string | null) {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleString()
}

function getName(value?: AnyRecord | null) {
  return (
    value?.name ??
    value?.fullName ??
    value?.displayName ??
    value?.legalName ??
    '—'
  )
}

function getOrderDate(order: PatientLabOrder) {
  return order.requestedAt ?? order.createdAt ?? order.updatedAt
}

function getOrderItems(order?: PatientLabOrder | null) {
  if (!order) return []

  return (
    order.items ??
    order.orderItems ??
    order.labOrderItems ??
    order.tests ??
    []
  )
}

function getTestName(item: AnyRecord) {
  return (
    item?.test?.name ??
    item?.testCatalog?.name ??
    item?.catalog?.name ??
    item?.name ??
    item?.testName ??
    item?.code ??
    'Unnamed test'
  )
}

function getReportsFromOrder(order?: PatientLabOrder | null) {
  if (!order) return []

  const directReports = order.reports ?? order.labReports ?? []

  if (directReports.length) return directReports

  if (order.report) return [order.report]

  if (order.labReport) return [order.labReport]

  return []
}

function getReportFileUrl(report?: PatientLabReport | AnyRecord | null) {
  if (!report) return ''

  return (
    report.fileUrl ??
    report.reportUrl ??
    report.file?.url ??
    report.file?.fileUrl ??
    report.document?.fileUrl ??
    report.attachment?.url ??
    ''
  )
}

function getReportTitle(report?: PatientLabReport | AnyRecord | null) {
  return (
    report?.title ??
    report?.fileName ??
    report?.originalName ??
    report?.summary ??
    'Lab report'
  )
}

function statusClass(status?: string) {
  switch (status) {
    case 'COMPLETED':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    case 'ACCEPTED':
      return 'border-blue-200 bg-blue-50 text-blue-700'
    case 'SAMPLE_COLLECTED':
      return 'border-cyan-200 bg-cyan-50 text-cyan-700'
    case 'IN_PROGRESS':
      return 'border-amber-200 bg-amber-50 text-amber-700'
    case 'REJECTED':
    case 'CANCELLED':
      return 'border-rose-200 bg-rose-50 text-rose-700'
    case 'REQUESTED':
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700'
  }
}

function StatusBadge({ status }: { status?: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusClass(
        status
      )}`}
    >
      {status ?? 'UNKNOWN'}
    </span>
  )
}

function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-700">
            <FlaskConical className="h-6 w-6" />
          </div>

          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
              {title}
            </h1>

            {subtitle ? (
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            ) : null}
          </div>
        </div>
      </div>

      {children}
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      {children}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <Card>
      <div className="py-10 text-center">
        <FileText className="mx-auto h-10 w-10 text-slate-400" />
        <p className="mt-3 font-semibold text-slate-600 dark:text-slate-300">
          {text}
        </p>
      </div>
    </Card>
  )
}

function LoadingState() {
  return (
    <div className="grid gap-4">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="h-36 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-900"
        />
      ))}
    </div>
  )
}

function ErrorState() {
  return (
    <Card>
      <p className="font-bold text-rose-600">
        Something went wrong while loading lab data.
      </p>
    </Card>
  )
}

function InfoLine({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value?: React.ReactNode
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 text-slate-400">{icon}</div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <div className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
          {value || '—'}
        </div>
      </div>
    </div>
  )
}

function ReportButton({ report }: { report: PatientLabReport | AnyRecord }) {
  const url = patientApiFileUrl(getReportFileUrl(report))

  if (!url) {
    return (
      <span className="inline-flex rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-500 dark:bg-slate-900">
        No file uploaded
      </span>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700"
    >
      <Download className="h-4 w-4" />
      Open report
    </a>
  )
}

function OrderCard({ order }: { order: PatientLabOrder }) {
  const items = getOrderItems(order)
  const reports = getReportsFromOrder(order)

  return (
    <Card>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={order.status} />
            <span className="text-sm text-slate-500">
              Ordered: {formatDate(getOrderDate(order))}
            </span>
          </div>

          <div>
            <h2 className="text-lg font-black text-slate-950 dark:text-white">
              Lab Order #{order.id?.slice(0, 8)}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {items.length} requested test{items.length === 1 ? '' : 's'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {items.length ? (
              items.map((item, index) => (
                <span
                  key={item.id ?? index}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  {getTestName(item)}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-500">
                No tests listed.
              </span>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <InfoLine
              icon={<Microscope className="h-4 w-4" />}
              label="Lab"
              value={getName(order.lab)}
            />
            <InfoLine
              icon={<UserRound className="h-4 w-4" />}
              label="Doctor"
              value={getName(order.orderingDoctor ?? order.doctor)}
            />
            <InfoLine
              icon={<Hospital className="h-4 w-4" />}
              label="Hospital"
              value={getName(order.hospital)}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Link
            to={`/app/labs/${order.id}`}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            View details
          </Link>

          {reports.length ? (
            <ReportButton report={reports[0]} />
          ) : (
            <span className="inline-flex rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-500 dark:bg-slate-900">
              Report pending
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}

function ReportCard({ report }: { report: PatientLabReport }) {
  const order = report.labOrder

  return (
    <Card>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              REPORT
            </span>

            <span className="text-sm text-slate-500">
              {formatDate(report.reportDate ?? report.createdAt)}
            </span>
          </div>

          <div>
            <h2 className="text-lg font-black text-slate-950 dark:text-white">
              {getReportTitle(report)}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {report.summary || 'Uploaded lab report'}
            </p>
          </div>

          {order ? (
            <div className="grid gap-4 md:grid-cols-3">
              <InfoLine
                icon={<Microscope className="h-4 w-4" />}
                label="Lab"
                value={getName(order.lab)}
              />
              <InfoLine
                icon={<UserRound className="h-4 w-4" />}
                label="Doctor"
                value={getName(order.orderingDoctor ?? order.doctor)}
              />
              <InfoLine
                icon={<Hospital className="h-4 w-4" />}
                label="Hospital"
                value={getName(order.hospital)}
              />
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          {order?.id ? (
            <Link
              to={`/app/labs/${order.id}`}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              View order
            </Link>
          ) : null}

          <Link
            to={`/app/lab-reports/${report.id}`}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            Details
          </Link>

          <ReportButton report={report} />
        </div>
      </div>
    </Card>
  )
}

export function PatientLabsPage() {
  const orders = usePatientLabOrders()
  const reports = usePatientLabReports()

  if (orders.isLoading || reports.isLoading) {
    return (
      <PageShell
        title="Labs & Reports"
        subtitle="Track lab orders, requested tests, order status, and uploaded reports."
      >
        <LoadingState />
      </PageShell>
    )
  }

  if (orders.error || reports.error) {
    return (
      <PageShell
        title="Labs & Reports"
        subtitle="Track lab orders, requested tests, order status, and uploaded reports."
      >
        <ErrorState />
      </PageShell>
    )
  }

  const labOrders = orders.data ?? []
  const labReports = reports.data ?? []

  return (
    <PageShell
      title="Labs & Reports"
      subtitle="Track lab orders, requested tests, order status, and uploaded reports."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm font-bold text-slate-500">Total orders</p>
          <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
            {labOrders.length}
          </p>
        </Card>

        <Card>
          <p className="text-sm font-bold text-slate-500">Completed</p>
          <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
            {labOrders.filter((order) => order.status === 'COMPLETED').length}
          </p>
        </Card>

        <Card>
          <p className="text-sm font-bold text-slate-500">Reports uploaded</p>
          <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
            {labReports.length}
          </p>
        </Card>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-cyan-600" />
          <h2 className="text-xl font-black text-slate-950 dark:text-white">
            Lab Orders
          </h2>
        </div>

        {labOrders.length ? (
          <div className="grid gap-4">
            {labOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <EmptyState text="No lab orders found yet." />
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-cyan-600" />
          <h2 className="text-xl font-black text-slate-950 dark:text-white">
            Uploaded Reports
          </h2>
        </div>

        {labReports.length ? (
          <div className="grid gap-4">
            {labReports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        ) : (
          <EmptyState text="No uploaded reports found yet." />
        )}
      </section>
    </PageShell>
  )
}

export function PatientLabOrderDetailPage() {
  const { labOrderId } = useParams()
  const order = usePatientLabOrder(labOrderId)

  if (order.isLoading) {
    return (
      <PageShell title="Lab Order Detail">
        <LoadingState />
      </PageShell>
    )
  }

  if (order.error || !order.data) {
    return (
      <PageShell title="Lab Order Detail">
        <ErrorState />
      </PageShell>
    )
  }

  const data = order.data
  const items = getOrderItems(data)
  const reports = getReportsFromOrder(data)

  return (
    <PageShell
      title={`Lab Order #${data.id?.slice(0, 8)}`}
      subtitle="Order status, requested tests, lab, doctor, hospital, and uploaded report."
    >
      <Link
        to="/app/labs"
        className="inline-flex items-center gap-2 text-sm font-bold text-cyan-700 hover:text-cyan-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Labs & Reports
      </Link>

      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <StatusBadge status={data.status} />

            <h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">
              Lab Order
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Ordered: {formatDate(getOrderDate(data))}
            </p>
          </div>

          {reports.length ? <ReportButton report={reports[0]} /> : null}
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <InfoLine
            icon={<Microscope className="h-4 w-4" />}
            label="Lab"
            value={getName(data.lab)}
          />
          <InfoLine
            icon={<UserRound className="h-4 w-4" />}
            label="Doctor"
            value={getName(data.orderingDoctor ?? data.doctor)}
          />
          <InfoLine
            icon={<Building2 className="h-4 w-4" />}
            label="Hospital"
            value={getName(data.hospital)}
          />
        </div>

        {data.reason || data.clinicalNotes ? (
          <div className="mt-6 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Clinical note / reason
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              {data.reason ?? data.clinicalNotes}
            </p>
          </div>
        ) : null}
      </Card>

      <Card>
        <h3 className="text-lg font-black text-slate-950 dark:text-white">
          Requested tests
        </h3>

        <div className="mt-4 grid gap-3">
          {items.length ? (
            items.map((item, index) => (
              <div
                key={item.id ?? index}
                className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
              >
                <p className="font-black text-slate-950 dark:text-white">
                  {getTestName(item)}
                </p>

                <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                  {item.status ? <span>Status: {item.status}</span> : null}
                  {item.price ? <span>Price: {item.price}</span> : null}
                  {item.notesForLab ? (
                    <span>Note: {item.notesForLab}</span>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No tests listed.</p>
          )}
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-black text-slate-950 dark:text-white">
          Reports
        </h3>

        <div className="mt-4 grid gap-3">
          {reports.length ? (
            reports.map((report) => (
              <div
                key={report.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-black text-slate-950 dark:text-white">
                    {getReportTitle(report)}
                  </p>
                  <p className="text-sm text-slate-500">
                    {formatDate(report.reportDate ?? report.createdAt)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/app/lab-reports/${report.id}`}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    Details
                  </Link>

                  <ReportButton report={report} />
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">
              No report uploaded yet. The report will appear here after the lab uploads it.
            </p>
          )}
        </div>
      </Card>
    </PageShell>
  )
}

export function PatientLabReportDetailPage() {
  const { reportId } = useParams()
  const report = usePatientLabReport(reportId)

  if (report.isLoading) {
    return (
      <PageShell title="Lab Report Detail">
        <LoadingState />
      </PageShell>
    )
  }

  if (report.error || !report.data) {
    return (
      <PageShell title="Lab Report Detail">
        <ErrorState />
      </PageShell>
    )
  }

  const data = report.data
  const order = data.labOrder
  const fileUrl = patientApiFileUrl(getReportFileUrl(data))

  return (
    <PageShell
      title="Lab Report Detail"
      subtitle="Open uploaded PDF/image report and view linked lab order information."
    >
      <Link
        to="/app/labs"
        className="inline-flex items-center gap-2 text-sm font-bold text-cyan-700 hover:text-cyan-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Labs & Reports
      </Link>

      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              REPORT
            </span>

            <h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">
              {getReportTitle(data)}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Uploaded: {formatDate(data.reportDate ?? data.createdAt)}
            </p>

            {data.summary ? (
              <p className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
                {data.summary}
              </p>
            ) : null}
          </div>

          <ReportButton report={data} />
        </div>

        {order ? (
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <InfoLine
              icon={<Microscope className="h-4 w-4" />}
              label="Lab"
              value={getName(order.lab)}
            />
            <InfoLine
              icon={<UserRound className="h-4 w-4" />}
              label="Doctor"
              value={getName(order.orderingDoctor ?? order.doctor)}
            />
            <InfoLine
              icon={<Building2 className="h-4 w-4" />}
              label="Hospital"
              value={getName(order.hospital)}
            />
          </div>
        ) : null}
      </Card>

      {fileUrl ? (
        <Card>
          <h3 className="mb-4 text-lg font-black text-slate-950 dark:text-white">
            Report preview
          </h3>

          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            <iframe
              title="Lab report preview"
              src={fileUrl}
              className="h-[75vh] w-full bg-white"
            />
          </div>
        </Card>
      ) : (
        <EmptyState text="No report file is attached." />
      )}
    </PageShell>
  )
}