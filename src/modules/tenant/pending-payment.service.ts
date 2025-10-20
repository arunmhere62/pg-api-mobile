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
   * Logic:
   * 1. If tenant is ACTIVE and has NO payments → Pending (full monthly rent)
   * 2. If last payment end_date has passed → Pending for new period
   * 3. If paid partial amount → Show balance
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
            end_date: 'desc',
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

    // If tenant is not ACTIVE, no pending payment
    if (tenant.status !== 'ACTIVE') {
      return {
        tenant_id: tenant.s_no,
        tenant_name: tenant.name,
        room_no: tenant.rooms?.room_no,
        total_pending: 0,
        current_month_pending: 0,
        overdue_months: 0,
        payment_status: 'PAID',
        monthly_rent: tenant.rooms?.rent_price ? parseFloat(tenant.rooms.rent_price.toString()) : 0,
        pending_months: [],
      };
    }

    const monthlyRent = tenant.rooms?.rent_price
      ? parseFloat(tenant.rooms.rent_price.toString())
      : 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastPayment = tenant.tenant_payments.length > 0 ? tenant.tenant_payments[0] : null;

    let totalPending = 0;
    let paymentStatus: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE' = 'PAID';
    let nextDueDate: string | undefined;
    const pendingMonths: Array<{
      month: string;
      year: number;
      expected_amount: number;
      paid_amount: number;
      balance: number;
      due_date: string;
      is_overdue: boolean;
    }> = [];

    // Case 1: No payments at all
    if (!lastPayment) {
      totalPending = monthlyRent;
      paymentStatus = 'PENDING';
      
      // Due date is end of current month
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      nextDueDate = endOfMonth.toISOString();

      pendingMonths.push({
        month: today.toLocaleString('default', { month: 'long' }),
        year: today.getFullYear(),
        expected_amount: monthlyRent,
        paid_amount: 0,
        balance: monthlyRent,
        due_date: endOfMonth.toISOString(),
        is_overdue: false,
      });
    } 
    // Case 2: Has payments - check if coverage has ended
    else {
      const lastPaymentEndDate = lastPayment.end_date ? new Date(lastPayment.end_date) : null;
      
      if (lastPaymentEndDate) {
        lastPaymentEndDate.setHours(23, 59, 59, 999);
        
        // Case 2a: Last payment end date has passed
        if (lastPaymentEndDate < today) {
          // Payment period has ended - show as PENDING (not OVERDUE)
          totalPending = monthlyRent;
          paymentStatus = 'PENDING';
          
          // Show next due date as one day after end date
          const nextDay = new Date(lastPaymentEndDate);
          nextDay.setDate(nextDay.getDate() + 1);
          nextDueDate = nextDay.toISOString();

          const endedMonth = lastPaymentEndDate.toLocaleString('default', { month: 'long' });
          const endedYear = lastPaymentEndDate.getFullYear();

          pendingMonths.push({
            month: endedMonth,
            year: endedYear,
            expected_amount: monthlyRent,
            paid_amount: 0,
            balance: monthlyRent,
            due_date: nextDay.toISOString(),
            is_overdue: false,
          });
        }
        // Case 2b: Last payment is still valid (end date is today or future)
        else {
          // Check if partial payment
          const actualRentAmount = lastPayment.actual_rent_amount 
            ? parseFloat(lastPayment.actual_rent_amount.toString())
            : monthlyRent;
          const amountPaid = parseFloat(lastPayment.amount_paid.toString());
          
          if (amountPaid < actualRentAmount) {
            // Partial payment
            totalPending = actualRentAmount - amountPaid;
            paymentStatus = 'PARTIAL';
            nextDueDate = lastPaymentEndDate.toISOString();

            const paymentMonth = lastPaymentEndDate.toLocaleString('default', { month: 'long' });
            const paymentYear = lastPaymentEndDate.getFullYear();

            pendingMonths.push({
              month: paymentMonth,
              year: paymentYear,
              expected_amount: actualRentAmount,
              paid_amount: amountPaid,
              balance: actualRentAmount - amountPaid,
              due_date: lastPaymentEndDate.toISOString(),
              is_overdue: false,
            });
          } else {
            // Fully paid and still valid
            totalPending = 0;
            paymentStatus = 'PAID';
            nextDueDate = lastPaymentEndDate.toISOString();
          }
        }
      } else {
        // No end date on last payment - treat as pending
        totalPending = monthlyRent;
        paymentStatus = 'PENDING';
        
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);
        nextDueDate = endOfMonth.toISOString();

        pendingMonths.push({
          month: today.toLocaleString('default', { month: 'long' }),
          year: today.getFullYear(),
          expected_amount: monthlyRent,
          paid_amount: 0,
          balance: monthlyRent,
          due_date: endOfMonth.toISOString(),
          is_overdue: false,
        });
      }
    }

    return {
      tenant_id: tenant.s_no,
      tenant_name: tenant.name,
      room_no: tenant.rooms?.room_no,
      total_pending: Math.round(totalPending * 100) / 100,
      current_month_pending: Math.round(totalPending * 100) / 100,
      overdue_months: 0, // No overdue tracking based on dates
      payment_status: paymentStatus,
      last_payment_date: lastPayment ? new Date(lastPayment.payment_date).toISOString() : undefined,
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
   * Uses the same simplified logic as calculateTenantPendingPayment
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
