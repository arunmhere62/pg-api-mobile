import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No authorization token provided');
    }

    // For now, just check if token exists
    // TODO: Implement proper JWT verification
    const token = authHeader.substring(7);
    if (!token) {
      throw new UnauthorizedException('Invalid authorization token');
    }

    return true;
  }
}
