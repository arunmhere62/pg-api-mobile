import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionsSeedService } from './permissions-seed.service';
import { PermissionsController } from './permissions.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PermissionsController],
  providers: [PermissionsService, PermissionsSeedService],
  exports: [PermissionsService, PermissionsSeedService],
})
export class PermissionsModule {}
