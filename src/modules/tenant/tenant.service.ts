import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { PendingPaymentService } from './pending-payment.service';

@Injectable()
export class TenantService {
  constructor(
    private prisma: PrismaService,
    private pendingPaymentService: PendingPaymentService,
  ) {}

  /**
   * Create a new tenant
   */
  async create(createTenantDto: CreateTenantDto) {
    try {
      // Generate unique tenant_id
      const tenantId = await this.generateTenantId();

      // Verify PG location exists
      const pgLocation = await this.prisma.pg_locations.findUnique({
        where: { s_no: createTenantDto.pg_id },
      });

      if (!pgLocation) {
        throw new NotFoundException(`PG Location with ID ${createTenantDto.pg_id} not found`);
      }

      // Verify room exists if provided
      if (createTenantDto.room_id) {
        const room = await this.prisma.rooms.findUnique({
          where: { s_no: createTenantDto.room_id },
        });

        if (!room) {
          throw new NotFoundException(`Room with ID ${createTenantDto.room_id} not found`);
        }
      }

      // Verify bed exists if provided
      if (createTenantDto.bed_id) {
        const bed = await this.prisma.beds.findUnique({
          where: { s_no: createTenantDto.bed_id },
        });

        if (!bed) {
          throw new NotFoundException(`Bed with ID ${createTenantDto.bed_id} not found`);
        }

        // Check if bed is already occupied by another active tenant
        const occupiedBed = await this.prisma.tenants.findFirst({
          where: {
            bed_id: createTenantDto.bed_id,
            status: 'ACTIVE',
            is_deleted: false,
          },
        });

        if (occupiedBed) {
          throw new BadRequestException(`Bed with ID ${createTenantDto.bed_id} is already occupied`);
        }
      }

      // Create tenant
      const tenant = await this.prisma.tenants.create({
        data: {
          tenant_id: tenantId,
          name: createTenantDto.name,
          phone_no: createTenantDto.phone_no,
          whatsapp_number: createTenantDto.whatsapp_number,
          email: createTenantDto.email,
          pg_id: createTenantDto.pg_id,
          room_id: createTenantDto.room_id,
          bed_id: createTenantDto.bed_id,
          check_in_date: new Date(createTenantDto.check_in_date),
          check_out_date: createTenantDto.check_out_date ? new Date(createTenantDto.check_out_date) : null,
          status: (createTenantDto.status as any) || 'ACTIVE',
          occupation: createTenantDto.occupation,
          tenant_address: createTenantDto.tenant_address,
          city_id: createTenantDto.city_id,
          state_id: createTenantDto.state_id,
          images: createTenantDto.images,
          proof_documents: createTenantDto.proof_documents,
        },
        include: {
          pg_locations: {
            select: {
              s_no: true,
              location_name: true,
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

      // Bed is now occupied (tracked by tenant record)

      return {
        success: true,
        message: 'Tenant created successfully',
        data: tenant,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all tenants with filters
   */
  async findAll(params: {
    page?: number;
    limit?: number;
    pg_id?: number;
    room_id?: number;
    status?: string;
    search?: string;
    pending_rent?: boolean;
    pending_advance?: boolean;
  }) {
    const { page = 1, limit = 10, pg_id, room_id, status, search, pending_rent, pending_advance } = params;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      is_deleted: false,
    };

    if (pg_id) {
      where.pg_id = pg_id;
    }

    if (room_id) {
      where.room_id = room_id;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { tenant_id: { contains: search, mode: 'insensitive' } },
        { phone_no: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await this.prisma.tenants.count({ where });

    // Get tenants with all related data
    const tenants = await this.prisma.tenants.findMany({
      where,
      skip,
      take: limit,
      include: {
        pg_locations: {
          select: {
            s_no: true,
            location_name: true,
            address: true,
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
        tenant_payments: {
          where: {
            is_deleted: false,
          },
          orderBy: {
            payment_date: 'desc',
          },
          select: {
            s_no: true,
            payment_date: true,
            amount_paid: true,
            actual_rent_amount: true,
            start_date: true,
            end_date: true,
            payment_method: true,
            status: true,
            remarks: true,
          },
        },
        advance_payments: {
          where: {
            is_deleted: false,
          },
          orderBy: {
            payment_date: 'desc',
          },
          select: {
            s_no: true,
            payment_date: true,
            amount_paid: true,
            actual_rent_amount: true,
            payment_method: true,
            status: true,
            remarks: true,
          },
        },
        refund_payments: {
          where: {
            is_deleted: false,
          },
          orderBy: {
            payment_date: 'desc',
          },
          select: {
            s_no: true,
            amount_paid: true,
            payment_method: true,
            payment_date: true,
            status: true,
            remarks: true,
            actual_rent_amount: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Calculate pending payments and check for unpaid months for each tenant
    const tenantsWithPendingPayments = await Promise.all(
      tenants.map(async (tenant) => {
        try {
          const pendingPayment = await this.pendingPaymentService.calculateTenantPendingPayment(
            tenant.s_no,
          );
          
          // Check if check-in date is covered by any payment period
          let hasUnpaidMonths = false;
          if (tenant.check_in_date && tenant.tenant_payments) {
            const checkInDate = new Date(tenant.check_in_date);
            checkInDate.setHours(0, 0, 0, 0);
            
            const checkInCovered = tenant.tenant_payments.some((payment) => {
              const startDate = new Date(payment.start_date);
              const endDate = new Date(payment.end_date);
              startDate.setHours(0, 0, 0, 0);
              endDate.setHours(0, 0, 0, 0);
              return checkInDate >= startDate && checkInDate <= endDate;
            });
            
            hasUnpaidMonths = !checkInCovered;
          } else if (tenant.check_in_date && (!tenant.tenant_payments || tenant.tenant_payments.length === 0)) {
            // No payments at all
            hasUnpaidMonths = true;
          }
          
          return {
            ...tenant,
            pending_payment: pendingPayment,
            has_unpaid_months: hasUnpaidMonths,
          };
        } catch (error) {
          // If pending payment calculation fails, return tenant without it
          return {
            ...tenant,
            pending_payment: null,
          };
        }
      }),
    );

    // Filter by pending rent if requested
    let filteredTenants = tenantsWithPendingPayments;
    
    if (pending_rent) {
      filteredTenants = filteredTenants.filter(
        (tenant) => tenant.pending_payment && tenant.pending_payment.total_pending > 0
      );
    }

    // Filter by pending advance if requested (tenants without advance payments)
    if (pending_advance) {
      filteredTenants = filteredTenants.filter(
        (tenant) => !tenant.advance_payments || tenant.advance_payments.length === 0
      );
    }

    // Recalculate pagination based on filtered results
    const filteredTotal = filteredTenants.length;
    const paginatedFilteredTenants = pending_rent || pending_advance 
      ? filteredTenants 
      : filteredTenants;

    return {
      success: true,
      data: paginatedFilteredTenants,
      pagination: {
        page,
        limit,
        total: pending_rent || pending_advance ? filteredTotal : total,
        totalPages: Math.ceil((pending_rent || pending_advance ? filteredTotal : total) / limit),
        hasMore: skip + limit < (pending_rent || pending_advance ? filteredTotal : total),
      },
    };
  }

  /**
   * Get tenant by ID with complete details
   */
  async findOne(id: number) {
    const tenant = await this.prisma.tenants.findFirst({
      where: {
        s_no: id,
        is_deleted: false,
      },
      include: {
        pg_locations: {
          select: {
            s_no: true,
            location_name: true,
            address: true,
            city: true,
            state: true,
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
        tenant_payments: {
          where: {
            is_deleted: false,
          },
          orderBy: {
            payment_date: 'desc',
          },
          select: {
            s_no: true,
            payment_date: true,
            amount_paid: true,
            actual_rent_amount: true,
            start_date: true,
            end_date: true,
            payment_method: true,
            remarks: true,
            status: true,
          },
        },
        advance_payments: {
          where: {
            is_deleted: false,
          },
          orderBy: {
            payment_date: 'desc',
          },
          select: {
            s_no: true,
            payment_date: true,
            amount_paid: true,
            actual_rent_amount: true,
            payment_method: true,
            status: true,
            remarks: true,
          },
        },
        refund_payments: {
          where: {
            is_deleted: false,
          },
          orderBy: {
            payment_date: 'desc',
          },
          select: {
            s_no: true,
            amount_paid: true,
            payment_method: true,
            payment_date: true,
            status: true,
            remarks: true,
            actual_rent_amount: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    // Calculate pending payment
    let pendingPayment = null;
    try {
      pendingPayment = await this.pendingPaymentService.calculateTenantPendingPayment(id);
    } catch (error) {
      // If pending payment calculation fails, continue without it
      console.error('Failed to calculate pending payment:', error);
    }

    return {
      success: true,
      data: {
        ...tenant,
        pending_payment: pendingPayment,
      },
    };
  }

  /**
   * Update tenant
   */
  async update(id: number, updateTenantDto: UpdateTenantDto) {
    // Check if tenant exists
    const existingTenant = await this.prisma.tenants.findFirst({
      where: {
        s_no: id,
        is_deleted: false,
      },
    });

    if (!existingTenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    // If changing bed, verify new bed
    if (updateTenantDto.bed_id && updateTenantDto.bed_id !== existingTenant.bed_id) {

      // Check if new bed is available
      const newBed = await this.prisma.beds.findUnique({
        where: { s_no: updateTenantDto.bed_id },
      });

      if (!newBed) {
        throw new NotFoundException(`Bed with ID ${updateTenantDto.bed_id} not found`);
      }

      // Check if new bed is already occupied
      const occupiedBed = await this.prisma.tenants.findFirst({
        where: {
          bed_id: updateTenantDto.bed_id,
          status: 'ACTIVE',
          is_deleted: false,
          s_no: { not: id },
        },
      });

      if (occupiedBed) {
        throw new BadRequestException(`Bed with ID ${updateTenantDto.bed_id} is already occupied`);
      }
    }

    // Update tenant
    const tenant = await this.prisma.tenants.update({
      where: { s_no: id },
      data: {
        name: updateTenantDto.name,
        phone_no: updateTenantDto.phone_no,
        whatsapp_number: updateTenantDto.whatsapp_number,
        email: updateTenantDto.email,
        pg_id: updateTenantDto.pg_id,
        room_id: updateTenantDto.room_id,
        bed_id: updateTenantDto.bed_id,
        check_in_date: updateTenantDto.check_in_date ? new Date(updateTenantDto.check_in_date) : undefined,
        check_out_date: updateTenantDto.check_out_date ? new Date(updateTenantDto.check_out_date) : undefined,
        status: updateTenantDto.status as any,
        occupation: updateTenantDto.occupation,
        tenant_address: updateTenantDto.tenant_address,
        city_id: updateTenantDto.city_id,
        state_id: updateTenantDto.state_id,
        images: updateTenantDto.images,
        proof_documents: updateTenantDto.proof_documents,
        updated_at: new Date(),
      },
      include: {
        pg_locations: true,
        rooms: true,
        beds: true,
        city: true,
        state: true,
      },
    });

    return {
      success: true,
      message: 'Tenant updated successfully',
      data: tenant,
    };
  }

  /**
   * Delete tenant (soft delete)
   */
  async remove(id: number) {
    const tenant = await this.prisma.tenants.findFirst({
      where: {
        s_no: id,
        is_deleted: false,
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    // Check if tenant has checked out
    if (!tenant.check_out_date || tenant.status === 'ACTIVE') {
      throw new BadRequestException(
        'Cannot delete tenant who has not checked out. Please checkout the tenant first.',
      );
    }

    // Soft delete tenant
    await this.prisma.tenants.update({
      where: { s_no: id },
      data: {
        is_deleted: true,
      },
    });

    return {
      success: true,
      message: 'Tenant deleted successfully',
    };
  }

  /**
   * Generate unique tenant ID
   */
  private async generateTenantId(): Promise<string> {
    const prefix = 'TNT';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  }
}
