import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { HeadersValidationGuard } from '../../common/guards/headers-validation.guard';
import { RequireHeaders } from '../../common/decorators/require-headers.decorator';
import { ValidatedHeaders } from '../../common/decorators/validated-headers.decorator';

@Controller('tenants')
@UseGuards(HeadersValidationGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  /**
   * Create a new tenant
   * POST /api/v1/tenants
   * Headers: pg_id, organization_id, user_id
   */
  @Post()
  @RequireHeaders({ pg_id: true, organization_id: true, user_id: true })
  // @UseGuards(JwtAuthGuard) // TODO: Add authentication
  async create(
    @ValidatedHeaders() headers: ValidatedHeaders,
    @Body() createTenantDto: CreateTenantDto,
  ) {
    return this.tenantService.create(createTenantDto);
  }

  /**
   * Get all tenants with filters
   * GET /api/v1/tenants
   * Headers: pg_id, organization_id, user_id
   * Query: page, limit, status, search, room_id, pending_rent, pending_advance
   */
  @Get()
  @RequireHeaders({ pg_id: true })
  // @UseGuards(JwtAuthGuard) // TODO: Add authentication
  async findAll(
    @ValidatedHeaders() headers: ValidatedHeaders,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('room_id') room_id?: string,
    @Query('pending_rent') pending_rent?: string,
    @Query('pending_advance') pending_advance?: string,
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    const roomId = room_id ? parseInt(room_id, 10) : undefined;
    const hasPendingRent = pending_rent === 'true';
    const hasPendingAdvance = pending_advance === 'true';

    return this.tenantService.findAll({
      page: pageNumber,
      limit: limitNumber,
      pg_id: headers.pg_id!,
      status,
      search,
      room_id: roomId,
      pending_rent: hasPendingRent,
      pending_advance: hasPendingAdvance,
    });
  }

  /**
   * Get tenant by ID
   * GET /api/v1/tenants/:id
   * Headers: pg_id, organization_id, user_id
   */
  @Get(':id')
  @RequireHeaders()
  // @UseGuards(JwtAuthGuard) // TODO: Add authentication
  async findOne(
    @ValidatedHeaders() headers: ValidatedHeaders,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.tenantService.findOne(id);
  }

  /**
   * Update tenant
   * PUT /api/v1/tenants/:id
   * Headers: pg_id, organization_id, user_id
   */
  @Put(':id')
  @RequireHeaders({ pg_id: true, organization_id: true, user_id: true })
  // @UseGuards(JwtAuthGuard) // TODO: Add authentication
  async update(
    @ValidatedHeaders() headers: ValidatedHeaders,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTenantDto: UpdateTenantDto,
  ) {
    return this.tenantService.update(id, updateTenantDto);
  }

  /**
   * Delete tenant (soft delete)
   * DELETE /api/v1/tenants/:id
   * Headers: pg_id, organization_id, user_id
   */
  @Delete(':id')
  @RequireHeaders({ pg_id: true, organization_id: true, user_id: true })
  // @UseGuards(JwtAuthGuard) // TODO: Add authentication
  async remove(
    @ValidatedHeaders() headers: ValidatedHeaders,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.tenantService.remove(id);
  }

  /**
   * Check out tenant
   * POST /api/v1/tenants/:id/checkout
   * Headers: pg_id, organization_id, user_id
   */
  @Post(':id/checkout')
  @RequireHeaders({ pg_id: true, organization_id: true, user_id: true })
  // @UseGuards(JwtAuthGuard) // TODO: Add authentication
  async checkout(
    @ValidatedHeaders() headers: ValidatedHeaders,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.tenantService.checkout(id);
  }
}
