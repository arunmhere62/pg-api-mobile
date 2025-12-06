/**
 * Centralized Error Codes and Messages
 * Used across the entire application for consistency
 */

export enum ErrorCode {
  // Authentication & Authorization (4000-4099)
  UNAUTHORIZED = 'AUTH_001',
  FORBIDDEN = 'AUTH_002',
  INVALID_CREDENTIALS = 'AUTH_003',
  TOKEN_EXPIRED = 'AUTH_004',
  TOKEN_INVALID = 'AUTH_005',
  SESSION_EXPIRED = 'AUTH_006',

  // Validation Errors (4100-4199)
  VALIDATION_FAILED = 'VAL_001',
  INVALID_INPUT = 'VAL_002',
  MISSING_REQUIRED_FIELD = 'VAL_003',
  INVALID_FORMAT = 'VAL_004',

  // Resource Errors (4040-4049)
  NOT_FOUND = 'RES_001',
  RESOURCE_NOT_FOUND = 'RES_002',
  ALREADY_EXISTS = 'RES_003',

  // Business Logic Errors (4200-4299)
  BUSINESS_LOGIC_ERROR = 'BIZ_001',
  INVALID_STATE = 'BIZ_002',
  OPERATION_NOT_ALLOWED = 'BIZ_003',
  INSUFFICIENT_PERMISSIONS = 'BIZ_004',
  QUOTA_EXCEEDED = 'BIZ_005',

  // Server Errors (5000-5099)
  INTERNAL_SERVER_ERROR = 'SRV_001',
  DATABASE_ERROR = 'SRV_002',
  EXTERNAL_SERVICE_ERROR = 'SRV_003',
  SERVICE_UNAVAILABLE = 'SRV_004',

  // File Upload Errors (4300-4399)
  FILE_UPLOAD_FAILED = 'FILE_001',
  FILE_TOO_LARGE = 'FILE_002',
  INVALID_FILE_TYPE = 'FILE_003',
  FILE_NOT_FOUND = 'FILE_004',

  // Rate Limiting (4290-4299)
  RATE_LIMIT_EXCEEDED = 'RATE_001',
  TOO_MANY_REQUESTS = 'RATE_002',

  // Generic
  UNKNOWN_ERROR = 'ERR_999',
}

export const ErrorMessages: Record<ErrorCode, string> = {
  // Authentication & Authorization
  [ErrorCode.UNAUTHORIZED]: 'Unauthorized access. Please login.',
  [ErrorCode.FORBIDDEN]: 'Access forbidden. You do not have permission.',
  [ErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password.',
  [ErrorCode.TOKEN_EXPIRED]: 'Your session has expired. Please login again.',
  [ErrorCode.TOKEN_INVALID]: 'Invalid or malformed token.',
  [ErrorCode.SESSION_EXPIRED]: 'Your session has expired.',

  // Validation Errors
  [ErrorCode.VALIDATION_FAILED]: 'Validation failed. Please check your input.',
  [ErrorCode.INVALID_INPUT]: 'Invalid input provided.',
  [ErrorCode.MISSING_REQUIRED_FIELD]: 'Required field is missing.',
  [ErrorCode.INVALID_FORMAT]: 'Invalid format provided.',

  // Resource Errors
  [ErrorCode.NOT_FOUND]: 'Resource not found.',
  [ErrorCode.RESOURCE_NOT_FOUND]: 'The requested resource does not exist.',
  [ErrorCode.ALREADY_EXISTS]: 'Resource already exists.',

  // Business Logic Errors
  [ErrorCode.BUSINESS_LOGIC_ERROR]: 'Business logic error occurred.',
  [ErrorCode.INVALID_STATE]: 'Invalid state for this operation.',
  [ErrorCode.OPERATION_NOT_ALLOWED]: 'This operation is not allowed.',
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions for this action.',
  [ErrorCode.QUOTA_EXCEEDED]: 'Quota exceeded. Please try again later.',

  // Server Errors
  [ErrorCode.INTERNAL_SERVER_ERROR]: 'Internal server error occurred.',
  [ErrorCode.DATABASE_ERROR]: 'Database error occurred. Please try again later.',
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'External service error. Please try again later.',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable.',

  // File Upload Errors
  [ErrorCode.FILE_UPLOAD_FAILED]: 'File upload failed.',
  [ErrorCode.FILE_TOO_LARGE]: 'File size exceeds the maximum limit.',
  [ErrorCode.INVALID_FILE_TYPE]: 'Invalid file type. Please upload a valid file.',
  [ErrorCode.FILE_NOT_FOUND]: 'File not found.',

  // Rate Limiting
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded. Please try again later.',
  [ErrorCode.TOO_MANY_REQUESTS]: 'Too many requests. Please try again later.',

  // Generic
  [ErrorCode.UNKNOWN_ERROR]: 'An unknown error occurred.',
};

export const ErrorHttpStatus: Record<ErrorCode, number> = {
  // Authentication & Authorization (401, 403)
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.INVALID_CREDENTIALS]: 401,
  [ErrorCode.TOKEN_EXPIRED]: 401,
  [ErrorCode.TOKEN_INVALID]: 401,
  [ErrorCode.SESSION_EXPIRED]: 401,

  // Validation Errors (400)
  [ErrorCode.VALIDATION_FAILED]: 400,
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.MISSING_REQUIRED_FIELD]: 400,
  [ErrorCode.INVALID_FORMAT]: 400,

  // Resource Errors (404, 409)
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.RESOURCE_NOT_FOUND]: 404,
  [ErrorCode.ALREADY_EXISTS]: 409,

  // Business Logic Errors (422)
  [ErrorCode.BUSINESS_LOGIC_ERROR]: 422,
  [ErrorCode.INVALID_STATE]: 422,
  [ErrorCode.OPERATION_NOT_ALLOWED]: 422,
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 403,
  [ErrorCode.QUOTA_EXCEEDED]: 429,

  // Server Errors (500, 503)
  [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,

  // File Upload Errors (400, 413)
  [ErrorCode.FILE_UPLOAD_FAILED]: 400,
  [ErrorCode.FILE_TOO_LARGE]: 413,
  [ErrorCode.INVALID_FILE_TYPE]: 400,
  [ErrorCode.FILE_NOT_FOUND]: 404,

  // Rate Limiting (429)
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCode.TOO_MANY_REQUESTS]: 429,

  // Generic (500)
  [ErrorCode.UNKNOWN_ERROR]: 500,
};
