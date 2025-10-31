import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CommonHeaders {
  pg_id?: number;
  organization_id?: number;
  user_id?: number;
}

export const CommonHeadersDecorator = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CommonHeaders => {
    const request = ctx.switchToHttp().getRequest();
    const headers = request.headers;

    return {
      pg_id: headers['x-pg-location-id'] ? parseInt(headers['x-pg-location-id'], 10) : undefined,
      organization_id: headers['x-organization-id'] ? parseInt(headers['x-organization-id'], 10) : undefined,
      user_id: headers['x-user-id'] ? parseInt(headers['x-user-id'], 10) : undefined,
    };
  },
);
