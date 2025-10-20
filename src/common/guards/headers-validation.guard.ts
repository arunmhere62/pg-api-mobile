import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CommonHeadersDto } from '../dto/common-headers.dto';

export const REQUIRED_HEADERS_KEY = 'requiredHeaders';

export interface RequiredHeadersOptions {
  pg_id?: boolean;
  organization_id?: boolean;
  user_id?: boolean;
}

/**
 * Guard to validate common headers
 * Use @RequireHeaders() decorator to specify which headers are required
 */
@Injectable()
export class HeadersValidationGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const headers = request.headers;

    // Get required headers from decorator metadata
    const requiredHeaders = this.reflector.getAllAndOverride<RequiredHeadersOptions>(
      REQUIRED_HEADERS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Extract and parse headers
    const headerData = {
      pg_id: headers['x-pg-location-id']
        ? parseInt(headers['x-pg-location-id'], 10)
        : undefined,
      organization_id: headers['x-organization-id']
        ? parseInt(headers['x-organization-id'], 10)
        : undefined,
      user_id: headers['x-user-id']
        ? parseInt(headers['x-user-id'], 10)
        : undefined,
    };

    // Transform to DTO and validate
    const headersDto = plainToClass(CommonHeadersDto, headerData);
    const errors = await validate(headersDto);

    if (errors.length > 0) {
      const errorMessages = errors
        .map((error) => Object.values(error.constraints || {}).join(', '))
        .join('; ');
      throw new BadRequestException(`Invalid headers: ${errorMessages}`);
    }

    // Check required headers
    if (requiredHeaders) {
      const missingHeaders: string[] = [];

      if (requiredHeaders.pg_id && !headerData.pg_id) {
        missingHeaders.push('X-PG-Location-Id');
      }
      if (requiredHeaders.organization_id && !headerData.organization_id) {
        missingHeaders.push('X-Organization-Id');
      }
      if (requiredHeaders.user_id && !headerData.user_id) {
        missingHeaders.push('X-User-Id');
      }

      if (missingHeaders.length > 0) {
        throw new BadRequestException(
          `Missing required headers: ${missingHeaders.join(', ')}`,
        );
      }
    }

    // Attach validated headers to request
    request.validatedHeaders = headerData;

    return true;
  }
}
