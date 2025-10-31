import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeeService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new employee
   */
  async create(organizationId: number, createDto: CreateEmployeeDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Create employee (password stored as plain text for now)
    const employee = await this.prisma.user.create({
      data: {
        name: createDto.name,
        email: createDto.email,
        password: createDto.password,
        phone: createDto.phone,
        role_id: createDto.role_id,
        pg_id: createDto.pg_id,
        organization_id: organizationId,
        gender: createDto.gender,
        address: createDto.address,
        city_id: createDto.city_id,
        state_id: createDto.state_id,
        pincode: createDto.pincode,
        country: createDto.country,
        proof_documents: createDto.proof_documents ? JSON.stringify(createDto.proof_documents) : null,
        profile_images: createDto.profile_images ? JSON.stringify(createDto.profile_images) : null,
        status: 'ACTIVE',
        is_deleted: false,
      },
      include: {
        roles: {
          select: {
            s_no: true,
            role_name: true,
          },
        },
        city: {
          select: {
            s_no: true,
            name: true,
          },
        },
        state: {
          select: {
            s_no: true,
            name: true,
          },
        },
      },
    });

    // Remove password from response
    const { password, ...employeeWithoutPassword } = employee;

    return {
      success: true,
      message: 'Employee created successfully',
      data: employeeWithoutPassword,
    };
  }

  /**
   * Get all employees with pagination and filters
   */
  async findAll(
    organizationId: number,
    page: number = 1,
    limit: number = 10,
    pgId?: number,
    roleId?: number,
    search?: string,
  ) {
    const skip = (page - 1) * limit;

    const whereClause: any = {
      organization_id: organizationId,
      is_deleted: false,
    };

    if (pgId) {
      whereClause.pg_id = pgId;
    }

    if (roleId) {
      whereClause.role_id = roleId;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const [employees, total] = await Promise.all([
      this.prisma.user.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        select: {
          s_no: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          role_id: true,
          pg_id: true,
          organization_id: true,
          gender: true,
          address: true,
          city_id: true,
          state_id: true,
          pincode: true,
          country: true,
          proof_documents: true,
          profile_images: true,
          created_at: true,
          updated_at: true,
          roles: {
            select: {
              s_no: true,
              role_name: true,
            },
          },
          city: {
            select: {
              s_no: true,
              name: true,
            },
          },
          state: {
            select: {
              s_no: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where: whereClause }),
    ]);

    return {
      success: true,
      data: employees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single employee by ID
   */
  async findOne(id: number, organizationId: number) {
    const employee = await this.prisma.user.findFirst({
      where: {
        s_no: id,
        organization_id: organizationId,
        is_deleted: false,
      },
      select: {
        s_no: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        role_id: true,
        pg_id: true,
        organization_id: true,
        gender: true,
        address: true,
        city_id: true,
        state_id: true,
        pincode: true,
        country: true,
        proof_documents: true,
        profile_images: true,
        created_at: true,
        updated_at: true,
        roles: {
          select: {
            s_no: true,
            role_name: true,
          },
        },
        city: {
          select: {
            s_no: true,
            name: true,
          },
        },
        state: {
          select: {
            s_no: true,
            name: true,
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return {
      success: true,
      data: employee,
    };
  }

  /**
   * Update an employee
   */
  async update(id: number, organizationId: number, updateDto: UpdateEmployeeDto) {
    // Check if employee exists
    const existing = await this.prisma.user.findFirst({
      where: {
        s_no: id,
        organization_id: organizationId,
        is_deleted: false,
      },
    });

    if (!existing) {
      throw new NotFoundException('Employee not found');
    }

    const employee = await this.prisma.user.update({
      where: { s_no: id },
      data: {
        name: updateDto.name,
        phone: updateDto.phone,
        role_id: updateDto.role_id,
        pg_id: updateDto.pg_id,
        gender: updateDto.gender,
        address: updateDto.address,
        city_id: updateDto.city_id,
        state_id: updateDto.state_id,
        pincode: updateDto.pincode,
        country: updateDto.country,
        proof_documents: updateDto.proof_documents ? JSON.stringify(updateDto.proof_documents) : undefined,
        profile_images: updateDto.profile_images ? JSON.stringify(updateDto.profile_images) : undefined,
      },
      select: {
        s_no: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        role_id: true,
        pg_id: true,
        organization_id: true,
        gender: true,
        address: true,
        city_id: true,
        state_id: true,
        pincode: true,
        country: true,
        proof_documents: true,
        profile_images: true,
        created_at: true,
        updated_at: true,
        roles: {
          select: {
            s_no: true,
            role_name: true,
          },
        },
        city: {
          select: {
            s_no: true,
            name: true,
          },
        },
        state: {
          select: {
            s_no: true,
            name: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Employee updated successfully',
      data: employee,
    };
  }

  /**
   * Soft delete an employee
   */
  async remove(id: number, organizationId: number) {
    // Check if employee exists
    const existing = await this.prisma.user.findFirst({
      where: {
        s_no: id,
        organization_id: organizationId,
        is_deleted: false,
      },
    });

    if (!existing) {
      throw new NotFoundException('Employee not found');
    }

    await this.prisma.user.update({
      where: { s_no: id },
      data: {
        is_deleted: true,
        status: 'INACTIVE',
      },
    });

    return {
      success: true,
      message: 'Employee deleted successfully',
    };
  }

  /**
   * Get employee statistics
   */
  async getStats(organizationId: number, pgId?: number) {
    const whereClause: any = {
      organization_id: organizationId,
      is_deleted: false,
    };

    if (pgId) {
      whereClause.pg_id = pgId;
    }

    const [totalEmployees, activeEmployees, employeesByRole] = await Promise.all([
      this.prisma.user.count({ where: whereClause }),
      this.prisma.user.count({ where: { ...whereClause, status: 'ACTIVE' } }),
      this.prisma.user.groupBy({
        by: ['role_id'],
        where: whereClause,
        _count: true,
      }),
    ]);

    return {
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        inactiveEmployees: totalEmployees - activeEmployees,
        employeesByRole,
      },
    };
  }
}
