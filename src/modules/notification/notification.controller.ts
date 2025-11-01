import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationService, RegisterTokenDto, SendNotificationDto } from './notification.service';
import { HeadersValidationGuard } from '../../common/guards/headers-validation.guard';

@Controller('notifications')
@UseGuards(HeadersValidationGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Register FCM token
   * POST /notifications/register-token
   */
  @Post('register-token')
  async registerToken(@Request() req, @Body() body: RegisterTokenDto) {
    const userId = req.user.userId || req.user.s_no;
    return await this.notificationService.registerToken(userId, body);
  }

  /**
   * Unregister FCM token
   * DELETE /notifications/unregister-token
   */
  @Delete('unregister-token')
  async unregisterToken(@Body() body: { fcm_token: string }) {
    return await this.notificationService.unregisterToken(body.fcm_token);
  }

  /**
   * Get notification history
   * GET /notifications/history?page=1&limit=20
   */
  @Get('history')
  async getHistory(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user.userId || req.user.s_no;
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 20;
    
    return await this.notificationService.getHistory(userId, pageNum, limitNum);
  }

  /**
   * Get unread notification count
   * GET /notifications/unread-count
   */
  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const userId = req.user.userId || req.user.s_no;
    return await this.notificationService.getUnreadCount(userId);
  }

  /**
   * Mark notification as read
   * PUT /notifications/:id/read
   */
  @Put(':id/read')
  async markAsRead(@Request() req, @Param('id') id: string) {
    const userId = req.user.userId || req.user.s_no;
    const notificationId = parseInt(id);
    return await this.notificationService.markAsRead(notificationId, userId);
  }

  /**
   * Mark all notifications as read
   * PUT /notifications/read-all
   */
  @Put('read-all')
  async markAllAsRead(@Request() req) {
    const userId = req.user.userId || req.user.s_no;
    return await this.notificationService.markAllAsRead(userId);
  }

  /**
   * Send test notification (for testing)
   * POST /notifications/test
   */
  @Post('test')
  async sendTestNotification(@Request() req) {
    const userId = req.user.userId || req.user.s_no;
    
    return await this.notificationService.sendToUser(userId, {
      title: '🎉 Test Notification',
      body: 'This is a test notification from PG Management System',
      type: 'TEST',
      data: {
        test: true,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Manually trigger rent reminders (for testing)
   * POST /notifications/trigger-rent-reminders
   */
  @Post('trigger-rent-reminders')
  async triggerRentReminders() {
    return await this.notificationService.sendRentReminders();
  }

  /**
   * Manually trigger overdue alerts (for testing)
   * POST /notifications/trigger-overdue-alerts
   */
  @Post('trigger-overdue-alerts')
  async triggerOverdueAlerts() {
    return await this.notificationService.sendOverdueAlerts();
  }

  /**
   * Send pending payment notifications
   * POST /notifications/trigger-pending-payments
   */
  @Post('trigger-pending-payments')
  async triggerPendingPayments() {
    return await this.notificationService.sendPendingPaymentNotifications();
  }

  /**
   * Send payment due soon notifications (3 days before)
   * POST /notifications/trigger-due-soon
   */
  @Post('trigger-due-soon')
  async triggerDueSoon() {
    return await this.notificationService.sendPaymentDueSoonNotifications();
  }

  /**
   * Send overdue payment notifications
   * POST /notifications/trigger-overdue-payments
   */
  @Post('trigger-overdue-payments')
  async triggerOverduePayments() {
    return await this.notificationService.sendOverduePaymentNotifications();
  }
}
