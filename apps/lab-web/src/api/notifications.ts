import { MissingEndpointError } from './client'
import type { Notification } from '../types/models'

export const labNotificationsSupported = false

export async function listLabNotifications(): Promise<Notification[]> {
  throw new MissingEndpointError('GET /lab/notifications is not implemented in the current Lab API.')
}

export async function markLabNotificationRead(): Promise<void> {
  throw new MissingEndpointError('PATCH /lab/notifications/:id/read is not implemented in the current Lab API.')
}

export async function markAllLabNotificationsRead(): Promise<void> {
  throw new MissingEndpointError('PATCH /lab/notifications/read-all is not implemented in the current Lab API.')
}
