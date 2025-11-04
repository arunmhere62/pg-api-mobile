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
import { OtpStrategyFactory } from './strategies/otp-strategy.factory';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { SignupDto } from './dto/signup.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthDbService {
  private readonly OTP_EXPIRY_MINUTES: number;
  private readonly MAX_ATTEMPTS: number;

  constructor(
    private prisma: PrismaService,
    private smsService: SmsService,
    private jwtTokenService: JwtTokenService,
    private configService: ConfigService,
    private otpStrategyFactory: OtpStrategyFactory,
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

    // Send OTP via SMS using strategy pattern
    const otpStrategy = this.otpStrategyFactory.getStrategy();
    const smsSent = await otpStrategy.sendOtp(phone, otp);

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

    // Verify OTP using strategy pattern
    const otpStrategy = this.otpStrategyFactory.getStrategy();
    const isValid = otpStrategy.verifyOtp(phone, otp, otpRecord.otp);

    if (!isValid) {
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
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is superadmin
    const isSuperAdmin = user.roles.role_name === 'SUPER_ADMIN' || 
                         user.roles.role_name.toLowerCase() === 'super_admin' ||
                         user.roles.role_name.toLowerCase() === 'superadmin';

    // Log user data for debugging
    console.log('🔍 User data from DB:', {
      s_no: user.s_no,
      name: user.name,
      organization_id: user.organization_id,
      role_name: user.roles.role_name,
      isSuperAdmin,
    });

    // Build user response object
    const userResponse: any = {
      s_no: user.s_no,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role_id: user.role_id,
      role_name: user.roles.role_name,
      organization_id: user.organization_id, // Always include, even if null
      status: user.status,
      address: user.address,
      city_id: user.city_id,
      state_id: user.state_id,
      gender: user.gender,
    };

    // Add organization name if organization_id exists
    if (user.organization_id) {
      // Fetch organization details
      const organization = await this.prisma.organization.findUnique({
        where: { s_no: user.organization_id },
        select: { s_no: true, name: true },
      });

      userResponse.organization_name = organization?.name;
      console.log('✅ Organization found:', organization?.name);
    } else {
      console.log('⚠️ User has no organization_id in database');
    }

    // Generate JWT tokens
    const tokens = await this.jwtTokenService.generateTokens(user, ipAddress);

    const response = {
      success: true,
      message: 'Login successful',
      user: userResponse,
      ...tokens, // Spread tokens (access_token, refresh_token, token_type, expires_in)
    };

    console.log('📤 Login response user object:', {
      s_no: userResponse.s_no,
      name: userResponse.name,
      organization_id: userResponse.organization_id,
      role_name: userResponse.role_name,
    });

    return response;
  }

  /**
   * Resend OTP (Database version) - Updates the same record
   */
  async resendOtp(sendOtpDto: SendOtpDto, ipAddress?: string, userAgent?: string) {
    // Just call sendOtp - it will update the existing record
    return this.sendOtp(sendOtpDto, ipAddress, userAgent);
  }

  /**
   * User Signup - Create organization, user, role, and PG location
   */
  async signup(signupDto: SignupDto) {
    const {
      organizationName,
      name,
      email,
      password,
      phone,
      pgName,
      pgAddress,
      stateId,
      cityId,
      pgPincode,
    } = signupDto;

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    // Check if phone already exists (if provided)
    if (phone) {
      const existingPhone = await this.prisma.user.findFirst({
        where: { phone },
      });

      if (existingPhone) {
        throw new BadRequestException('Phone number already registered');
      }
    }

    try {
      // Use transaction to ensure all operations succeed or fail together
      const result = await this.prisma.$transaction(async (prisma) => {
        // 1. Create organization first
        const organization = await prisma.organization.create({
          data: {
            name: organizationName,
            description: `Organization for ${organizationName}`,
            is_deleted: false,
          },
        });

        // 2. Find existing ADMIN role (global role, not organization-specific)
        const role = await prisma.roles.findFirst({
          where: {
            role_name: 'ADMIN',
            is_deleted: false,
          },
        });

        if (!role) {
          throw new BadRequestException('ADMIN role not found in the system. Please contact support.');
        }

        // 3. Create user (status INACTIVE until admin approval)
        const user = await prisma.user.create({
          data: {
            name,
            email,
            password, // Note: In production, hash the password using bcrypt
            phone,
            status: 'INACTIVE', // User needs admin approval
            role_id: role.s_no,
            organization_id: organization.s_no,
            is_deleted: false,
          },
        });

        // 4. Update organization with created user
        await prisma.organization.update({
          where: { s_no: organization.s_no },
          data: {
            created_by: user.s_no,
            updated_by: user.s_no,
          },
        });

        // 5. Create PG Location
        const pgLocation = await prisma.pg_locations.create({
          data: {
            user_id: user.s_no,
            location_name: pgName,
            address: pgAddress,
            pincode: pgPincode,
            status: 'ACTIVE',
            organization_id: organization.s_no,
            city_id: cityId,
            state_id: stateId,
            is_deleted: false,
          },
        });

        // 6. Update user with pgId
        await prisma.user.update({
          where: { s_no: user.s_no },
          data: { pg_id: pgLocation.s_no },
        });

        return {
          userId: user.s_no,
          pgId: pgLocation.s_no,
          organizationId: organization.s_no,
          email: user.email,
          name: user.name,
        };
      });

      return {
        success: true,
        message: 'Account created successfully. Please wait for admin approval.',
        data: result,
      };
    } catch (error) {
      console.error('Signup error:', error);
      throw new BadRequestException('Failed to create account. Please try again.');
    }
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

  /**
   * Update user profile
   */
  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { s_no: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if email is being changed and if it's already taken
    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const existingEmail = await this.prisma.user.findFirst({
        where: {
          email: updateProfileDto.email,
          s_no: { not: userId },
        },
      });

      if (existingEmail) {
        throw new BadRequestException('Email already in use');
      }
    }

    // Check if phone is being changed and if it's already taken
    if (updateProfileDto.phone && updateProfileDto.phone !== user.phone) {
      const existingPhone = await this.prisma.user.findFirst({
        where: {
          phone: updateProfileDto.phone,
          s_no: { not: userId },
        },
      });

      if (existingPhone) {
        throw new BadRequestException('Phone number already in use');
      }
    }

    // Update user profile
    const updatedUser = await this.prisma.user.update({
      where: { s_no: userId },
      data: {
        name: updateProfileDto.name,
        email: updateProfileDto.email,
        phone: updateProfileDto.phone,
        address: updateProfileDto.address,
        gender: updateProfileDto.gender,
        state_id: updateProfileDto.state_id,
        city_id: updateProfileDto.city_id,
        profile_images: updateProfileDto.profile_images,
      },
      select: {
        s_no: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        gender: true,
        state_id: true,
        city_id: true,
        profile_images: true,
        role_id: true,
        organization_id: true,
        status: true,
        roles: {
          select: {
            role_name: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Profile updated successfully',
      data: {
        ...updatedUser,
        role_name: updatedUser.roles.role_name,
      },
    };
  }

  /**
   * Change user password
   */
  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { s_no: userId },
      select: {
        s_no: true,
        password: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password (no encryption for now)
    if (user.password !== currentPassword) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Update password (no encryption for now)
    await this.prisma.user.update({
      where: { s_no: userId },
      data: {
        password: newPassword,
      },
    });

    return {
      success: true,
      message: 'Password changed successfully',
    };
  }

  /**
   * Get all users for an organization
   */
  async getUsers(organizationId: number) {
    const users = await this.prisma.user.findMany({
      where: {
        organization_id: organizationId,
        is_deleted: false,
      },
      select: {
        s_no: true,
        name: true,
        email: true,
        phone: true,
        role_id: true,
        status: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return {
      success: true,
      data: users,
    };
  }

  /**
   * Get all roles for an organization (excluding Super Admin)
   */
  async getRoles(organizationId: number) {
    console.log('📋 getRoles called with organization_id:', organizationId);
    
    const roles = await this.prisma.roles.findMany({
      where: {
        is_deleted: false,
        role_name: {
          not: 'SUPER_ADMIN',
        },
        status: 'ACTIVE',
      },
      select: {
        s_no: true,
        role_name: true,
        status: true,
      },
      orderBy: {
        role_name: 'asc',
      },
    });

    console.log('✅ Found roles:', roles.length, roles);

    return {
      success: true,
      data: roles,
    };
  }
}
