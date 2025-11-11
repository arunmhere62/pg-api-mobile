import { IsInt, IsBoolean, IsNumber, IsOptional } from 'class-validator';

/**
 * Tenant Status Result DTO
 * Uses snake_case to match database schema
 */
export class TenantStatusResultDto {
  @IsBoolean()
  is_rent_paid: boolean;

  @IsBoolean()
  is_rent_partial: boolean;

  @IsNumber()
  rent_due_amount: number;

  @IsNumber()
  partial_due_amount: number;

  @IsNumber()
  pending_due_amount: number;

  @IsBoolean()
  is_advance_paid: boolean;

  @IsBoolean()
  is_refund_paid: boolean;

  @IsInt()
  pending_months: number;
}

/**
 * Tenant Statistics DTO
 * Uses snake_case to match database schema
 */
export class TenantStatisticsDto {
  @IsInt()
  total: number;

  @IsInt()
  active: number;

  @IsInt()
  with_pending_rent: number;

  @IsInt()
  with_partial_rent: number;

  @IsInt()
  with_paid_rent: number;

  @IsInt()
  without_advance: number;

  @IsNumber()
  total_due_amount: number;
}

/**
 * Tenant with Status DTO
 * Combines tenant data with status information
 */
export class TenantWithStatusDto {
  @IsInt()
  s_no: number;

  @IsOptional()
  tenant_id?: string;

  @IsOptional()
  name?: string;

  @IsOptional()
  phone_no?: string;

  @IsOptional()
  email?: string;

  @IsOptional()
  status?: string;

  @IsBoolean()
  is_rent_paid: boolean;

  @IsBoolean()
  is_rent_partial: boolean;

  @IsNumber()
  rent_due_amount: number;

  @IsNumber()
  partial_due_amount: number;

  @IsNumber()
  pending_due_amount: number;

  @IsBoolean()
  is_advance_paid: boolean;

  @IsBoolean()
  is_refund_paid: boolean;

  @IsInt()
  pending_months: number;
}
