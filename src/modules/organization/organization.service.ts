import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface GetOrganizationsParams {
  page: number;
  limit: number;
  search?: string;
  status?: string;
}

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all organizations with admin details and statistics
   */
  async getAllOrganizations(params: GetOrganizationsParams) {
    const { page, limit, search, status } = params;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      is_deleted: false,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    // Get total count
    const total = await this.prisma.organization.count({ where });

    // Get organizations with related data
    const organizations = await this.prisma.organization.findMany({
      where,
      skip,
      take: limit,
      select: {
        s_no: true,
        name: true,
        description: true,
        status: true,
        created_at: true,
        updated_at: true,
        // Get admin users for this organization
        users: {
          where: {
            is_deleted: false,
            roles: {
              role_name: 'ADMIN',
            },
          },
          select: {
            s_no: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            created_at: true,
            roles: {
              select: {
                role_name: true,
              },
            },
          },
        },
        // Get PG locations count
        pg_locations: {
          where: {
            is_deleted: false,
          },
          select: {
            s_no: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Transform data to include counts and admin info
    const transformedOrganizations = organizations.map((org) => ({
      s_no: org.s_no,
      name: org.name,
      description: org.description,
      status: org.status,
      created_at: org.created_at,
      updated_at: org.updated_at,
      admins: org.users.map((user) => ({
        s_no: user.s_no,
        name: user.name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        role: user.roles.role_name,
        created_at: user.created_at,
      })),
      pg_locations_count: org.pg_locations.length,
    }));

    return {
      success: true,
      data: transformedOrganizations,
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
   * Get organization statistics for SuperAdmin dashboard
   */
  async getOrganizationStats() {
    // Total organizations
    const totalOrganizations = await this.prisma.organization.count({
      where: { is_deleted: false },
    });

    // Active organizations
    const activeOrganizations = await this.prisma.organization.count({
      where: {
        is_deleted: false,
        status: 'ACTIVE',
      },
    });

    // Total users across all organizations
    const totalUsers = await this.prisma.user.count({
      where: { is_deleted: false },
    });

    // Total PG locations
    const totalPGLocations = await this.prisma.pg_locations.count({
      where: { is_deleted: false },
    });

    // Total tenants
    const totalTenants = await this.prisma.tenants.count({
      where: { is_deleted: false },
    });

    // Total revenue (sum of all paid payments)
    const revenueResult = await this.prisma.payments.aggregate({
      where: {
        is_deleted: false,
        status: 'PAID',
      },
      _sum: {
        amount_paid: true,
      },
    });

    const totalRevenue = revenueResult._sum.amount_paid || 0;

    // Organizations created in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentOrganizations = await this.prisma.organization.count({
      where: {
        is_deleted: false,
        created_at: {
          gte: thirtyDaysAgo,
        },
      },
    });

    return {
      success: true,
      data: {
        totalOrganizations,
        activeOrganizations,
        inactiveOrganizations: totalOrganizations - activeOrganizations,
        totalUsers,
        totalPGLocations,
        totalTenants,
        totalRevenue: Number(totalRevenue),
        recentOrganizations,
      },
    };
  }

  /**
   * Get organization details by ID
   */
  async getOrganizationById(id: number) {
    const organization = await this.prisma.organization.findUnique({
      where: { s_no: id },
      select: {
        s_no: true,
        name: true,
        description: true,
        status: true,
        created_at: true,
        updated_at: true,
        // Get all users
        users: {
          where: {
            is_deleted: false,
          },
          select: {
            s_no: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            created_at: true,
            roles: {
              select: {
                role_name: true,
              },
            },
          },
        },
        // Get PG locations
        pg_locations: {
          where: {
            is_deleted: false,
          },
          select: {
            s_no: true,
            location_name: true,
            address: true,
            status: true,
            created_at: true,
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Get tenant count for this organization
    const tenantCount = await this.prisma.tenants.count({
      where: {
        is_deleted: false,
        organization_id: id,
      },
    });

    // Get revenue for this organization
    const revenueResult = await this.prisma.payments.aggregate({
      where: {
        is_deleted: false,
        status: 'PAID',
        organization_id: id,
      },
      _sum: {
        amount_paid: true,
      },
    });

    const totalRevenue = revenueResult._sum.amount_paid || 0;

    return {
      success: true,
      data: {
        ...organization,
        users: organization.users.map((user) => ({
          s_no: user.s_no,
          name: user.name,
          email: user.email,
          phone: user.phone,
          status: user.status,
          role: user.roles.role_name,
          created_at: user.created_at,
        })),
        statistics: {
          totalUsers: organization.users.length,
          totalPGLocations: organization.pg_locations.length,
          totalTenants: tenantCount,
          totalRevenue: Number(totalRevenue),
        },
      },
    };
  }
}
