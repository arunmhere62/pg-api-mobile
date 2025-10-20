import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { PendingPaymentController } from './pending-payment.controller';
import { PendingPaymentService } from './pending-payment.service';

@Module({
  imports: [PrismaModule],
  controllers: [TenantController, PendingPaymentController],
  providers: [TenantService, PendingPaymentService],
  exports: [TenantService, PendingPaymentService],
})
export class TenantModule {}
