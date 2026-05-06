import { apiClient } from './client';import type { HealthResponse } from '../types/models';export const healthApi={getHealth:async()=>(await apiClient.get<HealthResponse>('/health')).data}
