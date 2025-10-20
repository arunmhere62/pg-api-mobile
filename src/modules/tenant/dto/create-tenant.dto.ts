import { IsString, IsEmail, IsOptional, IsInt, IsDateString, IsEnum } from 'class-validator';

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  CHECKED_OUT = 'CHECKED_OUT',
}

export class CreateTenantDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  phone_no?: string;

  @IsOptional()
  @IsString()
  whatsapp_number?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsInt()
  pg_id: number;

  @IsOptional()
  @IsInt()
  room_id?: number;

  @IsOptional()
  @IsInt()
  bed_id?: number;

  @IsDateString()
  check_in_date: string;

  @IsOptional()
  @IsDateString()
  check_out_date?: string;

  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;

  @IsOptional()
  @IsString()
  occupation?: string;

  @IsOptional()
  @IsString()
  tenant_address?: string;

  @IsOptional()
  @IsInt()
  city_id?: number;

  @IsOptional()
  @IsInt()
  state_id?: number;

  @IsOptional()
  images?: any;

  @IsOptional()
  proof_documents?: any;
}
