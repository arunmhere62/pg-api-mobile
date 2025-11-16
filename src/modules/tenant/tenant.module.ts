import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { PendingPaymentController } from './pending-payment.controller';
import { PendingPaymentService } from './pending-payment.service';
import { TenantStatusController } from './tenant-status.controller';
import { TenantStatusService } from './tenant-status.service';
import { CheckoutModule } from './checkout/checkout.module';
import { TenantPaymentModule } from './tenant-payment/tenant-payment.module';
import { AdvancePaymentModule } from './advance-payment/advance-payment.module';
import { RefundPaymentModule } from './refund-payment/refund-payment.module';
import { CurrentBillModule } from './current-bill/current-bill.module';

@Module({
  imports: [PrismaModule, CommonModule, CheckoutModule, TenantPaymentModule, AdvancePaymentModule, RefundPaymentModule, CurrentBillModule],
  controllers: [TenantController, PendingPaymentController, TenantStatusController],
  providers: [TenantService, PendingPaymentService, TenantStatusService],
  exports: [TenantService, PendingPaymentService, TenantStatusService],
})
export class TenantModule {}
