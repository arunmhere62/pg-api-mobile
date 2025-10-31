import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVisitorDto } from './dto/create-visitor.dto';
import { UpdateVisitorDto } from './dto/update-visitor.dto';

@Injectable()
export class VisitorService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateVisitorDto, pgId: number) {
    const visitor = await this.prisma.visitors.create({
      data: {
        ...createDto,
        pg_id: pgId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      include: {
        rooms: true,
        beds: true,
        city: true,
        state: true,
      },
    });

    return {
      success: true,
      message: 'Visitor created successfully',
      data: visitor,
    };
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    pgId?: number,
    search?: string,
    roomId?: number,
    convertedToTenant?: boolean,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {
      is_deleted: false,
    };

    if (pgId) {
      where.pg_id = pgId;
    }

    if (search) {
      where.OR = [
        { visitor_name: { contains: search, mode: 'insensitive' } },
        { phone_no: { contains: search } },
        { purpose: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (roomId) {
      where.visited_room_id = roomId;
    }

    if (convertedToTenant !== undefined) {
      where.convertedTo_tenant = convertedToTenant;
    }

    const [visitors, total] = await Promise.all([
      this.prisma.visitors.findMany({
        where,
        skip,
        take: limit,
        include: {
          rooms: true,
          beds: true,
          city: true,
          state: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      }),
      this.prisma.visitors.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: visitors,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  }

  async findOne(id: number) {
    const visitor = await this.prisma.visitors.findFirst({
      where: {
        s_no: id,
        is_deleted: false,
      },
      include: {
        rooms: true,
        beds: true,
        city: true,
        state: true,
      },
    });

    if (!visitor) {
      throw new NotFoundException('Visitor not found');
    }

    return {
      success: true,
      data: visitor,
    };
  }

  async update(id: number, updateDto: UpdateVisitorDto) {
    const visitor = await this.prisma.visitors.findFirst({
      where: {
        s_no: id,
        is_deleted: false,
      },
    });

    if (!visitor) {
      throw new NotFoundException('Visitor not found');
    }

    const updated = await this.prisma.visitors.update({
      where: { s_no: id },
      data: {
        ...updateDto,
        updated_at: new Date().toISOString(),
      },
      include: {
        rooms: true,
        beds: true,
        city: true,
        state: true,
      },
    });

    return {
      success: true,
      message: 'Visitor updated successfully',
      data: updated,
    };
  }

  async remove(id: number) {
    const visitor = await this.prisma.visitors.findFirst({
      where: {
        s_no: id,
        is_deleted: false,
      },
    });

    if (!visitor) {
      throw new NotFoundException('Visitor not found');
    }

    await this.prisma.visitors.update({
      where: { s_no: id },
      data: {
        is_deleted: true,
        updated_at: new Date().toISOString(),
      },
    });

    return {
      success: true,
      message: 'Visitor deleted successfully',
    };
  }

  async getStats(pgId?: number) {
    const where: any = {
      is_deleted: false,
    };

    if (pgId) {
      where.pg_id = pgId;
    }

    const [total, convertedToTenant, notConverted] = await Promise.all([
      this.prisma.visitors.count({ where }),
      this.prisma.visitors.count({
        where: { ...where, convertedTo_tenant: true },
      }),
      this.prisma.visitors.count({
        where: { ...where, convertedTo_tenant: false },
      }),
    ]);

    return {
      success: true,
      data: {
        total,
        convertedToTenant,
        notConverted,
      },
    };
  }
}
