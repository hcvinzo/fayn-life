import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { AppError } from './errors'

/**
 * API Response Helpers
 *
 * Standardized response formatting for all API routes.
 * Ensures consistent response structure across the application.
 */

/**
 * Standard success response format
 */
export interface SuccessResponse<T = any> {
  success: true
  data: T
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
  success: false
  error: {
    message: string
    code?: string
    details?: any
  }
}

/**
 * Create a success response
 *
 * @param data - The data to return
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with success format
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse<SuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  )
}

/**
 * Create an error response
 *
 * @param message - Error message
 * @param code - Error code
 * @param status - HTTP status code (default: 500)
 * @param details - Additional error details
 * @returns NextResponse with error format
 */
export function errorResponse(
  message: string,
  code?: string,
  status: number = 500,
  details?: any
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code,
        details,
      },
    },
    { status }
  )
}

/**
 * Handle API errors and convert them to appropriate HTTP responses
 *
 * @param error - The error to handle
 * @param defaultStatus - Default HTTP status code if error doesn't specify one
 * @returns NextResponse with appropriate error format and status code
 */
export function handleApiError(error: unknown, defaultStatus?: number): NextResponse<ErrorResponse> {
  // Log error for debugging (in production, use proper logging service)
  console.error('API Error:', error)

  // Handle custom AppError instances
  if (error instanceof AppError) {
    return errorResponse(error.message, error.code, error.statusCode, (error as any).details)
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return errorResponse(
      'Validation failed',
      'VALIDATION_ERROR',
      400,
      error.issues.map((err: any) => ({
        path: err.path.join('.'),
        message: err.message,
      }))
    )
  }

  // Handle generic Error instances
  if (error instanceof Error) {
    // Don't expose internal error messages in production
    const message =
      process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'

    return errorResponse(message, 'INTERNAL_ERROR', defaultStatus || 500)
  }

  // Handle unknown error types
  return errorResponse('An unexpected error occurred', 'UNKNOWN_ERROR', defaultStatus || 500)
}

/**
 * Type guard to check if a response is a success response
 */
export function isSuccessResponse<T>(
  response: SuccessResponse<T> | ErrorResponse
): response is SuccessResponse<T> {
  return response.success === true
}

/**
 * Type guard to check if a response is an error response
 */
export function isErrorResponse(
  response: SuccessResponse<any> | ErrorResponse
): response is ErrorResponse {
  return response.success === false
}
