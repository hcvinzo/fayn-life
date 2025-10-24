/**
 * File API Client
 *
 * Frontend HTTP client for file metadata operations.
 * Used by Client Components to manage file records in the database.
 */

import { apiClient } from './client'
import type { FileRecord, CreateFileDto, EntityType } from '@/types/file'

export const fileApi = {
  /**
   * Get files for an entity
   * @param entityType - Type of entity
   * @param entityId - Entity ID
   * @returns Array of file records
   */
  async getFilesByEntity(entityType: EntityType, entityId: string): Promise<FileRecord[]> {
    return apiClient.get<FileRecord[]>(`/files?entityType=${entityType}&entityId=${entityId}`)
  },

  /**
   * Create a file record
   * @param data - File data
   * @returns Created file record
   */
  async createFile(data: CreateFileDto): Promise<FileRecord> {
    return apiClient.post<FileRecord>('/files', data)
  },

  /**
   * Delete a file record
   * @param fileId - File ID
   */
  async deleteFile(fileId: string): Promise<void> {
    await apiClient.delete(`/files?id=${fileId}`)
  },
}
