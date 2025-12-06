import { Injectable, BadRequestException } from '@nestjs/common';
import { S3Service } from '../../s3/s3.service';

/**
 * S3 Deletion Service
 * Provides common utilities for handling S3 file deletion across all modules
 */
@Injectable()
export class S3DeletionService {
  constructor(private s3Service: S3Service) {}

  /**
   * Extract S3 key from URL
   * @param url - Full S3 URL
   * @returns S3 key or null if invalid URL
   */
  extractS3KeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.substring(1); // Remove leading slash
    } catch {
      return null;
    }
  }

  /**
   * Delete removed files from S3
   * Compares old and new file arrays and deletes files that were removed
   * @param oldFiles - Original file URLs array
   * @param newFiles - Updated file URLs array
   * @param entityType - Type of entity (e.g., 'room', 'tenant', 'bed') for logging
   * @param fileType - Type of file (e.g., 'images', 'documents') for logging
   * @returns Array of deleted S3 keys
   */
  async deleteRemovedFiles(
    oldFiles: string[],
    newFiles: string[],
    entityType: string = 'entity',
    fileType: string = 'files',
  ): Promise<string[]> {
    try {
      // Ensure arrays are valid
      const oldFilesArray = Array.isArray(oldFiles) ? oldFiles : [];
      const newFilesArray = Array.isArray(newFiles) ? newFiles : [];

      // Find files that were removed (only S3 URLs)
      const removedFiles = oldFilesArray.filter(
        (oldUrl: string) =>
          !newFilesArray.includes(oldUrl) &&
          oldUrl &&
          oldUrl.includes('amazonaws.com'),
      );

      if (removedFiles.length === 0) {
        return [];
      }

      // Extract S3 keys from URLs
      const keysToDelete = removedFiles
        .map((fileUrl: string) => this.extractS3KeyFromUrl(fileUrl))
        .filter((key: string | null): key is string => key !== null);

      if (keysToDelete.length === 0) {
        return [];
      }

      // Delete from S3
      console.log(
        `Deleting removed ${entityType} ${fileType} from S3:`,
        keysToDelete,
      );

      await this.s3Service.deleteMultipleFiles({
        keys: keysToDelete,
        bucket: process.env.AWS_S3_BUCKET_NAME || 'indianpgmanagement',
      });

      console.log(
        `S3 ${entityType} ${fileType} deleted successfully:`,
        keysToDelete,
      );

      return keysToDelete;
    } catch (error) {
      console.error(
        `Failed to delete S3 ${entityType} ${fileType}:`,
        error,
      );
      throw new BadRequestException(
        `Failed to delete ${entityType} ${fileType} from cloud storage: ${error.message}`,
      );
    }
  }

  /**
   * Delete all files from S3
   * Used when deleting an entire entity (e.g., deleting a room)
   * @param files - File URLs array to delete
   * @param entityType - Type of entity for logging
   * @param fileType - Type of file for logging
   * @returns Array of deleted S3 keys
   */
  async deleteAllFiles(
    files: string[],
    entityType: string = 'entity',
    fileType: string = 'files',
  ): Promise<string[]> {
    try {
      if (!Array.isArray(files) || files.length === 0) {
        return [];
      }

      // Extract S3 keys from URLs
      const keysToDelete = files
        .map((fileUrl: string) => this.extractS3KeyFromUrl(fileUrl))
        .filter((key: string | null): key is string => key !== null);

      if (keysToDelete.length === 0) {
        return [];
      }

      // Delete from S3
      console.log(
        `Deleting all ${entityType} ${fileType} from S3:`,
        keysToDelete,
      );

      await this.s3Service.deleteMultipleFiles({
        keys: keysToDelete,
        bucket: process.env.AWS_S3_BUCKET_NAME || 'indianpgmanagement',
      });

      console.log(
        `S3 ${entityType} ${fileType} deleted successfully:`,
        keysToDelete,
      );

      return keysToDelete;
    } catch (error) {
      console.error(
        `Failed to delete S3 ${entityType} ${fileType}:`,
        error,
      );
      throw new BadRequestException(
        `Failed to delete ${entityType} ${fileType} from cloud storage: ${error.message}`,
      );
    }
  }
}
