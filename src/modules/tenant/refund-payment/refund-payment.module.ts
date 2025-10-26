import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { RefundPaymentService } from './refund-payment.service';
import { RefundPaymentController } from './refund-payment.controller';

@Module({
  imports: [PrismaModule],
  controllers: [RefundPaymentController],
  providers: [RefundPaymentService],
  exports: [RefundPaymentService],
})
export class RefundPaymentModule {}
