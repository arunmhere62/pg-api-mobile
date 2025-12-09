import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { TenantPaymentController } from './rent-payment.controller';
import { TenantPaymentService } from './rent-payment.service';

@Module({
  imports: [PrismaModule],
  controllers: [TenantPaymentController],
  providers: [TenantPaymentService],
  exports: [TenantPaymentService],
})
export class TenantPaymentModule {}
