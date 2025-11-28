import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { ValidatedHeaders } from '../../common/decorators/validated-headers.decorator';

@Injectable()
export class RoomService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new room or restore soft-deleted room
   */
  async create(createRoomDto: CreateRoomDto) {
    try {
      // Check if a soft-deleted room exists with the same pg_id and room_no
      const existingDeletedRoom = await this.prisma.rooms.findFirst({
        where: {
          pg_id: createRoomDto.pg_id,
          room_no: createRoomDto.room_no,
          is_deleted: true,
        },
      });

      let room;

      if (existingDeletedRoom) {
        // Restore the soft-deleted room by updating it
        room = await this.prisma.rooms.update({
          where: { s_no: existingDeletedRoom.s_no },
          data: {
            is_deleted: false,
            rent_price: createRoomDto.rent_price,
            images: createRoomDto.images,
            updated_at: new Date(),
          },
          include: {
            pg_locations: {
              select: {
                s_no: true,
                location_name: true,
              },
            },
            beds: {
              where: {
                is_deleted: false,
              },
              select: {
                s_no: true,
                bed_no: true,
              },
            },
          },
        });

        return {
          success: true,
          message: 'Room restored successfully',
          data: room,
        };
      } else {
        // Create a new room
        room = await this.prisma.rooms.create({
          data: {
            pg_id: createRoomDto.pg_id,
            room_no: createRoomDto.room_no,
            rent_price: createRoomDto.rent_price,
            images: createRoomDto.images,
          },
          include: {
            pg_locations: {
              select: {
                s_no: true,
                location_name: true,
              },
            },
            beds: {
              where: {
                is_deleted: false,
              },
              select: {
                s_no: true,
                bed_no: true,
              },
            },
          },
        });

        return {
          success: true,
          message: 'Room created successfully',
          data: room,
        };
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all rooms with filters
   */
  async findAll(params: {
    page?: number;
    limit?: number;
    pg_id?: number;
    search?: string;
  }) {
    const { page = 1, limit = 10, pg_id, search } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      is_deleted: false,
    };

    if (pg_id) {
      where.pg_id = pg_id;
    }

    if (search) {
      where.OR = [
        { room_no: { contains: search, mode: 'insensitive' } },
        { room_type: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [rooms, total] = await Promise.all([
      this.prisma.rooms.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          room_no: 'asc',
        },
        include: {
          pg_locations: {
            select: {
              s_no: true,
              location_name: true,
            },
          },
          beds: {
            where: {
              is_deleted: false,
            },
            select: {
              s_no: true,
              bed_no: true,
            },
          },
        },
      }),
      this.prisma.rooms.count({ where }),
    ]);

    // Add bed count for each room
    const roomsWithBedCount = rooms.map((room) => ({
      ...room,
      total_beds: room.beds.length,
    }));

    return {
      success: true,
      data: roomsWithBedCount,
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
   * Get room by ID
   */
  async findOne(id: number) {
    const room = await this.prisma.rooms.findFirst({
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
          },
        },
        beds: {
          where: {
            is_deleted: false,
          },
          select: {
            s_no: true,
            bed_no: true,
          },
          orderBy: {
            bed_no: 'asc',
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    return {
      success: true,
      data: {
        ...room,
        total_beds: room.beds.length,
      },
    };
  }

  /**
   * Update room
   */
  async update(id: number, updateRoomDto: UpdateRoomDto) {
    // Check if room exists
    const existingRoom = await this.prisma.rooms.findFirst({
      where: {
        s_no: id,
        is_deleted: false,
      },
    });

    if (!existingRoom) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    const room = await this.prisma.rooms.update({
      where: { s_no: id },
      data: {
        room_no: updateRoomDto.room_no,
        rent_price: updateRoomDto.rent_price,
        images: updateRoomDto.images,
      },
      include: {
        pg_locations: {
          select: {
            s_no: true,
            location_name: true,
          },
        },
        beds: {
          where: {
            is_deleted: false,
          },
          select: {
            s_no: true,
            bed_no: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Room updated successfully',
      data: room,
    };
  }

  /**
   * Delete room (soft delete)
   */
  async remove(id: number, headers: ValidatedHeaders) {
    // Check if room exists
    const existingRoom = await this.prisma.rooms.findFirst({
      where: {
        s_no: id,
        is_deleted: false,
      },
    });

    if (!existingRoom) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    // Check if room has any beds
    const bedCount = await this.prisma.beds.count({
      where: {
        pg_id: headers.pg_id,
        room_id: id,
        is_deleted: false,
      },
    });

    if (bedCount > 0) {
      throw new BadRequestException(
        `Cannot delete room. It has ${bedCount} bed(s) associated with it. Please delete all beds first.`,
      );
    }

    // Soft delete room
    await this.prisma.$transaction([
      this.prisma.rooms.update({
        where: { s_no: id },
        data: { is_deleted: true },
      }),
      this.prisma.beds.updateMany({
        where: { room_id: id },
        data: { is_deleted: true },
      }),
    ]);

    return {
      success: true,
      message: 'Room deleted successfully',
    };
  }
}
