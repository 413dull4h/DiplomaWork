import { listLabOrders } from './orders'
import { listLabTests } from './tests'
import type { DashboardSummary } from '../types/models'

export async function getLabDashboardSummary(): Promise<DashboardSummary> {
  const [tests, orders] = await Promise.all([listLabTests(), listLabOrders()])

  const count = (status: string) => orders.filter((order) => order.status === status).length
  const pendingReportUploads = orders.filter(
    (order) => order.status === 'COMPLETED' && (!order.reports || order.reports.length === 0)
  ).length

  return {
    totalTests: tests.length,
    requestedOrders: count('REQUESTED') + count('NEW'),
    acceptedOrders: count('ACCEPTED'),
    sampleCollectedOrders: count('SAMPLE_COLLECTED'),
    inProgressOrders: count('IN_PROGRESS'),
    completedOrders: count('COMPLETED'),
    rejectedOrders: count('REJECTED'),
    pendingReportUploads,
    recentOrders: orders.slice(0, 6),
  }
}
