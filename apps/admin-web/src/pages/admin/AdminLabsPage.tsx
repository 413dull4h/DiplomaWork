import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  Download,
  FileText,
  FlaskConical,
  Microscope,
  UserRound,
} from 'lucide-react'

import {
  adminApiFileUrl,
  type AdminLabOrder,
  type AdminLabReport,
  type AnyRecord,
} from '../../api/labs'
import {
  useAdminLabOrder,
  useAdminLabOrders,
  useAdminLabReport,
  useAdminLabReports,
} from '../../hooks/useAdminLabs'

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
    value?.legalName ??
    value?.displayName ??
    '—'
  )
}

function getOrderDate(order: AdminLabOrder) {
  return order.createdAt ?? order.rawOrder?.created_at
}

function getOrderReason(order?: AdminLabOrder | null) {
  return order?.rawOrder?.reason ?? order?.reason ?? '—'
}

function getReportFileUrl(report?: AdminLabReport | AnyRecord | null) {
  if (!report) return ''

  return (
    report.rawReport?.file_url ??
    report.rawReport?.fileUrl ??
    report.file_url ??
    report.fileUrl ??
    report.reportUrl ??
    ''
  )
}

function getReportTitle(report?: AdminLabReport | AnyRecord | null) {
  return (
    report?.rawReport?.title ??
    report?.title ??
    report?.rawReport?.original_name ??
    report?.original_name ??
    report?.rawReport?.file_name ??
    report?.file_name ??
    'Lab report'
  )
}

function getTestName(item: AnyRecord) {
  return (
    item.test_name ??
    item.testName ??
    item.name ??
    item.test?.name ??
    item.test_code ??
    item.testCode ??
    item.lab_test_id ??
    item.id ??
    'Unnamed test'
  )
}

