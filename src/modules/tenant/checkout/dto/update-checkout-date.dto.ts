import { IsDateString, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCheckoutDateDto {
  @ApiPropertyOptional({
    description: 'New checkout date in ISO format (YYYY-MM-DD)',
    example: '2025-11-01',
    type: String,
  })
  @IsOptional()
  @IsDateString()
  check_out_date?: string | null;

  @ApiPropertyOptional({
    description: 'Set to true to clear the checkout date and reactivate the tenant',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  clear_checkout?: boolean;
}
