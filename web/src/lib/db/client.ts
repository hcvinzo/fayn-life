import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Database Client Layer
 *
 * This is the ONLY file that should import and create Supabase clients.
 * All database operations should go through repositories that use this client.
 *
 * This abstraction allows us to easily replace Supabase with another database
 * in the future by only changing this file and the repository implementations.
 */

let supabaseClient: ReturnType<typeof createSupabaseClient<Database>> | null = null

/**
 * Get the singleton Supabase client instance
 * Uses service role key for server-side operations with full database access
 */
export function getDbClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
      )
    }

    supabaseClient = createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return supabaseClient
}

/**
 * Abstract database client interface
 * This can be used to define a contract that any database client must implement
 * making it easier to swap out Supabase for another solution
 */
export interface IDatabaseClient {
  // Define methods that any database client should implement
  // This is a placeholder for future database abstraction
}

/**
 * Type helper to extract table names from the database schema
 */
export type TableName = keyof Database['public']['Tables']

/**
 * Type helper to extract row type for a given table
 */
export type TableRow<T extends TableName> = Database['public']['Tables'][T]['Row']

/**
 * Type helper to extract insert type for a given table
 */
export type TableInsert<T extends TableName> = Database['public']['Tables'][T]['Insert']

/**
 * Type helper to extract update type for a given table
 */
export type TableUpdate<T extends TableName> = Database['public']['Tables'][T]['Update']