function statusClass(status?: string) {
  switch (status) {
    case 'COMPLETED':
    case 'FINAL':
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
    <div className="space-y-6">
      <div className="flex items-start gap-3">
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
        Something went wrong while loading admin lab data.
      </p>
    </Card>
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

function ReportButton({ report }: { report: AdminLabReport | AnyRecord }) {
  const url = adminApiFileUrl(getReportFileUrl(report))

  if (!url) {
    return (
      <span className="inline-flex rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-500 dark:bg-slate-900">
        No file
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

function OrderCard({ order }: { order: AdminLabOrder }) {
  const items = order.items ?? []
  const reports = order.reports ?? []

  return (
    <Card>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={order.status} />
            <span className="text-sm text-slate-500">
              Created: {formatDate(getOrderDate(order))}
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
              items.map((item) => (
                <span
                  key={item.id}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  {getTestName(item)}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-500">No tests listed.</span>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <InfoLine
              icon={<UserRound className="h-4 w-4" />}
              label="Patient"
              value={getName(order.patient)}
            />
            <InfoLine
              icon={<UserRound className="h-4 w-4" />}
              label="Doctor"
              value={getName(order.orderingDoctor)}
            />
            <InfoLine
              icon={<Building2 className="h-4 w-4" />}
              label="Hospital"
              value={getName(order.hospital)}
            />
            <InfoLine
              icon={<Microscope className="h-4 w-4" />}
              label="Lab"
              value={getName(order.lab)}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 xl:justify-end">
          <Link
            to={`/labs/${order.id}`}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            View details
          </Link>

          {reports.length ? (
            <ReportButton report={reports[0]} />
          ) : (
            <span className="inline-flex rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-500 dark:bg-slate-900">
              No report
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}

function ReportCard({ report }: { report: AdminLabReport }) {
  return (
    <Card>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={report.rawReport?.status ?? report.status ?? 'REPORT'} />
            <span className="text-sm text-slate-500">
              Created: {formatDate(report.createdAt ?? report.rawReport?.created_at)}
            </span>
          </div>

          <div>
            <h2 className="text-lg font-black text-slate-950 dark:text-white">
              {getReportTitle(report)}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {report.rawReport?.summary ?? report.summary ?? 'Uploaded lab report'}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <InfoLine
              icon={<UserRound className="h-4 w-4" />}
              label="Patient"
              value={getName(report.patient)}
            />
            <InfoLine
              icon={<UserRound className="h-4 w-4" />}
              label="Doctor"
              value={getName(report.orderingDoctor)}
            />
            <InfoLine
              icon={<Building2 className="h-4 w-4" />}
              label="Hospital"
              value={getName(report.hospital)}
            />
            <InfoLine
              icon={<Microscope className="h-4 w-4" />}
              label="Lab"
              value={getName(report.lab)}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 xl:justify-end">
          {report.labOrder?.id ? (
            <Link
              to={`/labs/${report.labOrder.id}`}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              View order
            </Link>
          ) : null}

          <Link
            to={`/lab-reports/${report.id}`}
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

export function AdminLabsPage() {
  const orders = useAdminLabOrders()
  const reports = useAdminLabReports()

  if (orders.isLoading || reports.isLoading) {
    return (
      <PageShell
        title="Labs & Reports"
        subtitle="Platform-wide lab order and report oversight."
      >
        <LoadingState />
      </PageShell>
    )
  }

  if (orders.error || reports.error) {
    return (
      <PageShell
        title="Labs & Reports"
        subtitle="Platform-wide lab order and report oversight."
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
      subtitle="Monitor lab orders, report uploads, patients, doctors, hospitals, and diagnostic centers."
    >
      <div className="grid gap-4 md:grid-cols-4">
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
          <p className="text-sm font-bold text-slate-500">Requested</p>
          <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
            {labOrders.filter((order) => order.status === 'REQUESTED').length}
          </p>
        </Card>
        <Card>
          <p className="text-sm font-bold text-slate-500">Reports</p>
          <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
            {labReports.length}
          </p>
        </Card>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-cyan-600" />
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
          <EmptyState text="No lab orders found." />
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
          <EmptyState text="No lab reports uploaded yet." />
        )}
      </section>
    </PageShell>
  )
}

export function AdminLabOrderDetailPage() {
  const { labOrderId } = useParams()
  const order = useAdminLabOrder(labOrderId)

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
  const items = data.items ?? []
  const reports = data.reports ?? []

  return (
    <PageShell
      title={`Lab Order #${data.id?.slice(0, 8)}`}
      subtitle="Read-only platform oversight for this lab order."
    >
      <Link
        to="/labs"
        className="inline-flex items-center gap-2 text-sm font-bold text-cyan-700 hover:text-cyan-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Labs & Reports
      </Link>

      <Card>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <StatusBadge status={data.status} />
            <h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">
              Lab Order
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Created: {formatDate(getOrderDate(data))}
            </p>
          </div>

          {reports.length ? <ReportButton report={reports[0]} /> : null}
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-4">
          <InfoLine
            icon={<UserRound className="h-4 w-4" />}
            label="Patient"
            value={getName(data.patient)}
          />
          <InfoLine
            icon={<UserRound className="h-4 w-4" />}
            label="Doctor"
            value={getName(data.orderingDoctor)}
          />
          <InfoLine
            icon={<Building2 className="h-4 w-4" />}
            label="Hospital"
            value={getName(data.hospital)}
          />
          <InfoLine
            icon={<Microscope className="h-4 w-4" />}
            label="Lab"
            value={getName(data.lab)}
          />
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Reason / clinical note
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            {getOrderReason(data)}
          </p>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-black text-slate-950 dark:text-white">
          Requested tests
        </h3>

        <div className="mt-4 grid gap-3">
          {items.length ? (
            items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
              >
                <p className="font-black text-slate-950 dark:text-white">
                  {getTestName(item)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Code: {item.test_code ?? item.testCode ?? '—'} · Price:{' '}
                  {item.price ?? '—'}
                </p>
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
                    {formatDate(report.created_at ?? report.createdAt)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/lab-reports/${report.id}`}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    Details
                  </Link>
                  <ReportButton report={report} />
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No reports uploaded yet.</p>
          )}
        </div>
      </Card>
    </PageShell>
  )
}

export function AdminLabReportDetailPage() {
  const { reportId } = useParams()
  const report = useAdminLabReport(reportId)

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
  const fileUrl = adminApiFileUrl(getReportFileUrl(data))

  return (
    <PageShell
      title="Lab Report Detail"
      subtitle="Read-only platform oversight for this uploaded report."
    >
      <Link
        to="/labs"
        className="inline-flex items-center gap-2 text-sm font-bold text-cyan-700 hover:text-cyan-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Labs & Reports
      </Link>

      <Card>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <StatusBadge status={data.rawReport?.status ?? data.status ?? 'REPORT'} />
            <h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">
              {getReportTitle(data)}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Created: {formatDate(data.createdAt ?? data.rawReport?.created_at)}
            </p>
          </div>

          <ReportButton report={data} />
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-4">
          <InfoLine
            icon={<UserRound className="h-4 w-4" />}
            label="Patient"
            value={getName(data.patient)}
          />
          <InfoLine
            icon={<UserRound className="h-4 w-4" />}
            label="Doctor"
            value={getName(data.orderingDoctor)}
          />
          <InfoLine
            icon={<Building2 className="h-4 w-4" />}
            label="Hospital"
            value={getName(data.hospital)}
          />
          <InfoLine
            icon={<Microscope className="h-4 w-4" />}
            label="Lab"
            value={getName(data.lab)}
          />
        </div>

        {data.rawReport?.summary ?? data.summary ? (
          <div className="mt-6 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Summary
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              {data.rawReport?.summary ?? data.summary}
            </p>
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
