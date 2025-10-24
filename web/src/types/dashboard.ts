/**
 * Dashboard Domain Types
 *
 * Business domain types for Dashboard statistics and metrics
 */

import type { AppointmentWithClient } from './appointment'

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  todayFillRate: number // Percentage of appointments filled for today
  weekFillRate: number // Percentage of appointments filled for current week
  totalClients: number // Total active clients
  todayAppointments: number // Number of appointments today
  weekAppointments: number // Number of appointments this week
}

/**
 * Dashboard data (complete dashboard view)
 */
export interface DashboardData {
  stats: DashboardStats
  todayAppointments: AppointmentWithClient[]
  upcomingAppointments: AppointmentWithClient[] // Next 7 days
}
