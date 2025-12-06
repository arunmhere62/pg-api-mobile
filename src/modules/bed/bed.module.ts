import { Module } from '@nestjs/common';
import { BedService } from './bed.service';
import { BedController } from './bed.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { S3Module } from '../../s3/s3.module';

@Module({
  imports: [PrismaModule, S3Module],
  controllers: [BedController],
  providers: [BedService],
  exports: [BedService],
})
export class BedModule {}
