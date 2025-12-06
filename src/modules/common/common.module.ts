import { Module } from '@nestjs/common';
import { S3Module } from '../../s3/s3.module';
import { PendingRentCalculatorService } from './pending-rent-calculator.service';
import { S3DeletionService } from './s3-deletion.service';

@Module({
  imports: [S3Module],
  providers: [PendingRentCalculatorService, S3DeletionService],
  exports: [PendingRentCalculatorService, S3DeletionService],
})
export class CommonModule {}
