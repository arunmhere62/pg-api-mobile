/**
 * OTP Strategy Interface
 * Defines the contract for different OTP sending strategies
 */

export interface OtpStrategy {
  /**
   * Send OTP to phone number
   */
  sendOtp(phoneNumber: string, otp: string): Promise<boolean>;

  /**
   * Verify OTP
   */
  verifyOtp(phoneNumber: string, otp: string, storedOtp: string): boolean;

  /**
   * Get strategy name
   */
  getStrategyName(): string;
}
