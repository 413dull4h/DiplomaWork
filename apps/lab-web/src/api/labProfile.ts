import { apiClient, unwrapResponse, MissingEndpointError } from './client'
import type { LabProfile } from '../types/models'

export async function getLabProfile() {
  const response = await apiClient.get('/lab/profile')
  return unwrapResponse<LabProfile>(response.data, 'lab')
}

export async function updateLabProfile(): Promise<LabProfile> {
  throw new MissingEndpointError('PATCH /lab/profile is not implemented in the current Lab API.')
}
