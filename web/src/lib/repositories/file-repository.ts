/**
 * File Repository
 *
 * Data access layer for file metadata in the database
 */

import { createClient } from '@/lib/supabase/server'
import type { FileRecord, CreateFileDto, EntityType } from '@/types/file'
import { DatabaseError } from '@/lib/utils/errors'

export class FileRepository {
  /**
   * Create a file record
   * @param data - File data
   * @returns Created file record
   */
  async createFile(data: CreateFileDto): Promise<FileRecord> {
    try {
      const supabase = await createClient()

      const { data: file, error } = await supabase
        .from('files')
        .insert({
          practice_id: data.practice_id,
          entity_type: data.entity_type,
          entity_id: data.entity_id,
          bucket_name: data.bucket_name,
          file_path: data.file_path,
          file_name: data.file_name,
          file_type: data.file_type,
          file_size: data.file_size,
          uploaded_by: data.uploaded_by,
        })
        .select()
        .single()

      if (error) {
        throw new DatabaseError(`Failed to create file record: ${error.message}`, error)
      }

      return file
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Unexpected error creating file record', error)
    }
  }

  /**
   * Get files for an entity
   * @param entityType - Type of entity
   * @param entityId - Entity ID
   * @returns Array of file records
   */
  async getFilesByEntity(entityType: EntityType, entityId: string): Promise<FileRecord[]> {
    try {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new DatabaseError(`Failed to fetch files: ${error.message}`, error)
      }

      return data || []
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Unexpected error fetching files', error)
    }
  }

  /**
   * Get a single file by ID
   * @param fileId - File ID
   * @returns File record or null
   */
  async getFileById(fileId: string): Promise<FileRecord | null> {
    try {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw new DatabaseError(`Failed to fetch file: ${error.message}`, error)
      }

      return data
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Unexpected error fetching file', error)
    }
  }

  /**
   * Delete a file record
   * @param fileId - File ID
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      const supabase = await createClient()

      const { error } = await supabase.from('files').delete().eq('id', fileId)

      if (error) {
        throw new DatabaseError(`Failed to delete file record: ${error.message}`, error)
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Unexpected error deleting file record', error)
    }
  }

  /**
   * Delete all file records for an entity
   * @param entityType - Type of entity
   * @param entityId - Entity ID
   */
  async deleteFilesByEntity(entityType: EntityType, entityId: string): Promise<void> {
    try {
      const supabase = await createClient()

      const { error } = await supabase
        .from('files')
        .delete()
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)

      if (error) {
        throw new DatabaseError(`Failed to delete file records: ${error.message}`, error)
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Unexpected error deleting file records', error)
    }
  }
}

// Export singleton instance
export const fileRepository = new FileRepository()
