import {
  Controller,
  Post,
  Put,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { CheckoutTenantDto } from './dto/checkout-tenant.dto';
import { HeadersValidationGuard } from '../../../common/guards/headers-validation.guard';
import { RequireHeaders } from '../../../common/decorators/require-headers.decorator';
import { ValidatedHeaders } from '../../../common/decorators/validated-headers.decorator';
import { UpdateCheckoutDateDto } from '../dto/update-checkout-date.dto';
import { CheckoutService } from './checkout.service';

@ApiTags('Tenant Checkout')
@Controller('tenants')
@UseGuards(HeadersValidationGuard)
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  /**
   * Check out tenant
   * POST /api/v1/tenants/:id/checkout
   */
  @Post(':id/checkout')
  @RequireHeaders({ pg_id: true, organization_id: true, user_id: true })
  @ApiOperation({ 
    summary: 'Checkout tenant',
    description: 'Mark tenant as checked out with optional checkout date. Defaults to current date if not provided.'
  })
  @ApiParam({ 
    name: 'id', 
    type: Number, 
    description: 'Tenant ID' 
  })
  @ApiBody({ 
    type: CheckoutTenantDto,
    description: 'Optional checkout date',
    examples: {
      withDate: {
        summary: 'With specific date',
        value: { check_out_date: '2025-10-25' }
      },
      withoutDate: {
        summary: 'Use current date',
        value: {}
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Tenant checked out successfully',
    schema: {
      example: {
        success: true,
        message: 'Tenant checked out successfully',
        data: {
          s_no: 1,
          name: 'John Doe',
          status: 'INACTIVE',
          check_out_date: '2025-10-25T00:00:00.000Z'
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async checkout(
    @ValidatedHeaders() headers: ValidatedHeaders,
    @Param('id', ParseIntPipe) id: number,
    @Body() checkoutDto: CheckoutTenantDto,
  ) {
    return this.checkoutService.checkout(id, checkoutDto);
  }

  /**
   * Update or clear checkout date
   * PUT /api/v1/tenants/:id/checkout-date
   */
  @Put(':id/checkout-date')
  @RequireHeaders({ pg_id: true, organization_id: true, user_id: true })
  @ApiOperation({ 
    summary: 'Update or clear checkout date',
    description: 'Change the checkout date or clear it to reactivate the tenant'
  })
  @ApiParam({ 
    name: 'id', 
    type: Number, 
    description: 'Tenant ID' 
  })
  @ApiBody({ 
    type: UpdateCheckoutDateDto,
    description: 'Checkout date update options',
    examples: {
      updateDate: {
        summary: 'Update checkout date',
        value: { check_out_date: '2025-11-01' }
      },
      clearCheckout: {
        summary: 'Clear checkout and reactivate',
        value: { clear_checkout: true }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Checkout date updated successfully',
    schema: {
      example: {
        success: true,
        message: 'Checkout date updated successfully',
        data: {
          s_no: 1,
          name: 'John Doe',
          status: 'ACTIVE',
          check_out_date: null
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiResponse({ status: 400, description: 'Invalid request - must provide either check_out_date or clear_checkout' })
  async updateCheckoutDate(
    @ValidatedHeaders() headers: ValidatedHeaders,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCheckoutDateDto: UpdateCheckoutDateDto,
  ) {
    return this.checkoutService.updateCheckoutDate(id, updateCheckoutDateDto);
  }
}
