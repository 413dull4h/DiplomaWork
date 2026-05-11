import { Link } from 'react-router-dom'
import { ClipboardList, FileWarning, FlaskConical, TestTube2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { PageHeader } from '../../components/common/PageHeader'
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton'
import { ErrorState } from '../../components/common/ErrorState'
import { EmptyState } from '../../components/common/EmptyState'
import { StatCard } from '../../components/cards/StatCard'
import { OrderCard } from '../../components/cards/OrderCard'
import { Button } from '../../components/ui/Button'
import { useLabDashboard } from './useLabDashboard'

export function DashboardPage() {
  const dashboard = useLabDashboard()

  if (dashboard.isLoading) return <LoadingSkeleton rows={5} />
  if (dashboard.error || !dashboard.data) return <ErrorState onRetry={() => void dashboard.refetch()} />

  const data = dashboard.data

  return (
    <div>
      <PageHeader
        title="Lab Dashboard"
        subtitle="Monitor incoming orders, sample progress, report uploads, and your diagnostic test catalog."
        actions={
          <>
            <Link to="/tests/new"><Button>Add test</Button></Link>
            <Link to="/orders"><Button variant="secondary">View orders</Button></Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Test catalog" value={data.totalTests} icon={<TestTube2 className="h-5 w-5" />} />
        <StatCard label="Incoming orders" value={data.requestedOrders} icon={<ClipboardList className="h-5 w-5" />} />
        <StatCard label="In progress" value={data.inProgressOrders} icon={<FlaskConical className="h-5 w-5" />} />
        <StatCard label="Pending reports" value={data.pendingReportUploads} icon={<FileWarning className="h-5 w-5" />} />
        <StatCard label="Accepted" value={data.acceptedOrders} />
        <StatCard label="Sample collected" value={data.sampleCollectedOrders} />
        <StatCard label="Completed" value={data.completedOrders} />
        <StatCard label="Rejected" value={data.rejectedOrders} />
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
        <PageHeader title="Recent lab orders" subtitle="Latest order activity from doctors and hospitals." />
        {data.recentOrders.length ? (
          <div className="grid gap-4">
            {data.recentOrders.map((order) => <OrderCard key={order.id} order={order} />)}
          </div>
        ) : (
          <EmptyState title="No lab orders yet" message="Incoming lab requests will appear here once doctors or hospitals send orders." />
        )}
      </motion.div>
    </div>
  )
}
