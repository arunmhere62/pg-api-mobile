import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';

export class CreateVisitorDto {
  @ApiProperty({ example: 'John Doe', description: 'Visitor name' })
  @IsString()
  visitor_name: string;

  @ApiProperty({ example: '9876543210', description: 'Phone number' })
  @IsString()
  phone_no: string;

  @ApiProperty({ example: 'Room Inquiry', description: 'Purpose of visit', required: false })
  @IsString()
  @IsOptional()
  purpose?: string;

  @ApiProperty({ example: '2025-10-31', description: 'Visit date', required: false })
  @IsString()
  @IsOptional()
  visited_date?: string;

  @ApiProperty({ example: 1, description: 'Room ID', required: false })
  @IsInt()
  @IsOptional()
  visited_room_id?: number;

  @ApiProperty({ example: 1, description: 'Bed ID', required: false })
  @IsInt()
  @IsOptional()
  visited_bed_id?: number;

  @ApiProperty({ example: 1, description: 'City ID', required: false })
  @IsInt()
  @IsOptional()
  city_id?: number;

  @ApiProperty({ example: 1, description: 'State ID', required: false })
  @IsInt()
  @IsOptional()
  state_id?: number;

  @ApiProperty({ example: 'Looking for 2BHK', description: 'Additional remarks', required: false })
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiProperty({ example: false, description: 'Converted to tenant', required: false })
  @IsBoolean()
  @IsOptional()
  convertedTo_tenant?: boolean;
}
