import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { PermissionsSeedService } from './permissions-seed.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PermissionQueryDto } from './dto/permission-query.dto';

@ApiTags('Permissions')
@Controller('permissions')
export class PermissionsController {
  constructor(
    private readonly permissionsService: PermissionsService,
    private readonly permissionsSeedService: PermissionsSeedService,
  ) {}

  /**
   * Create a new permission
   * POST /api/v1/permissions
   */
  @Post()
  @ApiOperation({ summary: 'Create a new permission' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Permission created successfully',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Permission key already exists',
  })
  async create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }

  /**
   * Bulk create permissions
   * POST /api/v1/permissions/bulk
   */
  @Post('bulk')
  @ApiOperation({ summary: 'Bulk create permissions' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Permissions created successfully',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Some permission keys already exist',
  })
  async bulkCreate(@Body() permissions: CreatePermissionDto[]) {
    return this.permissionsService.bulkCreate(permissions);
  }

  /**
   * Get all permissions with filtering and pagination
   * GET /api/v1/permissions
   */
  @Get()
  @ApiOperation({ summary: 'Get all permissions with filtering and pagination' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by permission key or description' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Permissions retrieved successfully',
  })
  async findAll(@Query() query: PermissionQueryDto) {
    return this.permissionsService.findAll(query);
  }

  /**
   * Get all permissions (simple list for dropdowns)
   * GET /api/v1/permissions/simple
   */
  @Get('simple')
  @ApiOperation({ summary: 'Get all permissions (simple list for dropdowns)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Permissions retrieved successfully',
  })
  async findAllSimple() {
    return this.permissionsService.findAllSimple();
  }

  /**
   * Get permissions grouped by category
   * GET /api/v1/permissions/grouped
   */
  @Get('grouped')
  @ApiOperation({ summary: 'Get permissions grouped by category' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Grouped permissions retrieved successfully',
  })
  async findGrouped() {
    return this.permissionsService.findGrouped();
  }

  /**
   * Get permission by screen and action
   * GET /api/v1/permissions/key/:screen/:action
   */
  @Get('key/:screen/:action')
  @ApiOperation({ summary: 'Get permission by screen and action' })
  @ApiParam({ name: 'screen', description: 'Screen name' })
  @ApiParam({ name: 'action', description: 'Action type' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Permission retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Permission not found',
  })
  async findByKey(@Param('screen') screen: string, @Param('action') action: string) {
    return this.permissionsService.findByKey(screen, action);
  }

  /**
   * Get permission by ID
   * GET /api/v1/permissions/:id
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get permission by ID' })
  @ApiParam({ name: 'id', description: 'Permission ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Permission retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Permission not found',
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.findOne(id);
  }

  /**
   * Update permission
   * PATCH /api/v1/permissions/:id
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update permission' })
  @ApiParam({ name: 'id', description: 'Permission ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Permission updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Permission not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Permission key already exists',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.permissionsService.update(id, updatePermissionDto);
  }

  /**
   * Delete permission
   * DELETE /api/v1/permissions/:id
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete permission' })
  @ApiParam({ name: 'id', description: 'Permission ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Permission deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Permission not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Cannot delete permission that is being used by roles',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.remove(id);
  }

  /**
   * Seed default permissions
   * POST /api/v1/permissions/seed
   */
  @Post('seed')
  @ApiOperation({ summary: 'Seed default permissions' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Default permissions seeded successfully',
  })
  async seedDefaultPermissions() {
    return this.permissionsSeedService.seedDefaultPermissions();
  }

  /**
   * Create default roles
   * POST /api/v1/permissions/seed-roles
   */
  @Post('seed-roles')
  @ApiOperation({ summary: 'Create default roles' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Default roles created successfully',
  })
  async createDefaultRoles() {
    return this.permissionsSeedService.createDefaultRoles();
  }
}
