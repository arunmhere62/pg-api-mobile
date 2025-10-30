import { Module } from '@nestjs/common';
import { EmployeeSalaryController } from './employee-salary.controller';
import { EmployeeSalaryService } from './employee-salary.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EmployeeSalaryController],
  providers: [EmployeeSalaryService],
  exports: [EmployeeSalaryService],
})
export class EmployeeSalaryModule {}
