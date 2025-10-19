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
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { PgLocationService } from './pg-location.service';
import { CreatePgLocationDto } from './dto/create-pg-location.dto';
import { UpdatePgLocationDto } from './dto/update-pg-location.dto';

@ApiTags('pg-locations')
@Controller('pg-locations')
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
  async findAll(@Request() req: any) {
    // Get userId and organizationId from headers
    const userId = parseInt(req.headers['x-user-id']) || req.user?.s_no || 1;
    const organizationId = parseInt(req.headers['x-organization-id']) || req.user?.organization_id || 1;

    return this.pgLocationService.findAll(userId, organizationId);
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
  async getStats(@Request() req: any) {
    // Get userId and organizationId from headers
    const userId = parseInt(req.headers['x-user-id']) || req.user?.s_no || 1;
    const organizationId = parseInt(req.headers['x-organization-id']) || req.user?.organization_id || 1;

    return this.pgLocationService.getStats(userId, organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single PG location by ID' })
  @ApiParam({ name: 'id', description: 'PG Location ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'PG location fetched successfully',
  })
  @ApiResponse({ status: 404, description: 'PG location not found' })
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    // Get userId and organizationId from headers
    const userId = parseInt(req.headers['x-user-id']) || req.user?.s_no || 1;
    const organizationId = parseInt(req.headers['x-organization-id']) || req.user?.organization_id || 1;

    return this.pgLocationService.findOne(id, userId, organizationId);
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
  async create(@Body() createPgLocationDto: CreatePgLocationDto, @Request() req: any) {
    // Get userId and organizationId from headers
    const userId = parseInt(req.headers['x-user-id']) || req.user?.s_no || 1;
    const organizationId = parseInt(req.headers['x-organization-id']) || req.user?.organization_id || 1;

    return this.pgLocationService.create(createPgLocationDto, userId, organizationId);
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
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePgLocationDto: UpdatePgLocationDto,
    @Request() req: any,
  ) {
    // Get userId and organizationId from headers
    const userId = parseInt(req.headers['x-user-id']) || req.user?.s_no || 1;
    const organizationId = parseInt(req.headers['x-organization-id']) || req.user?.organization_id || 1;

    return this.pgLocationService.update(id, updatePgLocationDto, userId, organizationId);
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
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    // Get userId and organizationId from headers
    const userId = parseInt(req.headers['x-user-id']) || req.user?.s_no || 1;
    const organizationId = parseInt(req.headers['x-organization-id']) || req.user?.organization_id || 1;

    return this.pgLocationService.remove(id, userId, organizationId);
  }
}
