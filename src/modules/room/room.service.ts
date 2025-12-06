import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from '../../s3/s3.service';
import { ValidatedHeaders } from '../../common/decorators/validated-headers.decorator';
import { ResponseUtil } from '../../common/utils/response.util';

@Injectable()
export class RoomService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {}

  /**
   * Create a new room or restore soft-deleted room
   */
  async create(createRoomDto: CreateRoomDto) {
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
              bed_price: true,
            },
          },
        },
      });

      return room;
    } else {
      // Create a new room
      room = await this.prisma.rooms.create({
        data: {
          pg_id: createRoomDto.pg_id,
          room_no: createRoomDto.room_no,
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
              bed_price: true,
            },
          },
        },
      });

      return room;
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
              bed_price: true,
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

    return ResponseUtil.paginated(roomsWithBedCount, total, page, limit, 'Rooms fetched successfully');
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
            bed_price: true,
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
      ...room,
      total_beds: room.beds.length,
    };
  }

  /**
   * Extract S3 key from URL
   */
  private extractS3KeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.substring(1); // Remove leading slash
    } catch {
      return null;
    }
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

    // Handle S3 image deletion if images are being updated
    if (updateRoomDto.images !== undefined) {
      const oldImages = (Array.isArray(existingRoom.images) ? existingRoom.images : []) as string[];
      const newImages = (Array.isArray(updateRoomDto.images) ? updateRoomDto.images : []) as string[];
      
      // Find images that were removed
      const removedImages = oldImages.filter((oldUrl: string) => 
        !newImages.includes(oldUrl) && oldUrl && oldUrl.includes('amazonaws.com')
      );

      // Delete removed images from S3 using S3Service
      if (removedImages.length > 0) {
        try {
          const keysToDelete = removedImages
            .map((imageUrl: string) => this.extractS3KeyFromUrl(imageUrl))
            .filter((key: string | null): key is string => key !== null);

          if (keysToDelete.length > 0) {
            console.log('Deleting removed images from S3:', keysToDelete);
            await this.s3Service.deleteMultipleFiles({
              keys: keysToDelete,
              bucket: process.env.AWS_S3_BUCKET_NAME || 'indianpgmanagement',
            });
            console.log('S3 images deleted successfully:', keysToDelete);
          }
        } catch (error) {
          console.warn('Failed to delete S3 images:', error);
          // Don't throw - continue with update even if S3 deletion fails
        }
      }
    }

    const room = await this.prisma.rooms.update({
      where: { s_no: id },
      data: {
        room_no: updateRoomDto.room_no,
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
            bed_price: true,
          },
        },
      },
    });

    return room;
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

    return ResponseUtil.noContent('Room deleted successfully');
  }
}
