import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsArray, IsEnum, MinLength } from 'class-validator';

export class UpdatePgLocationDto {
  @ApiProperty({ example: 'Green Valley PG', description: 'PG location name', required: false })
  @IsString()
  @IsOptional()
  locationName?: string;

  @ApiProperty({ example: '123 Main Street, City', description: 'PG address', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: '560001', description: 'Pincode', required: false })
  @IsString()
  @IsOptional()
  @MinLength(4)
  pincode?: string;

  @ApiProperty({ example: 1, description: 'State ID', required: false })
  @IsInt()
  @IsOptional()
  stateId?: number;

  @ApiProperty({ example: 1, description: 'City ID', required: false })
  @IsInt()
  @IsOptional()
  cityId?: number;

  @ApiProperty({ 
    example: ['image1.jpg', 'image2.jpg'], 
    description: 'Array of image URLs',
    required: false,
    type: [String]
  })
  @IsArray()
  @IsOptional()
  images?: string[];

  @ApiProperty({ 
    example: 'ACTIVE', 
    description: 'PG location status',
    enum: ['ACTIVE', 'INACTIVE'],
    required: false 
  })
  @IsEnum(['ACTIVE', 'INACTIVE'])
  @IsOptional()
  status?: 'ACTIVE' | 'INACTIVE';
}
