import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Import the Prisma enum type
export enum PermissionAction {
  CREATE = 'CREATE',
  EDIT = 'EDIT', 
  VIEW = 'VIEW',
  DELETE = 'DELETE'
}

export class CreatePermissionDto {
  @ApiProperty({
    description: 'Screen name (module/functionality)',
    example: 'tenant',
  })
  @IsString()
  @IsNotEmpty()
  screen_name: string;

  @ApiProperty({
    description: 'Action type',
    enum: PermissionAction,
    example: PermissionAction.CREATE,
  })
  @IsEnum(PermissionAction)
  @IsNotEmpty()
  action: PermissionAction;

  @ApiPropertyOptional({
    description: 'Permission description',
    example: 'Allow user to create new tenants',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
