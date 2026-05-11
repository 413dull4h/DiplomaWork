import { apiClient, unwrapResponse, MissingEndpointError } from './client'
import type { TestCatalogItem } from '../types/models'

export type TestPayload = {
  name: string
  code: string
  category: TestCatalogItem['category']
  sampleType: TestCatalogItem['sampleType']
  price?: number
  turnaroundTimeHours?: number
  patientInstructions?: string
  description?: string
  isActive?: boolean
}

export async function listLabTests() {
  const response = await apiClient.get('/lab/tests')
  return unwrapResponse<TestCatalogItem[]>(response.data, 'tests') ?? []
}

export async function getLabTest(id: string) {
  const tests = await listLabTests()
  const test = tests.find((item) => item.id === id)

  if (!test) {
    throw new Error('Lab test not found.')
  }

  return test
}

export async function createLabTest(payload: TestPayload) {
  const response = await apiClient.post('/lab/tests', payload)
  return unwrapResponse<TestCatalogItem>(response.data, 'test')
}

export async function updateLabTest(id: string, payload: Partial<TestPayload>) {
  const response = await apiClient.patch(`/lab/tests/${id}`, payload)
  return unwrapResponse<TestCatalogItem>(response.data, 'test')
}

export async function deleteLabTest(): Promise<void> {
  throw new MissingEndpointError('DELETE /lab/tests/:id is not implemented. Use PATCH /lab/tests/:id with isActive=false.')
}
