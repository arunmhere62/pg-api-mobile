import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly smsApiUrl: string;
  private readonly smsUser: string;
  private readonly smsPassword: string;
  private readonly smsSenderId: string;
  private readonly smsChannel: string;
  private readonly smsRoute: string;

  constructor(private configService: ConfigService) {
    // SMS API Configuration
    this.smsApiUrl = 'http://cannyinfotech.in/api/mt/SendSMS';
    this.smsUser = 'SATZTECHNOSOLUTIONS';
    this.smsPassword = 'demo1234';
    this.smsSenderId = 'SATZTH';
    this.smsChannel = 'Trans';
    this.smsRoute = '10';
  }

  /**
   * Send OTP via SMS
   */
  async sendOtp(phoneNumber: string, otp: string): Promise<boolean> {
    try {
      const message = `Your OTP number for registration is ${otp}. Please verify your OTP - SATZ/TNYADAVS.COM`;

      const url = new URL(this.smsApiUrl);
      url.searchParams.append('user', this.smsUser);
      url.searchParams.append('password', this.smsPassword);
      url.searchParams.append('senderid', this.smsSenderId);
      url.searchParams.append('channel', this.smsChannel);
      url.searchParams.append('DCS', '0');
      url.searchParams.append('flashsms', '0');
      url.searchParams.append('number', phoneNumber);
      url.searchParams.append('text', message);
      url.searchParams.append('route', this.smsRoute);

      this.logger.log(`Sending OTP to ${phoneNumber}`);

      const response = await fetch(url.toString());
      const result = await response.text();

      this.logger.log(`SMS API Response: ${result}`);

      // Check if SMS was sent successfully
      if (response.ok) {
        this.logger.log(`OTP sent successfully to ${phoneNumber}`);
        return true;
      } else {
        this.logger.error(`Failed to send OTP to ${phoneNumber}: ${result}`);
        return false;
      }
    } catch (error) {
      this.logger.error(`Error sending OTP: ${error.message}`);
      return false;
    }
  }

  /**
   * Send custom SMS message
   */
  async sendSms(phoneNumber: string, message: string): Promise<boolean> {
    try {
      const url = new URL(this.smsApiUrl);
      url.searchParams.append('user', this.smsUser);
      url.searchParams.append('password', this.smsPassword);
      url.searchParams.append('senderid', this.smsSenderId);
      url.searchParams.append('channel', this.smsChannel);
      url.searchParams.append('DCS', '0');
      url.searchParams.append('flashsms', '0');
      url.searchParams.append('number', phoneNumber);
      url.searchParams.append('text', message);
      url.searchParams.append('route', this.smsRoute);

      const response = await fetch(url.toString());
      const result = await response.text();

      this.logger.log(`SMS sent to ${phoneNumber}: ${result}`);

      return response.ok;
    } catch (error) {
      this.logger.error(`Error sending SMS: ${error.message}`);
      return false;
    }
  }
}
