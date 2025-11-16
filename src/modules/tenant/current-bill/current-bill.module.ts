import { Module } from '@nestjs/common';
import { CurrentBillService } from './current-bill.service';
import { CurrentBillController } from './current-bill.controller';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CurrentBillController],
  providers: [CurrentBillService],
  exports: [CurrentBillService],
})
export class CurrentBillModule {}
