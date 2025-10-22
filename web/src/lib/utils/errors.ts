/**
 * Custom Error Classes
 *
 * Standardized error handling across the application.
 * These errors can be thrown from services and will be caught
 * by API route handlers to return appropriate HTTP responses.
 */

/**
 * Base application error class
 * All custom errors extend this class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Validation Error (400)
 * Thrown when input validation fails
 */
export class ValidationError extends AppError {
  constructor(message: string, public details?: any) {
    super(message, 400, 'VALIDATION_ERROR')
  }
}

/**
 * Not Found Error (404)
 * Thrown when a requested resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND')
  }
}

/**
 * Unauthorized Error (401)
 * Thrown when authentication is required but missing or invalid
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

/**
 * Forbidden Error (403)
 * Thrown when user doesn't have permission to access a resource
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN')
  }
}

/**
 * Conflict Error (409)
 * Thrown when there's a conflict with existing data (e.g., duplicate email)
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT')
  }
}

/**
 * Database Error (500)
 * Thrown when a database operation fails
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', public originalError?: any) {
    super(message, 500, 'DATABASE_ERROR')
  }
}

/**
 * Internal Server Error (500)
 * Generic server error
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, 'INTERNAL_ERROR')
  }
}

/**
 * Authentication Error (401)
 * Thrown when authentication operations fail
 */
export class AuthError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTH_ERROR')
  }
}
