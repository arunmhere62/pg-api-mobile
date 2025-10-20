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
      pg_id: headers['X-PG-Location-Id'] ? parseInt(headers['X-PG-Location-Id'], 10) : undefined,
      organization_id: headers['X-Organization-Id'] ? parseInt(headers['X-Organization-Id'], 10) : undefined,
      user_id: headers['X-User-Id'] ? parseInt(headers['X-User-Id'], 10) : undefined,
    };
  },
);
