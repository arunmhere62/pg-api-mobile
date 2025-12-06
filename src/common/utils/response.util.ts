/**
 * Response Utility Helper
 * Provides helper methods for creating consistent API responses
 */

import { ApiResponseDto } from '../dto/response.dto';
import { HttpStatus } from '@nestjs/common';

export class ResponseUtil {
  /**
   * Create a success response
   */
  static success<T>(
    data: T,
    message: string = 'Success',
    statusCode: number = HttpStatus.OK,
  ): ApiResponseDto<T> {
    return new ApiResponseDto(statusCode, message, data);
  }

  /**
   * Create a created response (201)
   */
  static created<T>(
    data: T,
    message: string = 'Resource created successfully',
  ): ApiResponseDto<T> {
    return new ApiResponseDto(HttpStatus.CREATED, message, data);
  }

  /**
   * Create a paginated response
   */
  static paginated<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
    message: string = 'Success',
  ): ApiResponseDto<any> {
    return new ApiResponseDto(HttpStatus.OK, message, {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  /**
   * Create a no content response (204)
   */
  static noContent(message: string = 'No content'): ApiResponseDto<null> {
    return new ApiResponseDto(HttpStatus.NO_CONTENT, message, null);
  }

  /**
   * Create an accepted response (202)
   */
  static accepted<T>(
    data: T,
    message: string = 'Request accepted',
  ): ApiResponseDto<T> {
    return new ApiResponseDto(HttpStatus.ACCEPTED, message, data);
  }
}
