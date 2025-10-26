import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTenantPaymentDto, UpdateTenantPaymentDto } from './dto';

@Injectable()
export class TenantPaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTenantPaymentDto: CreateTenantPaymentDto) {
    try {
      // Verify tenant exists
      const tenant = await this.prisma.tenants.findUnique({
        where: { s_no: createTenantPaymentDto.tenant_id },
      });

      if (!tenant) {
        throw new NotFoundException(`Tenant with ID ${createTenantPaymentDto.tenant_id} not found`);
      }

      // Validate start_date is not before tenant's check-in date
      if (tenant.check_in_date && createTenantPaymentDto.start_date) {
        const checkInDate = new Date(tenant.check_in_date);
        const startDate = new Date(createTenantPaymentDto.start_date);
        
        // Set time to midnight for date-only comparison
        checkInDate.setHours(0, 0, 0, 0);
        startDate.setHours(0, 0, 0, 0);
        
        if (startDate < checkInDate) {
          throw new BadRequestException(
            `Payment start date (${createTenantPaymentDto.start_date}) cannot be before tenant's check-in date (${tenant.check_in_date.toISOString().split('T')[0]})`
          );
        }
      }

      // Verify room exists
      const room = await this.prisma.rooms.findUnique({
        where: { s_no: createTenantPaymentDto.room_id },
      });

      if (!room) {
        throw new NotFoundException(`Room with ID ${createTenantPaymentDto.room_id} not found`);
      }

      // Verify bed exists
      const bed = await this.prisma.beds.findUnique({
        where: { s_no: createTenantPaymentDto.bed_id },
      });

      if (!bed) {
        throw new NotFoundException(`Bed with ID ${createTenantPaymentDto.bed_id} not found`);
      }

      // Create the payment
      const payment = await this.prisma.tenant_payments.create({
        data: {
          tenant_id: createTenantPaymentDto.tenant_id,
          pg_id: createTenantPaymentDto.pg_id,
          room_id: createTenantPaymentDto.room_id,
          bed_id: createTenantPaymentDto.bed_id,
          amount_paid: createTenantPaymentDto.amount_paid,
          actual_rent_amount: createTenantPaymentDto.actual_rent_amount,
          payment_date: createTenantPaymentDto.payment_date ? new Date(createTenantPaymentDto.payment_date) : new Date(),
          payment_method: createTenantPaymentDto.payment_method,
          status: createTenantPaymentDto.status,
          start_date: new Date(createTenantPaymentDto.start_date),
          end_date: new Date(createTenantPaymentDto.end_date),
          current_bill: createTenantPaymentDto.current_bill,
          current_bill_id: createTenantPaymentDto.current_bill_id,
          remarks: createTenantPaymentDto.remarks,
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
        message: 'Tenant payment created successfully',
        data: payment,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Failed to create tenant payment');
    }
  }

  async findAll(
    pg_id?: number,
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
    try {
      const skip = (page - 1) * limit;
      
      const where: any = {
        is_deleted: false,
      };

      if (pg_id) {
        where.pg_id = pg_id;
      }

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

      // Filter by month and year
      if (month && year) {
        const monthIndex = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ].indexOf(month);

        if (monthIndex !== -1) {
          const startOfMonth = new Date(year, monthIndex, 1);
          const endOfMonth = new Date(year, monthIndex + 1, 0, 23, 59, 59);

          where.payment_date = {
            gte: startOfMonth,
            lte: endOfMonth,
          };
        }
      }

      // Filter by date range (overrides month/year if both provided)
      if (start_date || end_date) {
        where.payment_date = {};
        
        if (start_date) {
          where.payment_date.gte = new Date(start_date);
        }
        
        if (end_date) {
          const endDateTime = new Date(end_date);
          endDateTime.setHours(23, 59, 59, 999);
          where.payment_date.lte = endDateTime;
        }
      }

      const [payments, total] = await Promise.all([
        this.prisma.tenant_payments.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            payment_date: 'desc',
          },
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
        }),
        this.prisma.tenant_payments.count({ where }),
      ]);

      // Add tenant unavailability reason
      const enrichedData = payments.map(payment => {
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
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to fetch tenant payments');
    }
  }

