import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { RolePermissionsService } from './role-permissions.service';
import { AssignPermissionsDto, BulkPermissionUpdateDto } from './dto/assign-permissions.dto';

@ApiTags('Role Permissions')
@Controller('role-permissions')
export class RolePermissionsController {
  constructor(private readonly rolePermissionsService: RolePermissionsService) {}

  /**
   * Assign permissions to a role
   * POST /api/v1/role-permissions/:roleId/assign
   */
  @Post(':roleId/assign')
  @ApiOperation({ summary: 'Assign permissions to a role' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Permissions assigned successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Role not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid permission keys',
  })
  async assignPermissions(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ) {
    return this.rolePermissionsService.assignPermissions(roleId, assignPermissionsDto);
  }

  /**
   * Remove permissions from a role
   * DELETE /api/v1/role-permissions/:roleId/remove
   */
  @Delete(':roleId/remove')
  @ApiOperation({ summary: 'Remove permissions from a role' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Permissions removed successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Role not found',
  })
  async removePermissions(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Body() body: { permission_keys: string[] },
  ) {
    return this.rolePermissionsService.removePermissions(roleId, body.permission_keys);
  }

  /**
   * Bulk update role permissions
   * PATCH /api/v1/role-permissions/:roleId/bulk-update
   */
  @Patch(':roleId/bulk-update')
  @ApiOperation({ summary: 'Bulk update role permissions' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Permissions updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Role not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid permission keys',
  })
  async bulkUpdatePermissions(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Body() bulkUpdateDto: BulkPermissionUpdateDto,
  ) {
    return this.rolePermissionsService.bulkUpdatePermissions(roleId, bulkUpdateDto);
  }

  /**
   * Get role permissions with details
   * GET /api/v1/role-permissions/:roleId
   */
  @Get(':roleId')
  @ApiOperation({ summary: 'Get role permissions with details' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Role permissions retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Role not found',
  })
  async getRolePermissions(@Param('roleId', ParseIntPipe) roleId: number) {
    return this.rolePermissionsService.getRolePermissions(roleId);
  }

  /**
   * Copy permissions from one role to another
   * POST /api/v1/role-permissions/:sourceRoleId/copy-to/:targetRoleId
   */
  @Post(':sourceRoleId/copy-to/:targetRoleId')
  @ApiOperation({ summary: 'Copy permissions from one role to another' })
  @ApiParam({ name: 'sourceRoleId', description: 'Source Role ID' })
  @ApiParam({ name: 'targetRoleId', description: 'Target Role ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Permissions copied successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Source or target role not found',
  })
  async copyPermissions(
    @Param('sourceRoleId', ParseIntPipe) sourceRoleId: number,
    @Param('targetRoleId', ParseIntPipe) targetRoleId: number,
  ) {
    return this.rolePermissionsService.copyPermissions(sourceRoleId, targetRoleId);
  }

  /**
   * Get permission usage across roles
   * GET /api/v1/role-permissions/usage
   */
  @Get('usage')
  @ApiOperation({ summary: 'Get permission usage across roles' })
  @ApiQuery({ name: 'permission_key', required: false, description: 'Specific permission key to check' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Permission usage retrieved successfully',
  })
  async getPermissionUsage(@Query('permission_key') permissionKey?: string) {
    return this.rolePermissionsService.getPermissionUsage(permissionKey);
  }
}
