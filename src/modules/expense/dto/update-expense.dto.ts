import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, IsDateString, Min } from 'class-validator';
import { PaymentMethod } from './create-expense.dto';

export class UpdateExpenseDto {
  @ApiProperty({ required: false, description: 'Type of expense' })
  @IsOptional()
  @IsString()
  expense_type?: string;

  @ApiProperty({ required: false, description: 'Amount paid' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiProperty({ required: false, description: 'Person/Entity paid to' })
  @IsOptional()
  @IsString()
  paid_to?: string;

  @ApiProperty({ required: false, description: 'Date of payment', example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  paid_date?: string;

  @ApiProperty({ required: false, enum: PaymentMethod, description: 'Payment method' })
  @IsOptional()
  @IsEnum(PaymentMethod)
  payment_method?: PaymentMethod;

  @ApiProperty({ required: false, description: 'Additional remarks' })
  @IsOptional()
  @IsString()
  remarks?: string;
}
