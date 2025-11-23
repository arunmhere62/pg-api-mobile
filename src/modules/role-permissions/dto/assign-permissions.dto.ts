import { IsArray, IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignPermissionsDto {
  @ApiProperty({
    description: 'Array of permission keys to assign',
    example: ['tenant_create', 'tenant_edit', 'tenant_view'],
  })
  @IsArray()
  @IsString({ each: true })
  permission_keys: string[];

  @ApiPropertyOptional({
    description: 'Whether to replace all permissions or merge with existing',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  replace_all?: boolean = false;
}

export class BulkPermissionUpdateDto {
  @ApiProperty({
    description: 'Permissions object with permission keys as keys and boolean values',
    example: {
      'tenant_create': true,
      'tenant_edit': true,
      'tenant_delete': false,
      'tenant_view': true
    },
  })
  permissions: Record<string, boolean>;
}
