import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { PendingPaymentController } from './pending-payment.controller';
import { PendingPaymentService } from './pending-payment.service';
import { CheckoutModule } from './checkout/checkout.module';
import { TenantPaymentModule } from './tenant-payment/tenant-payment.module';
import { AdvancePaymentModule } from './advance-payment/advance-payment.module';

@Module({
  imports: [PrismaModule, CheckoutModule, TenantPaymentModule, AdvancePaymentModule],
  controllers: [TenantController, PendingPaymentController],
  providers: [TenantService, PendingPaymentService],
  exports: [TenantService, PendingPaymentService],
})
export class TenantModule {}
