import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { OrganizationService } from './organization.service';

@Controller('api/v1/organizations')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  /**
   * Get all organizations with admin details (SuperAdmin only)
   * GET /api/v1/organizations
   */
  @Get()
  // @UseGuards(JwtAuthGuard, SuperAdminGuard) // TODO: Add authentication guards
  async getAllOrganizations(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 10;

    return this.organizationService.getAllOrganizations({
      page: pageNumber,
      limit: limitNumber,
      search,
      status,
    });
  }

  /**
   * Get organization statistics (SuperAdmin only)
   * GET /api/v1/organizations/stats
   */
  @Get('stats')
  // @UseGuards(JwtAuthGuard, SuperAdminGuard) // TODO: Add authentication guards
  async getOrganizationStats() {
    return this.organizationService.getOrganizationStats();
  }

  /**
   * Get organization details by ID (SuperAdmin only)
   * GET /api/v1/organizations/:id
   */
  @Get(':id')
  // @UseGuards(JwtAuthGuard, SuperAdminGuard) // TODO: Add authentication guards
  async getOrganizationById(@Query('id') id: string) {
    return this.organizationService.getOrganizationById(parseInt(id, 10));
  }
}
