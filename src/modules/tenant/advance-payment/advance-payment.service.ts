import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateAdvancePaymentDto, UpdateAdvancePaymentDto } from './dto';

@Injectable()
export class AdvancePaymentService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new advance payment
   */
  async create(createAdvancePaymentDto: CreateAdvancePaymentDto) {
    // Verify tenant exists
    const tenant = await this.prisma.tenants.findFirst({
      where: {
        s_no: createAdvancePaymentDto.tenant_id,
        is_deleted: false,
      },
    });

    if (!tenant) {
      throw new NotFoundException(
        `Tenant with ID ${createAdvancePaymentDto.tenant_id} not found`,
      );
    }

    // Verify room exists
    const room = await this.prisma.rooms.findFirst({
      where: {
        s_no: createAdvancePaymentDto.room_id,
        is_deleted: false,
      },
    });

    if (!room) {
      throw new NotFoundException(
        `Room with ID ${createAdvancePaymentDto.room_id} not found`,
      );
    }

    // Verify bed exists
    const bed = await this.prisma.beds.findFirst({
      where: {
        s_no: createAdvancePaymentDto.bed_id,
        is_deleted: false,
      },
    });

    if (!bed) {
      throw new NotFoundException(
        `Bed with ID ${createAdvancePaymentDto.bed_id} not found`,
      );
    }

    // Create advance payment
    const advancePayment = await this.prisma.advance_payments.create({
      data: {
        tenant_id: createAdvancePaymentDto.tenant_id,
        pg_id: createAdvancePaymentDto.pg_id,
        room_id: createAdvancePaymentDto.room_id,
        bed_id: createAdvancePaymentDto.bed_id,
        amount_paid: createAdvancePaymentDto.amount_paid,
        actual_rent_amount: createAdvancePaymentDto.actual_rent_amount || createAdvancePaymentDto.amount_paid,
        payment_date: createAdvancePaymentDto.payment_date 
          ? new Date(createAdvancePaymentDto.payment_date)
          : new Date(),
        payment_method: createAdvancePaymentDto.payment_method as any,
        status: (createAdvancePaymentDto.status || 'PAID') as any,
        remarks: createAdvancePaymentDto.remarks,
      },
      include: {
        tenants: {
          select: {
            s_no: true,
            tenant_id: true,
            name: true,
            phone_no: true,
          },
        },
        rooms: {
          select: {
            s_no: true,
            room_no: true,
          },
        },
        beds: {
          select: {
            s_no: true,
            bed_no: true,
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
      message: 'Advance payment created successfully',
      data: advancePayment,
    };
  }

  /**
   * Get all advance payments with filters
   */
  async findAll(
    pg_id: number,
    tenant_id?: number,
    status?: string,
    month?: string,
    year?: number,
    start_date?: string,
    end_date?: string,
    room_id?: number,
    bed_id?: number,
    page: number = 1,
    limit: number = 10,
  ) {
    const where: any = {
      pg_id,
      is_deleted: false,
    };

    if (tenant_id) {
      where.tenant_id = tenant_id;
    }

    if (status) {
      where.status = status;
    }

    if (room_id) {
      where.room_id = room_id;
    }

    if (bed_id) {
      where.bed_id = bed_id;
    }

    // Date filtering
    if (start_date && end_date) {
      // Date range filter takes precedence
      const startDateTime = new Date(start_date);
      startDateTime.setHours(0, 0, 0, 0);
      
      const endDateTime = new Date(end_date);
      endDateTime.setHours(23, 59, 59, 999);

      where.payment_date = {
        gte: startDateTime,
        lte: endDateTime,
      };
    } else if (month && year) {
      // Month and year filter
      const monthIndex = new Date(Date.parse(month + ' 1, 2000')).getMonth();
      const startOfMonth = new Date(year, monthIndex, 1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const endOfMonth = new Date(year, monthIndex + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);

      where.payment_date = {
        gte: startOfMonth,
        lte: endOfMonth,
      };
    }

    const skip = (page - 1) * limit;

    const [advancePayments, total] = await Promise.all([
      this.prisma.advance_payments.findMany({
        where,
        include: {
          tenants: {
            select: {
              s_no: true,
              tenant_id: true,
              name: true,
              phone_no: true,
              is_deleted: true,
              status: true,
              check_out_date: true,
            },
          },
          rooms: {
            select: {
              s_no: true,
              room_no: true,
            },
          },
          beds: {
            select: {
              s_no: true,
              bed_no: true,
            },
          },
          pg_locations: {
            select: {
              s_no: true,
              location_name: true,
            },
          },
        },
        orderBy: {
          payment_date: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.advance_payments.count({ where }),
    ]);

    // Add tenant unavailability reason
    const enrichedData = advancePayments.map(payment => {
      let tenant_unavailable_reason = null;
      
      if (!payment.tenants) {
        tenant_unavailable_reason = 'NOT_FOUND';
      } else if (payment.tenants.is_deleted) {
        tenant_unavailable_reason = 'DELETED';
      } else if (payment.tenants.check_out_date) {
        tenant_unavailable_reason = 'CHECKED_OUT';
      } else if (payment.tenants.status === 'INACTIVE') {
        tenant_unavailable_reason = 'INACTIVE';
      }

      return {
        ...payment,
        tenant_unavailable_reason,
      };
    });

    return {
      success: true,
      data: enrichedData,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get advance payments by tenant
   */
  async getPaymentsByTenant(tenant_id: number) {
    const tenant = await this.prisma.tenants.findFirst({
      where: {
        s_no: tenant_id,
        is_deleted: false,
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${tenant_id} not found`);
    }

    const advancePayments = await this.prisma.advance_payments.findMany({
      where: {
        tenant_id,
        is_deleted: false,
      },
      include: {
        tenants: {
          select: {
            s_no: true,
            tenant_id: true,
            name: true,
            phone_no: true,
          },
        },
        rooms: {
          select: {
            s_no: true,
            room_no: true,
          },
        },
        beds: {
          select: {
            s_no: true,
            bed_no: true,
          },
        },
        pg_locations: {
          select: {
            s_no: true,
            location_name: true,
          },
        },
      },
      orderBy: {
        payment_date: 'desc',
      },
    });

    return {
      success: true,
      data: advancePayments,
    };
  }

  /**
   * Get single advance payment
   */
  async findOne(id: number) {
    const advancePayment = await this.prisma.advance_payments.findFirst({
      where: {
        s_no: id,
        is_deleted: false,
      },
      include: {
        tenants: {
          select: {
            s_no: true,
            tenant_id: true,
            name: true,
            phone_no: true,
          },
        },
        rooms: {
          select: {
            s_no: true,
            room_no: true,
          },
        },
        beds: {
          select: {
            s_no: true,
            bed_no: true,
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

    if (!advancePayment) {
      throw new NotFoundException(`Advance payment with ID ${id} not found`);
    }

    return {
      success: true,
      data: advancePayment,
    };
  }

  /**
   * Update advance payment
   */
  async update(id: number, updateAdvancePaymentDto: UpdateAdvancePaymentDto) {
    const advancePayment = await this.prisma.advance_payments.findFirst({
      where: {
        s_no: id,
        is_deleted: false,
      },
    });

    if (!advancePayment) {
      throw new NotFoundException(`Advance payment with ID ${id} not found`);
    }

    const updateData: any = {};

    if (updateAdvancePaymentDto.amount_paid !== undefined) {
      updateData.amount_paid = updateAdvancePaymentDto.amount_paid;
    }

    if (updateAdvancePaymentDto.actual_rent_amount !== undefined) {
      updateData.actual_rent_amount = updateAdvancePaymentDto.actual_rent_amount;
    }

    if (updateAdvancePaymentDto.payment_date) {
      updateData.payment_date = new Date(updateAdvancePaymentDto.payment_date);
    }

    if (updateAdvancePaymentDto.payment_method) {
      updateData.payment_method = updateAdvancePaymentDto.payment_method;
    }

    if (updateAdvancePaymentDto.status) {
      updateData.status = updateAdvancePaymentDto.status;
    }

    if (updateAdvancePaymentDto.remarks !== undefined) {
      updateData.remarks = updateAdvancePaymentDto.remarks;
    }

    updateData.updated_at = new Date();

    const updatedAdvancePayment = await this.prisma.advance_payments.update({
      where: { s_no: id },
      data: updateData,
      include: {
        tenants: {
          select: {
            s_no: true,
            tenant_id: true,
            name: true,
            phone_no: true,
          },
        },
        rooms: {
          select: {
            s_no: true,
            room_no: true,
          },
        },
        beds: {
          select: {
            s_no: true,
            bed_no: true,
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
      message: 'Advance payment updated successfully',
      data: updatedAdvancePayment,
    };
  }

  /**
   * Update payment status
   */
  async updateStatus(id: number, status: string, payment_date?: string) {
    const advancePayment = await this.prisma.advance_payments.findFirst({
      where: {
        s_no: id,
        is_deleted: false,
      },
    });

    if (!advancePayment) {
      throw new NotFoundException(`Advance payment with ID ${id} not found`);
    }

    const validStatuses = ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      );
    }

    const updateData: any = {
      status,
      updated_at: new Date(),
    };

    // If marking as PAID and payment_date is provided, update it
    if (status === 'PAID' && payment_date) {
      updateData.payment_date = new Date(payment_date);
    } else if (status === 'PAID' && !advancePayment.payment_date) {
      // If marking as PAID but no payment_date exists, set to current date
      updateData.payment_date = new Date();
    }

    const updatedAdvancePayment = await this.prisma.advance_payments.update({
      where: { s_no: id },
      data: updateData,
      include: {
        tenants: {
          select: {
            s_no: true,
            tenant_id: true,
            name: true,
            phone_no: true,
          },
        },
        rooms: {
          select: {
            s_no: true,
            room_no: true,
          },
        },
        beds: {
          select: {
            s_no: true,
            bed_no: true,
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
      message: 'Advance payment status updated successfully',
      data: updatedAdvancePayment,
    };
  }

  /**
   * Delete advance payment (soft delete)
   */
  async remove(id: number) {
    const advancePayment = await this.prisma.advance_payments.findFirst({
      where: {
        s_no: id,
        is_deleted: false,
      },
    });

    if (!advancePayment) {
      throw new NotFoundException(`Advance payment with ID ${id} not found`);
    }

    await this.prisma.advance_payments.update({
      where: { s_no: id },
      data: {
        is_deleted: true,
        updated_at: new Date(),
      },
    });

    return {
      success: true,
      message: 'Advance payment deleted successfully',
    };
  }
}
