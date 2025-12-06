/**
 * Standard API Response DTO
 * All API responses follow this structure for consistency
 */

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  error?: {
    code: string;
    details?: any;
  };
  timestamp: string;
  path?: string;
}

export class ApiResponseDto<T = any> implements ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  error?: {
    code: string;
    details?: any;
  };
  timestamp: string;
  path?: string;

  constructor(
    statusCode: number,
    message: string,
    data?: T,
    error?: { code: string; details?: any },
    path?: string,
  ) {
    this.statusCode = statusCode;
    this.message = message;
    this.success = statusCode >= 200 && statusCode < 300;
    this.data = data;
    this.error = error;
    this.timestamp = new Date().toISOString();
    this.path = path;
  }
}
