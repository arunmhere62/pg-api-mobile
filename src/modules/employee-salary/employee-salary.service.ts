import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEmployeeSalaryDto } from './dto/create-employee-salary.dto';
import { UpdateEmployeeSalaryDto } from './dto/update-employee-salary.dto';

@Injectable()
export class EmployeeSalaryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new employee salary record
   */
  async create(pgId: number, createDto: CreateEmployeeSalaryDto) {
    // Check if salary already exists for this user and month
    const existing = await this.prisma.employee_salary.findFirst({
      where: {
        user_id: createDto.user_id,
        month: new Date(createDto.month),
        is_deleted: false,
      },
    });

    if (existing) {
      throw new BadRequestException('Salary record already exists for this employee and month');
    }

    const salary = await this.prisma.employee_salary.create({
      data: {
        user_id: createDto.user_id,
        pg_id: pgId,
        salary_amount: createDto.salary_amount,
        month: new Date(createDto.month),
        paid_date: createDto.paid_date ? new Date(createDto.paid_date) : null,
        payment_method: createDto.payment_method || null,
        remarks: createDto.remarks,
        is_deleted: false,
      },
      include: {
        users: {
          select: {
            s_no: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        pg_locations: {
          select: {
            s_no: true,
            location_name: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Employee salary record created successfully',
      data: salary,
    };
  }

  /**
   * Get all salary records for a PG location with pagination
   */
  async findAll(pgId: number, page: number = 1, limit: number = 10) {
    if (!pgId) {
      throw new BadRequestException('PG Location ID is required');
    }

    const skip = (page - 1) * limit;

    const [salaries, total] = await Promise.all([
      this.prisma.employee_salary.findMany({
        where: {
          pg_id: pgId,
          is_deleted: false,
          pg_locations: {
            is_deleted: false,
          },
          users: {
            is_deleted: false,
          },
        },
        orderBy: [
          { month: 'desc' },
          { paid_date: 'desc' },
        ],
        skip,
        take: limit,
        include: {
          users: {
            select: {
              s_no: true,
              name: true,
              email: true,
              phone: true,
              role_id: true,
            },
          },
          pg_locations: {
            select: {
              s_no: true,
              location_name: true,
              organization_id: true,
            },
          },
        },
      }),
      this.prisma.employee_salary.count({
        where: {
          pg_id: pgId,
          is_deleted: false,
          pg_locations: {
            is_deleted: false,
          },
          users: {
            is_deleted: false,
          },
        },
      }),
    ]);

    return {
      success: true,
      data: salaries,
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
   * Get salary records for a specific employee
   */
  async findByEmployee(userId: number, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [salaries, total] = await Promise.all([
      this.prisma.employee_salary.findMany({
        where: {
          user_id: userId,
          is_deleted: false,
        },
        orderBy: {
          month: 'desc',
        },
        skip,
        take: limit,
        include: {
          users: {
            select: {
              s_no: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          pg_locations: {
            select: {
              s_no: true,
              location_name: true,
            },
          },
        },
      }),
      this.prisma.employee_salary.count({
        where: {
          user_id: userId,
          is_deleted: false,
        },
      }),
    ]);

    return {
      success: true,
      data: salaries,
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
   * Get a single salary record by ID
   */
  async findOne(id: number) {
    const salary = await this.prisma.employee_salary.findFirst({
      where: {
        s_no: id,
        is_deleted: false,
      },
      include: {
        users: {
          select: {
            s_no: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        pg_locations: {
          select: {
            s_no: true,
            location_name: true,
          },
        },
      },
    });

    if (!salary) {
      throw new NotFoundException('Salary record not found');
    }

    return {
      success: true,
      data: salary,
    };
  }

  /**
   * Update a salary record
   */
  async update(id: number, updateDto: UpdateEmployeeSalaryDto) {
    // Check if salary exists
    const existing = await this.prisma.employee_salary.findFirst({
      where: {
        s_no: id,
        is_deleted: false,
      },
    });

    if (!existing) {
      throw new NotFoundException('Salary record not found');
    }

    const salary = await this.prisma.employee_salary.update({
      where: { s_no: id },
      data: {
        salary_amount: updateDto.salary_amount,
        paid_date: updateDto.paid_date ? new Date(updateDto.paid_date) : undefined,
        payment_method: updateDto.payment_method,
        remarks: updateDto.remarks,
      },
      include: {
        users: {
          select: {
            s_no: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        pg_locations: {
          select: {
            s_no: true,
            location_name: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Salary record updated successfully',
      data: salary,
    };
  }

  /**
   * Soft delete a salary record
   */
  async remove(id: number) {
    // Check if salary exists
    const existing = await this.prisma.employee_salary.findFirst({
      where: {
        s_no: id,
        is_deleted: false,
      },
    });

    if (!existing) {
      throw new NotFoundException('Salary record not found');
    }

    await this.prisma.employee_salary.update({
      where: { s_no: id },
      data: {
        is_deleted: true,
      },
    });

    return {
      success: true,
      message: 'Salary record deleted successfully',
    };
  }

  /**
   * Get salary statistics for a PG location
   */
  async getStats(pgId: number, startMonth?: string, endMonth?: string) {
    const whereClause: any = {
      pg_id: pgId,
      is_deleted: false,
    };

    if (startMonth && endMonth) {
      whereClause.month = {
        gte: new Date(startMonth),
        lte: new Date(endMonth),
      };
    }

    const [totalSalaries, salariesByEmployee] = await Promise.all([
      this.prisma.employee_salary.aggregate({
        where: whereClause,
        _sum: {
          salary_amount: true,
        },
        _count: true,
      }),
      this.prisma.employee_salary.groupBy({
        by: ['user_id'],
        where: whereClause,
        _sum: {
          salary_amount: true,
        },
        _count: true,
      }),
    ]);

    return {
      success: true,
      data: {
        totalAmount: totalSalaries._sum.salary_amount || 0,
        totalCount: totalSalaries._count,
        byEmployee: salariesByEmployee,
      },
    };
  }
}
