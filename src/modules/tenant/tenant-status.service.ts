import { Injectable } from '@nestjs/common';

/**
 * Tenant Status Service
 * Handles all tenant rent status calculations based on payment records
 */

interface TenantPayment {
  start_date: string | Date;
  end_date: string | Date;
  status: 'PAID' | 'PENDING' | 'FAILED' | 'PARTIAL';
  actual_rent_amount: string | number;
  amount_paid: string | number;
}

interface AdvancePayment {
  status: 'PAID' | 'PENDING' | 'FAILED';
}

interface RefundPayment {
  status: 'PAID' | 'PENDING' | 'FAILED' | 'PARTIAL';
}

interface TenantData {
  tenant_payments?: TenantPayment[];
  advance_payments?: AdvancePayment[];
  refund_payments?: RefundPayment[];
  check_in_date?: string | Date;
  check_out_date?: string | Date;
  rooms?: {
    rent_price: string | number;
  };
}

export interface TenantStatusResult {
  is_rent_paid: boolean;
  is_rent_partial: boolean;
  rent_due_amount: number; // Total due amount (partial + pending)
  partial_due_amount: number; // Only partial payment remaining amounts
  pending_due_amount: number; // Only pending/failed payment amounts
  is_advance_paid: boolean;
  is_refund_paid: boolean;
  pending_months: number;
}

@Injectable()
export class TenantStatusService {
  /**
   * Calculate pending months for a tenant
   * Checks for PENDING/PARTIAL/FAILED payments or missing rent periods
   */
  private calculatePendingMonths(tenant: TenantData): number {
    // If no rent records, check time since check-in date
    if (!tenant.tenant_payments || tenant.tenant_payments.length === 0) {
      if (!tenant.check_in_date) return 0;

      const now = new Date();
      const checkInDate = new Date(tenant.check_in_date);

      // If tenant checked in before today, always mark as pending
      if (checkInDate < now) {
        // Calculate months between check-in and now
        const yearDiff = now.getFullYear() - checkInDate.getFullYear();
        const monthDiff = now.getMonth() - checkInDate.getMonth();
        return Math.max(1, yearDiff * 12 + monthDiff);
      }
      return 0;
    }

    // Count payments with PENDING or FAILED status
    // PARTIAL payments should NOT be counted as pending months (they're tracked separately)
    let pendingCount = 0;

    tenant.tenant_payments.forEach((payment) => {
      if (payment.status === 'PENDING' || payment.status === 'FAILED') {
        pendingCount++;
      }
    });

    // If no pending payments found, check if current date is covered by a PAID or PARTIAL rent
    if (pendingCount === 0) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const isCoveredByPayment = tenant.tenant_payments.some((payment) => {
        // Both PAID and PARTIAL cover the period (PARTIAL just has remaining balance)
        if (payment.status !== 'PAID' && payment.status !== 'PARTIAL')
          return false;

        const startDate = new Date(payment.start_date);
        const endDate = new Date(payment.end_date);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        // Check if current date falls within this payment period
        return now >= startDate && now <= endDate;
      });

      // If current date is NOT covered by any payment, calculate months from last payment
      if (!isCoveredByPayment) {
        // Find the latest PAID payment by end date
        const paidPayments = tenant.tenant_payments.filter(
          (p) => p.status === 'PAID'
        );

        if (paidPayments.length > 0) {
          const latestPaidPayment = paidPayments.sort(
            (a, b) =>
              new Date(b.end_date).getTime() - new Date(a.end_date).getTime()
          )[0];

          const lastPaidEndDate = new Date(latestPaidPayment.end_date);
          lastPaidEndDate.setHours(0, 0, 0, 0);

          // Calculate months between last paid end date and now
          const yearDiff = now.getFullYear() - lastPaidEndDate.getFullYear();
          const monthDiff = now.getMonth() - lastPaidEndDate.getMonth();
          pendingCount = Math.max(1, yearDiff * 12 + monthDiff);
        } else {
          // No PAID payments at all, calculate from check-in date
          if (tenant.check_in_date) {
            const checkInDate = new Date(tenant.check_in_date);
            checkInDate.setHours(0, 0, 0, 0);

            const yearDiff = now.getFullYear() - checkInDate.getFullYear();
            const monthDiff = now.getMonth() - checkInDate.getMonth();
            pendingCount = Math.max(1, yearDiff * 12 + monthDiff);
          } else {
            pendingCount = 1;
          }
        }
      }
    }

