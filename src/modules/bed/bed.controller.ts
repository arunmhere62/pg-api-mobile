import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { BedService } from './bed.service';
import { CreateBedDto } from './dto/create-bed.dto';
import { UpdateBedDto } from './dto/update-bed.dto';
import { CommonHeaders, CommonHeadersDecorator } from '../../common/decorators/common-headers.decorator';

@Controller('beds')
export class BedController {
  constructor(private readonly bedService: BedService) {}

  /**
   * Create a new bed
   * POST /api/v1/beds
   * Headers: pg_id, organization_id, user_id
   */
  @Post()
  async create(
    @CommonHeadersDecorator() headers: CommonHeaders,
    @Body() createBedDto: CreateBedDto,
  ) {
    return this.bedService.create(createBedDto);
  }

  /**
   * Get all beds with filters
   * GET /api/v1/beds
   * Headers: pg_id, organization_id, user_id
   * Query: page, limit, room_id, is_occupied, search
   */
  @Get()
  async findAll(
    @CommonHeadersDecorator() headers: CommonHeaders,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('room_id') room_id?: string,
    @Query('search') search?: string,
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 100;
    const roomId = room_id ? parseInt(room_id, 10) : undefined;

    return this.bedService.findAll({
      page: pageNumber,
      limit: limitNumber,
      room_id: roomId,
      search,
    });
  }

  /**
   * Get beds by room ID
   * GET /api/v1/beds/room/:roomId
   * Headers: pg_id, organization_id, user_id
   */
  @Get('room/:roomId')
  async findByRoomId(
    @CommonHeadersDecorator() headers: CommonHeaders,
    @Param('roomId') roomId: string,
  ) {
    return this.bedService.findByRoomId(+roomId);
  }

  /**
   * Get bed by ID
   * GET /api/v1/beds/:id
   * Headers: pg_id, organization_id, user_id
   */
  @Get(':id')
  async findOne(
    @CommonHeadersDecorator() headers: CommonHeaders,
    @Param('id') id: string,
  ) {
    return this.bedService.findOne(+id);
  }

  /**
   * Update bed
   * PATCH /api/v1/beds/:id
   * Headers: pg_id, organization_id, user_id
   */
  @Patch(':id')
  async update(
    @CommonHeadersDecorator() headers: CommonHeaders,
    @Param('id') id: string,
    @Body() updateBedDto: UpdateBedDto,
  ) {
    return this.bedService.update(+id, updateBedDto);
  }

  /**
   * Delete bed (soft delete)
   * DELETE /api/v1/beds/:id
   * Headers: pg_id, organization_id, user_id
   */
  @Delete(':id')
  async remove(
    @CommonHeadersDecorator() headers: CommonHeaders,
    @Param('id') id: string,
  ) {
    return this.bedService.remove(+id);
  }
}
