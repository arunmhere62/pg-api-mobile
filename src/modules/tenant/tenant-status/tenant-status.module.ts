import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { CommonModule } from '../../common/common.module';
import { TenantStatusController } from './tenant-status.controller';
import { TenantStatusService } from './tenant-status.service';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [TenantStatusController],
  providers: [TenantStatusService],
  exports: [TenantStatusService],
})
export class TenantStatusModule {}
