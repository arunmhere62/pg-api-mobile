import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { LocationModule } from './modules/location/location.module';
import { PgLocationModule } from './modules/pg-location/pg-location.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: configuration,
    }),
    PrismaModule,
    AuthModule,
    LocationModule,
    PgLocationModule,
    OrganizationModule,
    TenantModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
