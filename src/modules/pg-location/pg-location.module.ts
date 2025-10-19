import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PgLocationController } from './pg-location.controller';
import { PgLocationService } from './pg-location.service';

@Module({
  imports: [PrismaModule],
  controllers: [PgLocationController],
  providers: [PgLocationService],
  exports: [PgLocationService],
})
export class PgLocationModule {}
