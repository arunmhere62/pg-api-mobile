import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all active subscription plans
   */
  async getActivePlans() {
    const plans = await this.prisma.subscription_plans.findMany({
      where: { is_active: true },
      orderBy: { price: 'asc' },
      select: {
        s_no: true,
        name: true,
        description: true,
        duration: true,
        price: true,
        currency: true,
        features: true,
        max_pg_locations: true,
        max_tenants: true,
        is_active: true,
      },
    });

    return plans;
  }

  /**
   * Get current active subscription for a user
   */
  async getCurrentSubscription(userId: number, organizationId: number) {
    const subscription = await this.prisma.user_subscriptions.findFirst({
      where: {
        user_id: userId,
        organization_id: organizationId,
        status: 'ACTIVE',
        end_date: { gte: new Date() },
      },
      include: {
        subscription_plans: true,
      },
      orderBy: {
        end_date: 'desc',
      },
    });

    return subscription;
  }

  /**
   * Check if user has active subscription
   */
  async checkSubscriptionStatus(userId: number, organizationId: number) {
    const subscription = await this.getCurrentSubscription(userId, organizationId);
    
    return {
      isActive: !!subscription,
      subscription: subscription || null,
    };
  }

  /**
   * Get subscription by ID
   */
  async getSubscriptionById(subscriptionId: number) {
    const subscription = await this.prisma.user_subscriptions.findUnique({
      where: { s_no: subscriptionId },
      include: {
        subscription_plans: true,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }

  /**
   * Get all subscriptions for a user
   */
  async getUserSubscriptions(userId: number, organizationId: number) {
    const subscriptions = await this.prisma.user_subscriptions.findMany({
      where: {
        user_id: userId,
        organization_id: organizationId,
      },
      include: {
        subscription_plans: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return subscriptions;
  }
}
