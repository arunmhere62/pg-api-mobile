import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsEnum, IsOptional, IsDateString, Min } from 'class-validator';

export enum PaymentMethod {
  GPAY = 'GPAY',
  PHONEPE = 'PHONEPE',
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export class CreateEmployeeSalaryDto {
  @ApiProperty({ description: 'User/Employee ID' })
  @IsNumber()
  user_id: number;

  @ApiProperty({ description: 'Salary amount' })
  @IsNumber()
  @Min(0)
  salary_amount: number;

  @ApiProperty({ description: 'Month for which salary is paid', example: '2024-01-01' })
  @IsDateString()
  month: string;

  @ApiProperty({ description: 'Date of payment', example: '2024-01-15' })
  @IsDateString()
  @IsOptional()
  paid_date?: string;

  @ApiProperty({ enum: PaymentMethod, description: 'Payment method', required: false })
  @IsEnum(PaymentMethod)
  @IsOptional()
  payment_method?: PaymentMethod;

  @ApiProperty({ required: false, description: 'Additional remarks' })
  @IsOptional()
  remarks?: string;
}
