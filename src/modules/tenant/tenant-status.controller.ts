import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TenantStatusService } from './tenant-status.service';
import { PrismaService } from '../../prisma/prisma.service';
import { HeadersValidationGuard } from '../../common/guards/headers-validation.guard';
import { RequireHeaders } from '../../common/decorators/require-headers.decorator';
import { ValidatedHeaders } from '../../common/decorators/validated-headers.decorator';

@Controller('tenant-status')
@UseGuards(HeadersValidationGuard)
export class TenantStatusController {
  constructor(
    private readonly tenantStatusService: TenantStatusService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get tenants with pending rent
   * GET /api/v1/tenant-status/pending-rent
   * Headers: pg_id
   * Query: page, limit
   */
  @Get('pending-rent')
  @RequireHeaders({ pg_id: true })
  async getTenantsWithPendingRent(
    @ValidatedHeaders() headers: ValidatedHeaders,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    const skip = (pageNumber - 1) * limitNumber;

    // Fetch all active tenants with related data
    const tenants = await this.prisma.tenants.findMany({
      where: {
        pg_id: headers.pg_id!,
        status: 'ACTIVE',
        is_deleted: false,
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
            bed_price: true,
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
          select: {
            s_no: true,
            status: true,
          },
        },
        refund_payments: {
          where: {
            is_deleted: false,
          },
          select: {
            s_no: true,
            status: true,
          },
        },
      },
    });

    // Get tenants with pending rent
    const pendingRentTenants = this.tenantStatusService.getTenantsWithPendingRent(tenants);

    // Apply pagination
    const total = pendingRentTenants.length;
    const paginatedTenants = pendingRentTenants.slice(skip, skip + limitNumber);

    return {
      success: true,
      data: paginatedTenants,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
        hasMore: skip + limitNumber < total,
      },
    };
  }

  /**
   * Get tenants with partial rent
   * GET /api/v1/tenant-status/partial-rent
   * Headers: pg_id
   * Query: page, limit
   */
  @Get('partial-rent')
  @RequireHeaders({ pg_id: true })
  async getTenantsWithPartialRent(
    @ValidatedHeaders() headers: ValidatedHeaders,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    const skip = (pageNumber - 1) * limitNumber;

    // Fetch all active tenants with related data
    const tenants = await this.prisma.tenants.findMany({
      where: {
        pg_id: headers.pg_id!,
        status: 'ACTIVE',
        is_deleted: false,
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
            bed_price: true,
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
          select: {
            s_no: true,
            status: true,
          },
        },
        refund_payments: {
          where: {
            is_deleted: false,
          },
          select: {
            s_no: true,
            status: true,
          },
        },
      },
    });

    // Get tenants with partial rent
    const partialRentTenants = this.tenantStatusService.getTenantsWithPartialRent(tenants);

    // Apply pagination
    const total = partialRentTenants.length;
    const paginatedTenants = partialRentTenants.slice(skip, skip + limitNumber);

    return {
      success: true,
      data: paginatedTenants,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
        hasMore: skip + limitNumber < total,
      },
    };
  }

  /**
   * Get tenants without advance payment
   * GET /api/v1/tenant-status/without-advance
   * Headers: pg_id
   * Query: page, limit
   */
  @Get('without-advance')
  @RequireHeaders({ pg_id: true })
  async getTenantsWithoutAdvance(
    @ValidatedHeaders() headers: ValidatedHeaders,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    const skip = (pageNumber - 1) * limitNumber;

    // Fetch all active tenants with related data
    const tenants = await this.prisma.tenants.findMany({
      where: {
        pg_id: headers.pg_id!,
        status: 'ACTIVE',
        is_deleted: false,
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
            bed_price: true,
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
          select: {
            s_no: true,
            status: true,
          },
        },
        refund_payments: {
          where: {
            is_deleted: false,
          },
          select: {
            s_no: true,
            status: true,
          },
        },
      },
    });

    // Get tenants without advance
    const withoutAdvanceTenants = this.tenantStatusService.getTenantsWithoutAdvance(tenants);

    // Apply pagination
    const total = withoutAdvanceTenants.length;
    const paginatedTenants = withoutAdvanceTenants.slice(skip, skip + limitNumber);

    return {
      success: true,
      data: paginatedTenants,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
        hasMore: skip + limitNumber < total,
      },
    };
  }

  /**
   * Get tenants with paid rent
   * GET /api/v1/tenant-status/paid-rent
   * Headers: pg_id
   * Query: page, limit
   */
  @Get('paid-rent')
  @RequireHeaders({ pg_id: true })
  async getTenantsWithPaidRent(
    @ValidatedHeaders() headers: ValidatedHeaders,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    const skip = (pageNumber - 1) * limitNumber;

    // Fetch all active tenants with related data
    const tenants = await this.prisma.tenants.findMany({
      where: {
        pg_id: headers.pg_id!,
        status: 'ACTIVE',
        is_deleted: false,
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
            bed_price: true,
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
          select: {
            s_no: true,
            status: true,
          },
        },
        refund_payments: {
          where: {
            is_deleted: false,
          },
          select: {
            s_no: true,
            status: true,
          },
        },
      },
    });

    // Get tenants with paid rent
    const paidRentTenants = this.tenantStatusService.getTenantsWithPaidRent(tenants);

    // Apply pagination
    const total = paidRentTenants.length;
    const paginatedTenants = paidRentTenants.slice(skip, skip + limitNumber);

    return {
      success: true,
      data: paginatedTenants,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
        hasMore: skip + limitNumber < total,
      },
    };
  }

  /**
   * Get tenant statistics
   * GET /api/v1/tenant-status/statistics
   * Headers: pg_id
   */
  @Get('statistics')
  @RequireHeaders({ pg_id: true })
  async getTenantStatistics(
    @ValidatedHeaders() headers: ValidatedHeaders,
  ) {
    // Fetch all tenants with related data
    const tenants = await this.prisma.tenants.findMany({
      where: {
        pg_id: headers.pg_id!,
        is_deleted: false,
      },
      include: {
        rooms: {
          select: {
            room_no: true,
          },
        },
        beds: {
          select: {
            bed_price: true,
          },
        },
        tenant_payments: {
          where: {
            is_deleted: false,
          },
          select: {
            start_date: true,
            end_date: true,
            status: true,
            actual_rent_amount: true,
            amount_paid: true,
          },
        },
        advance_payments: {
          where: {
            is_deleted: false,
          },
          select: {
            status: true,
          },
        },
        refund_payments: {
          where: {
            is_deleted: false,
          },
          select: {
            status: true,
          },
        },
      },
    });

    // Get statistics
    const statistics = this.tenantStatusService.getTenantStatistics(tenants);

    return {
      success: true,
      data: statistics,
    };
  }

  /**
   * Get tenant status by ID
   * GET /api/v1/tenant-status/:id
   * Headers: pg_id
   */
  @Get(':id')
  @RequireHeaders({ pg_id: true })
  async getTenantStatus(
    @ValidatedHeaders() headers: ValidatedHeaders,
    @Query('id') id?: string,
  ) {
    const tenantId = id ? parseInt(id, 10) : undefined;

    if (!tenantId) {
      return {
        success: false,
        message: 'Tenant ID is required',
      };
    }

    // Fetch tenant with related data
    const tenant = await this.prisma.tenants.findFirst({
      where: {
        s_no: tenantId,
        pg_id: headers.pg_id!,
        is_deleted: false,
      },
      include: {
        rooms: {
          select: {
            room_no: true,
          },
        },
        beds: {
          select: {
            bed_price: true,
          },
        },
        tenant_payments: {
          where: {
            is_deleted: false,
          },
          select: {
            start_date: true,
            end_date: true,
            status: true,
            actual_rent_amount: true,
            amount_paid: true,
          },
        },
        advance_payments: {
          where: {
            is_deleted: false,
          },
          select: {
            status: true,
          },
        },
        refund_payments: {
          where: {
            is_deleted: false,
          },
          select: {
            status: true,
          },
        },
      },
    });

    if (!tenant) {
      return {
        success: false,
        message: 'Tenant not found',
      };
    }

    // Calculate status
    const statusData = this.tenantStatusService.calculateTenantStatus({
      tenant_payments: tenant.tenant_payments?.map((p: any) => ({
        start_date: p.start_date,
        end_date: p.end_date,
        status: p.status,
        actual_rent_amount: p.actual_rent_amount,
        amount_paid: p.amount_paid,
      })),
      advance_payments: tenant.advance_payments?.map((p: any) => ({
        status: p.status,
      })),
      refund_payments: tenant.refund_payments?.map((p: any) => ({
        status: p.status,
      })),
      check_in_date: tenant.check_in_date,
      check_out_date: tenant.check_out_date,
      rooms: tenant.rooms
        ? {
            rent_price: tenant.beds?.bed_price?.toString(),
          }
        : undefined,
    });

    return {
      success: true,
      data: {
        tenant_id: tenant.s_no,
        tenant_name: tenant.name,
        ...statusData,
      },
    };
  }
}
