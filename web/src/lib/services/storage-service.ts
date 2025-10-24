/**
 * Storage Service
 *
 * Handles file uploads, downloads, and deletes using Supabase Storage
 * Directly interacts with storage bucket (no API layer needed per requirements)
 */

import { createClient } from '@/lib/supabase/client'
import type { EntityType } from '@/types/file'

export class StorageService {
  private supabase = createClient()
  private bucketName = 'session-files'

  /**
   * Upload a file to storage
   * @param file - The file to upload
   * @param practiceId - Practice ID (for folder structure)
   * @param entityType - Type of entity the file belongs to
   * @param entityId - ID of the entity
   * @returns The file path in storage
   */
  async uploadFile(
    file: File,
    practiceId: string,
    entityType: EntityType,
    entityId: string
  ): Promise<{ path: string; url: string }> {
    try {
      // Generate unique file path: practiceId/entityType/entityId/timestamp-filename
      const timestamp = Date.now()
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filePath = `${practiceId}/${entityType}/${entityId}/${timestamp}-${sanitizedFileName}`

      // Upload file
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) {
        throw new Error(`Upload failed: ${error.message}`)
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(data.path)

      return {
        path: data.path,
        url: urlData.publicUrl,
      }
    } catch (error) {
      console.error('Storage upload error:', error)
      throw error
    }
  }

  /**
   * Download/get URL for a file
   * @param filePath - Path to the file in storage
   * @returns Public URL of the file
   */
  getFileUrl(filePath: string): string {
    const { data } = this.supabase.storage.from(this.bucketName).getPublicUrl(filePath)
    return data.publicUrl
  }

  /**
   * Delete a file from storage
   * @param filePath - Path to the file in storage
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      const { error } = await this.supabase.storage.from(this.bucketName).remove([filePath])

      if (error) {
        throw new Error(`Delete failed: ${error.message}`)
      }
    } catch (error) {
      console.error('Storage delete error:', error)
      throw error
    }
  }

  /**
   * Delete multiple files from storage
   * @param filePaths - Array of file paths to delete
   */
  async deleteFiles(filePaths: string[]): Promise<void> {
    try {
      const { error } = await this.supabase.storage.from(this.bucketName).remove(filePaths)

      if (error) {
        throw new Error(`Batch delete failed: ${error.message}`)
      }
    } catch (error) {
      console.error('Storage batch delete error:', error)
      throw error
    }
  }
}

// Export singleton instance
export const storageService = new StorageService()
