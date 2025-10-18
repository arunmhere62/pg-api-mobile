import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SmsService } from './sms.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

interface OtpStore {
  otp: string;
  expiresAt: Date;
  attempts: number;
}

@Injectable()
export class AuthService {
  // In-memory OTP storage (for production, use Redis or database)
  private otpStore: Map<string, OtpStore> = new Map();
  private readonly OTP_EXPIRY_MINUTES = 5;
  private readonly MAX_ATTEMPTS = 3;

  constructor(
    private prisma: PrismaService,
    private smsService: SmsService,
  ) {}

  /**
   * Generate a 4-digit OTP
   */
  private generateOtp(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  /**
   * Send OTP to user's phone
   */
  async sendOtp(sendOtpDto: SendOtpDto) {
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

    // Store OTP
    this.otpStore.set(phone, {
      otp,
      expiresAt,
      attempts: 0,
    });

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
   * Verify OTP and login user
   */
  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { phone, otp } = verifyOtpDto;

    // Get stored OTP
    const storedOtp = this.otpStore.get(phone);

    if (!storedOtp) {
      throw new UnauthorizedException('OTP not found or expired. Please request a new OTP.');
    }

    // Check if OTP is expired
    if (new Date() > storedOtp.expiresAt) {
      this.otpStore.delete(phone);
      throw new UnauthorizedException('OTP has expired. Please request a new OTP.');
    }

    // Check attempts
    if (storedOtp.attempts >= this.MAX_ATTEMPTS) {
      this.otpStore.delete(phone);
      throw new UnauthorizedException(
        'Maximum verification attempts exceeded. Please request a new OTP.',
      );
    }

    // Verify OTP
    if (storedOtp.otp !== otp) {
      storedOtp.attempts += 1;
      this.otpStore.set(phone, storedOtp);
      throw new UnauthorizedException(
        `Invalid OTP. ${this.MAX_ATTEMPTS - storedOtp.attempts} attempts remaining.`,
      );
    }

    // OTP is valid, remove from store
    this.otpStore.delete(phone);

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

    // In production, generate JWT token here
    // For now, returning user data
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
      // TODO: Add JWT token generation
      // token: 'jwt_token_here'
    };
  }

  /**
   * Resend OTP
   */
  async resendOtp(sendOtpDto: SendOtpDto) {
    // Delete existing OTP
    this.otpStore.delete(sendOtpDto.phone);

    // Send new OTP
    return this.sendOtp(sendOtpDto);
  }

  /**
   * Clean up expired OTPs (call this periodically)
   */
  cleanupExpiredOtps() {
    const now = new Date();
    for (const [phone, otpData] of this.otpStore.entries()) {
      if (now > otpData.expiresAt) {
        this.otpStore.delete(phone);
      }
    }
  }
}
