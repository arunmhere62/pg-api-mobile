import { Module } from '@nestjs/common';
import { PendingRentCalculatorService } from './pending-rent-calculator.service';

@Module({
  providers: [PendingRentCalculatorService],
  exports: [PendingRentCalculatorService],
})
export class CommonModule {}