    return pendingCount;
  }

  /**
   * Calculate tenant rent status based on payment records
   * Detects pending or partial payments
   */
  calculateTenantStatus(tenant: TenantData): TenantStatusResult {
    // Check advance and refund payments
    const is_advance_paid =
      tenant.advance_payments?.some((p) => p.status === 'PAID') || false;
    const is_refund_paid =
      tenant.refund_payments?.some((p) => p.status === 'PAID') || false;

    // Current date for calculations
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Check for rent payment issues
    const hasPartialPayment =
      tenant.tenant_payments?.some((p) => p.status === 'PARTIAL') || false;
    const hasPendingPayment =
      tenant.tenant_payments?.some(
        (p) => p.status === 'PENDING' || p.status === 'FAILED'
      ) || false;

    // Check for rent period gap (current date not covered by any PAID rent period)
    let hasRentGap = false;

    if (tenant.tenant_payments && tenant.tenant_payments.length > 0) {
      // Check if current date is covered by any PAID rent period
      const isCoveredByPaidRent = tenant.tenant_payments.some((payment) => {
        if (payment.status !== 'PAID') return false;

        const startDate = new Date(payment.start_date);
        const endDate = new Date(payment.end_date);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        // Check if current date falls within this PAID rent period
        return now >= startDate && now <= endDate;
      });

      // If current date is NOT covered by any PAID rent period, there's a gap
      hasRentGap = !isCoveredByPaidRent;
    } else if (tenant.check_in_date) {
      // If no payments but has check-in date, always has gap
      hasRentGap = new Date(tenant.check_in_date) < now;
    }

    // Calculate pending months
    const pendingMonths = this.calculatePendingMonths(tenant);

    // A tenant's rent is considered PAID only if:
    // 1. No partial payments
    // 2. No pending/failed payments
    // 3. No rent gap (current date is covered by a PAID rent period)
    // 4. No pending months from other calculations
    const is_rent_paid =
      !hasPartialPayment &&
      !hasPendingPayment &&
      !hasRentGap &&
      pendingMonths === 0;
    const is_rent_partial = hasPartialPayment;

    // Calculate due amounts (separate partial and pending)
    let partial_due_amount = 0;
    let pending_due_amount = 0;
    const rentPrice = Number(tenant.rooms?.rent_price || 0);

    if (tenant.tenant_payments && tenant.tenant_payments.length > 0) {
      // Sum due amounts from PARTIAL and PENDING payments separately
      tenant.tenant_payments.forEach((p) => {
        if (p.status === 'PARTIAL') {
          const expected = Number(p.actual_rent_amount || 0);
          const paid = Number(p.amount_paid || 0);
          partial_due_amount += expected - paid;
        } else if (p.status === 'PENDING' || p.status === 'FAILED') {
          pending_due_amount += Number(p.actual_rent_amount || 0);
        }
      });

      // If there's a rent gap and no explicit pending payments,
      // calculate due amount based on pending months
      // (This can happen even if there are partial payments for other months)
      if (hasRentGap && pending_due_amount === 0 && pendingMonths > 0) {
        pending_due_amount = rentPrice * pendingMonths;
      }
    } else if (pendingMonths > 0) {
      // No payments but pending months (based on check-in date)
      pending_due_amount = rentPrice * pendingMonths;
    }

    const rent_due_amount = partial_due_amount + pending_due_amount;

    return {
      is_rent_paid,
      is_rent_partial,
      rent_due_amount,
      partial_due_amount,
      pending_due_amount,
      is_advance_paid,
      is_refund_paid,
      pending_months: pendingMonths,
    };
  }

  /**
   * Enrich tenant list with status calculations
   * Simplified version
   */
  enrichTenantsWithStatus(tenants: any[]): any[] {
    return tenants.map((tenant) => {
      const statusData = this.calculateTenantStatus(this.mapTenantData(tenant));
      return {
        ...tenant,
        ...statusData,
      };
    });
  }

  /**
   * Get active tenants with pending rent
   * Returns tenants with PENDING/FAILED payments, rent gaps, or no rent record but past check-in date
   * NOTE: A tenant can appear in BOTH pending and partial tabs if they have both types of payments
   */
  getTenantsWithPendingRent(tenants: any[]): any[] {
    const enrichedTenants = this.enrichTenantsWithStatus(tenants);

    const filteredTenants = enrichedTenants.filter((tenant) => {
      if (tenant.status !== 'ACTIVE') return false;

      // Include tenant if they have any pending/failed payments
      const hasPendingOrFailed = tenant.tenant_payments?.some(
        (p: any) => p.status === 'PENDING' || p.status === 'FAILED'
      );

      // Include tenant if they have pending months (even if they also have partial payments)
      const hasPendingMonths = tenant.pending_months > 0;

      // Debug logging
      const shouldInclude = hasPendingOrFailed || hasPendingMonths;
      if (shouldInclude) {
        console.log(`Including tenant ${tenant.name} in pending filter:`, {
          hasPendingOrFailed,
          hasPendingMonths,
          pending_months: tenant.pending_months,
          is_rent_partial: tenant.is_rent_partial,
          payments: tenant.tenant_payments?.map(p => ({ status: p.status, amount: p.amount_paid }))
        });
      }

      // Include if they have pending/failed payments OR pending months
      return shouldInclude;
    });

    console.log(`Pending rent filter: ${filteredTenants.length} tenants found out of ${enrichedTenants.length} total`);
    return filteredTenants;
  }

  /**
   * Get active tenants with partial rent
   * Returns tenants with PARTIAL payments
   */
  getTenantsWithPartialRent(tenants: any[]): any[] {
    const enrichedTenants = this.enrichTenantsWithStatus(tenants);
    return enrichedTenants.filter(
      (tenant) => tenant.status === 'ACTIVE' && tenant.is_rent_partial
    );
  }

  /**
   * Get active tenants without advance payment
   * Returns tenants that haven't paid advance
   */
  getTenantsWithoutAdvance(tenants: any[]): any[] {
    const enrichedTenants = this.enrichTenantsWithStatus(tenants);
    return enrichedTenants.filter(
      (tenant) => tenant.status === 'ACTIVE' && !tenant.is_advance_paid
    );
  }

  /**
   * Get active tenants with paid rent
   * Returns tenants with all rents fully paid
   */
  getTenantsWithPaidRent(tenants: any[]): any[] {
    const enrichedTenants = this.enrichTenantsWithStatus(tenants);
    return enrichedTenants.filter(
      (tenant) => tenant.status === 'ACTIVE' && tenant.is_rent_paid
    );
  }

  /**
   * Get tenant statistics for active tenants
   * Simplified version
   */
  getTenantStatistics(tenants: any[]): {
    total: number;
    active: number;
    with_pending_rent: number;
    with_partial_rent: number;
    with_paid_rent: number;
    without_advance: number;
    total_due_amount: number;
  } {
    const enrichedTenants = this.enrichTenantsWithStatus(tenants);
    const activeTenants = enrichedTenants.filter((t) => t.status === 'ACTIVE');

    // Calculate actual statistics
    return {
      total: tenants.length,
      active: activeTenants.length,
      with_pending_rent: this.getTenantsWithPendingRent(tenants).length,
      with_partial_rent: this.getTenantsWithPartialRent(tenants).length,
      with_paid_rent: this.getTenantsWithPaidRent(tenants).length,
      without_advance: this.getTenantsWithoutAdvance(tenants).length,
      total_due_amount: activeTenants.reduce(
        (sum, t) => sum + (t.rent_due_amount || 0),
        0
      ),
    };
  }

  /**
   * Map database tenant object to TenantData interface
   */
  private mapTenantData(tenant: any): TenantData {
    return {
      tenant_payments: tenant.tenant_payments?.map((p: any) => ({
        start_date: p.start_date,
        end_date: p.end_date,
        status: p.status,
        actual_rent_amount: p.actual_rent_amount,
        amount_paid: p.amount_paid,
      })),
      advance_payments: tenant.advance_payments?.map((p: any) => ({
        status: p.status,
      })),
      refund_payments: tenant.refund_payments?.map((p: any) => ({
        status: p.status,
      })),
      check_in_date: tenant.check_in_date,
      check_out_date: tenant.check_out_date,
      rooms: tenant.rooms
        ? {
            rent_price: tenant.rooms.rent_price,
          }
        : undefined,
    };
  }
}
