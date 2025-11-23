import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AssignPermissionsDto, BulkPermissionUpdateDto } from './dto/assign-permissions.dto';

@Injectable()
export class RolePermissionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Assign permissions to a role
   */
  async assignPermissions(roleId: number, assignPermissionsDto: AssignPermissionsDto) {
    try {
      // Check if role exists
      const role = await this.prisma.roles.findUnique({
        where: { s_no: roleId },
      });

      if (!role) {
        throw new NotFoundException('Role not found');
      }

      // Verify all permission keys exist
      // Convert permission keys to screen_name + action format
      const permissionKeyMap = assignPermissionsDto.permission_keys.reduce((acc, key) => {
        const [screenName, action] = key.split('_');
        if (screenName && action) {
          acc[key] = { screen_name: screenName, action: action.toUpperCase() };
        }
        return acc;
      }, {} as Record<string, { screen_name: string; action: string }>);

      const permissions = await this.prisma.permissions_master.findMany({
        where: {
          OR: Object.values(permissionKeyMap).map(({ screen_name, action }) => ({
            AND: [
              { screen_name },
              { action: action as any }
            ]
          }))
        },
      });

      const foundKeys = permissions.map(p => `${p.screen_name}_${p.action.toLowerCase()}`);
      const missingKeys = assignPermissionsDto.permission_keys.filter(key => !foundKeys.includes(key));

      if (missingKeys.length > 0) {
        throw new BadRequestException(`Permission keys not found: ${missingKeys.join(', ')}`);
      }

      // Prepare permissions object
      let newPermissions: Record<string, boolean>;

      if (assignPermissionsDto.replace_all) {
        // Replace all permissions
        newPermissions = {};
        assignPermissionsDto.permission_keys.forEach(key => {
          newPermissions[key] = true;
        });
      } else {
        // Merge with existing permissions
        newPermissions = (role.permissions as Record<string, boolean>) || {};
        assignPermissionsDto.permission_keys.forEach(key => {
          newPermissions[key] = true;
        });
      }

      // Update role permissions
      const updatedRole = await this.prisma.roles.update({
        where: { s_no: roleId },
        data: {
          permissions: newPermissions,
          updated_at: new Date(),
        },
      });

      return {
        success: true,
        message: 'Permissions assigned successfully',
        data: updatedRole,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to assign permissions');
    }
  }

  /**
   * Remove permissions from a role
   */
  async removePermissions(roleId: number, permissionKeys: string[]) {
    try {
      // Check if role exists
      const role = await this.prisma.roles.findUnique({
        where: { s_no: roleId },
      });

      if (!role) {
        throw new NotFoundException('Role not found');
      }

      // Get current permissions
      const currentPermissions = (role.permissions as Record<string, boolean>) || {};

      // Remove specified permissions
      permissionKeys.forEach(key => {
        delete currentPermissions[key];
      });

      // Update role permissions
      const updatedRole = await this.prisma.roles.update({
        where: { s_no: roleId },
        data: {
          permissions: currentPermissions,
          updated_at: new Date(),
        },
      });

      return {
        success: true,
        message: 'Permissions removed successfully',
        data: updatedRole,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to remove permissions');
    }
  }

  /**
   * Bulk update role permissions
   */
  async bulkUpdatePermissions(roleId: number, bulkUpdateDto: BulkPermissionUpdateDto) {
    try {
      // Check if role exists
      const role = await this.prisma.roles.findUnique({
        where: { s_no: roleId },
      });

      if (!role) {
        throw new NotFoundException('Role not found');
      }

      // Verify all permission keys exist
      const permissionKeys = Object.keys(bulkUpdateDto.permissions);
      // Convert permission keys to screen_name + action format
      const permissionKeyMap = permissionKeys.reduce((acc, key) => {
        const [screenName, action] = key.split('_');
        if (screenName && action) {
          acc[key] = { screen_name: screenName, action: action.toUpperCase() };
        }
        return acc;
      }, {} as Record<string, { screen_name: string; action: string }>);

      const permissions = await this.prisma.permissions_master.findMany({
        where: {
          OR: Object.values(permissionKeyMap).map(({ screen_name, action }) => ({
            AND: [
              { screen_name },
              { action: action as any }
            ]
          }))
        },
      });

      const foundKeys = permissions.map(p => `${p.screen_name}_${p.action.toLowerCase()}`);
      const missingKeys = permissionKeys.filter(key => !foundKeys.includes(key));

      if (missingKeys.length > 0) {
        throw new BadRequestException(`Permission keys not found: ${missingKeys.join(', ')}`);
      }

      // Update role permissions
      const updatedRole = await this.prisma.roles.update({
        where: { s_no: roleId },
        data: {
          permissions: bulkUpdateDto.permissions,
          updated_at: new Date(),
        },
      });

      return {
        success: true,
        message: 'Permissions updated successfully',
        data: updatedRole,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to update permissions');
    }
  }

  /**
   * Get role permissions with details
   */
  async getRolePermissions(roleId: number) {
    try {
      const role = await this.prisma.roles.findUnique({
        where: { s_no: roleId },
      });

      if (!role) {
        throw new NotFoundException('Role not found');
      }

      // Get all available permissions
      const allPermissions = await this.prisma.permissions_master.findMany({
        orderBy: {
          screen_name: 'asc',
        },
      });

      // Get role permissions
      const rolePermissions = (role.permissions as Record<string, boolean>) || {};

      // Map permissions with their status
      const permissionsWithStatus = allPermissions.map(permission => ({
        ...permission,
        granted: rolePermissions[`${permission.screen_name}_${permission.action.toLowerCase()}`] === true,
      }));

      return {
        success: true,
        data: {
          role: {
            s_no: role.s_no,
            role_name: role.role_name,
            status: role.status,
          },
          permissions: permissionsWithStatus,
          summary: {
            total_permissions: allPermissions.length,
            granted_permissions: Object.values(rolePermissions).filter(Boolean).length,
          },
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to get role permissions');
    }
  }

  /**
   * Copy permissions from one role to another
   */
  async copyPermissions(sourceRoleId: number, targetRoleId: number) {
    try {
      // Check if both roles exist
      const [sourceRole, targetRole] = await Promise.all([
        this.prisma.roles.findUnique({ where: { s_no: sourceRoleId } }),
        this.prisma.roles.findUnique({ where: { s_no: targetRoleId } }),
      ]);

      if (!sourceRole) {
        throw new NotFoundException('Source role not found');
      }

      if (!targetRole) {
        throw new NotFoundException('Target role not found');
      }

      // Copy permissions
      const sourcePermissions = (sourceRole.permissions as Record<string, boolean>) || {};

      const updatedRole = await this.prisma.roles.update({
        where: { s_no: targetRoleId },
        data: {
          permissions: sourcePermissions,
          updated_at: new Date(),
        },
      });

      return {
        success: true,
        message: `Permissions copied from ${sourceRole.role_name} to ${targetRole.role_name}`,
        data: updatedRole,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to copy permissions');
    }
  }

  /**
   * Get permission usage across roles
   */
  async getPermissionUsage(permissionKey?: string) {
    try {
      const where: any = {
        is_deleted: false,
      };

      if (permissionKey) {
        where.permissions = {
          path: permissionKey,
          equals: true,
        };
      }

      const roles = await this.prisma.roles.findMany({
        where,
        select: {
          s_no: true,
          role_name: true,
          permissions: true,
          _count: {
            select: {
              users: true,
            },
          },
        },
      });

      if (permissionKey) {
        return {
          success: true,
          data: {
            permission_key: permissionKey,
            roles_using: roles,
            total_roles: roles.length,
            total_users_affected: roles.reduce((sum, role) => sum + role._count.users, 0),
          },
        };
      }

      // Get all permissions usage
      const allPermissions = await this.prisma.permissions_master.findMany();
      const usageMap = allPermissions.map(permission => {
        const permissionKey = `${permission.screen_name}_${permission.action.toLowerCase()}`;
        const rolesUsing = roles.filter(role => {
          const rolePermissions = role.permissions as Record<string, boolean>;
          return rolePermissions && rolePermissions[permissionKey] === true;
        });

        return {
          permission_key: permissionKey,
          screen_name: permission.screen_name,
          action: permission.action,
          description: permission.description,
          roles_count: rolesUsing.length,
          users_affected: rolesUsing.reduce((sum, role) => sum + role._count.users, 0),
          roles: rolesUsing.map(role => ({
            s_no: role.s_no,
            role_name: role.role_name,
            users_count: role._count.users,
          })),
        };
      });

      return {
        success: true,
        data: usageMap,
      };
    } catch (error) {
      throw new BadRequestException('Failed to get permission usage');
    }
  }
}
