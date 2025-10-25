import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePgLocationDto } from './dto/create-pg-location.dto';
import { UpdatePgLocationDto } from './dto/update-pg-location.dto';

@Injectable()
export class PgLocationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all PG locations for a user's organization
   */
  async findAll(userId: number, organizationId: number) {
    try {
      const pgLocations = await this.prisma.pg_locations.findMany({
        where: {
          organization_id: organizationId,
          is_deleted: false,
        },
        select: {
          s_no: true,
          user_id: true,
          location_name: true,
          address: true,
          pincode: true,
          status: true,
          images: true,
          city_id: true,
          state_id: true,
          organization_id: true,
          created_at: true,
          updated_at: true,
          city: {
            select: {
              s_no: true,
              name: true,
              state_code: true,
            },
          },
          state: {
            select: {
              s_no: true,
              name: true,
              iso_code: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      return {
        success: true,
        message: pgLocations.length > 0 
          ? 'PG locations fetched successfully' 
          : 'No PG locations found for this organization',
        data: pgLocations, // Will be empty array [] if no locations found
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch PG locations');
    }
  }

  /**
   * Get a single PG location by ID
   */
  async findOne(id: number, userId: number, organizationId: number) {
    try {
      const pgLocation = await this.prisma.pg_locations.findFirst({
        where: {
          s_no: id,
          organization_id: organizationId,
          is_deleted: false,
        },
        include: {
          city: {
            select: {
              s_no: true,
              name: true,
              state_code: true,
            },
          },
          state: {
            select: {
              s_no: true,
              name: true,
              iso_code: true,
            },
          },
          organization: {
            select: {
              s_no: true,
              name: true,
            },
          },
        },
      });

      if (!pgLocation) {
        throw new NotFoundException('PG location not found');
      }

      return {
        success: true,
        message: 'PG location fetched successfully',
        data: pgLocation,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch PG location');
    }
  }

  /**
   * Create a new PG location
   */
  async create(
    createPgLocationDto: CreatePgLocationDto,
    userId: number,
    organizationId: number,
  ) {
    const { locationName, address, pincode, stateId, cityId, images } = createPgLocationDto;

    try {
      const newPgLocation = await this.prisma.pg_locations.create({
        data: {
          user_id: userId,
          location_name: locationName,
          address,
          pincode,
          status: 'ACTIVE',
          organization_id: organizationId,
          city_id: cityId,
          state_id: stateId,
          images: images || [],
          is_deleted: false,
        },
        include: {
          city: {
            select: {
              s_no: true,
              name: true,
            },
          },
          state: {
            select: {
              s_no: true,
              name: true,
            },
          },
        },
      });

      return {
        success: true,
        message: 'PG location created successfully',
        data: newPgLocation,
      };
    } catch (error) {
      console.error('Create PG location error:', error);
      throw new BadRequestException('Failed to create PG location');
    }
  }

  /**
   * Update a PG location
   */
  async update(
    id: number,
    updatePgLocationDto: UpdatePgLocationDto,
    userId: number,
    organizationId: number,
  ) {
    // Check if PG location exists and belongs to the organization
    const existingPg = await this.prisma.pg_locations.findFirst({
      where: {
        s_no: id,
        organization_id: organizationId,
        is_deleted: false,
      },
    });

    if (!existingPg) {
      throw new NotFoundException('PG location not found');
    }

    try {
      const updatedPgLocation = await this.prisma.pg_locations.update({
        where: {
          s_no: id,
        },
        data: {
          location_name: updatePgLocationDto.locationName,
          address: updatePgLocationDto.address,
          pincode: updatePgLocationDto.pincode,
          city_id: updatePgLocationDto.cityId,
          state_id: updatePgLocationDto.stateId,
          images: updatePgLocationDto.images,
          status: updatePgLocationDto.status,
          updated_at: new Date(),
        },
        include: {
          city: {
            select: {
              s_no: true,
              name: true,
            },
          },
          state: {
            select: {
              s_no: true,
              name: true,
            },
          },
        },
      });

      return {
        success: true,
        message: 'PG location updated successfully',
        data: updatedPgLocation,
      };
    } catch (error) {
      console.error('Update PG location error:', error);
      throw new BadRequestException('Failed to update PG location');
    }
  }

  /**
   * Soft delete a PG location
   */
  async remove(id: number, userId: number, organizationId: number) {
    // Check if PG location exists and belongs to the organization
    const existingPg = await this.prisma.pg_locations.findFirst({
      where: {
        s_no: id,
        organization_id: organizationId,
        is_deleted: false,
      },
    });

    if (!existingPg) {
      throw new NotFoundException('PG location not found');
    }

    // Check if PG location has any rooms
    const roomCount = await this.prisma.rooms.count({
      where: {
        pg_id: id,
        is_deleted: false,
      },
    });

    if (roomCount > 0) {
      throw new BadRequestException(
        `Cannot delete PG location. It has ${roomCount} room(s) associated with it. Please delete all rooms first.`,
      );
    }

    try {
      await this.prisma.pg_locations.update({
        where: {
          s_no: id,
        },
        data: {
          is_deleted: true,
          updated_at: new Date(),
        },
      });

      return {
        success: true,
        message: 'PG location deleted successfully',
      };
    } catch (error) {
      console.error('Delete PG location error:', error);
      throw new BadRequestException('Failed to delete PG location');
    }
  }

  /**
   * Get PG location statistics
   */
  async getStats(userId: number, organizationId: number) {
    try {
      const [total, active, inactive] = await Promise.all([
        this.prisma.pg_locations.count({
          where: {
            organization_id: organizationId,
            is_deleted: false,
          },
        }),
        this.prisma.pg_locations.count({
          where: {
            organization_id: organizationId,
            status: 'ACTIVE',
            is_deleted: false,
          },
        }),
        this.prisma.pg_locations.count({
          where: {
            organization_id: organizationId,
            status: 'INACTIVE',
            is_deleted: false,
          },
        }),
      ]);

      return {
        success: true,
        message: 'PG location stats fetched successfully',
        data: {
          total,
          active,
          inactive,
        },
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch PG location stats');
    }
  }
}
