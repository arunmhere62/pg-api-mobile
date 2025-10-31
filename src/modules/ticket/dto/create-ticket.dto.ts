import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsArray, IsInt } from 'class-validator';

export enum TicketCategory {
  BUG = 'BUG',
  FEATURE_REQUEST = 'FEATURE_REQUEST',
  SUPPORT = 'SUPPORT',
  OTHER = 'OTHER',
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export class CreateTicketDto {
  @ApiProperty({ example: 'Login button not working', description: 'Ticket title' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'When I click the login button, nothing happens', description: 'Detailed description' })
  @IsString()
  description: string;

  @ApiProperty({ enum: TicketCategory, example: TicketCategory.BUG })
  @IsEnum(TicketCategory)
  category: TicketCategory;

  @ApiProperty({ enum: TicketPriority, example: TicketPriority.MEDIUM })
  @IsEnum(TicketPriority)
  priority: TicketPriority;

  @ApiProperty({ example: ['https://example.com/screenshot.png'], required: false })
  @IsArray()
  @IsOptional()
  attachments?: string[];

  @ApiProperty({ example: 1, description: 'PG Location ID', required: false })
  @IsInt()
  @IsOptional()
  pg_id?: number;
}
