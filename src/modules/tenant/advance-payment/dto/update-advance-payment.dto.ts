import { PartialType } from '@nestjs/swagger';
import { CreateAdvancePaymentDto } from './create-advance-payment.dto';

export class UpdateAdvancePaymentDto extends PartialType(CreateAdvancePaymentDto) {}
