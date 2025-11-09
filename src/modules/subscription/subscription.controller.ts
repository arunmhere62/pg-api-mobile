import { Controller, Get, Post, Req, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Subscription')
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  /**
   * Get all active subscription plans (Public - No auth required)
   */
  @Get('plans')
  @ApiOperation({ summary: 'Get all active subscription plans' })
  async getPlans() {
    try {
      console.log('📋 Fetching subscription plans...');
      const plans = await this.subscriptionService.getActivePlans();
      console.log(`✅ Found ${plans.length} active plans`);
      return {
        success: true,
        plans,
      };
    } catch (error) {
      console.error('❌ Error fetching plans:', error);
      return {
        success: false,
        plans: [],
        error: 'Failed to fetch subscription plans',
      };
    }
  }

  /**
   * Get current user's active subscription
   */
  @Get('current')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user active subscription' })
  async getCurrentSubscription(@Req() req: any) {
    const userId = parseInt(req.headers['x-user-id']);
    const organizationId = parseInt(req.headers['x-organization-id']);

    const subscription = await this.subscriptionService.getCurrentSubscription(
      userId,
      organizationId,
    );

    return {
      success: true,
      subscription,
    };
  }

  /**
   * Check subscription status
   */
  @Get('status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if user has active subscription' })
  async checkStatus(@Req() req: any) {
    try {
      const userId = parseInt(req.headers['x-user-id']) || req.user?.userId;
      const organizationId = parseInt(req.headers['x-organization-id']) || req.user?.organizationId;

      if (!userId || !organizationId) {
        console.log('⚠️ Missing user info - userId:', userId, 'orgId:', organizationId);
        return {
          success: true,
          isActive: false,
          subscription: null,
        };
      }

      console.log('✅ Checking subscription for user:', userId, 'org:', organizationId);

      const result = await this.subscriptionService.checkSubscriptionStatus(
        userId,
        organizationId,
      );

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      console.error('❌ Error checking subscription status:', error);
      return {
        success: true,
        isActive: false,
        subscription: null,
      };
    }
  }

  /**
   * Get all user subscriptions (history)
   */
  @Get('history')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user subscription history' })
  async getHistory(@Req() req: any) {
    const userId = parseInt(req.headers['x-user-id']);
    const organizationId = parseInt(req.headers['x-organization-id']);

    const subscriptions = await this.subscriptionService.getUserSubscriptions(
      userId,
      organizationId,
    );

    return {
      success: true,
      subscriptions,
    };
  }

  /**
   * Subscribe to a plan
   */
  @Post('subscribe')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Subscribe to a plan' })
  async subscribe(@Req() req: any, @Body() body: { plan_id: number }) {
    const userId = parseInt(req.headers['x-user-id']);
    const organizationId = parseInt(req.headers['x-organization-id']);
    const { plan_id } = body;

    console.log('📦 Subscribe request:', { userId, organizationId, plan_id });

    const result = await this.subscriptionService.initiateSubscription(
      userId,
      organizationId,
      plan_id,
    );

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Test CCAvenue configuration
   */
  @Get('test-ccavenue')
  @ApiOperation({ summary: 'Test CCAvenue configuration' })
  async testCCAvenue() {
    return this.subscriptionService.testCCAvenueConfig();
  }

  /**
   * Payment callback - Success
   */
  @Post('payment/callback')
  @ApiOperation({ summary: 'CCAvenue payment callback' })
  async paymentCallback(@Body() body: any, @Req() req: any) {
    console.log('💳 Payment callback received:', body);
    
    try {
      const result = await this.subscriptionService.handlePaymentCallback(body);
      
      // Return HTML response to show success message
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Success</title>
          <style>
            body { font-family: Arial; text-align: center; padding: 50px; background: #f0f0f0; }
            .success { background: #4CAF50; color: white; padding: 20px; border-radius: 10px; }
            .button { background: #2196F3; color: white; padding: 15px 30px; text-decoration: none; 
                     border-radius: 5px; display: inline-block; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="success">
            <h1>✅ Payment Successful!</h1>
            <p>Your subscription has been activated.</p>
            <p>Order ID: ${result.orderId}</p>
            <a href="pgmanagement://subscription/success" class="button">Return to App</a>
          </div>
        </body>
        </html>
      `;
    } catch (error) {
      console.error('❌ Payment callback error:', error);
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Failed</title>
          <style>
            body { font-family: Arial; text-align: center; padding: 50px; background: #f0f0f0; }
            .error { background: #f44336; color: white; padding: 20px; border-radius: 10px; }
            .button { background: #2196F3; color: white; padding: 15px 30px; text-decoration: none; 
                     border-radius: 5px; display: inline-block; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>❌ Payment Failed</h1>
            <p>There was an error processing your payment.</p>
            <a href="pgmanagement://subscription/failed" class="button">Return to App</a>
          </div>
        </body>
        </html>
      `;
    }
  }

  /**
   * Payment cancel
   */
  @Post('payment/cancel')
  @ApiOperation({ summary: 'CCAvenue payment cancel' })
  async paymentCancel(@Body() body: any) {
    console.log('🚫 Payment cancelled:', body);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Cancelled</title>
        <style>
          body { font-family: Arial; text-align: center; padding: 50px; background: #f0f0f0; }
          .cancel { background: #ff9800; color: white; padding: 20px; border-radius: 10px; }
          .button { background: #2196F3; color: white; padding: 15px 30px; text-decoration: none; 
                   border-radius: 5px; display: inline-block; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="cancel">
          <h1>⚠️ Payment Cancelled</h1>
          <p>You have cancelled the payment.</p>
          <a href="pgmanagement://subscription/cancelled" class="button">Return to App</a>
        </div>
      </body>
      </html>
    `;
  }
}
