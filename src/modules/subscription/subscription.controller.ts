import { Controller, Get, Req, UseGuards } from '@nestjs/common';
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
}
