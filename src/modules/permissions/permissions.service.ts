import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePermissionDto, PermissionAction } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PermissionQueryDto } from './dto/permission-query.dto';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new permission
   */
  async create(createPermissionDto: CreatePermissionDto) {
    try {
      // Check if permission already exists
      const existingPermission = await this.prisma.permissions_master.findUnique({
        where: {
          screen_name_action: {
            screen_name: createPermissionDto.screen_name,
            action: createPermissionDto.action as any, // Cast to Prisma enum
          },
        },
      });

      if (existingPermission) {
        throw new ConflictException('Permission with this screen and action already exists');
      }

      const permission = await this.prisma.permissions_master.create({
        data: {
          screen_name: createPermissionDto.screen_name,
          action: createPermissionDto.action as any, // Cast to Prisma enum
          description: createPermissionDto.description,
        },
      });

      return {
        success: true,
        message: 'Permission created successfully',
        data: permission,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to create permission');
    }
  }

  /**
   * Get all permissions with filtering and pagination
   */
  async findAll(query: PermissionQueryDto) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        {
          screen_name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          action: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [permissions, total] = await Promise.all([
      this.prisma.permissions_master.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          screen_name: 'asc',
        },
      }),
      this.prisma.permissions_master.count({ where }),
    ]);

    return {
      success: true,
      data: permissions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all permissions (without pagination) - useful for dropdowns
   */
  async findAllSimple() {
    const permissions = await this.prisma.permissions_master.findMany({
      select: {
        s_no: true,
        screen_name: true,
        action: true,
        description: true,
      },
      orderBy: {
        screen_name: 'asc',
      },
    });

    return {
      success: true,
      data: permissions,
    };
  }

  /**
   * Get permission by ID
   */
  async findOne(id: number) {
    const permission = await this.prisma.permissions_master.findUnique({
      where: { s_no: id },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    return {
      success: true,
      data: permission,
    };
  }

  /**
   * Get permission by key
   */
  async findByKey(screenName: string, action: string) {
    const permission = await this.prisma.permissions_master.findUnique({
      where: {
        screen_name_action: {
          screen_name: screenName,
          action: action as any, // Cast to Prisma enum
        },
      },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    return {
      success: true,
      data: permission,
    };
  }

  /**
   * Update permission
   */
  async update(id: number, updatePermissionDto: UpdatePermissionDto) {
    try {
      // Check if permission exists
      const existingPermission = await this.prisma.permissions_master.findUnique({
        where: { s_no: id },
      });

      if (!existingPermission) {
        throw new NotFoundException('Permission not found');
      }

      // Check if permission key already exists (if updating permission_key)
      if (updatePermissionDto.screen_name && updatePermissionDto.action) {
        const duplicatePermission = await this.prisma.permissions_master.findUnique({
          where: {
            screen_name_action: {
              screen_name: updatePermissionDto.screen_name,
              action: updatePermissionDto.action as any, // Cast to Prisma enum
            },
          },
        });

        if (duplicatePermission && duplicatePermission.s_no !== id) {
          throw new ConflictException('Permission with this screen and action already exists');
        }
      }

      const updatedPermission = await this.prisma.permissions_master.update({
        where: { s_no: id },
        data: {
          ...(updatePermissionDto.screen_name && { screen_name: updatePermissionDto.screen_name }),
          ...(updatePermissionDto.action && { action: updatePermissionDto.action as any }), // Cast to Prisma enum
          ...(updatePermissionDto.description && { description: updatePermissionDto.description }),
        },
      });

      return {
        success: true,
        message: 'Permission updated successfully',
        data: updatedPermission,
      };
    } catch (error) {
      if (error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update permission');
    }
  }

  /**
   * Delete permission
   */
  async remove(id: number) {
    try {
      const permission = await this.prisma.permissions_master.findUnique({
        where: { s_no: id },
      });

      if (!permission) {
        throw new NotFoundException('Permission not found');
      }

      // Check if permission is being used in any roles
      const permissionKey = `${permission.screen_name}_${permission.action.toLowerCase()}`;
      const rolesUsingPermission = await this.prisma.roles.findMany({
        where: {
          permissions: {
            path: permissionKey,
            not: null,
          },
          is_deleted: false,
        },
      });

      if (rolesUsingPermission.length > 0) {
        throw new ConflictException(
          `Cannot delete permission. It is being used by ${rolesUsingPermission.length} role(s)`
        );
      }

      await this.prisma.permissions_master.delete({
        where: { s_no: id },
      });

      return {
        success: true,
        message: 'Permission deleted successfully',
      };
    } catch (error) {
      if (error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete permission');
    }
  }

  /**
   * Get permissions grouped by category (based on permission key prefix)
   */
  async findGrouped() {
    const permissions = await this.prisma.permissions_master.findMany({
      orderBy: {
        screen_name: 'asc',
      },
    });

    // Group permissions by screen name
    const grouped = permissions.reduce((acc, permission) => {
      const category = permission.screen_name || 'general';
      
      if (!acc[category]) {
        acc[category] = [];
      }
      
      acc[category].push(permission);
      return acc;
    }, {} as Record<string, any[]>);

    return {
      success: true,
      data: grouped,
    };
  }

  /**
   * Bulk create permissions
   */
  async bulkCreate(permissions: CreatePermissionDto[]) {
    try {
      // Check for duplicate permission keys
      const existingPermissions = await this.prisma.permissions_master.findMany({
        where: {
          OR: permissions.map(p => ({
            AND: [
              { screen_name: p.screen_name },
              { action: p.action as any }
            ]
          })),
        },
      });

      if (existingPermissions.length > 0) {
        const existingKeys = existingPermissions.map(p => `${p.screen_name}_${p.action}`);
        throw new ConflictException(`Permissions already exist: ${existingKeys.join(', ')}`);
      }

      const createdPermissions = await this.prisma.permissions_master.createMany({
        data: permissions.map(p => ({
          screen_name: p.screen_name,
          action: p.action as any, // Cast to Prisma enum
          description: p.description,
        })),
        skipDuplicates: true,
      });

      return {
        success: true,
        message: `${createdPermissions.count} permissions created successfully`,
        data: { count: createdPermissions.count },
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to create permissions');
    }
  }
}
