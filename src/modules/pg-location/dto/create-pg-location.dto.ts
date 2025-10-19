import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, IsArray, MinLength } from 'class-validator';

export class CreatePgLocationDto {
  @ApiProperty({ example: 'Green Valley PG', description: 'PG location name' })
  @IsString()
  @IsNotEmpty()
  locationName: string;

  @ApiProperty({ example: '123 Main Street, City', description: 'PG address' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: '560001', description: 'Pincode', required: false })
  @IsString()
  @IsOptional()
  @MinLength(4)
  pincode?: string;

  @ApiProperty({ example: 1, description: 'State ID' })
  @IsInt()
  @IsNotEmpty()
  stateId: number;

  @ApiProperty({ example: 1, description: 'City ID' })
  @IsInt()
  @IsNotEmpty()
  cityId: number;

  @ApiProperty({ 
    example: ['image1.jpg', 'image2.jpg'], 
    description: 'Array of image URLs',
    required: false,
    type: [String]
  })
  @IsArray()
  @IsOptional()
  images?: string[];
}
