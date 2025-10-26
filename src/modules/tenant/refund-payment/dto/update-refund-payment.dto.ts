import { PartialType } from '@nestjs/swagger';
import { CreateRefundPaymentDto } from './create-refund-payment.dto';

export class UpdateRefundPaymentDto extends PartialType(CreateRefundPaymentDto) {}
