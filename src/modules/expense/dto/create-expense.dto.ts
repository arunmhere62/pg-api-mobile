import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, IsDateString, Min } from 'class-validator';

export enum PaymentMethod {
  GPAY = 'GPAY',
  PHONEPE = 'PHONEPE',
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export class CreateExpenseDto {
  @ApiProperty({ description: 'Type of expense' })
  @IsString()
  expense_type: string;

  @ApiProperty({ description: 'Amount paid' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Person/Entity paid to' })
  @IsString()
  paid_to: string;

  @ApiProperty({ description: 'Date of payment', example: '2024-01-15' })
  @IsDateString()
  paid_date: string;

  @ApiProperty({ enum: PaymentMethod, description: 'Payment method' })
  @IsEnum(PaymentMethod)
  payment_method: PaymentMethod;

  @ApiProperty({ required: false, description: 'Additional remarks' })
  @IsOptional()
  @IsString()
  remarks?: string;
}