  async findOne(id: number) {
    try {
      const payment = await this.prisma.tenant_payments.findFirst({
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
              whatsapp_number: true,
              email: true,
            },
          },
          rooms: {
            select: {
              s_no: true,
              room_no: true,
              rent_price: true,
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
              address: true,
            },
          },
          current_bills: true,
        },
      });

      if (!payment) {
        throw new NotFoundException(`Tenant payment with ID ${id} not found`);
      }

      return {
        success: true,
        data: payment,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Failed to fetch tenant payment');
    }
  }

  async update(id: number, updateTenantPaymentDto: UpdateTenantPaymentDto) {
    try {
      // Check if payment exists
      const existingPayment = await this.prisma.tenant_payments.findFirst({
        where: {
          s_no: id,
          is_deleted: false,
        },
      });

      if (!existingPayment) {
        throw new NotFoundException(`Tenant payment with ID ${id} not found`);
      }

      // If start_date is being updated, validate against tenant's check-in date
      if (updateTenantPaymentDto.start_date) {
        const tenant = await this.prisma.tenants.findUnique({
          where: { s_no: existingPayment.tenant_id },
        });

        if (tenant && tenant.check_in_date) {
          const checkInDate = new Date(tenant.check_in_date);
          const startDate = new Date(updateTenantPaymentDto.start_date);
          
          // Set time to midnight for date-only comparison
          checkInDate.setHours(0, 0, 0, 0);
          startDate.setHours(0, 0, 0, 0);
          
          if (startDate < checkInDate) {
            throw new BadRequestException(
              `Payment start date (${updateTenantPaymentDto.start_date}) cannot be before tenant's check-in date (${tenant.check_in_date.toISOString().split('T')[0]})`
            );
          }
        }
      }

      const updateData: any = {};

      if (updateTenantPaymentDto.amount_paid !== undefined) {
        updateData.amount_paid = updateTenantPaymentDto.amount_paid;
      }
      if (updateTenantPaymentDto.actual_rent_amount !== undefined) {
        updateData.actual_rent_amount = updateTenantPaymentDto.actual_rent_amount;
      }
      if (updateTenantPaymentDto.payment_date) {
        updateData.payment_date = new Date(updateTenantPaymentDto.payment_date);
      }
      if (updateTenantPaymentDto.payment_method) {
        updateData.payment_method = updateTenantPaymentDto.payment_method;
      }
      if (updateTenantPaymentDto.status) {
        updateData.status = updateTenantPaymentDto.status;
      }
      if (updateTenantPaymentDto.start_date) {
        updateData.start_date = new Date(updateTenantPaymentDto.start_date);
      }
      if (updateTenantPaymentDto.end_date) {
        updateData.end_date = new Date(updateTenantPaymentDto.end_date);
      }
      if (updateTenantPaymentDto.current_bill !== undefined) {
        updateData.current_bill = updateTenantPaymentDto.current_bill;
      }
      if (updateTenantPaymentDto.current_bill_id !== undefined) {
        updateData.current_bill_id = updateTenantPaymentDto.current_bill_id;
      }
      if (updateTenantPaymentDto.remarks !== undefined) {
        updateData.remarks = updateTenantPaymentDto.remarks;
      }

      updateData.updated_at = new Date();

      const payment = await this.prisma.tenant_payments.update({
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
        message: 'Tenant payment updated successfully',
        data: payment,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Failed to update tenant payment');
    }
  }

  async remove(id: number) {
    try {
      const existingPayment = await this.prisma.tenant_payments.findFirst({
        where: {
          s_no: id,
          is_deleted: false,
        },
      });

      if (!existingPayment) {
        throw new NotFoundException(`Tenant payment with ID ${id} not found`);
      }

      await this.prisma.tenant_payments.update({
        where: { s_no: id },
        data: {
          is_deleted: true,
          updated_at: new Date(),
        },
      });

      return {
        success: true,
        message: 'Tenant payment deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Failed to delete tenant payment');
    }
  }

  async getPaymentsByTenant(tenant_id: number) {
    try {
      const payments = await this.prisma.tenant_payments.findMany({
        where: {
          tenant_id,
          is_deleted: false,
        },
        orderBy: {
          payment_date: 'desc',
        },
        include: {
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
        },
      });

      return {
        success: true,
        data: payments,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to fetch tenant payments');
    }
  }

  async updateStatus(id: number, status: string, payment_date?: string) {
    try {
      // Check if payment exists
      const existingPayment = await this.prisma.tenant_payments.findFirst({
        where: {
          s_no: id,
          is_deleted: false,
        },
      });

      if (!existingPayment) {
        throw new NotFoundException(`Tenant payment with ID ${id} not found`);
      }

      // Validate status
      const validStatuses = ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'];
      if (!validStatuses.includes(status.toUpperCase())) {
        throw new BadRequestException(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      // Update payment status
      const updateData: any = {
        status: status.toUpperCase(),
        updated_at: new Date(),
      };

      // If marking as paid, update payment_date if provided
      if (status.toUpperCase() === 'PAID' && payment_date) {
        updateData.payment_date = new Date(payment_date);
      } else if (status.toUpperCase() === 'PAID' && !payment_date) {
        // Default to current date if marking as paid without a date
        updateData.payment_date = new Date();
      }

      const payment = await this.prisma.tenant_payments.update({
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
        message: `Payment status updated to ${status.toUpperCase()} successfully`,
        data: payment,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Failed to update payment status');
    }
  }
}
