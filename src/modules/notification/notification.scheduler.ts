import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationService } from './notification.service';

/**
 * Notification Scheduler
 * 
 * Handles automated notification sending using cron jobs
 */
@Injectable()
export class NotificationScheduler {
  private readonly logger = new Logger(NotificationScheduler.name);

  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Send payment due soon notifications
   * Runs every day at 9:00 AM
   */
  @Cron('0 9 * * *', {
    name: 'payment-due-soon',
    timeZone: 'Asia/Kolkata',
  })
  async handlePaymentDueSoon() {
    this.logger.log('🔔 Running payment due soon notifications...');
    try {
      const result = await this.notificationService.sendPaymentDueSoonNotifications();
      this.logger.log(`✅ Sent ${result.sent}/${result.total} payment due soon notifications`);
    } catch (error) {
      this.logger.error(`❌ Failed to send payment due soon notifications: ${error.message}`);
    }
  }

  /**
   * Send overdue payment notifications
   * Runs every day at 10:00 AM
   */
  @Cron('0 10 * * *', {
    name: 'overdue-payments',
    timeZone: 'Asia/Kolkata',
  })
  async handleOverduePayments() {
    this.logger.log('🔔 Running overdue payment notifications...');
    try {
      const result = await this.notificationService.sendOverduePaymentNotifications();
      this.logger.log(`✅ Sent ${result.sent}/${result.total} overdue payment notifications`);
    } catch (error) {
      this.logger.error(`❌ Failed to send overdue payment notifications: ${error.message}`);
    }
  }

  /**
   * Send pending payment reminders
   * Runs every Monday at 9:00 AM
   */
  @Cron('0 9 * * 1', {
    name: 'pending-payments',
    timeZone: 'Asia/Kolkata',
  })
  async handlePendingPayments() {
    this.logger.log('🔔 Running pending payment notifications...');
    try {
      const result = await this.notificationService.sendPendingPaymentNotifications();
      this.logger.log(`✅ Sent ${result.sent}/${result.total} pending payment notifications`);
    } catch (error) {
      this.logger.error(`❌ Failed to send pending payment notifications: ${error.message}`);
    }
  }

  /**
   * Send rent reminders (existing functionality)
   * Runs every day at 8:00 AM
   */
  @Cron('0 8 * * *', {
    name: 'rent-reminders',
    timeZone: 'Asia/Kolkata',
  })
  async handleRentReminders() {
    this.logger.log('🔔 Running rent reminders...');
    try {
      const result = await this.notificationService.sendRentReminders();
      this.logger.log(`✅ Sent ${result.sent} rent reminders`);
    } catch (error) {
      this.logger.error(`❌ Failed to send rent reminders: ${error.message}`);
    }
  }

  /**
   * Send overdue alerts (existing functionality)
   * Runs every day at 11:00 AM
   */
  @Cron('0 11 * * *', {
    name: 'overdue-alerts',
    timeZone: 'Asia/Kolkata',
  })
  async handleOverdueAlerts() {
    this.logger.log('🔔 Running overdue alerts...');
    try {
      const result = await this.notificationService.sendOverdueAlerts();
      this.logger.log(`✅ Sent ${result.sent} overdue alerts`);
    } catch (error) {
      this.logger.error(`❌ Failed to send overdue alerts: ${error.message}`);
    }
  }
}
