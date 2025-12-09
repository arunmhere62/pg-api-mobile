import { PartialType } from '@nestjs/swagger';
import { CreateTenantPaymentDto } from './create-rent-payment.dto';

export class UpdateTenantPaymentDto extends PartialType(CreateTenantPaymentDto) {}
