/**
 * Dashboard API Client
 *
 * Frontend HTTP client for dashboard operations.
 * Used by Client Components to call dashboard API routes.
 */

import { apiClient } from './client'
import type { DashboardData } from '@/types/dashboard'

export const dashboardApi = {
  /**
   * Get complete dashboard data
   * @returns Dashboard data with stats and appointments
   */
  async getDashboardData(): Promise<DashboardData> {
    return apiClient.get<DashboardData>('/api/dashboard')
  },
}
