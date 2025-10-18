import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { SmsService } from './sms.service';
import { JwtTokenService } from './jwt.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Injectable()
export class AuthDbService {
  private readonly OTP_EXPIRY_MINUTES: number;
  private readonly MAX_ATTEMPTS: number;

  constructor(
    private prisma: PrismaService,
    private smsService: SmsService,
    private jwtTokenService: JwtTokenService,
    private configService: ConfigService,
  ) {
    // Get configuration based on environment
    this.OTP_EXPIRY_MINUTES = this.configService.get<number>('app.auth.otpExpiryMinutes', 5);
    this.MAX_ATTEMPTS = this.configService.get<number>('app.auth.otpMaxAttempts', 3);
  }

  /**
   * Generate a 4-digit OTP
   */
  private generateOtp(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  /**
   * Send OTP to user's phone (Database version)
   */
  async sendOtp(sendOtpDto: SendOtpDto, ipAddress?: string, userAgent?: string) {
    const { phone } = sendOtpDto;

    // Check if user exists with this phone number
    const user = await this.prisma.user.findFirst({
      where: {
        phone: phone,
        is_deleted: false,
        status: 'ACTIVE',
      },
      select: {
        s_no: true,
        name: true,
        email: true,
        phone: true,
        status: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found with this phone number');
    }

    // Generate OTP
    const otp = this.generateOtp();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

    // Check if user already has an OTP record
    const existingOtp = await this.prisma.otp_verifications.findFirst({
      where: {
        user_id: user.s_no,
      },
    });

    if (existingOtp) {
      // Update existing record
      await this.prisma.otp_verifications.update({
        where: {
          s_no: existingOtp.s_no,
        },
        data: {
          otp,
          is_verified: false,
          attempts: 0,
          expires_at: expiresAt,
          verified_at: null,
          ip_address: ipAddress,
          user_agent: userAgent,
        },
      });
    } else {
      // Create new record (first time for this user)
      await this.prisma.otp_verifications.create({
        data: {
          user_id: user.s_no,
          phone,
          otp,
          expires_at: expiresAt,
          ip_address: ipAddress,
          user_agent: userAgent,
        },
      });
    }

    // Send OTP via SMS
    const smsSent = await this.smsService.sendOtp(phone, otp);

    if (!smsSent) {
      throw new BadRequestException('Failed to send OTP. Please try again.');
    }

    return {
      success: true,
      message: 'OTP sent successfully',
      data: {
        phone,
        expiresIn: `${this.OTP_EXPIRY_MINUTES} minutes`,
      },
    };
  }

  /**
   * Verify OTP and login user (Database version)
   */
  async verifyOtp(verifyOtpDto: VerifyOtpDto, ipAddress?: string) {
    const { phone, otp } = verifyOtpDto;

    // Find the latest unverified OTP for this phone
    const otpRecord = await this.prisma.otp_verifications.findFirst({
      where: {
        phone: phone,
        is_verified: false,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    if (!otpRecord) {
      throw new UnauthorizedException('OTP not found or expired. Please request a new OTP.');
    }

    // Check if OTP is expired
    if (new Date() > otpRecord.expires_at) {
      await this.prisma.otp_verifications.update({
        where: { s_no: otpRecord.s_no },
        data: { is_verified: true }, // Mark as verified to invalidate
      });
      throw new UnauthorizedException('OTP has expired. Please request a new OTP.');
    }

    // Check attempts
    if (otpRecord.attempts >= this.MAX_ATTEMPTS) {
      await this.prisma.otp_verifications.update({
        where: { s_no: otpRecord.s_no },
        data: { is_verified: true }, // Mark as verified to invalidate
      });
      throw new UnauthorizedException(
        'Maximum verification attempts exceeded. Please request a new OTP.',
      );
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      await this.prisma.otp_verifications.update({
        where: { s_no: otpRecord.s_no },
        data: { attempts: otpRecord.attempts + 1 },
      });
      throw new UnauthorizedException(
        `Invalid OTP. ${this.MAX_ATTEMPTS - (otpRecord.attempts + 1)} attempts remaining.`,
      );
    }

    // OTP is valid, mark as verified
    await this.prisma.otp_verifications.update({
      where: { s_no: otpRecord.s_no },
      data: {
        is_verified: true,
        verified_at: new Date(),
      },
    });

    // Get user details
    const user = await this.prisma.user.findFirst({
      where: {
        phone: phone,
        is_deleted: false,
        status: 'ACTIVE',
      },
      select: {
        s_no: true,
        name: true,
        email: true,
        phone: true,
        role_id: true,
        organization_id: true,
        status: true,
        address: true,
        city_id: true,
        state_id: true,
        gender: true,
        roles: {
          select: {
            s_no: true,
            role_name: true,
          },
        },
        organization: {
          select: {
            s_no: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate JWT tokens
    const tokens = await this.jwtTokenService.generateTokens(user, ipAddress);

    return {
      success: true,
      message: 'Login successful',
      user: {
        s_no: user.s_no,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role_id: user.role_id,
        role_name: user.roles.role_name,
        organization_id: user.organization_id,
        organization_name: user.organization.name,
        status: user.status,
        address: user.address,
        city_id: user.city_id,
        state_id: user.state_id,
        gender: user.gender,
      },
      ...tokens, // Spread tokens (access_token, refresh_token, token_type, expires_in)
    };
  }

  /**
   * Resend OTP (Database version) - Updates the same record
   */
  async resendOtp(sendOtpDto: SendOtpDto, ipAddress?: string, userAgent?: string) {
    // Just call sendOtp - it will update the existing record
    return this.sendOtp(sendOtpDto, ipAddress, userAgent);
  }

  /**
   * Clean up expired OTPs (run as cron job)
   */
  async cleanupExpiredOtps() {
    const result = await this.prisma.otp_verifications.deleteMany({
      where: {
        expires_at: {
          lt: new Date(),
        },
      },
    });
    return {
      success: true,
      message: `Cleaned up ${result.count} expired OTP records`,
    };
  }

  /**
   * Get OTP statistics for a phone number
   */
  async getOtpStats(phone: string) {
    const stats = await this.prisma.otp_verifications.findMany({
      where: { phone },
      orderBy: { created_at: 'desc' },
      take: 10,
      select: {
        s_no: true,
        is_verified: true,
        attempts: true,
        created_at: true,
        verified_at: true,
        expires_at: true,
      },
    });

    return {
      phone,
      totalRecords: stats.length,
      records: stats,
    };
  }
}
