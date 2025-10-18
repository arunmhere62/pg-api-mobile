import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

interface TokenPayload {
  sub: number; // user id
  phone: string;
  email: string;
  role_id: number;
  organization_id: number;
}

@Injectable()
export class JwtTokenService {
  constructor(
    private jwtService: NestJwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  /**
   * Generate access and refresh tokens
   */
  async generateTokens(user: any, ipAddress?: string, userAgent?: string) {
    const payload: TokenPayload = {
      sub: user.s_no,
      phone: user.phone,
      email: user.email,
      role_id: user.role_id,
      organization_id: user.organization_id,
    };

    // Get JWT expiry from environment-based config
    const accessTokenExpiry = this.configService.get<string>('app.auth.jwtAccessTokenExpiry', '24h');
    const refreshTokenExpiry = this.configService.get<string>('app.auth.jwtRefreshTokenExpiry', '7d');

    // Generate access token
    const accessToken = this.jwtService.sign(payload as any, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: accessTokenExpiry as any,
    });

    // Generate refresh token
    const refreshToken = this.jwtService.sign(
      { sub: user.s_no } as any,
      {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: refreshTokenExpiry as any,
      },
    );

    // Calculate expiration times
    const expiresIn = accessTokenExpiry;
    const refreshExpiresIn = refreshTokenExpiry;
    
    const expiresAt = this.calculateExpiryDate(expiresIn);
    const refreshExpiresAt = this.calculateExpiryDate(refreshExpiresIn);

    // Check if user already has a token record
    const existingToken = await this.prisma.tokens.findFirst({
      where: { user_id: user.s_no },
    });

    if (existingToken) {
      // Update existing token
      await this.prisma.tokens.update({
        where: { s_no: existingToken.s_no },
        data: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresAt,
          refresh_expires_at: refreshExpiresAt,
          is_revoked: false,
          revoked_at: null,
          ip_address: ipAddress,
          user_agent: userAgent,
          last_used_at: new Date(),
        },
      });
    } else {
      // Create new token record
      await this.prisma.tokens.create({
        data: {
          user_id: user.s_no,
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresAt,
          refresh_expires_at: refreshExpiresAt,
          ip_address: ipAddress,
          user_agent: userAgent,
          last_used_at: new Date(),
        },
      });
    }

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: this.getSecondsFromExpiry(expiresIn),
    };
  }

  /**
   * Verify access token
   */
  async verifyAccessToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      // Check if token is revoked
      const tokenRecord = await this.prisma.tokens.findFirst({
        where: {
          user_id: payload.sub,
          access_token: token,
          is_revoked: false,
        },
      });

      if (!tokenRecord) {
        return null;
      }

      // Update last used time
      await this.prisma.tokens.update({
        where: { s_no: tokenRecord.s_no },
        data: { last_used_at: new Date() },
      });

      return payload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Revoke token (logout)
   */
  async revokeToken(userId: number) {
    await this.prisma.tokens.updateMany({
      where: {
        user_id: userId,
        is_revoked: false,
      },
      data: {
        is_revoked: true,
        revoked_at: new Date(),
      },
    });
  }

  /**
   * Calculate expiry date from string like "24h", "7d"
   */
  private calculateExpiryDate(expiry: string): Date {
    const now = new Date();
    const value = parseInt(expiry);
    const unit = expiry.slice(-1);

    switch (unit) {
      case 'h':
        return new Date(now.getTime() + value * 60 * 60 * 1000);
      case 'd':
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
      case 'm':
        return new Date(now.getTime() + value * 60 * 1000);
      case 's':
        return new Date(now.getTime() + value * 1000);
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default 24 hours
    }
  }

  /**
   * Get seconds from expiry string
   */
  private getSecondsFromExpiry(expiry: string): number {
    const value = parseInt(expiry);
    const unit = expiry.slice(-1);

    switch (unit) {
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      case 'm':
        return value * 60;
      case 's':
        return value;
      default:
        return 24 * 60 * 60; // Default 24 hours
    }
  }
}
