import { Module } from '@nestjs/common';
import { AdvancePaymentService } from './advance-payment.service';
import { AdvancePaymentController } from './advance-payment.controller';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdvancePaymentController],
  providers: [AdvancePaymentService],
  exports: [AdvancePaymentService],
})
export class AdvancePaymentModule {}
