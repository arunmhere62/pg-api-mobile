/**
 * Production OTP Strategy
 * Sends real SMS via SMS provider
 */

import { Injectable, Logger } from '@nestjs/common';
import { OtpStrategy } from './otp-strategy.interface';
import { SmsService } from '../sms.service';

@Injectable()
export class ProductionOtpStrategy implements OtpStrategy {
  private readonly logger = new Logger(ProductionOtpStrategy.name);

  constructor(private readonly smsService: SmsService) {}

  async sendOtp(phoneNumber: string, otp: string): Promise<boolean> {
    this.logger.log(`[PRODUCTION] Sending real SMS to ${phoneNumber}`);
    return this.smsService.sendOtp(phoneNumber, otp);
  }

  verifyOtp(phoneNumber: string, otp: string, storedOtp: string): boolean {
    this.logger.log(`[PRODUCTION] Verifying OTP for ${phoneNumber}`);
    return otp === storedOtp;
  }

  getStrategyName(): string {
    return 'Production';
  }
}
