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
} from '@nestjs/common';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { CommonHeadersDecorator, CommonHeaders } from '../../common/decorators/common-headers.decorator';

@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  /**
   * Create a new tenant
   * POST /api/v1/tenants
   * Headers: pg_id, organization_id, user_id
   */
  @Post()
  // @UseGuards(JwtAuthGuard) // TODO: Add authentication
  async create(
    @CommonHeadersDecorator() headers: CommonHeaders,
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
  // @UseGuards(JwtAuthGuard) // TODO: Add authentication
  async findAll(
    @CommonHeadersDecorator() headers: CommonHeaders,
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
      pg_id: headers.pg_id,
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
  // @UseGuards(JwtAuthGuard) // TODO: Add authentication
  async findOne(
    @CommonHeadersDecorator() headers: CommonHeaders,
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
  // @UseGuards(JwtAuthGuard) // TODO: Add authentication
  async update(
    @CommonHeadersDecorator() headers: CommonHeaders,
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
  // @UseGuards(JwtAuthGuard) // TODO: Add authentication
  async remove(
    @CommonHeadersDecorator() headers: CommonHeaders,
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
  // @UseGuards(JwtAuthGuard) // TODO: Add authentication
  async checkout(
    @CommonHeadersDecorator() headers: CommonHeaders,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.tenantService.checkout(id);
  }
}
