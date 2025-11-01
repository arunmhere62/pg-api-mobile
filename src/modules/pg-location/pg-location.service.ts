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

  /**
   * Get comprehensive summary for a specific PG location
   */
  async getSummary(pgId: number, userId: number, organizationId: number) {
    try {
      // Verify PG location exists and belongs to organization
      const pgLocation = await this.prisma.pg_locations.findFirst({
        where: {
          s_no: pgId,
          organization_id: organizationId,
          is_deleted: false,
        },
        select: {
          s_no: true,
          location_name: true,
          address: true,
          status: true,
        },
      });

      if (!pgLocation) {
        throw new NotFoundException('PG location not found');
      }

      // Get all statistics in parallel
      const [
        allRooms,
        allBeds,
        tenantStats,
        employeeStats,
      ] = await Promise.all([
        // Get all rooms with tenant info
        this.prisma.rooms.findMany({
          where: {
            pg_id: pgId,
            is_deleted: false,
          },
          include: {
            tenants: {
              where: {
                status: 'ACTIVE',
                is_deleted: false,
              },
            },
          },
        }),
        // Get all beds with tenant info
        this.prisma.beds.findMany({
          where: {
            rooms: {
              pg_id: pgId,
              is_deleted: false,
            },
            is_deleted: false,
          },
          include: {
            tenants: {
              where: {
                status: 'ACTIVE',
                is_deleted: false,
              },
            },
          },
        }),
        // Tenant statistics
        this.prisma.tenants.groupBy({
          by: ['status'],
          where: {
            pg_id: pgId,
            is_deleted: false,
          },
          _count: true,
        }),
        // Employee count
        this.prisma.employee_salary.count({
          where: {
            pg_id: pgId,
            is_deleted: false,
          },
        }),
      ]);

      // Process room statistics
      const totalRooms = allRooms.length;
      const occupiedRooms = allRooms.filter(room => room.tenants.length > 0).length;
      const vacantRooms = totalRooms - occupiedRooms;
      const maintenanceRooms = 0; // No maintenance status in schema

      // Process bed statistics
      const totalBeds = allBeds.length;
      const occupiedBeds = allBeds.filter(bed => bed.tenants.length > 0).length;
      const vacantBeds = totalBeds - occupiedBeds;
      const maintenanceBeds = 0; // No maintenance status in schema

      // Process tenant statistics
      const totalTenants = tenantStats.reduce((acc, curr) => acc + curr._count, 0);
      const activeTenants = tenantStats.find(t => t.status === 'ACTIVE')?._count || 0;
      const inactiveTenants = tenantStats.find(t => t.status === 'INACTIVE')?._count || 0;

      // Calculate occupancy rate
      const roomOccupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : '0.0';
      const bedOccupancyRate = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : '0.0';

      return {
        success: true,
        message: 'PG location summary fetched successfully',
        data: {
          pgLocation: {
            id: pgLocation.s_no,
            name: pgLocation.location_name,
            address: pgLocation.address,
            status: pgLocation.status,
          },
          rooms: {
            total: totalRooms,
            occupied: occupiedRooms,
            vacant: vacantRooms,
            maintenance: maintenanceRooms,
            occupancyRate: parseFloat(roomOccupancyRate),
          },
          beds: {
            total: totalBeds,
            occupied: occupiedBeds,
            vacant: vacantBeds,
            maintenance: maintenanceBeds,
            occupancyRate: parseFloat(bedOccupancyRate),
          },
          tenants: {
            total: totalTenants,
            active: activeTenants,
            inactive: inactiveTenants,
          },
          employees: {
            total: employeeStats,
          },
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Get PG summary error:', error);
      throw new BadRequestException('Failed to fetch PG location summary');
    }
  }

  /**
   * Get financial analytics for a specific PG location with monthly breakdown
   */
  async getFinancialAnalytics(pgId: number, userId: number, organizationId: number, months: number = 6) {
    try {
      // Verify PG location exists and belongs to organization
      const pgLocation = await this.prisma.pg_locations.findFirst({
        where: {
          s_no: pgId,
          organization_id: organizationId,
          is_deleted: false,
        },
      });

      if (!pgLocation) {
        throw new NotFoundException('PG location not found');
      }

      // Get monthly data for the last N months
      const monthlyData = [];
      const currentDate = new Date();

      for (let i = months - 1; i >= 0; i--) {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0, 23, 59, 59);

        // Get rent payments (revenue)
        const rentPayments = await this.prisma.tenant_payments.aggregate({
          where: {
            pg_id: pgId,
            is_deleted: false,
            status: 'PAID',
            payment_date: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
          _sum: {
            amount_paid: true,
          },
        });

        // Get advance payments (revenue)
        const advancePayments = await this.prisma.advance_payments.aggregate({
          where: {
            pg_id: pgId,
            is_deleted: false,
            payment_date: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
          _sum: {
            amount_paid: true,
          },
        });

        // Get expenses (loss)
        const expenses = await this.prisma.expenses.aggregate({
          where: {
            pg_id: pgId,
            is_deleted: false,
            paid_date: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
          _sum: {
            amount: true,
          },
        });

        // Get salary payments (loss)
        const salaries = await this.prisma.employee_salary.aggregate({
          where: {
            pg_id: pgId,
            is_deleted: false,
            paid_date: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
          _sum: {
            salary_amount: true,
          },
        });

        const totalRevenue = 
          Number(rentPayments._sum.amount_paid || 0) + 
          Number(advancePayments._sum.amount_paid || 0);

        const totalExpenses = 
          Number(expenses._sum.amount || 0) + 
          Number(salaries._sum.salary_amount || 0);

        const profit = totalRevenue - totalExpenses;

        monthlyData.push({
          month: monthStart.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
          year: monthStart.getFullYear(),
          monthNumber: monthStart.getMonth() + 1,
          revenue: {
            rentPayments: Number(rentPayments._sum.amount_paid || 0),
            advancePayments: Number(advancePayments._sum.amount_paid || 0),
            total: totalRevenue,
          },
          expenses: {
            generalExpenses: Number(expenses._sum.amount || 0),
            salaries: Number(salaries._sum.salary_amount || 0),
            total: totalExpenses,
          },
          profit: profit,
          profitPercentage: totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(2) : '0.00',
        });
      }

      // Calculate totals
      const totals = monthlyData.reduce(
        (acc, month) => ({
          revenue: acc.revenue + month.revenue.total,
          expenses: acc.expenses + month.expenses.total,
          profit: acc.profit + month.profit,
        }),
        { revenue: 0, expenses: 0, profit: 0 }
      );

      return {
        success: true,
        message: 'Financial analytics fetched successfully',
        data: {
          pgLocation: {
            id: pgLocation.s_no,
            name: pgLocation.location_name,
          },
          monthlyData,
          totals: {
            ...totals,
            profitPercentage: totals.revenue > 0 ? ((totals.profit / totals.revenue) * 100).toFixed(2) : '0.00',
          },
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Get financial analytics error:', error);
      throw new BadRequestException('Failed to fetch financial analytics');
    }
  }

  /**
   * Get tenants with pending or partial rent payments for a specific PG location
   * Checks all monthly payments since check-in date, including any missing months in between
   */
  async getTenantRentPaymentStatus(pgId: number, userId: number, organizationId: number) {
    try {
      // Verify PG location exists and belongs to organization
      const pgLocation = await this.prisma.pg_locations.findFirst({
        where: {
          s_no: pgId,
          organization_id: organizationId,
          is_deleted: false,
        },
      });

      if (!pgLocation) {
        throw new NotFoundException('PG location not found');
      }

      // Get active tenants with their payment history
      const tenants = await this.prisma.tenants.findMany({
        where: {
          pg_id: pgId,
          status: 'ACTIVE',
          is_deleted: false,
        },
        select: {
          s_no: true,
          tenant_id: true,
          name: true,
          phone_no: true,
          email: true,
          check_in_date: true,
          room_id: true,
          bed_id: true,
          rooms: {
            select: {
              room_no: true,
              rent_price: true,
            },
          },
          beds: {
            select: {
              bed_no: true,
            },
          },
          tenant_payments: {
            where: {
              is_deleted: false,
            },
            orderBy: {
              payment_date: 'desc',
            },
            select: {
              s_no: true,
              amount_paid: true,
              actual_rent_amount: true,
              payment_date: true,
              status: true,
              start_date: true,
              end_date: true,
            },
          },
        },
      });

      const currentDate = new Date();
      const tenantsWithPaymentIssues = [];

      // Process each tenant's payment history
      for (const tenant of tenants) {
        const checkInDate = new Date(tenant.check_in_date);
        const rentPrice = Number(tenant.rooms?.rent_price || 0);
        
        if (rentPrice === 0) continue; // Skip if rent price is not set
        
        // Calculate expected payment months since check-in
        const expectedPayments = this.getExpectedPaymentMonths(checkInDate, currentDate);
        
        // Map actual payments by month-year
        const actualPayments = new Map();
        tenant.tenant_payments.forEach(payment => {
          const paymentDate = new Date(payment.payment_date);
          // Create a standardized key for month-year comparison
          const monthYearKey = `${paymentDate.getMonth()}-${paymentDate.getFullYear()}`;
          
          // If there are multiple payments for the same month, keep the one with issues
          // (PARTIAL or PENDING takes precedence over PAID)
          if (!actualPayments.has(monthYearKey) || 
              (payment.status !== 'PAID' && actualPayments.get(monthYearKey).status === 'PAID')) {
            actualPayments.set(monthYearKey, payment);
          }
        });
        
        // Find missing or partial payments
        const missingPayments = [];
        const partialPayments = [];
        
        expectedPayments.forEach(expectedDate => {
          // Skip future months - we shouldn't expect payments for months that haven't occurred yet
          if (expectedDate > currentDate) return;
          
          const monthYearKey = `${expectedDate.getMonth()}-${expectedDate.getFullYear()}`;
          const payment = actualPayments.get(monthYearKey);
          
          if (!payment) {
            // Missing payment for this month
            missingPayments.push({
              expected_date: expectedDate,
              month: expectedDate.toLocaleString('default', { month: 'long' }),
              year: expectedDate.getFullYear(),
              amount: rentPrice,
              // Add a status field to make it clear this is a missing payment
              status: 'MISSING'
            });
          } else if (payment.status === 'PARTIAL' || payment.status === 'PENDING') {
            // Partial or pending payment for this month
            const actualRent = Number(payment.actual_rent_amount);
            const amountPaid = payment.status === 'PENDING' ? 0 : Number(payment.amount_paid);
            const dueAmount = actualRent - amountPaid;
            
            partialPayments.push({
              payment_id: payment.s_no,
              payment_date: payment.payment_date,
              month: new Date(payment.payment_date).toLocaleString('default', { month: 'long' }),
              year: new Date(payment.payment_date).getFullYear(),
              actual_rent: actualRent,
              amount_paid: amountPaid,
              due_amount: dueAmount,
              status: payment.status,
              // Add a flag to easily identify if this is a pending payment with no amount paid yet
              is_fully_pending: payment.status === 'PENDING',
            });
          }
        });
        
        // Check if there are any pending payments from the latest month
        const latestPayment = tenant.tenant_payments[0];
        const hasPendingCurrentPayment = latestPayment && latestPayment.status === 'PENDING';
        const hasPartialCurrentPayment = latestPayment && latestPayment.status === 'PARTIAL';
        
        // Only add tenant to the list if they have missing payments, partial payments, or pending current payment
        // Explicitly exclude tenants with all PAID payments and no missing payments
        if (missingPayments.length > 0 || partialPayments.length > 0 || hasPendingCurrentPayment || hasPartialCurrentPayment) {
          let totalDueAmount = 0;
          
          // Calculate total due from missing payments
          missingPayments.forEach(payment => {
            totalDueAmount += payment.amount;
          });
          
          // Add due amounts from partial payments
          partialPayments.forEach(payment => {
            totalDueAmount += payment.due_amount;
          });
          
          // Add due amount from pending current payment if exists
          if (hasPendingCurrentPayment) {
            totalDueAmount += Number(latestPayment.actual_rent_amount);
          }
          
          // Determine the overall payment status based on all issues
          let overallStatus = 'PAID';
          if (missingPayments.length > 0) {
            overallStatus = 'MISSING_PAYMENTS';
          } else if (partialPayments.length > 0) {
            overallStatus = 'PARTIAL_PAYMENTS';
          } else if (hasPendingCurrentPayment) {
            overallStatus = 'PENDING';
          }

          tenantsWithPaymentIssues.push({
            id: tenant.s_no,
            tenant_id: tenant.tenant_id,
            name: tenant.name,
            phone: tenant.phone_no,
            email: tenant.email,
            room_no: tenant.rooms?.room_no || 'N/A',
            bed_no: tenant.beds?.bed_no || 'N/A',
            check_in_date: tenant.check_in_date,
            missing_payments: missingPayments,
            partial_payments: partialPayments,
            current_payment_status: latestPayment ? latestPayment.status : 'NO_PAYMENT',
            overall_status: overallStatus,
            total_due_amount: totalDueAmount,
            missing_months_count: missingPayments.length,
            partial_months_count: partialPayments.length,
            latest_payment: latestPayment ? {
              payment_date: latestPayment.payment_date,
              status: latestPayment.status,
              actual_rent: Number(latestPayment.actual_rent_amount),
              amount_paid: Number(latestPayment.amount_paid),
              due_amount: Number(latestPayment.actual_rent_amount) - Number(latestPayment.amount_paid),
              rent_period: {
                start_date: latestPayment.start_date,
                end_date: latestPayment.end_date,
              },
            } : null,
          });
        }
      }

      return {
        success: true,
        message: 'Tenant rent payment status fetched successfully',
        data: tenantsWithPaymentIssues,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Get tenant rent payment status error:', error);
      throw new BadRequestException('Failed to fetch tenant rent payment status');
    }
  }
  
  /**
   * Helper method to get expected payment months between two dates
   * Returns an array of Date objects for the first day of each month between startDate and endDate
   */
  private getExpectedPaymentMonths(startDate: Date, endDate: Date): Date[] {
    const months = [];
    const currentDate = new Date(startDate);
    const lastDate = new Date(endDate);
    
    // Set dates to first day of their respective months to standardize
    currentDate.setDate(1);
    currentDate.setHours(0, 0, 0, 0);
    
    // Set endDate to first day of its month for proper comparison
    const endDateFirstDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), 1);
    endDateFirstDay.setHours(0, 0, 0, 0);
    
    // Loop through each month from start date to end date (inclusive)
    while (currentDate <= endDateFirstDay) {
      months.push(new Date(currentDate));
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return months;
  }
}
