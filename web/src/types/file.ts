/**
 * File Domain Types
 *
 * Types for file attachments with polymorphic entity relations
 */

import type { Database } from './database'

/**
 * File entity type (mirrors database row)
 */
export type FileRecord = Database['public']['Tables']['files']['Row']

/**
 * Entity types that can have file attachments
 */
export type EntityType = 'client_sessions' | 'clients' | 'appointments' | 'profiles'

/**
 * Data required to create a new file record
 */
export interface CreateFileDto {
  practice_id: string
  entity_type: EntityType
  entity_id: string
  bucket_name: string
  file_path: string
  file_name: string
  file_type: string
  file_size: number
  uploaded_by: string
}

/**
 * File with upload progress (for UI)
 */
export interface FileWithProgress extends File {
  id?: string
  progress?: number
  uploadedUrl?: string
  error?: string
}

/**
 * Allowed file types and their MIME types
 */
export const ALLOWED_FILE_TYPES = {
  // Images
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],

  // Documents
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],

  // Text
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
} as const

/**
 * Maximum file size (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB in bytes

/**
 * Get file icon based on MIME type
 */
export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType === 'application/pdf') return '📄'
  if (mimeType.includes('word')) return '📝'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️'
  if (mimeType.startsWith('text/')) return '📃'
  return '📎'
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Validate file type
 */
export function isAllowedFileType(file: File): boolean {
  return Object.keys(ALLOWED_FILE_TYPES).includes(file.type)
}

/**
 * Validate file size
 */
export function isValidFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? `.${parts[parts.length - 1]}` : ''
}
