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
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { CommonHeaders, CommonHeadersDecorator } from '../../common/decorators/common-headers.decorator';

@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  /**
   * Create a new room
   * POST /api/v1/rooms
   * Headers: pg_id, organization_id, user_id
   */
  @Post()
  async create(
    @CommonHeadersDecorator() headers: CommonHeaders,
    @Body() createRoomDto: CreateRoomDto,
  ) {
    return this.roomService.create(createRoomDto);
  }

  /**
   * Get all rooms with filters
   * GET /api/v1/rooms
   * Headers: pg_id, organization_id, user_id
   * Query: page, limit, search
   */
  @Get()
  async findAll(
    @CommonHeadersDecorator() headers: CommonHeaders,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 100;

    return this.roomService.findAll({
      page: pageNumber,
      limit: limitNumber,
      pg_id: headers.pg_id,
      search,
    });
  }

  /**
   * Get room by ID
   * GET /api/v1/rooms/:id
   * Headers: pg_id, organization_id, user_id
   */
  @Get(':id')
  async findOne(
    @CommonHeadersDecorator() headers: CommonHeaders,
    @Param('id') id: string,
  ) {
    return this.roomService.findOne(+id);
  }

  /**
   * Update room
   * PATCH /api/v1/rooms/:id
   * Headers: pg_id, organization_id, user_id
   */
  @Patch(':id')
  async update(
    @CommonHeadersDecorator() headers: CommonHeaders,
    @Param('id') id: string,
    @Body() updateRoomDto: UpdateRoomDto,
  ) {
    return this.roomService.update(+id, updateRoomDto);
  }

  /**
   * Delete room (soft delete)
   * DELETE /api/v1/rooms/:id
   * Headers: pg_id, organization_id, user_id
   */
  @Delete(':id')
  async remove(
    @CommonHeadersDecorator() headers: CommonHeaders,
    @Param('id') id: string,
  ) {
    return this.roomService.remove(+id);
  }
}
