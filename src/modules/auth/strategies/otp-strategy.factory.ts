/**
 * OTP Strategy Factory
 * Creates appropriate OTP strategy based on environment
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OtpStrategy } from './otp-strategy.interface';
import { ProductionOtpStrategy } from './production-otp.strategy';
import { DevelopmentOtpStrategy } from './development-otp.strategy';
import { SmsService } from '../sms.service';

@Injectable()
export class OtpStrategyFactory {
  private readonly logger = new Logger(OtpStrategyFactory.name);
  private strategy: OtpStrategy;

  constructor(
    private readonly configService: ConfigService,
    private readonly smsService: SmsService,
  ) {
    this.initializeStrategy();
  }

  private initializeStrategy(): void {
    const nodeEnv = this.configService.get<string>('NODE_ENV') || 'development';
    
    if (nodeEnv === 'production') {
      this.strategy = new ProductionOtpStrategy(this.smsService);
      this.logger.log('🔒 Using PRODUCTION OTP Strategy - Real SMS only');
    } else {
      this.strategy = new DevelopmentOtpStrategy(this.smsService);
      this.logger.warn('⚠️  Using DEVELOPMENT OTP Strategy - Bypass OTP: 1234');
    }

    this.logger.log(`OTP Strategy: ${this.strategy.getStrategyName()}`);
  }

  getStrategy(): OtpStrategy {
    return this.strategy;
  }
}
