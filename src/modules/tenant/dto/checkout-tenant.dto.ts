import { IsDateString, IsOptional } from 'class-validator';

export class CheckoutTenantDto {
  @IsOptional()
  @IsDateString()
  check_out_date?: string;
}
