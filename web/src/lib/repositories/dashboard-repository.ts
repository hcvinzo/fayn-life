/**
 * Dashboard Repository
 *
 * Data access layer for dashboard statistics and data.
 * Aggregates data from multiple tables for dashboard display.
 */

import { createClient } from '@/lib/supabase/server'
import type { DashboardStats } from '@/types/dashboard'
import type { AppointmentWithClient } from '@/types/appointment'
import { DatabaseError } from '@/lib/utils/errors'

export class DashboardRepository {
  /**
   * Get dashboard statistics for a practice
   * @param practiceId - Practice ID
   * @returns Dashboard statistics
   */
  async getStatistics(practiceId: string): Promise<DashboardStats> {
    try {
      const supabase = await createClient()
      const now = new Date()

      // Get start and end of today (ensure proper time component)
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date(todayStart)
      todayEnd.setDate(todayEnd.getDate() + 1)

      // Get start and end of current week (Monday to Sunday)
      const currentDay = now.getDay()
      const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() + diffToMonday)
      weekStart.setHours(0, 0, 0, 0)

      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 7)
      weekEnd.setHours(0, 0, 0, 0)

      // Count total active clients
      const { count: totalClients, error: clientError } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('practice_id', practiceId)
        .eq('status', 'active')

      if (clientError) {
        throw new DatabaseError(`Failed to count clients: ${clientError.message}`, clientError)
      }

      // Count today's appointments (all statuses except cancelled)
      const { count: todayTotal, error: todayTotalError } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('practice_id', practiceId)
        .gte('start_time', todayStart.toISOString())
        .lt('start_time', todayEnd.toISOString())
        .neq('status', 'cancelled')

      if (todayTotalError) {
        throw new DatabaseError(`Failed to count today's appointments: ${todayTotalError.message}`, todayTotalError)
      }

      // Count today's completed/confirmed appointments
      const { count: todayFilled, error: todayFilledError } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('practice_id', practiceId)
        .gte('start_time', todayStart.toISOString())
        .lt('start_time', todayEnd.toISOString())
        .or('status.eq.completed,status.eq.confirmed')

      if (todayFilledError) {
        throw new DatabaseError(`Failed to count today's filled appointments: ${todayFilledError.message}`, todayFilledError)
      }

      // Count this week's appointments (all statuses except cancelled)
      const { count: weekTotal, error: weekTotalError } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('practice_id', practiceId)
        .gte('start_time', weekStart.toISOString())
        .lt('start_time', weekEnd.toISOString())
        .neq('status', 'cancelled')

      if (weekTotalError) {
        throw new DatabaseError(`Failed to count week's appointments: ${weekTotalError.message}`, weekTotalError)
      }

      // Count this week's completed/confirmed appointments
      const { count: weekFilled, error: weekFilledError } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('practice_id', practiceId)
        .gte('start_time', weekStart.toISOString())
        .lt('start_time', weekEnd.toISOString())
        .or('status.eq.completed,status.eq.confirmed')

      if (weekFilledError) {
        throw new DatabaseError(`Failed to count week's filled appointments: ${weekFilledError.message}`, weekFilledError)
      }

      // Calculate fill rates
      const todayFillRate = todayTotal && todayTotal > 0 ? Math.round((todayFilled! / todayTotal) * 100) : 0
      const weekFillRate = weekTotal && weekTotal > 0 ? Math.round((weekFilled! / weekTotal) * 100) : 0

      return {
        todayFillRate,
        weekFillRate,
        totalClients: totalClients || 0,
        todayAppointments: todayTotal || 0,
        weekAppointments: weekTotal || 0,
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Unexpected error fetching dashboard statistics', error)
    }
  }

  /**
   * Get today's appointments with client details
   * @param practiceId - Practice ID
   * @returns Array of today's appointments in ascending order
   */
  async getTodayAppointments(practiceId: string): Promise<AppointmentWithClient[]> {
    try {
      const supabase = await createClient()
      const now = new Date()

      // Get start and end of today (ensure proper time component)
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date(todayStart)
      todayEnd.setDate(todayEnd.getDate() + 1)

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          client:client_id (
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq('practice_id', practiceId)
        .gte('start_time', todayStart.toISOString())
        .lt('start_time', todayEnd.toISOString())
        .order('start_time', { ascending: true })

      if (error) {
        throw new DatabaseError(`Failed to fetch today's appointments: ${error.message}`, error)
      }

      return (data as any) || []
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Unexpected error fetching today\'s appointments', error)
    }
  }

  /**
   * Get upcoming appointments (next 7 days) with client details
   * @param practiceId - Practice ID
   * @returns Array of upcoming appointments
   */
  async getUpcomingAppointments(practiceId: string): Promise<AppointmentWithClient[]> {
    try {
      const supabase = await createClient()
      const now = new Date()

      // Get start of tomorrow (ensure proper time component)
      const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      tomorrowStart.setDate(tomorrowStart.getDate() + 1)
      tomorrowStart.setHours(0, 0, 0, 0)

      // Get end of next 7 days
      const weekEnd = new Date(tomorrowStart)
      weekEnd.setDate(tomorrowStart.getDate() + 7)
      weekEnd.setHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          client:client_id (
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq('practice_id', practiceId)
        .gte('start_time', tomorrowStart.toISOString())
        .lt('start_time', weekEnd.toISOString())
        .neq('status', 'cancelled')
        .order('start_time', { ascending: true })
        .limit(10) // Limit to 10 upcoming appointments

      if (error) {
        throw new DatabaseError(`Failed to fetch upcoming appointments: ${error.message}`, error)
      }

      return (data as any) || []
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Unexpected error fetching upcoming appointments', error)
    }
  }
}

// Export singleton instance
export const dashboardRepository = new DashboardRepository()
