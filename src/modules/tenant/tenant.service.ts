import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PendingRentCalculatorService } from '../common/pending-rent-calculator.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { PendingPaymentService } from './pending-payment.service';
import { TenantStatusService } from './tenant-status.service';

@Injectable()
export class TenantService {
  constructor(
    private prisma: PrismaService,
    private pendingPaymentService: PendingPaymentService,
    private tenantStatusService: TenantStatusService,
    private pendingRentCalculatorService: PendingRentCalculatorService,
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
    partial_rent?: boolean;
  }) {
    const { page = 1, limit = 10, pg_id, room_id, status, search, pending_rent, pending_advance, partial_rent } = params;
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

    // Enrich tenants with status calculations using TenantStatusService
    const enrichedTenants = this.tenantStatusService.enrichTenantsWithStatus(tenants);

    // Filter by pending rent if requested - use TenantStatusService
    let filteredTenants = enrichedTenants;
    
    if (pending_rent) {
      filteredTenants = this.tenantStatusService.getTenantsWithPendingRent(filteredTenants);
    }

    // Filter by pending advance if requested - use TenantStatusService
    if (pending_advance) {
      filteredTenants = this.tenantStatusService.getTenantsWithoutAdvance(filteredTenants);
    }

    // Filter by partial rent if requested - use TenantStatusService
    if (partial_rent) {
      filteredTenants = this.tenantStatusService.getTenantsWithPartialRent(filteredTenants);
    }

    // Recalculate pagination based on filtered results
    const filteredTotal = filteredTenants.length;
    const paginatedFilteredTenants = pending_rent || pending_advance || partial_rent
      ? filteredTenants 
      : filteredTenants;

    return {
      success: true,
      data: paginatedFilteredTenants,
      pagination: {
        page,
        limit,
        total: pending_rent || pending_advance || partial_rent ? filteredTotal : total,
        totalPages: Math.ceil((pending_rent || pending_advance || partial_rent ? filteredTotal : total) / limit),
        hasMore: skip + limit < (pending_rent || pending_advance || partial_rent ? filteredTotal : total),
      },
    };
  }

  /**
   * Get tenants with pending rent
   */
  async getTenantsWithPendingRent(params: {
    page?: number;
    limit?: number;
    pg_id?: number;
  }) {
    const { page = 1, limit = 10, pg_id } = params;
    const skip = (page - 1) * limit;

    // Get all tenants first
    const tenants = await this.prisma.tenants.findMany({
      where: {
        pg_id,
        status: 'ACTIVE',
      },
      include: {
        pg_locations: true,
        rooms: true,
        beds: true,
        city: true,
        state: true,
        tenant_payments: {
          orderBy: { payment_date: 'desc' },
        },
        advance_payments: {
          orderBy: { payment_date: 'desc' },
        },
        refund_payments: {
          orderBy: { payment_date: 'desc' },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Filter tenants with pending rent using TenantStatusService
    const filteredTenants = this.tenantStatusService.getTenantsWithPendingRent(tenants);
    
    // Apply pagination to filtered results
    const paginatedTenants = filteredTenants.slice(skip, skip + limit);
    const total = filteredTenants.length;

    return {
      success: true,
      data: paginatedTenants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
    };
  }

  /**
   * Get tenants with partial rent
   */
  async getTenantsWithPartialRent(params: {
    page?: number;
    limit?: number;
    pg_id?: number;
  }) {
    const { page = 1, limit = 10, pg_id } = params;
    const skip = (page - 1) * limit;

    // Get all tenants first
    const tenants = await this.prisma.tenants.findMany({
      where: {
        pg_id,
        status: 'ACTIVE',
      },
      include: {
        pg_locations: true,
        rooms: true,
        beds: true,
        city: true,
        state: true,
        tenant_payments: {
          orderBy: { payment_date: 'desc' },
        },
        advance_payments: {
          orderBy: { payment_date: 'desc' },
        },
        refund_payments: {
          orderBy: { payment_date: 'desc' },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Filter tenants with partial rent using TenantStatusService
    const filteredTenants = this.tenantStatusService.getTenantsWithPartialRent(tenants);
    
    // Apply pagination to filtered results
    const paginatedTenants = filteredTenants.slice(skip, skip + limit);
    const total = filteredTenants.length;

    return {
      success: true,
      data: paginatedTenants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
    };
  }

  /**
   * Get tenants without advance payment
   */
  async getTenantsWithoutAdvance(params: {
    page?: number;
    limit?: number;
    pg_id?: number;
  }) {
    const { page = 1, limit = 10, pg_id } = params;
    const skip = (page - 1) * limit;

    // Get all tenants first
    const tenants = await this.prisma.tenants.findMany({
      where: {
        pg_id,
        status: 'ACTIVE',
      },
      include: {
        pg_locations: true,
        rooms: true,
        beds: true,
        city: true,
        state: true,
        tenant_payments: {
          orderBy: { payment_date: 'desc' },
        },
        advance_payments: {
          orderBy: { payment_date: 'desc' },
        },
        refund_payments: {
          orderBy: { payment_date: 'desc' },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Filter tenants without advance using TenantStatusService
    const filteredTenants = this.tenantStatusService.getTenantsWithoutAdvance(tenants);
    
    // Apply pagination to filtered results
    const paginatedTenants = filteredTenants.slice(skip, skip + limit);
    const total = filteredTenants.length;

    return {
      success: true,
      data: paginatedTenants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
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

    // Enrich tenant with status calculations using TenantStatusService
    const enrichedTenant = this.tenantStatusService.enrichTenantsWithStatus([tenant])[0];

    return {
      success: true,
      data: enrichedTenant,
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

  /**
   * Get detailed pending rent information for a tenant
   */
  async getTenantPendingRentDetails(tenantId: number) {
    try {
      // Get tenant with all payment data
      const tenant = await this.prisma.tenants.findUnique({
        where: { s_no: tenantId },
        include: {
          rooms: true,
          beds: true,
          tenant_payments: {
            orderBy: { payment_date: 'desc' }
          },
          advance_payments: {
            orderBy: { payment_date: 'desc' }
          },
          refund_payments: {
            orderBy: { payment_date: 'desc' }
          },
        },
      });

      if (!tenant) {
        return {
          success: false,
          message: 'Tenant not found',
        };
      }

      // Transform tenant_payments to match TenantPayment interface
      const transformedTenantPayments = (tenant.tenant_payments || []).map(payment => ({
        ...payment,
        payment_date: payment.payment_date.toISOString(),
        amount_paid: payment.amount_paid.toString(),
        actual_rent_amount: payment.actual_rent_amount.toString(),
        start_date: payment.start_date.toISOString(),
        end_date: payment.end_date.toISOString()
      }));

      // Transform advance_payments to match AdvancePayment interface
      const transformedAdvancePayments = (tenant.advance_payments || []).map(payment => ({
        ...payment,
        payment_date: payment.payment_date.toISOString(),
        amount_paid: payment.amount_paid.toString(),
        actual_rent_amount: payment.actual_rent_amount.toString()
      }));

      // Calculate detailed pending rent information
      const pendingRentDetails = this.pendingRentCalculatorService.calculatePendingRentDetails(
        tenant.check_in_date.toISOString(),
        Number(tenant.rooms?.rent_price || 0),
        transformedTenantPayments,
        transformedAdvancePayments
      );

      return {
        success: true,
        data: {
          tenant: {
            id: tenant.s_no,
            name: tenant.name,
            tenant_id: tenant.tenant_id,
            room: tenant.rooms?.room_no,
            bed: tenant.beds?.bed_no,
            check_in_date: tenant.check_in_date,
            current_rent: tenant.rooms?.rent_price,
          },
          pending_rent_details: pendingRentDetails,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to calculate pending rent details',
        error: error.message,
      };
    }
  }

  /**
   * Get pending rent summary for all tenants with detailed breakdown
   */
  async getAllTenantsPendingRentSummary(params: any) {
    try {
      // Get all tenants with payment data
      const tenants = await this.prisma.tenants.findMany({
        where: {
          pg_id: params.pg_id,
          is_deleted: false,
        },
        include: {
          rooms: true,
          beds: true,
          tenant_payments: {
            orderBy: { payment_date: 'desc' }
          },
          advance_payments: {
            orderBy: { payment_date: 'desc' }
          },
          refund_payments: {
            orderBy: { payment_date: 'desc' }
          },
        },
        take: params.limit || 50,
        skip: ((params.page || 1) - 1) * (params.limit || 50),
      });

      // Calculate pending rent details for all tenants
      const tenantsWithPendingRent = this.pendingRentCalculatorService.getBulkPendingRentSummary(tenants);

      // Sort by total pending amount (highest first)
      const sortedTenants = tenantsWithPendingRent.sort(
        (a, b) => b.total_pending_amount - a.total_pending_amount
      );

      // Calculate summary statistics
      const summary = {
        total_tenants: sortedTenants.length,
        tenants_with_pending: sortedTenants.filter(t => t.total_pending_amount > 0).length,
        tenants_overdue: sortedTenants.filter(t => t.is_overdue).length,
        total_pending_amount: sortedTenants.reduce((sum, t) => sum + t.total_pending_amount, 0),
        tenants_need_follow_up: sortedTenants.filter(t => 
          t.recommended_action === 'FOLLOW_UP' || t.recommended_action === 'URGENT_FOLLOW_UP'
        ).length,
        tenants_need_notice: sortedTenants.filter(t => 
          t.recommended_action === 'NOTICE' || t.recommended_action === 'EVICTION_WARNING'
        ).length,
      };

      return {
        success: true,
        data: sortedTenants,
        summary,
        pagination: {
          page: params.page || 1,
          limit: params.limit || 50,
          total: sortedTenants.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get pending rent summary',
        error: error.message,
      };
    }
  }

  /**
   * Get tenants with overdue payments
   */
  async getOverdueTenants(params: any) {
    try {
      // Get all tenants
      const tenants = await this.prisma.tenants.findMany({
        where: {
          pg_id: params.pg_id,
          is_deleted: false,
        },
        include: {
          rooms: true,
          beds: true,
          tenant_payments: {
            orderBy: { payment_date: 'desc' }
          },
          advance_payments: {
            orderBy: { payment_date: 'desc' }
          },
        },
      });

      // Filter tenants with overdue payments
      const overdueTenants = this.pendingRentCalculatorService.filterTenantsByPendingRent(
        tenants,
        {
          minPendingAmount: params.min_amount ? parseInt(params.min_amount) : 0,
          includeOverdue: true,
        }
      );

      return {
        success: true,
        data: overdueTenants,
        count: overdueTenants.length,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get overdue tenants',
        error: error.message,
      };
    }
  }

  /**
   * Get pending rent statistics for dashboard
   */
  async getPendingRentStats(params: any) {
    try {
      // Get all tenants
      const tenants = await this.prisma.tenants.findMany({
        where: {
          pg_id: params.pg_id,
          is_deleted: false,
        },
        include: {
          rooms: true,
          beds: true,
          tenant_payments: {
            orderBy: { payment_date: 'desc' }
          },
          advance_payments: {
            orderBy: { payment_date: 'desc' }
          },
        },
      });

      const tenantsWithPendingRent = this.pendingRentCalculatorService.getBulkPendingRentSummary(tenants);

      // Calculate comprehensive statistics
      const stats = {
        total_tenants: tenantsWithPendingRent.length,
        tenants_with_pending: tenantsWithPendingRent.filter(t => t.total_pending_amount > 0).length,
        tenants_overdue: tenantsWithPendingRent.filter(t => t.is_overdue).length,
        tenants_partial: tenantsWithPendingRent.filter(t => t.pending_rent_details.hasPartialPayments).length,
        
        total_pending_amount: tenantsWithPendingRent.reduce((sum, t) => sum + t.total_pending_amount, 0),
        total_overdue_amount: tenantsWithPendingRent.reduce((sum, t) => 
          sum + (t.is_overdue ? t.total_pending_amount : 0), 0
        ),
        
        average_pending_per_tenant: tenantsWithPendingRent.length > 0 
          ? tenantsWithPendingRent.reduce((sum, t) => sum + t.total_pending_amount, 0) / tenantsWithPendingRent.length
          : 0,
        
        // Action recommendations
        tenants_need_follow_up: tenantsWithPendingRent.filter(t => 
          t.recommended_action === 'FOLLOW_UP' || t.recommended_action === 'URGENT_FOLLOW_UP'
        ).length,
        tenants_need_notice: tenantsWithPendingRent.filter(t => 
          t.recommended_action === 'NOTICE' || t.recommended_action === 'EVICTION_WARNING'
        ).length,
        
        // Monthly breakdown
        pending_by_months: this.calculatePendingByMonths(tenantsWithPendingRent),
      };

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get pending rent statistics',
        error: error.message,
      };
    }
  }

  private calculatePendingByMonths(tenants: any[]) {
    const monthlyStats = {};
    
    tenants.forEach(tenant => {
      tenant.pending_rent_details.pendingMonths.forEach(month => {
        if (!monthlyStats[month.month]) {
          monthlyStats[month.month] = {
            month: month.month,
            monthName: month.monthName,
            tenants_count: 0,
            total_pending: 0,
            overdue_count: 0,
          };
        }
        
        monthlyStats[month.month].tenants_count += 1;
        monthlyStats[month.month].total_pending += month.pendingAmount;
        if (month.isOverdue) {
          monthlyStats[month.month].overdue_count += 1;
        }
      });
    });
    
    return Object.values(monthlyStats).sort((a: any, b: any) => a.month.localeCompare(b.month));
  }
}
