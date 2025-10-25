import { IsDateString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CheckoutTenantDto {
  @ApiPropertyOptional({
    description: 'Checkout date in ISO format (YYYY-MM-DD). Defaults to current date if not provided.',
    example: '2025-10-25',
    type: String,
  })
  @IsOptional()
  @IsDateString()
  check_out_date?: string;
}
