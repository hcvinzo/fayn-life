/**
 * Dashboard Service
 *
 * Business logic layer for dashboard operations.
 * Orchestrates dashboard repository calls and applies business rules.
 */

import { dashboardRepository } from '@/lib/repositories/dashboard-repository'
import type { DashboardData } from '@/types/dashboard'
import { ValidationError, InternalServerError } from '@/lib/utils/errors'

export class DashboardService {
  /**
   * Get complete dashboard data for a practice
   * @param practiceId - Practice ID
   * @returns Dashboard data with stats and appointments
   */
  async getDashboardData(practiceId: string): Promise<DashboardData> {
    try {
      if (!practiceId) {
        throw new ValidationError('Practice ID is required')
      }

      // Fetch all dashboard data in parallel
      const [stats, todayAppointments, upcomingAppointments] = await Promise.all([
        dashboardRepository.getStatistics(practiceId),
        dashboardRepository.getTodayAppointments(practiceId),
        dashboardRepository.getUpcomingAppointments(practiceId),
      ])

      return {
        stats,
        todayAppointments,
        upcomingAppointments,
      }
    } catch (error) {
      if (error instanceof ValidationError) throw error
      throw new InternalServerError('Failed to fetch dashboard data')
    }
  }
}

// Export singleton instance for server-side usage
export const serverDashboardService = new DashboardService()
