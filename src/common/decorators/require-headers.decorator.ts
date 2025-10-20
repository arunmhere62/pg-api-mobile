import { SetMetadata } from '@nestjs/common';
import {
  REQUIRED_HEADERS_KEY,
  RequiredHeadersOptions,
} from '../guards/headers-validation.guard';

/**
 * Decorator to specify which headers are required for an endpoint
 * 
 * @example
 * // Require pg_id header
 * @RequireHeaders({ pg_id: true })
 * 
 * @example
 * // Require multiple headers
 * @RequireHeaders({ pg_id: true, organization_id: true, user_id: true })
 * 
 * @example
 * // No required headers (but still validates format if provided)
 * @RequireHeaders()
 */
export const RequireHeaders = (options: RequiredHeadersOptions = {}) =>
  SetMetadata(REQUIRED_HEADERS_KEY, options);
