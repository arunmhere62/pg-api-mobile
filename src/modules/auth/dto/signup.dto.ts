import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty, IsOptional, IsInt, MinLength } from 'class-validator';

export class SignupDto {
  @ApiProperty({ example: 'My PG Organization', description: 'Organization name' })
  @IsString()
  @IsNotEmpty()
  organizationName: string;

  @ApiProperty({ example: 'John Doe', description: 'User full name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'john@example.com', description: 'User email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'SecurePass123!', description: 'User password (min 6 characters)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: '+919876543210', description: 'User phone number with country code (e.g., +91 for India)', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'Green Valley PG', description: 'PG location name' })
  @IsString()
  @IsNotEmpty()
  pgName: string;

  @ApiProperty({ example: '123 Main Street, City', description: 'PG address' })
  @IsString()
  @IsNotEmpty()
  pgAddress: string;

  @ApiProperty({ example: 1, description: 'State ID' })
  @IsInt()
  @IsNotEmpty()
  stateId: number;

  @ApiProperty({ example: 1, description: 'City ID' })
  @IsInt()
  @IsNotEmpty()
  cityId: number;

  @ApiProperty({ example: '560001', description: 'PG pincode', required: false })
  @IsString()
  @IsOptional()
  pgPincode?: string;

  @ApiProperty({ example: 'CALENDAR', description: 'Rent cycle type (CALENDAR or MIDMONTH)', required: false })
  @IsString()
  @IsOptional()
  rentCycleType?: string;

  @ApiProperty({ example: 1, description: 'Rent cycle start day (1-31)', required: false })
  @IsInt()
  @IsOptional()
  rentCycleStart?: number;

  @ApiProperty({ example: 30, description: 'Rent cycle end day (1-31)', required: false })
  @IsInt()
  @IsOptional()
  rentCycleEnd?: number;

  @ApiProperty({ example: 'COLIVING', description: 'PG type (COLIVING, MENS, WOMENS)', required: false })
  @IsString()
  @IsOptional()
  pgType?: string;
}
