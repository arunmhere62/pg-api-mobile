import { IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckoutTenantDto {
  @ApiProperty({
    description: 'Checkout date in ISO format (YYYY-MM-DD). Required field.',
    example: '2025-10-25',
    type: String,
  })
  @IsDateString()
  check_out_date: string;
}
