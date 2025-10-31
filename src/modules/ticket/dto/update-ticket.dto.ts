import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateTicketDto, TicketStatus } from './create-ticket.dto';
import { IsEnum, IsOptional, IsString, IsInt } from 'class-validator';

export class UpdateTicketDto extends PartialType(CreateTicketDto) {
  @ApiProperty({ enum: TicketStatus, required: false })
  @IsEnum(TicketStatus)
  @IsOptional()
  status?: TicketStatus;

  @ApiProperty({ example: 'Fixed in version 1.2.3', required: false })
  @IsString()
  @IsOptional()
  resolution?: string;

  @ApiProperty({ example: 2, description: 'Assign to user ID', required: false })
  @IsInt()
  @IsOptional()
  assigned_to?: number;
}
