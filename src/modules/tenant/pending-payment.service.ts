import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface PendingPaymentDetails {
  tenant_id: number;
  tenant_name: string;
  room_no?: string;
  total_pending: number;
  current_month_pending: number;
  overdue_months: number;
  payment_status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';
  last_payment_date?: string;
  next_due_date?: string;
  monthly_rent: number;
  pending_months: Array<{
    month: string;
    year: number;
    expected_amount: number;
    paid_amount: number;
    balance: number;
    due_date: string;
    is_overdue: boolean;
  }>;
}

@Injectable()
export class PendingPaymentService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculate pending payments for a specific tenant
   */
  async calculateTenantPendingPayment(
    tenantId: number,
  ): Promise<PendingPaymentDetails> {
    // Get tenant details with room and payments
    const tenant = await this.prisma.tenants.findUnique({
      where: { s_no: tenantId },
      include: {
        rooms: {
          select: {
            room_no: true,
            rent_price: true,
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
            payment_date: true,
            amount_paid: true,
            actual_rent_amount: true,
            start_date: true,
            end_date: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const monthlyRent = tenant.rooms?.rent_price
      ? parseFloat(tenant.rooms.rent_price.toString())
      : 0;
    const checkInDate = new Date(tenant.check_in_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate all months from check-in to today
    const pendingMonths = this.calculateMonthlyPending(
      checkInDate,
      today,
      monthlyRent,
      tenant.tenant_payments,
    );

    // Calculate totals
    const totalPending = pendingMonths.reduce(
      (sum, month) => sum + month.balance,
      0,
    );
    const currentMonthPending =
      pendingMonths.length > 0
        ? pendingMonths[pendingMonths.length - 1].balance
        : 0;
    const overdueMonths = pendingMonths.filter((m) => m.is_overdue).length;

    // Determine payment status
    let paymentStatus: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE' = 'PAID';
    if (totalPending > 0) {
      if (overdueMonths > 0) {
        paymentStatus = 'OVERDUE';
      } else if (currentMonthPending > 0 && currentMonthPending < monthlyRent) {
        paymentStatus = 'PARTIAL';
      } else {
        paymentStatus = 'PENDING';
      }
    }

    // Get last payment date
    const lastPayment =
      tenant.tenant_payments.length > 0 ? tenant.tenant_payments[0] : null;
    const lastPaymentDate = lastPayment
      ? new Date(lastPayment.payment_date).toISOString()
      : undefined;

    // Calculate next due date (end date of last payment or current month end)
    let nextDueDate: string | undefined;
    if (lastPayment?.end_date) {
      const endDate = new Date(lastPayment.end_date);
      // Check if end date is today or in the past
      if (endDate <= today) {
        // Next payment is due tomorrow
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        nextDueDate = tomorrow.toISOString();
      } else {
        nextDueDate = endDate.toISOString();
      }
    } else {
      // No payments yet, due date is end of current month
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      nextDueDate = endOfMonth.toISOString();
    }

    return {
      tenant_id: tenant.s_no,
      tenant_name: tenant.name,
      room_no: tenant.rooms?.room_no,
      total_pending: Math.round(totalPending * 100) / 100,
      current_month_pending: Math.round(currentMonthPending * 100) / 100,
      overdue_months: overdueMonths,
      payment_status: paymentStatus,
      last_payment_date: lastPaymentDate,
      next_due_date: nextDueDate,
      monthly_rent: monthlyRent,
      pending_months: pendingMonths.map((m) => ({
        ...m,
        expected_amount: Math.round(m.expected_amount * 100) / 100,
        paid_amount: Math.round(m.paid_amount * 100) / 100,
        balance: Math.round(m.balance * 100) / 100,
      })),
    };
  }

  /**
   * Get all tenants with pending payments
   */
  async getAllPendingPayments(pgId?: number): Promise<PendingPaymentDetails[]> {
    const where: any = {
      is_deleted: false,
      status: 'ACTIVE',
    };

    if (pgId) {
      where.pg_id = pgId;
    }

    const tenants = await this.prisma.tenants.findMany({
      where,
      select: {
        s_no: true,
      },
    });

    const pendingPayments = await Promise.all(
      tenants.map((tenant) =>
        this.calculateTenantPendingPayment(tenant.s_no),
      ),
    );

    // Filter only tenants with pending payments
    return pendingPayments.filter((p) => p.total_pending > 0);
  }

  /**
   * Calculate monthly pending amounts
   */
  private calculateMonthlyPending(
    checkInDate: Date,
    currentDate: Date,
    monthlyRent: number,
    payments: Array<{
      payment_date: Date;
      amount_paid: any;
      actual_rent_amount: any;
      start_date: Date;
      end_date: Date;
    }>,
  ) {
    const months: Array<{
      month: string;
      year: number;
      expected_amount: number;
      paid_amount: number;
      balance: number;
      due_date: string;
      is_overdue: boolean;
    }> = [];

    const startDate = new Date(checkInDate);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(currentDate);
    endDate.setHours(0, 0, 0, 0);

    // Iterate through each month from check-in to current date
    let currentMonth = new Date(startDate);

    while (currentMonth <= endDate) {
      const monthStart = new Date(currentMonth);
      const monthEnd = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        0,
      );
      monthEnd.setHours(23, 59, 59, 999);

      // Calculate expected amount for this month
      const daysInMonth = monthEnd.getDate();
      let daysToCharge = daysInMonth;

      // If it's the first month, calculate from check-in date
      if (
        monthStart.getMonth() === startDate.getMonth() &&
        monthStart.getFullYear() === startDate.getFullYear()
      ) {
        daysToCharge = daysInMonth - startDate.getDate() + 1;
      }

      // If it's the current month, calculate up to today
      if (
        monthStart.getMonth() === endDate.getMonth() &&
        monthStart.getFullYear() === endDate.getFullYear()
      ) {
        daysToCharge = endDate.getDate() - monthStart.getDate() + 1;
      }

      const expectedAmount = (monthlyRent / daysInMonth) * daysToCharge;

      // Calculate paid amount for this month
      const paidAmount = payments
        .filter((payment) => {
          const paymentDate = new Date(payment.payment_date);
          const paymentStart = payment.start_date
            ? new Date(payment.start_date)
            : paymentDate;
          const paymentEnd = payment.end_date
            ? new Date(payment.end_date)
            : paymentDate;

          // Check if payment covers this month
          return paymentStart <= monthEnd && paymentEnd >= monthStart;
        })
        .reduce((sum, payment) => {
          const amount = parseFloat(payment.amount_paid.toString());
          return sum + amount;
        }, 0);

      const balance = expectedAmount - paidAmount;
      const isOverdue = monthEnd < endDate && balance > 0;

      months.push({
        month: monthStart.toLocaleString('default', { month: 'long' }),
        year: monthStart.getFullYear(),
        expected_amount: expectedAmount,
        paid_amount: paidAmount,
        balance: balance > 0 ? balance : 0,
        due_date: monthEnd.toISOString(),
        is_overdue: isOverdue,
      });

      // Move to next month
      currentMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        1,
      );
    }

    return months.filter((m) => m.balance > 0); // Return only months with pending balance
  }

  /**
   * Check if tenant has payment due tomorrow (end date is today)
   */
  async getTenantsWithPaymentDueTomorrow(
    pgId?: number,
  ): Promise<
    Array<{
      tenant_id: number;
      tenant_name: string;
      room_no?: string;
      last_payment_end_date: string;
      monthly_rent: number;
    }>
  > {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const where: any = {
      is_deleted: false,
      status: 'ACTIVE',
    };

    if (pgId) {
      where.pg_id = pgId;
    }

    const tenants = await this.prisma.tenants.findMany({
      where,
      include: {
        rooms: {
          select: {
            room_no: true,
            rent_price: true,
          },
        },
        tenant_payments: {
          where: {
            is_deleted: false,
          },
          orderBy: {
            payment_date: 'desc',
          },
          take: 1,
          select: {
            end_date: true,
          },
        },
      },
    });

    const dueTomorrow = tenants
      .filter((tenant) => {
        if (tenant.tenant_payments.length === 0) return false;

        const lastPayment = tenant.tenant_payments[0];
        if (!lastPayment.end_date) return false;

        const endDate = new Date(lastPayment.end_date);
        endDate.setHours(0, 0, 0, 0);

        // Check if end date is today
        return endDate.getTime() === today.getTime();
      })
      .map((tenant) => ({
        tenant_id: tenant.s_no,
        tenant_name: tenant.name,
        room_no: tenant.rooms?.room_no,
        last_payment_end_date: tenant.tenant_payments[0].end_date.toISOString(),
        monthly_rent: tenant.rooms?.rent_price
          ? parseFloat(tenant.rooms.rent_price.toString())
          : 0,
      }));

    return dueTomorrow;
  }
}
