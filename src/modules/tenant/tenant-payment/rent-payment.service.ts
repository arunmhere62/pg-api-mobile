import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {  UpdateTenantPaymentDto } from './dto';
import { ResponseUtil } from '../../../common/utils/response.util';
import { CreateTenantPaymentDto } from './dto/create-rent-payment.dto';

@Injectable()
export class TenantPaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTenantPaymentDto: CreateTenantPaymentDto) {
    // Verify tenant exists
    const tenant = await this.prisma.tenants.findUnique({
      where: { s_no: createTenantPaymentDto.tenant_id },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${createTenantPaymentDto.tenant_id} not found`);
    }

    // Check if tenant is checked out (has a check_out_date)
    if (tenant.check_out_date) {
      throw new BadRequestException(
        `Cannot add rent payment for checked-out tenant. Tenant was checked out on ${new Date(tenant.check_out_date).toISOString().split('T')[0]}`
      );
    }


    // Verify room exists
    const room = await this.prisma.rooms.findUnique({
      where: { s_no: createTenantPaymentDto.room_id },
    });

    if (!room) {
      throw new NotFoundException(`Room with ID ${createTenantPaymentDto.room_id} not found`);
    }

    // Verify bed exists
    const bed = await this.prisma.beds.findUnique({
      where: { s_no: createTenantPaymentDto.bed_id },
    });

    if (!bed) {
      throw new NotFoundException(`Bed with ID ${createTenantPaymentDto.bed_id} not found`);
    }

    // Validate amount paid does not exceed actual rent amount
    if (createTenantPaymentDto.amount_paid > createTenantPaymentDto.actual_rent_amount) {
      throw new BadRequestException(
        `Amount paid (₹${createTenantPaymentDto.amount_paid}) cannot exceed actual rent amount (₹${createTenantPaymentDto.actual_rent_amount})`
      );
    }

    // Create the payment
    const payment = await this.prisma.tenant_payments.create({
      data: {
        tenant_id: createTenantPaymentDto.tenant_id,
        pg_id: createTenantPaymentDto.pg_id,
        room_id: createTenantPaymentDto.room_id,
        bed_id: createTenantPaymentDto.bed_id,
        amount_paid: createTenantPaymentDto.amount_paid,
        actual_rent_amount: createTenantPaymentDto.actual_rent_amount,
        payment_date: createTenantPaymentDto.payment_date ? new Date(createTenantPaymentDto.payment_date) : new Date(),
        payment_method: createTenantPaymentDto.payment_method,
        status: createTenantPaymentDto.status,
        start_date: new Date(createTenantPaymentDto.start_date),
        end_date: new Date(createTenantPaymentDto.end_date),
        current_bill: createTenantPaymentDto.current_bill,
        current_bill_id: createTenantPaymentDto.current_bill_id,
        remarks: createTenantPaymentDto.remarks,
      },
      include: {
        tenants: {
          select: {
            s_no: true,
            tenant_id: true,
            name: true,
            phone_no: true,
          },
        },
        rooms: {
          select: {
            s_no: true,
            room_no: true,
          },
        },
        beds: {
          select: {
            s_no: true,
            bed_no: true,
          },
        },
        pg_locations: {
          select: {
            s_no: true,
            location_name: true,
          },
        },
      },
    });

    return ResponseUtil.success(payment, 'Tenant payment created successfully');
  }

  async findAll(
    pg_id?: number,
    tenant_id?: number,
    status?: string,
    month?: string,
    year?: number,
    start_date?: string,
    end_date?: string,
    room_id?: number,
    bed_id?: number,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;
    
    const where: any = {
      is_deleted: false,
    };

    if (pg_id) {
      where.pg_id = pg_id;
    }

    if (tenant_id) {
      where.tenant_id = tenant_id;
    }

    if (status) {
      where.status = status;
    }

    if (room_id) {
      where.room_id = room_id;
    }

    if (bed_id) {
      where.bed_id = bed_id;
    }

    // Filter by month and year
    if (month && year) {
      const monthIndex = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ].indexOf(month);

      if (monthIndex !== -1) {
        const startOfMonth = new Date(year, monthIndex, 1);
        const endOfMonth = new Date(year, monthIndex + 1, 0, 23, 59, 59);

        where.payment_date = {
          gte: startOfMonth,
          lte: endOfMonth,
        };
      }
    }

    // Filter by date range (overrides month/year if both provided)
    if (start_date || end_date) {
      where.payment_date = {};
      
      if (start_date) {
        where.payment_date.gte = new Date(start_date);
      }
      
      if (end_date) {
        const endDateTime = new Date(end_date);
        endDateTime.setHours(23, 59, 59, 999);
        where.payment_date.lte = endDateTime;
      }
    }

    const [payments, total] = await Promise.all([
      this.prisma.tenant_payments.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          payment_date: 'desc',
        },
        include: {
          tenants: {
            select: {
              s_no: true,
              tenant_id: true,
              name: true,
              phone_no: true,
              is_deleted: true,
              status: true,
              check_out_date: true,
            },
          },
          rooms: {
            select: {
              s_no: true,
              room_no: true,
            },
          },
          beds: {
            select: {
              s_no: true,
              bed_no: true,
            },
          },
          pg_locations: {
            select: {
              s_no: true,
              location_name: true,
            },
          },
        },
      }),
      this.prisma.tenant_payments.count({ where }),
    ]);

    // Add tenant unavailability reason
    const enrichedData = payments.map(payment => {
      let tenant_unavailable_reason = null;
      
      if (!payment.tenants) {
        tenant_unavailable_reason = 'NOT_FOUND';
      } else if (payment.tenants.is_deleted) {
        tenant_unavailable_reason = 'DELETED';
      } else if (payment.tenants.check_out_date) {
        tenant_unavailable_reason = 'CHECKED_OUT';
      } else if (payment.tenants.status === 'INACTIVE') {
        tenant_unavailable_reason = 'INACTIVE';
      }

      return {
        ...payment,
        tenant_unavailable_reason,
      };
    });

    return ResponseUtil.paginated(enrichedData, total, page, limit, 'Tenant payments fetched successfully');
  }

  async findOne(id: number) {
    const payment = await this.prisma.tenant_payments.findFirst({
      where: {
        s_no: id,
        is_deleted: false,
      },
      include: {
        tenants: {
          select: {
            s_no: true,
            tenant_id: true,
            name: true,
            phone_no: true,
            whatsapp_number: true,
            email: true,
          },
        },
        rooms: {
          select: {
            s_no: true,
            room_no: true,
          },
        },
        beds: {
          select: {
            s_no: true,
            bed_no: true,
            bed_price: true,
          },
        },
        pg_locations: {
          select: {
            s_no: true,
            location_name: true,
            address: true,
          },
        },
        current_bills: true,
      },
    });

    if (!payment) {
      throw new NotFoundException(`Tenant payment with ID ${id} not found`);
    }

    return ResponseUtil.success(payment, 'Tenant payment fetched successfully');
  }

  async update(id: number, updateTenantPaymentDto: UpdateTenantPaymentDto) {
    // Check if payment exists
    const existingPayment = await this.prisma.tenant_payments.findFirst({
      where: {
        s_no: id,
        is_deleted: false,
      },
    });

    if (!existingPayment) {
      throw new NotFoundException(`Tenant payment with ID ${id} not found`);
    }


    const updateData: any = {};

    if (updateTenantPaymentDto.amount_paid !== undefined) {
      updateData.amount_paid = updateTenantPaymentDto.amount_paid;
    }
    if (updateTenantPaymentDto.actual_rent_amount !== undefined) {
      updateData.actual_rent_amount = updateTenantPaymentDto.actual_rent_amount;
    }
    if (updateTenantPaymentDto.payment_date) {
      updateData.payment_date = new Date(updateTenantPaymentDto.payment_date);
    }
    if (updateTenantPaymentDto.payment_method) {
      updateData.payment_method = updateTenantPaymentDto.payment_method;
    }
    if (updateTenantPaymentDto.status) {
      updateData.status = updateTenantPaymentDto.status;
    }
    // Note: start_date and end_date cannot be modified after creation
    if (updateTenantPaymentDto.current_bill !== undefined) {
      updateData.current_bill = updateTenantPaymentDto.current_bill;
    }
    if (updateTenantPaymentDto.current_bill_id !== undefined) {
      updateData.current_bill_id = updateTenantPaymentDto.current_bill_id;
    }
    if (updateTenantPaymentDto.remarks !== undefined) {
      updateData.remarks = updateTenantPaymentDto.remarks;
    }

    updateData.updated_at = new Date();

    const payment = await this.prisma.tenant_payments.update({
      where: { s_no: id },
      data: updateData,
      include: {
        tenants: {
          select: {
            s_no: true,
            tenant_id: true,
            name: true,
            phone_no: true,
          },
        },
        rooms: {
          select: {
            s_no: true,
            room_no: true,
          },
        },
        beds: {
          select: {
            s_no: true,
            bed_no: true,
          },
        },
        pg_locations: {
          select: {
            s_no: true,
            location_name: true,
          },
        },
      },
    });

    return ResponseUtil.success(payment, 'Tenant payment updated successfully');
  }

  async remove(id: number) {
    const existingPayment = await this.prisma.tenant_payments.findFirst({
      where: {
        s_no: id,
        is_deleted: false,
      },
    });

    if (!existingPayment) {
      throw new NotFoundException(`Tenant payment with ID ${id} not found`);
    }

    await this.prisma.tenant_payments.update({
      where: { s_no: id },
      data: {
        is_deleted: true,
        updated_at: new Date(),
      },
    });

    return ResponseUtil.noContent('Tenant payment deleted successfully');
  }

  async getPaymentsByTenant(tenant_id: number) {
    const payments = await this.prisma.tenant_payments.findMany({
      where: {
        tenant_id,
        is_deleted: false,
      },
      orderBy: {
        payment_date: 'desc',
      },
      include: {
        rooms: {
          select: {
            s_no: true,
            room_no: true,
          },
        },
        beds: {
          select: {
            s_no: true,
            bed_no: true,
          },
        },
      },
    });

    return ResponseUtil.success(payments, 'Tenant payments fetched successfully');
  }

  async updateStatus(id: number, status: string, payment_date?: string) {
    // Check if payment exists
    const existingPayment = await this.prisma.tenant_payments.findFirst({
      where: {
        s_no: id,
        is_deleted: false,
      },
    });

    if (!existingPayment) {
      throw new NotFoundException(`Tenant payment with ID ${id} not found`);
    }

    // Validate status
    const validStatuses = ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'];
    if (!validStatuses.includes(status.toUpperCase())) {
      throw new BadRequestException(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Update payment status
    const updateData: any = {
      status: status.toUpperCase(),
      updated_at: new Date(),
    };

    // If marking as paid, update payment_date if provided
    if (status.toUpperCase() === 'PAID' && payment_date) {
      updateData.payment_date = new Date(payment_date);
    } else if (status.toUpperCase() === 'PAID' && !payment_date) {
      // Default to current date if marking as paid without a date
      updateData.payment_date = new Date();
    }

    const payment = await this.prisma.tenant_payments.update({
      where: { s_no: id },
      data: updateData,
      include: {
        tenants: {
          select: {
            s_no: true,
            tenant_id: true,
            name: true,
            phone_no: true,
          },
        },
        rooms: {
          select: {
            s_no: true,
            room_no: true,
          },
        },
        beds: {
          select: {
            s_no: true,
            bed_no: true,
          },
        },
        pg_locations: {
          select: {
            s_no: true,
            location_name: true,
          },
        },
      },
    });

    return ResponseUtil.success(payment, `Payment status updated to ${status.toUpperCase()} successfully`);
  }

  async detectPaymentGaps(tenant_id: number) {
    // Fetch tenant with check-in date and rent cycle type
    const tenant = await this.prisma.tenants.findUnique({
      where: { s_no: tenant_id },
      include: {
        pg_locations: {
          select: { rent_cycle_type: true },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${tenant_id} not found`);
    }

