import { IsDateString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateCheckoutDateDto {
  @IsOptional()
  @IsDateString()
  check_out_date?: string | null;

  @IsOptional()
  @IsBoolean()
  clear_checkout?: boolean; // If true, clears the checkout date and reactivates tenant
}
