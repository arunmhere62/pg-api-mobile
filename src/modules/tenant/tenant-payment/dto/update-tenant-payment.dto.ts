import { PartialType } from '@nestjs/swagger';
import { CreateTenantPaymentDto } from './create-tenant-payment.dto';

export class UpdateTenantPaymentDto extends PartialType(CreateTenantPaymentDto) {}
