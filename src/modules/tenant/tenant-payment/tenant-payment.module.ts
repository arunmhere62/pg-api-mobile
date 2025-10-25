import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { TenantPaymentController } from './tenant-payment.controller';
import { TenantPaymentService } from './tenant-payment.service';

@Module({
  imports: [PrismaModule],
  controllers: [TenantPaymentController],
  providers: [TenantPaymentService],
  exports: [TenantPaymentService],
})
export class TenantPaymentModule {}
