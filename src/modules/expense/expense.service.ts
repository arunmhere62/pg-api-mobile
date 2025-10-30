import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpenseService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new expense
   */
  async create(pgId: number, createExpenseDto: CreateExpenseDto) {
    const expense = await this.prisma.expenses.create({
      data: {
        pg_id: pgId,
        expense_type: createExpenseDto.expense_type,
        amount: createExpenseDto.amount,
        paid_to: createExpenseDto.paid_to,
        paid_date: new Date(createExpenseDto.paid_date),
        payment_method: createExpenseDto.payment_method,
        remarks: createExpenseDto.remarks,
        is_deleted: false,
      },
    });

    return {
      success: true,
      message: 'Expense created successfully',
      data: expense,
    };
  }

  /**
   * Get all expenses for a PG location with pagination
   */
  async findAll(pgId: number, page: number = 1, limit: number = 10) {
    if (!pgId) {
      throw new BadRequestException('PG Location ID is required');
    }

    const skip = (page - 1) * limit;

    const [expenses, total] = await Promise.all([
      this.prisma.expenses.findMany({
        where: {
          pg_id: pgId,
          is_deleted: false,
          pg_locations: {
            is_deleted: false,
          },
        },
        orderBy: {
          paid_date: 'desc',
        },
        skip,
        take: limit,
        include: {
          pg_locations: {
            select: {
              location_name: true,
              organization_id: true,
            },
          },
        },
      }),
      this.prisma.expenses.count({
        where: {
          pg_id: pgId,
          is_deleted: false,
          pg_locations: {
            is_deleted: false,
          },
        },
      }),
    ]);

    return {
      success: true,
      data: expenses,
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
   * Get a single expense by ID
   */
  async findOne(id: number) {
    const expense = await this.prisma.expenses.findFirst({
      where: {
        s_no: id,
        is_deleted: false,
      },
      include: {
        pg_locations: {
          select: {
            location_name: true,
          },
        },
      },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    return {
      success: true,
      data: expense,
    };
  }

  /**
   * Update an expense
   */
  async update(id: number, updateExpenseDto: UpdateExpenseDto) {
    // Check if expense exists
    const existingExpense = await this.prisma.expenses.findFirst({
      where: {
        s_no: id,
        is_deleted: false,
      },
    });

    if (!existingExpense) {
      throw new NotFoundException('Expense not found');
    }

    const expense = await this.prisma.expenses.update({
      where: { s_no: id },
      data: {
        expense_type: updateExpenseDto.expense_type,
        amount: updateExpenseDto.amount,
        paid_to: updateExpenseDto.paid_to,
        paid_date: updateExpenseDto.paid_date
          ? new Date(updateExpenseDto.paid_date)
          : undefined,
        payment_method: updateExpenseDto.payment_method,
        remarks: updateExpenseDto.remarks,
      },
    });

    return {
      success: true,
      message: 'Expense updated successfully',
      data: expense,
    };
  }

  /**
   * Soft delete an expense
   */
  async remove(id: number) {
    // Check if expense exists
    const existingExpense = await this.prisma.expenses.findFirst({
      where: {
        s_no: id,
        is_deleted: false,
      },
    });

    if (!existingExpense) {
      throw new NotFoundException('Expense not found');
    }

    await this.prisma.expenses.update({
      where: { s_no: id },
      data: {
        is_deleted: true,
      },
    });

    return {
      success: true,
      message: 'Expense deleted successfully',
    };
  }

  /**
   * Get expense statistics for a PG location
   */
  async getStats(pgId: number, startDate?: string, endDate?: string) {
    const whereClause: any = {
      pg_id: pgId,
      is_deleted: false,
    };

    if (startDate && endDate) {
      whereClause.paid_date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [totalExpenses, expensesByType] = await Promise.all([
      this.prisma.expenses.aggregate({
        where: whereClause,
        _sum: {
          amount: true,
        },
        _count: true,
      }),
      this.prisma.expenses.groupBy({
        by: ['expense_type'],
        where: whereClause,
        _sum: {
          amount: true,
        },
        _count: true,
      }),
    ]);

    return {
      success: true,
      data: {
        totalAmount: totalExpenses._sum.amount || 0,
        totalCount: totalExpenses._count,
        byType: expensesByType,
      },
    };
  }
}
