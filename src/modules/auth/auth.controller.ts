import { Controller, Post, Body, HttpCode, HttpStatus, Patch, Param, ParseIntPipe, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthDbService } from './auth-db.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { SignupDto } from './dto/signup.dto';
import { AuthResponseDto, LoginResponseDto } from './dto/auth-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CommonHeadersDecorator, CommonHeaders } from '../../common/decorators/common-headers.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthDbService) {}

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to user phone number' })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found with this phone number' })
  @ApiResponse({ status: 400, description: 'Failed to send OTP' })
  async sendOtp(@Body() sendOtpDto: SendOtpDto) {
    return this.authService.sendOtp(sendOtpDto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and login user' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend OTP to user phone number' })
  @ApiResponse({
    status: 200,
    description: 'OTP resent successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found with this phone number' })
  @ApiResponse({ status: 400, description: 'Failed to send OTP' })
  async resendOtp(@Body() sendOtpDto: SendOtpDto) {
    return this.authService.resendOtp(sendOtpDto);
  }

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new user with organization and PG location' })
  @ApiResponse({
    status: 201,
    description: 'Account created successfully',
    schema: {
      example: {
        success: true,
        message: 'Account created successfully. Please wait for admin approval.',
        data: {
          userId: 1,
          pgId: 1,
          organizationId: 1,
          email: 'john@example.com',
          name: 'John Doe',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Email or phone already registered' })
  @ApiResponse({ status: 500, description: 'Failed to create account' })
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Patch('profile/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateProfile(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(userId, updateProfileDto);
  }

  @Post('change-password/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
  })
  @ApiResponse({ status: 400, description: 'Current password is incorrect' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async changePassword(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, changePasswordDto);
  }

  @Get('users')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all users for organization' })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
  })
  async getUsers(@CommonHeadersDecorator() headers: CommonHeaders) {
    return this.authService.getUsers(headers.organization_id);
  }

  @Get('roles')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all roles for organization (excluding Super Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Roles retrieved successfully',
  })
  async getRoles(@CommonHeadersDecorator() headers: CommonHeaders) {
    return this.authService.getRoles(headers.organization_id);
  }
}