    // Fetch all non-deleted payments sorted by start_date
    const payments = await this.prisma.tenant_payments.findMany({
      where: {
        tenant_id,
        is_deleted: false,
      },
      orderBy: {
        start_date: 'asc',
      },
      select: {
        s_no: true,
        start_date: true,
        end_date: true,
        amount_paid: true,
        status: true,
      },
    });

    const gaps = [];
    let gapIndex = 0;
    const cycleType = tenant.pg_locations?.rent_cycle_type || 'CALENDAR';

    // ============================================================================
    // FOR MIDMONTH: CHECK FOR UNPAID MONTHS BETWEEN CHECK-IN AND NOW
    // ============================================================================
    
    if (cycleType === 'MIDMONTH') {
      const now = new Date();
      let currentCycleStart = new Date(tenant.check_in_date);
      const checkInDate = new Date(tenant.check_in_date);
      let isFirstCycle = true;
      
      // Find the latest payment end date to determine how far to check
      let latestPaymentEnd = now;
      if (payments.length > 0) {
        const lastPayment = payments[payments.length - 1];
        const lastPaymentEnd = new Date(lastPayment.end_date);
        if (lastPaymentEnd > latestPaymentEnd) {
          latestPaymentEnd = lastPaymentEnd;
        }
      }
      
      let maxIterations = 100; // Safety limit
      let iterations = 0;
      
      while (iterations < maxIterations) {
        iterations++;
        // Get MIDMONTH cycle period (day X to day (X-1) of next month)
        const year = currentCycleStart.getFullYear();
        const month = currentCycleStart.getMonth();
        const day = currentCycleStart.getDate();
        
        const cycleStart = new Date(year, month, day);
        const cycleEnd = new Date(year, month + 1, day);
        cycleEnd.setDate(cycleEnd.getDate() - 1);
        
        // Stop if cycle start date is after the latest payment end date
        if (cycleStart > latestPaymentEnd) {
          break;
        }
        
        // Check if any PAID or PARTIAL payment covers this cycle period
        const paymentForCycle = payments.find((payment) => {
          const paymentStart = new Date(payment.start_date);
          const paymentEnd = new Date(payment.end_date);
          
          // Check if payment covers this cycle period AND is PAID or PARTIAL
          return (
            paymentStart <= cycleEnd &&
            paymentEnd >= cycleStart &&
            (payment.status === 'PAID' || payment.status === 'PARTIAL')
          );
        });
        
        // If no PAID/PARTIAL payment found for this cycle, add to gaps
        if (!paymentForCycle) {
          const gapStartStr = cycleStart.toISOString().split('T')[0];
          const gapEndStr = cycleEnd.toISOString().split('T')[0];
          
          // Calculate days missing
          const timeDiff = cycleEnd.getTime() - cycleStart.getTime();
          const daysMissing = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;
          
          gaps.push({
            gapId: `gap_midmonth_${gapIndex}`,
            gapStart: gapStartStr,
            gapEnd: gapEndStr,
            daysMissing: daysMissing,
            afterPaymentId: null,
            beforePaymentId: null,
            priority: isFirstCycle ? -1 : gapIndex, // First cycle gap has highest priority
            isCheckInGap: isFirstCycle, // Mark if it's the first cycle from check-in
          });
          gapIndex++;
        }
        
        // Move to next cycle
        currentCycleStart = new Date(cycleEnd);
        currentCycleStart.setDate(currentCycleStart.getDate() + 1);
        isFirstCycle = false;
      }
    } else {
      // ============================================================================
      // FOR CALENDAR: CHECK EACH MONTH SEQUENTIALLY FROM CHECK-IN DATE TO NOW
      // ============================================================================
      
      const now = new Date();
      let currentMonthStart = new Date(tenant.check_in_date);
      currentMonthStart.setDate(1); // Start from 1st of check-in month
      
      while (currentMonthStart <= now) {
        const year = currentMonthStart.getFullYear();
        const month = currentMonthStart.getMonth();
        
        // Get calendar month dates (1st to last day)
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);
        
        // Check if any PAID or PARTIAL payment covers this calendar month
        const paymentForMonth = payments.find((payment) => {
          const paymentStart = new Date(payment.start_date);
          const paymentEnd = new Date(payment.end_date);
          
          // Check if payment covers this month AND is PAID or PARTIAL
          return (
            paymentStart <= monthEnd &&
            paymentEnd >= monthStart &&
            (payment.status === 'PAID' || payment.status === 'PARTIAL')
          );
        });
        
        // If no PAID/PARTIAL payment found for this month, add to gaps
        if (!paymentForMonth) {
          const gapStartStr = monthStart.toISOString().split('T')[0];
          const gapEndStr = monthEnd.toISOString().split('T')[0];
          
          // Calculate days missing
          const timeDiff = monthEnd.getTime() - monthStart.getTime();
          const daysMissing = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;
          
          // Determine if this is check-in gap (first month from check-in)
          const isCheckInMonth = currentMonthStart.getTime() === new Date(tenant.check_in_date).getTime() || 
                                 (currentMonthStart.getFullYear() === new Date(tenant.check_in_date).getFullYear() && 
                                  currentMonthStart.getMonth() === new Date(tenant.check_in_date).getMonth());
          
          gaps.push({
            gapId: `gap_calendar_${gapIndex}`,
            gapStart: gapStartStr,
            gapEnd: gapEndStr,
            daysMissing: daysMissing,
            afterPaymentId: null,
            beforePaymentId: null,
            priority: isCheckInMonth ? -1 : gapIndex, // Check-in month gap has highest priority
            isCheckInGap: isCheckInMonth, // Mark if it's the first month from check-in
          });
          gapIndex++;
        }
        
        // Move to next month
        currentMonthStart.setMonth(currentMonthStart.getMonth() + 1);
      }
    }

    return ResponseUtil.success(
      {
        hasGaps: gaps.length > 0,
        gapCount: gaps.length,
        gaps: gaps,
      },
      gaps.length > 0 ? `Found ${gaps.length} gap(s) in rent periods` : 'No gaps found'
    );
  }

  // ============================================================================
  // CALENDAR CYCLE - NEXT PAYMENT DATES
  // ============================================================================

  private calculateNextPaymentDatesCalendar(lastPaymentEndDate: Date): { startDate: string; endDate: string } {
    // For CALENDAR cycle: next payment starts on 1st of next month
    const lastEnd = new Date(lastPaymentEndDate);
    const nextMonthStart = new Date(lastEnd.getFullYear(), lastEnd.getMonth() + 1, 1);

    const startDate = nextMonthStart.toISOString().split('T')[0];

    // End date is last day of that month
    const endOfMonth = new Date(nextMonthStart.getFullYear(), nextMonthStart.getMonth() + 1, 0);
    const endDate = endOfMonth.toISOString().split('T')[0];

    return { startDate, endDate };
  }

  // ============================================================================
  // MIDMONTH CYCLE - NEXT PAYMENT DATES
  // ============================================================================

  private calculateNextPaymentDatesMidmonth(lastPaymentEndDate: Date): { startDate: string; endDate: string } {
    // For MIDMONTH cycle: next payment starts the day after last payment ends
    const nextStart = new Date(lastPaymentEndDate);
    nextStart.setDate(nextStart.getDate() + 1);

    const startDate = nextStart.toISOString().split('T')[0];

    // End date is same day next month - 1
    const endDate = new Date(nextStart.getFullYear(), nextStart.getMonth() + 1, nextStart.getDate());
    endDate.setDate(endDate.getDate() - 1);

    return { startDate, endDate: endDate.toISOString().split('T')[0] };
  }

  // ============================================================================
  // UNIFIED NEXT PAYMENT DATES CALCULATOR
  // ============================================================================

  private calculateNextPaymentDates(lastPaymentEndDate: Date, rentCycleType: string): { startDate: string; endDate: string } {
    if (rentCycleType === 'CALENDAR') {
      return this.calculateNextPaymentDatesCalendar(lastPaymentEndDate);
    } else {
      return this.calculateNextPaymentDatesMidmonth(lastPaymentEndDate);
    }
  }

  async getNextPaymentDates(tenant_id: number, rentCycleType: string, skipGaps: boolean = false) {
    // Get last payment (most recent by end_date)
    const lastPayment = await this.prisma.tenant_payments.findFirst({
      where: {
        tenant_id,
        is_deleted: false,
      },
      orderBy: {
        end_date: 'desc',
      },
      select: {
        end_date: true,
      },
    });

    if (!lastPayment) {
      // No payments exist, get tenant joining date
      const tenant = await this.prisma.tenants.findUnique({
        where: { s_no: tenant_id },
        select: { check_in_date: true },
      });

      if (!tenant) {
        throw new NotFoundException(`Tenant with ID ${tenant_id} not found`);
      }

      return ResponseUtil.success(
        {
          suggestedStartDate: new Date(tenant.check_in_date).toISOString().split('T')[0],
          isGapFill: false,
          message: 'First payment - use joining date',
        },
        'No previous payments - use joining date'
      );
    }

    // If skipGaps is true, calculate next cycle after last payment (ignoring gaps)
    if (skipGaps) {
      const { startDate, endDate } = this.calculateNextPaymentDates(new Date(lastPayment.end_date), rentCycleType);

      return ResponseUtil.success(
        {
          suggestedStartDate: startDate,
          suggestedEndDate: endDate,
          isGapFill: false,
          message: `Next payment cycle (skipping gaps) - ${rentCycleType} cycle`,
        },
        'Next payment dates calculated'
      );
    }

    // If skipGaps is false, check for gaps first
    const gapResponse = await this.detectPaymentGaps(tenant_id);
    const gapData = gapResponse.data;

    // If gaps exist, suggest filling the earliest gap
    if (gapData.hasGaps && gapData.gaps.length > 0) {
      const earliestGap = gapData.gaps[0];
      return ResponseUtil.success(
        {
          suggestedStartDate: earliestGap.gapStart,
          suggestedEndDate: earliestGap.gapEnd,
          isGapFill: true,
          gapInfo: earliestGap,
          message: `Gap detected from ${earliestGap.gapStart} to ${earliestGap.gapEnd}. Please fill this gap first.`,
        },
        'Gap detected - suggest filling earliest gap'
      );
    }

    // No gaps, calculate next cycle after last payment
    const { startDate, endDate } = this.calculateNextPaymentDates(new Date(lastPayment.end_date), rentCycleType);

    return ResponseUtil.success(
      {
        suggestedStartDate: startDate,
        suggestedEndDate: endDate,
        isGapFill: false,
        message: `Next payment cycle - ${rentCycleType} cycle`,
      },
      'Next payment dates calculated'
    );
  }
}
