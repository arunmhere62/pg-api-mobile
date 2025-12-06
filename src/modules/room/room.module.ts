import { Module } from '@nestjs/common';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { S3Module } from '../../s3/s3.module';

@Module({
  imports: [PrismaModule, S3Module],
  controllers: [RoomController],
  providers: [RoomService],
  exports: [RoomService],
})
export class RoomModule {}
