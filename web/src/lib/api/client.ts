/**
 * Frontend API Client
 *
 * HTTP client wrapper for making requests to the backend API.
 * Provides type-safe methods and centralized error handling.
 *
 * This is the ONLY way frontend components should communicate with the backend.
 * DO NOT use Supabase directly in frontend components.
 */

import type { SuccessResponse, ErrorResponse } from '@/lib/utils/response'

/**
 * API Client error class
 */
export class ApiClientError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}

/**
 * API Client configuration
 */
interface ApiClientConfig {
  baseURL?: string
  headers?: Record<string, string>
}

/**
 * API Client class
 * Handles all HTTP communication with the backend
 */
class ApiClient {
  private baseURL: string
  private defaultHeaders: Record<string, string>

  constructor(config: ApiClientConfig = {}) {
    this.baseURL = config.baseURL || '/api'
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers,
    }
  }

  /**
   * Make an HTTP request
   * @param endpoint - API endpoint (e.g., '/profile')
   * @param options - Fetch options
   * @returns Response data
   * @throws ApiClientError if request fails
   */
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.defaultHeaders,
          ...options?.headers,
        },
        credentials: 'same-origin', // Include cookies for authentication
      })

      const data: SuccessResponse<T> | ErrorResponse = await response.json()

      // Handle error responses
      if (!response.ok || !data.success) {
        const errorData = data as ErrorResponse
        throw new ApiClientError(
          errorData.error.message || 'Request failed',
          response.status,
          errorData.error.code,
          errorData.error.details
        )
      }

      // Return success data
      return (data as SuccessResponse<T>).data
    } catch (error) {
      // Handle network errors or JSON parse errors
      if (error instanceof ApiClientError) {
        throw error
      }

      if (error instanceof Error) {
        throw new ApiClientError(
          error.message || 'Network error',
          0,
          'NETWORK_ERROR'
        )
      }

      throw new ApiClientError('Unknown error occurred', 0, 'UNKNOWN_ERROR')
    }
  }

  /**
   * GET request
   * @param endpoint - API endpoint
   * @param params - Query parameters
   * @returns Response data
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    // Build query string if params provided
    let url = endpoint
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
      const queryString = searchParams.toString()
      if (queryString) {
        url = `${endpoint}?${queryString}`
      }
    }

    return this.request<T>(url, { method: 'GET' })
  }

  /**
   * POST request
   * @param endpoint - API endpoint
   * @param data - Request body
   * @returns Response data
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * PUT request
   * @param endpoint - API endpoint
   * @param data - Request body
   * @returns Response data
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * PATCH request
   * @param endpoint - API endpoint
   * @param data - Request body
   * @returns Response data
   */
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * DELETE request
   * @param endpoint - API endpoint
   * @returns Response data
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

/**
 * Singleton API client instance
 * Use this throughout the application for API calls
 */
export const apiClient = new ApiClient()

/**
 * Create a custom API client with different configuration
 * Useful for testing or different base URLs
 */
export function createApiClient(config: ApiClientConfig): ApiClient {
  return new ApiClient(config)
}
