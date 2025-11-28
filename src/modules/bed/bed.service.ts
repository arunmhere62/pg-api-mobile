import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateBedDto } from './dto/create-bed.dto';
import { UpdateBedDto } from './dto/update-bed.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BedService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new bed or restore soft-deleted bed
   */
  async create(createBedDto: CreateBedDto) {
    try {
      // Verify room exists
      const room = await this.prisma.rooms.findFirst({
        where: {
          s_no: createBedDto.room_id,
          is_deleted: false,
        },
      });

      if (!room) {
        throw new NotFoundException(`Room with ID ${createBedDto.room_id} not found`);
      }

      // Check if an active bed already exists with the same room_id and bed_no
      const existingActiveBed = await this.prisma.beds.findFirst({
        where: {
          room_id: createBedDto.room_id,
          bed_no: createBedDto.bed_no,
          is_deleted: false,
        },
      });

      if (existingActiveBed) {
        throw new BadRequestException(
          `Bed number "${createBedDto.bed_no}" already exists in this room. Please use a different bed number.`
        );
      }

      // Check if a soft-deleted bed exists with the same room_id and bed_no
      const existingDeletedBed = await this.prisma.beds.findFirst({
        where: {
          room_id: createBedDto.room_id,
          bed_no: createBedDto.bed_no,
          is_deleted: true,
        },
      });

      let bed;

      if (existingDeletedBed) {
        // Restore the soft-deleted bed by updating it
        bed = await this.prisma.beds.update({
          where: { s_no: existingDeletedBed.s_no },
          data: {
            is_deleted: false,
            pg_id: createBedDto.pg_id,
            images: createBedDto.images,
            updated_at: new Date(),
          },
          include: {
            rooms: {
              select: {
                s_no: true,
                room_no: true,
                pg_locations: {
                  select: {
                    s_no: true,
                    location_name: true,
                  },
                },
              },
            },
          },
        });
      } else {
        // Create a new bed
        bed = await this.prisma.beds.create({
          data: {
            room_id: createBedDto.room_id,
            bed_no: createBedDto.bed_no,
            pg_id: createBedDto.pg_id,
            images: createBedDto.images,
          },
          include: {
            rooms: {
              select: {
                s_no: true,
                room_no: true,
                pg_locations: {
                  select: {
                    s_no: true,
                    location_name: true,
                  },
                },
              },
            },
          },
        });
      }

      return {
        success: true,
        message: existingDeletedBed ? 'Bed restored successfully' : 'Bed created successfully',
        data: bed,
      };
    } catch (error) {
      // Re-throw known exceptions
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      // Handle Prisma unique constraint errors
      if (error.code === 'P2002') {
        throw new BadRequestException(
          `Bed number "${createBedDto.bed_no}" already exists in this room. Please use a different bed number.`
        );
      }
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Get all beds with filters
   */
  async findAll(params: {
    pg_id?: number;
    page?: number;
    limit?: number;
    room_id?: number;
    only_unoccupied?: boolean;
    search?: string;
  }) {
    const { page = 1, limit = 10, room_id, pg_id, search, only_unoccupied } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      is_deleted: false,
      rooms: {
        pg_id: params.pg_id,
      },
    };

    if (room_id) {
      where.room_id = room_id;
    }
    if (params.pg_id) {
      where.rooms.pg_id = params.pg_id; // ✅ filter beds by PG ID through room
    }
    if (search) {
      where.bed_no = { contains: search, mode: 'insensitive' };
    }
    
    // Filter only unoccupied beds (beds without active tenants)
    if (only_unoccupied) {
      where.tenants = {
        none: {
          status: 'ACTIVE',
          is_deleted: false,
        },
      };
    }

    const [beds, total] = await Promise.all([
      this.prisma.beds.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          bed_no: 'asc',
        },
        include: {
          rooms: {
            select: {
              s_no: true,
              room_no: true,
              pg_id: true,
              pg_locations: {
                select: {
                  s_no: true,
                  location_name: true,
                },
              },
            },
          },
          tenants: {
            where: {
              status: 'ACTIVE',
              OR: [
                { is_deleted: false },
                { is_deleted: null },
              ],
            },
            select: {
              s_no: true,
              name: true,
              phone_no: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.beds.count({ where }),
    ]);

    // Add is_occupied flag based on active tenants
    const bedsWithStatus = beds.map(bed => ({
      ...bed,
      is_occupied: bed.tenants && bed.tenants.length > 0,
    }));

    return {
      success: true,
      data: bedsWithStatus,
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
   * Get beds by room ID
   */
  async findByRoomId(roomId: number) {
    const beds = await this.prisma.beds.findMany({
      where: {
        room_id: roomId,
        is_deleted: false,
      },
      orderBy: {
        bed_no: 'asc',
      },
      include: {
        rooms: {
          select: {
            s_no: true,
            room_no: true,
          },
        },
        tenants: {
          where: {
            status: 'ACTIVE',
            OR: [
              { is_deleted: false },
              { is_deleted: null },
            ],
          },
          select: {
            s_no: true,
            name: true,
            phone_no: true,
            status: true,
          },
        },
      },
    });

    // Add is_occupied flag based on active tenants
    const bedsWithStatus = beds.map(bed => ({
      ...bed,
      is_occupied: bed.tenants && bed.tenants.length > 0,
    }));

    return {
      success: true,
      data: bedsWithStatus,
    };
  }

  /**
   * Get bed by ID
   */
  async findOne(id: number) {
    const bed = await this.prisma.beds.findFirst({
      where: {
        s_no: id,
        is_deleted: false,
      },
      include: {
        rooms: {
          select: {
            s_no: true,
            room_no: true,
            rent_price: true,
            pg_locations: {
              select: {
                s_no: true,
                location_name: true,
                address: true,
              },
            },
          },
        },
      },
    });

    if (!bed) {
      throw new NotFoundException(`Bed with ID ${id} not found`);
    }

    return {
      success: true,
      data: bed,
    };
  }

  /**
   * Update bed
   */
  async update(id: number, updateBedDto: UpdateBedDto) {
    // Check if bed exists
    const existingBed = await this.prisma.beds.findFirst({
      where: {
        s_no: id,
        is_deleted: false,
      },
    });

    if (!existingBed) {
      throw new NotFoundException(`Bed with ID ${id} not found`);
    }

    // If room_id is being updated, verify new room exists
    if (updateBedDto.room_id) {
      const room = await this.prisma.rooms.findFirst({
        where: {
          s_no: updateBedDto.room_id,
          is_deleted: false,
        },
      });

      if (!room) {
        throw new NotFoundException(`Room with ID ${updateBedDto.room_id} not found`);
      }
    }

    const bed = await this.prisma.beds.update({
      where: { s_no: id },
      data: {
        room_id: updateBedDto.room_id,
        bed_no: updateBedDto.bed_no,
        pg_id: updateBedDto.pg_id,
        images: updateBedDto.images,
      },
      include: {
        rooms: {
          select: {
            s_no: true,
            room_no: true,
            pg_locations: {
              select: {
                s_no: true,
                location_name: true,
              },
            },
          },
        },
      },
    });

    return {
      success: true,
      message: 'Bed updated successfully',
      data: bed,
    };
  }

  /**
   * Delete bed (soft delete)
   */
  async remove(id: number) {
    // Check if bed exists
    const existingBed = await this.prisma.beds.findFirst({
      where: {
        s_no: id,
        is_deleted: false,
      },
    });

    if (!existingBed) {
      throw new NotFoundException(`Bed with ID ${id} not found`);
    }

    // Prevent deletion if any active tenant is assigned to this bed
    const activeTenant = await this.prisma.tenants.findFirst({
      where: {
        bed_id: id,
        status: 'ACTIVE',
        is_deleted: false,
      },
      select: { s_no: true },
    });

    if (activeTenant) {
      throw new BadRequestException('Cannot delete bed while a tenant is assigned to it');
    }

    await this.prisma.beds.update({
      where: { s_no: id },
      data: { is_deleted: true },
    });

    return {
      success: true,
      message: 'Bed deleted successfully',
    };
  }
}
