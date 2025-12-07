import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { CommonModule } from '../../common/common.module';
import { PendingPaymentController } from './pending-payment.controller';
import { PendingPaymentService } from './pending-payment.service';
import { TenantStatusService } from '../tenant-status/tenant-status.service';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [PendingPaymentController],
  providers: [PendingPaymentService, TenantStatusService],
  exports: [PendingPaymentService],
})
export class PendingPaymentModule {}
