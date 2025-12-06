import { Controller, Post, Delete, Get, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { S3Service } from './s3.service';

@ApiTags('s3')
@Controller('s3')
export class S3Controller {
  constructor(private readonly s3Service: S3Service) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload file to S3' })
  @ApiResponse({ status: 200, description: 'File uploaded successfully' })
  @ApiResponse({ status: 500, description: 'Upload failed' })
  async uploadFile(@Body() uploadData: {
    key: string;
    contentType: string;
    fileData: string;
    isPublic: boolean;
    bucket: string;
  }) {
    try {
      const result = await this.s3Service.uploadFile(uploadData);
      return {
        success: true,
        url: result.Location,
        key: result.Key,
      };
    } catch (error) {
      console.error('S3 upload error:', error);
      return {
        success: false,
        error: error.message || 'Upload failed',
      };
    }
  }

  @Delete('delete')
  @ApiOperation({ summary: 'Delete file from S3' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  async deleteFile(@Body() deleteData: {
    key: string;
    bucket: string;
  }) {
    try {
      console.log('Delete request received:', deleteData);
      const response = await this.s3Service.deleteFile(deleteData);
      console.log('Delete successful:', response);
      return { success: true, response };
    } catch (error) {
      console.error('S3 delete error:', {
        message: error.message,
        code: error.code,
        statusCode: error.$metadata?.httpStatusCode,
        deleteData
      });
      return {
        success: false,
        error: error.message || 'Delete failed',
        code: error.code,
      };
    }
  }

  @Delete('delete-multiple')
  @ApiOperation({ summary: 'Delete multiple files from S3' })
  @ApiResponse({ status: 200, description: 'Files deleted successfully' })
  async deleteMultipleFiles(@Body() deleteData: {
    keys: string[];
    bucket: string;
  }) {
    try {
      await this.s3Service.deleteMultipleFiles(deleteData);
      return { success: true };
    } catch (error) {
      console.error('S3 bulk delete error:', error);
      return {
        success: false,
        error: error.message || 'Bulk delete failed',
      };
    }
  }

  @Get('exists')
  @ApiOperation({ summary: 'Check if file exists in S3' })
  @ApiResponse({ status: 200, description: 'File existence checked' })
  async fileExists(@Query() query: {
    key: string;
    bucket: string;
  }) {
    try {
      const exists = await this.s3Service.fileExists(query);
      return { exists };
    } catch (error) {
      if (error.code === 'NotFound') {
        return { exists: false };
      }
      console.error('S3 exists check error:', error);
      return {
        success: false,
        error: error.message || 'Exists check failed',
      };
    }
  }

  @Get('health')
  @ApiOperation({ summary: 'Check S3 service health' })
  @ApiResponse({ status: 200, description: 'S3 service is available' })
  async health() {
    try {
      // Simple health check - just return available if service is initialized
      return { available: true };
    } catch (error) {
      return { available: false, error: error.message };
    }
  }
}
