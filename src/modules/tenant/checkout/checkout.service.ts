import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CheckoutTenantDto } from './dto/checkout-tenant.dto';
import { UpdateCheckoutDateDto } from '../dto/update-checkout-date.dto';

@Injectable()
export class CheckoutService {
  constructor(private prisma: PrismaService) {}

  /**
   * Check out tenant
   */
  async checkout(id: number, checkoutDto: CheckoutTenantDto) {
    const tenant = await this.prisma.tenants.findFirst({
      where: {
        s_no: id,
        is_deleted: false,
      },
      include: {
        tenant_payments: {
          where: {
            is_deleted: false,
          },
          select: {
            s_no: true,
            status: true,
            amount_paid: true,
            payment_date: true,
          },
        },
        advance_payments: {
          where: {
            is_deleted: false,
          },
          select: {
            s_no: true,
            status: true,
            amount_paid: true,
            payment_date: true,
          },
        },
        refund_payments: {
          where: {
            is_deleted: false,
          },
          select: {
            s_no: true,
            status: true,
            amount_paid: true,
            payment_date: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    // Check if all payments are paid
    const unpaidRentPayments = tenant.tenant_payments.filter(
      (payment) => payment.status !== 'PAID'
    );
    const unpaidAdvancePayments = tenant.advance_payments.filter(
      (payment) => payment.status !== 'PAID'
    );
    const unpaidRefundPayments = tenant.refund_payments.filter(
      (payment) => payment.status !== 'PAID'
    );

    const totalUnpaidPayments = 
      unpaidRentPayments.length + 
      unpaidAdvancePayments.length + 
      unpaidRefundPayments.length;

    if (totalUnpaidPayments > 0) {
      const unpaidDetails = [];
      
      if (unpaidRentPayments.length > 0) {
        unpaidDetails.push(`${unpaidRentPayments.length} rent payment(s)`);
      }
      if (unpaidAdvancePayments.length > 0) {
        unpaidDetails.push(`${unpaidAdvancePayments.length} advance payment(s)`);
      }
      if (unpaidRefundPayments.length > 0) {
        unpaidDetails.push(`${unpaidRefundPayments.length} refund payment(s)`);
      }

      throw new BadRequestException(
        `Cannot checkout tenant. There are ${totalUnpaidPayments} unpaid payment(s): ${unpaidDetails.join(', ')}. Please mark all payments as PAID before checkout.`
      );
    }

    // Use provided checkout date or default to now
    const checkoutDate = checkoutDto.check_out_date 
      ? new Date(checkoutDto.check_out_date) 
      : new Date();

    // Update tenant status
    const updatedTenant = await this.prisma.tenants.update({
      where: { s_no: id },
      data: {
        status: 'INACTIVE',
        check_out_date: checkoutDate,
      },
      include: {
        pg_locations: true,
        rooms: true,
        beds: true,
      },
    });

    return {
      success: true,
      message: 'Tenant checked out successfully',
      data: updatedTenant,
    };
  }

  /**
   * Update or clear checkout date
   */
  async updateCheckoutDate(id: number, updateCheckoutDateDto: UpdateCheckoutDateDto) {
    const tenant = await this.prisma.tenants.findFirst({
      where: {
        s_no: id,
        is_deleted: false,
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    let updateData: any = {};

    if (updateCheckoutDateDto.clear_checkout) {
      // Clear checkout date and reactivate tenant
      updateData = {
        check_out_date: null,
        status: 'ACTIVE',
      };
    } else if (updateCheckoutDateDto.check_out_date) {
      // Update checkout date
      updateData = {
        check_out_date: new Date(updateCheckoutDateDto.check_out_date),
      };
    } else {
      throw new BadRequestException('Either provide check_out_date or set clear_checkout to true');
    }

    const updatedTenant = await this.prisma.tenants.update({
      where: { s_no: id },
      data: updateData,
      include: {
        pg_locations: true,
        rooms: true,
        beds: true,
      },
    });

    const message = updateCheckoutDateDto.clear_checkout
      ? 'Checkout cleared and tenant reactivated successfully'
      : 'Checkout date updated successfully';

    return {
      success: true,
      message,
      data: updatedTenant,
    };
  }
}
