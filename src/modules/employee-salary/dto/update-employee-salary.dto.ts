import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsEnum, IsOptional, IsDateString, Min } from 'class-validator';
import { PaymentMethod } from './create-employee-salary.dto';

export class UpdateEmployeeSalaryDto {
  @ApiProperty({ description: 'Salary amount', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  salary_amount?: number;

  @ApiProperty({ description: 'Date of payment', example: '2024-01-15', required: false })
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
