import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, Length } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({
    example: '918248449609',
    description: 'Phone number with country code (without + sign)',
  })
  @IsString()
  // @Matches(/^91[6-9]\d{9}$/, {
  //   message: 'Phone number must be a valid Indian mobile number starting with 91',
  // })
  phone: string;

  @ApiProperty({
    example: '1234',
    description: '4-digit OTP code',
  })
  @IsString()
  @Length(4, 4, { message: 'OTP must be exactly 4 digits' })
  @Matches(/^\d{4}$/, { message: 'OTP must contain only digits' })
  otp: string;
}
