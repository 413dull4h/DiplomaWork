import type { LabOrderStatus } from '../types/models'

export const orderStatusFlow: LabOrderStatus[] = [
  'REQUESTED',
  'ACCEPTED',
  'SAMPLE_COLLECTED',
  'IN_PROGRESS',
  'COMPLETED',
]

export function nextAllowedActions(status: LabOrderStatus) {
  switch (status) {
    case 'NEW':
    case 'REQUESTED':
      return ['ACCEPTED', 'REJECTED'] as LabOrderStatus[]
    case 'ACCEPTED':
    case 'SCHEDULED':
      return ['SAMPLE_COLLECTED'] as LabOrderStatus[]
    case 'SAMPLE_COLLECTED':
      return ['IN_PROGRESS'] as LabOrderStatus[]
    case 'IN_PROGRESS':
      return ['COMPLETED'] as LabOrderStatus[]
    default:
      return [] as LabOrderStatus[]
  }
}

export function isTerminalStatus(status: LabOrderStatus) {
  return ['COMPLETED', 'REJECTED', 'CANCELLED', 'MISSED'].includes(status)
}
