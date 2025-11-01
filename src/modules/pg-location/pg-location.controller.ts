import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { PgLocationService } from './pg-location.service';
import { CreatePgLocationDto } from './dto/create-pg-location.dto';
import { UpdatePgLocationDto } from './dto/update-pg-location.dto';
import { HeadersValidationGuard } from '../../common/guards/headers-validation.guard';
import { RequireHeaders } from '../../common/decorators/require-headers.decorator';
import { ValidatedHeaders } from '../../common/decorators/validated-headers.decorator';

@ApiTags('pg-locations')
@Controller('pg-locations')
@UseGuards(HeadersValidationGuard)
// @ApiBearerAuth() // Uncomment when JWT auth is implemented
export class PgLocationController {
  constructor(private readonly pgLocationService: PgLocationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all PG locations for the organization' })
  @ApiResponse({
    status: 200,
    description: 'PG locations fetched successfully',
    schema: {
      example: {
        success: true,
        message: 'PG locations fetched successfully',
        data: [
          {
            s_no: 1,
            location_name: 'Green Valley PG',
            address: '123 Main Street',
            pincode: '560001',
            status: 'ACTIVE',
            city: { s_no: 1, name: 'Bangalore' },
            state: { s_no: 1, name: 'Karnataka' },
          },
        ],
      },
    },
  })
  @RequireHeaders({ user_id: true, organization_id: true })
  async findAll(@ValidatedHeaders() headers: ValidatedHeaders) {
    return this.pgLocationService.findAll(headers.user_id!, headers.organization_id!);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get PG location statistics' })
  @ApiResponse({
    status: 200,
    description: 'Stats fetched successfully',
    schema: {
      example: {
        success: true,
        message: 'PG location stats fetched successfully',
        data: {
          total: 5,
          active: 4,
          inactive: 1,
        },
      },
    },
  })
  @RequireHeaders({ user_id: true, organization_id: true })
  async getStats(@ValidatedHeaders() headers: ValidatedHeaders) {
    return this.pgLocationService.getStats(headers.user_id!, headers.organization_id!);
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Get comprehensive summary for a PG location' })
  @ApiParam({ name: 'id', description: 'PG Location ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Summary fetched successfully',
    schema: {
      example: {
        success: true,
        message: 'PG location summary fetched successfully',
        data: {
          pgLocation: {
            id: 1,
            name: 'Green Valley PG',
            address: '123 Main Street',
            status: 'ACTIVE',
          },
          rooms: {
            total: 20,
            occupied: 15,
            vacant: 4,
            maintenance: 1,
            occupancyRate: 75.0,
          },
          beds: {
            total: 40,
            occupied: 32,
            vacant: 7,
            maintenance: 1,
            occupancyRate: 80.0,
          },
          tenants: {
            total: 32,
            active: 30,
            inactive: 2,
          },
          employees: {
            total: 5,
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'PG location not found' })
  @RequireHeaders({ user_id: true, organization_id: true })
  async getSummary(
    @Param('id', ParseIntPipe) id: number,
    @ValidatedHeaders() headers: ValidatedHeaders,
  ) {
    return this.pgLocationService.getSummary(id, headers.user_id!, headers.organization_id!);
  }

  @Get(':id/financial-analytics')
  @ApiOperation({ summary: 'Get financial analytics with monthly breakdown for a PG location' })
  @ApiParam({ name: 'id', description: 'PG Location ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Financial analytics fetched successfully',
    schema: {
      example: {
        success: true,
        message: 'Financial analytics fetched successfully',
        data: {
          pgLocation: {
            id: 1,
            name: 'Green Valley PG',
          },
          monthlyData: [
            {
              month: 'Oct 2024',
              year: 2024,
              monthNumber: 10,
              revenue: {
                rentPayments: 50000,
                advancePayments: 10000,
                total: 60000,
              },
              expenses: {
                generalExpenses: 15000,
                salaries: 20000,
                total: 35000,
              },
              profit: 25000,
              profitPercentage: '41.67',
            },
          ],
          totals: {
            revenue: 360000,
            expenses: 210000,
            profit: 150000,
            profitPercentage: '41.67',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'PG location not found' })
  @RequireHeaders({ user_id: true, organization_id: true })
  async getFinancialAnalytics(
    @Param('id', ParseIntPipe) id: number,
    @Query('months') months: string = '6',
    @ValidatedHeaders() headers: ValidatedHeaders,
  ) {
    const monthsNumber = parseInt(months, 10) || 6;
    return this.pgLocationService.getFinancialAnalytics(id, headers.user_id!, headers.organization_id!, monthsNumber);
  }

  @Get(':id/tenant-rent-status')
  @ApiOperation({ summary: 'Get tenants with pending or partial rent payments for a PG location' })
  @ApiParam({ name: 'id', description: 'PG Location ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Tenant rent payment status fetched successfully',
    schema: {
      example: {
        success: true,
        message: 'Tenant rent payment status fetched successfully',
        data: [
          {
            id: 1,
            tenant_id: 'TEN001',
            name: 'John Doe',
            phone: '9876543210',
            email: 'john@example.com',
            room_no: '101',
            bed_no: 'A',
            check_in_date: '2023-01-01T00:00:00.000Z',
            missing_payments: [
              {
                expected_date: '2023-10-01T00:00:00.000Z',
                month: 'October',
                year: 2023,
                amount: 5000
              }
            ],
            partial_payments: [
              {
                payment_id: 123,
                payment_date: '2023-09-01T00:00:00.000Z',
                month: 'September',
                year: 2023,
                actual_rent: 5000,
                amount_paid: 3000,
                due_amount: 2000,
                status: 'PARTIAL'
              }
            ],
            current_payment_status: 'PARTIAL',
            total_due_amount: 7000,
            latest_payment: {
              payment_date: '2023-09-01T00:00:00.000Z',
              status: 'PARTIAL',
              actual_rent: 5000,
              amount_paid: 3000,
              due_amount: 2000,
              rent_period: {
                start_date: '2023-09-01T00:00:00.000Z',
                end_date: '2023-09-30T00:00:00.000Z'
              }
            }
          }
        ]
      }
    }
  })
  @ApiResponse({ status: 404, description: 'PG location not found' })
  @RequireHeaders({ user_id: true, organization_id: true })
  async getTenantRentPaymentStatus(
    @Param('id', ParseIntPipe) id: number,
    @ValidatedHeaders() headers: ValidatedHeaders,
  ) {
    return this.pgLocationService.getTenantRentPaymentStatus(id, headers.user_id!, headers.organization_id!);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single PG location by ID' })
  @ApiParam({ name: 'id', description: 'PG Location ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'PG location fetched successfully',
  })
  @ApiResponse({ status: 404, description: 'PG location not found' })
  @RequireHeaders({ user_id: true, organization_id: true })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @ValidatedHeaders() headers: ValidatedHeaders,
  ) {
    return this.pgLocationService.findOne(id, headers.user_id!, headers.organization_id!);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new PG location' })
  @ApiResponse({
    status: 201,
    description: 'PG location created successfully',
    schema: {
      example: {
        success: true,
        message: 'PG location created successfully',
        data: {
          s_no: 1,
          location_name: 'Green Valley PG',
          address: '123 Main Street',
          pincode: '560001',
          status: 'ACTIVE',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @RequireHeaders({ user_id: true, organization_id: true })
  async create(
    @Body() createPgLocationDto: CreatePgLocationDto,
    @ValidatedHeaders() headers: ValidatedHeaders,
  ) {
    return this.pgLocationService.create(createPgLocationDto, headers.user_id!, headers.organization_id!);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a PG location' })
  @ApiParam({ name: 'id', description: 'PG Location ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'PG location updated successfully',
  })
  @ApiResponse({ status: 404, description: 'PG location not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @RequireHeaders({ user_id: true, organization_id: true })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePgLocationDto: UpdatePgLocationDto,
    @ValidatedHeaders() headers: ValidatedHeaders,
  ) {
    return this.pgLocationService.update(id, updatePgLocationDto, headers.user_id!, headers.organization_id!);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a PG location (soft delete)' })
  @ApiParam({ name: 'id', description: 'PG Location ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'PG location deleted successfully',
    schema: {
      example: {
        success: true,
        message: 'PG location deleted successfully',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'PG location not found' })
  @RequireHeaders({ user_id: true, organization_id: true })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @ValidatedHeaders() headers: ValidatedHeaders,
  ) {
    return this.pgLocationService.remove(id, headers.user_id!, headers.organization_id!);
  }
}
