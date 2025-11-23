import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleQueryDto } from './dto/role-query.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new role
   */
  async create(createRoleDto: CreateRoleDto) {
    try {
      // Check if role name already exists
      const existingRole = await this.prisma.roles.findFirst({
        where: {
          role_name: createRoleDto.role_name,
          is_deleted: false,
        },
      });

      if (existingRole) {
        throw new ConflictException('Role name already exists');
      }

      const role = await this.prisma.roles.create({
        data: {
          role_name: createRoleDto.role_name,
          permissions: createRoleDto.permissions || {},
          status: createRoleDto.status || 'ACTIVE',
        },
        include: {
          _count: {
            select: {
              users: true,
            },
          },
        },
      });

      return {
        success: true,
        message: 'Role created successfully',
        data: role,
      };
    } catch (error) {
      if (error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to create role');
    }
  }

  /**
   * Get all roles with filtering and pagination
   */
  async findAll(query: RoleQueryDto) {
    const { page = 1, limit = 10, status, search, include_deleted = false } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      is_deleted: include_deleted ? undefined : false,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.role_name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const [roles, total] = await Promise.all([
      this.prisma.roles.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              users: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      }),
      this.prisma.roles.count({ where }),
    ]);

    return {
      success: true,
      data: roles,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get role by ID
   */
  async findOne(id: number) {
    const role = await this.prisma.roles.findUnique({
      where: { s_no: id },
      include: {
        users: {
          select: {
            s_no: true,
            name: true,
            email: true,
            status: true,
          },
          where: {
            is_deleted: false,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return {
      success: true,
      data: role,
    };
  }

  /**
   * Update role
   */
  async update(id: number, updateRoleDto: UpdateRoleDto) {
    try {
      // Check if role exists
      const existingRole = await this.prisma.roles.findUnique({
        where: { s_no: id },
      });

      if (!existingRole) {
        throw new NotFoundException('Role not found');
      }

      // Check if role name already exists (if updating role_name)
      if (updateRoleDto.role_name && updateRoleDto.role_name !== existingRole.role_name) {
        const duplicateRole = await this.prisma.roles.findFirst({
          where: {
            role_name: updateRoleDto.role_name,
            is_deleted: false,
            s_no: {
              not: id,
            },
          },
        });

        if (duplicateRole) {
          throw new ConflictException('Role name already exists');
        }
      }

      const updatedRole = await this.prisma.roles.update({
        where: { s_no: id },
        data: {
          ...updateRoleDto,
          updated_at: new Date(),
        },
        include: {
          _count: {
            select: {
              users: true,
            },
          },
        },
      });

      return {
        success: true,
        message: 'Role updated successfully',
        data: updatedRole,
      };
    } catch (error) {
      if (error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update role');
    }
  }

  /**
   * Soft delete role
   */
  async remove(id: number) {
    try {
      const role = await this.prisma.roles.findUnique({
        where: { s_no: id },
        include: {
          _count: {
            select: {
              users: true,
            },
          },
        },
      });

      if (!role) {
        throw new NotFoundException('Role not found');
      }

      // Check if role has active users
      if (role._count.users > 0) {
        throw new ConflictException('Cannot delete role that has assigned users');
      }

      await this.prisma.roles.update({
        where: { s_no: id },
        data: {
          is_deleted: true,
          updated_at: new Date(),
        },
      });

      return {
        success: true,
        message: 'Role deleted successfully',
      };
    } catch (error) {
      if (error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete role');
    }
  }


  /**
   * Update role permissions
   */
  async updatePermissions(id: number, permissions: Record<string, any>) {
    try {
      const role = await this.prisma.roles.findUnique({
        where: { s_no: id },
      });

      if (!role) {
        throw new NotFoundException('Role not found');
      }

      const updatedRole = await this.prisma.roles.update({
        where: { s_no: id },
        data: {
          permissions,
          updated_at: new Date(),
        },
      });

      return {
        success: true,
        message: 'Role permissions updated successfully',
        data: updatedRole,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update role permissions');
    }
  }
}
