import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface ValidatedHeaders {
  pg_id?: number;
  organization_id?: number;
  user_id?: number;
}

/**
 * Decorator to extract validated headers from request
 * Must be used with @RequireHeaders() and HeadersValidationGuard
 * 
 * @example
 * @Get()
 * @RequireHeaders({ pg_id: true })
 * async findAll(@ValidatedHeaders() headers: ValidatedHeaders) {
 *   // headers.pg_id is guaranteed to exist and be a valid positive integer
 * }
 */
export const ValidatedHeaders = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ValidatedHeaders => {
    const request = ctx.switchToHttp().getRequest();
    return request.validatedHeaders || {};
  },
);
