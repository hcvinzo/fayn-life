/**
 * API Type Definitions
 *
 * Common types used across API requests and responses
 */

/**
 * Pagination parameters for list endpoints
 */
export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

/**
 * Pagination metadata in responses
 */
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

/**
 * Sort parameters
 */
export interface SortParams {
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Filter parameters (generic)
 */
export interface FilterParams {
  [key: string]: any
}

/**
 * Common query parameters for list endpoints
 */
export interface ListQueryParams extends PaginationParams, SortParams, FilterParams {}
