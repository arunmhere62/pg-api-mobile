# 🔔 Backend Notification Setup - Complete Guide

## ✅ What's Done

- ✅ Database tables created (notification_settings, notifications, user_fcm_tokens)
- ✅ Prisma schema updated
- ✅ Notification module created
- ✅ Notification service implemented (with Prisma ORM)
- ✅ Notification controller with API endpoints
- ✅ Module registered in app.module.ts

---

## 📋 Next Steps to Complete Backend Setup

### Step 1: Install Firebase Admin SDK

```bash
cd api
npm install firebase-admin
```

### Step 2: Save Firebase Service Account JSON

1. Create file: `api/firebase-service-account.json`
2. Paste the JSON content from your email:

```json
{
  "type": "service_account",
  "project_id": "indianpgmanagement",
  "private_key_id": "54ece26736cce054b131204e27e60b0856078f9b",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "firebase-adminsdk-fbsvc@indianpgmanagement.iam.gserviceaccount.com",
  ...
}
```

3. **IMPORTANT**: Add to `.gitignore`:

```bash
# Add this line to api/.gitignore
firebase-service-account.json
```

### Step 3: Regenerate Prisma Client

```bash
cd api
npx prisma generate
```

This will fix all the Prisma type errors.

### Step 4: Start the Backend

```bash
npm run start:dev
```

You should see:
```
✅ Firebase Admin initialized successfully
[Nest] INFO [NotificationModule] NotificationModule dependencies initialized
```

---

## 📡 API Endpoints Available

### 1. Register FCM Token
```http
POST /notifications/register-token
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "fcm_token": "ExponentPushToken[xxxxxxxxxxxxxx]",
  "device_type": "ios",
  "device_id": "iPhone-12345",
  "device_name": "John's iPhone"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token registered"
}
```

### 2. Get Notification History
```http
GET /notifications/history?page=1&limit=20
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "notifications": [
    {
      "s_no": 1,
      "user_id": 1,
      "title": "💰 Rent Payment Reminder",
      "body": "Your rent of ₹5000 is due in 3 days",
      "type": "RENT_REMINDER",
      "data": { "amount": 5000 },
      "is_read": false,
      "sent_at": "2025-11-01T10:00:00Z",
      "read_at": null
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

### 3. Get Unread Count
```http
GET /notifications/unread-count
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "count": 3
}
```

### 4. Mark as Read
```http
PUT /notifications/:id/read
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true
}
```

### 5. Mark All as Read
```http
PUT /notifications/read-all
Authorization: Bearer <JWT_TOKEN>
```

### 6. Send Test Notification
```http
POST /notifications/test
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "successCount": 1,
  "failureCount": 0
}
```

### 7. Unregister Token (Logout)
```http
DELETE /notifications/unregister-token
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "fcm_token": "ExponentPushToken[xxxxxxxxxxxxxx]"
}
```

---

## 🔧 How to Send Notifications from Your Code

### Example 1: Send Payment Confirmation

In your payment service:

```typescript
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class PaymentService {
  constructor(
    private notificationService: NotificationService,
  ) {}

  async createPayment(paymentData: any) {
    // Save payment to database
    const payment = await this.savePayment(paymentData);

    // Send notification
    await this.notificationService.sendPaymentConfirmation(
      payment.user_id,
      {
        amount: payment.amount,
        payment_id: payment.s_no,
        payment_date: payment.payment_date,
      }
    );

    return payment;
  }
}
```

### Example 2: Send Custom Notification

```typescript
await this.notificationService.sendToUser(userId, {
  title: '🏠 New Tenant Check-in',
  body: `${tenantName} checked into Room ${roomNo}`,
  type: 'TENANT_CHECKIN',
  data: {
    tenant_id: tenantId,
    room_id: roomId,
    check_in_date: checkInDate,
  },
});
```

### Example 3: Send to Multiple Users

```typescript
await this.notificationService.sendToMultipleUsers(
  [userId1, userId2, userId3],
  {
    title: '📢 Important Announcement',
    body: 'Maintenance scheduled for tomorrow',
    type: 'GENERAL',
    data: { date: '2025-11-02' },
  }
);
```

---

## 🕐 Automated Notifications (Cron Jobs)

The service already has methods for automated notifications:

### 1. Rent Payment Reminders

```typescript
// Automatically sends reminders 3 days before rent due date
await this.notificationService.sendRentReminders();
```

### 2. Overdue Payment Alerts

```typescript
// Sends alerts for overdue payments
await this.notificationService.sendOverdueAlerts();
```

### To Schedule These (Optional):

Install NestJS Schedule:
```bash
npm install @nestjs/schedule
```

Add to `notification.service.ts`:

```typescript
import { Cron } from '@nestjs/schedule';

@Cron('0 9 * * *') // Every day at 9 AM
async sendDailyRentReminders() {
  await this.sendRentReminders();
}

@Cron('0 10 * * *') // Every day at 10 AM
async sendDailyOverdueAlerts() {
  await this.sendOverdueAlerts();
}
```

Add ScheduleModule to app.module.ts:

```typescript
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    // ... other modules
  ],
})
```

---

## 🗄️ Database Schema

### user_fcm_tokens
```sql
s_no          INT (PK)
user_id       INT (FK to users)
fcm_token     VARCHAR(512) UNIQUE
device_type   VARCHAR(20)
device_id     VARCHAR(255)
device_name   VARCHAR(255)
is_active     BOOLEAN
created_at    TIMESTAMP
updated_at    TIMESTAMP
```

### notifications
```sql
s_no      INT (PK)
user_id   INT (FK to users)
title     VARCHAR(255)
body      TEXT
type      VARCHAR(50)
data      JSON
is_read   BOOLEAN
sent_at   TIMESTAMP
read_at   TIMESTAMP
```

### notification_settings
```sql
s_no                  INT (PK)
user_id               INT (FK to users) UNIQUE
rent_reminders        BOOLEAN
payment_confirmations BOOLEAN
tenant_alerts         BOOLEAN
maintenance_alerts    BOOLEAN
general_notifications BOOLEAN
created_at            TIMESTAMP
updated_at            TIMESTAMP
```

---

## 🧪 Testing

### Test 1: Check Backend is Running

```bash
curl http://localhost:3000/
```

### Test 2: Register Token (After Login)

```bash
curl -X POST http://localhost:3000/notifications/register-token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fcm_token": "ExponentPushToken[test]",
    "device_type": "ios",
    "device_id": "test-device",
    "device_name": "Test iPhone"
  }'
```

### Test 3: Send Test Notification

```bash
curl -X POST http://localhost:3000/notifications/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test 4: Check Notification History

```bash
curl http://localhost:3000/notifications/history \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test 5: Check Unread Count

```bash
curl http://localhost:3000/notifications/unread-count \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🐛 Troubleshooting

### Error: "Cannot find module 'firebase-admin'"
**Solution:**
```bash
npm install firebase-admin
```

### Error: "Firebase not initialized"
**Solution:**
- Check `firebase-service-account.json` exists in `api/` folder
- Verify JSON is valid
- Check file path in service

### Error: "Property 'notifications' does not exist on type 'PrismaService'"
**Solution:**
```bash
npx prisma generate
```

### Error: "No FCM tokens found for user"
**Solution:**
- User must login and register token first
- Check `user_fcm_tokens` table:
  ```sql
  SELECT * FROM user_fcm_tokens WHERE user_id = 1;
  ```

### Notification Not Sent
**Check:**
1. Firebase service account JSON is correct
2. FCM token is registered in database
3. Backend logs for errors
4. User has granted notification permission on device

---

## 📊 Monitoring

### Check Registered Tokens
```sql
SELECT 
  u.email,
  t.device_type,
  t.device_name,
  t.is_active,
  t.created_at
FROM user_fcm_tokens t
JOIN users u ON t.user_id = u.s_no
WHERE t.is_active = true
ORDER BY t.created_at DESC;
```

### Check Notification History
```sql
SELECT 
  u.email,
  n.title,
  n.type,
  n.is_read,
  n.sent_at
FROM notifications n
JOIN users u ON n.user_id = u.s_no
ORDER BY n.sent_at DESC
LIMIT 20;
```

### Check Unread Notifications
```sql
SELECT 
  user_id,
  COUNT(*) as unread_count
FROM notifications
WHERE is_read = false
GROUP BY user_id;
```

---

## ✅ Checklist

- [ ] `firebase-admin` installed
- [ ] `firebase-service-account.json` created
- [ ] Added to `.gitignore`
- [ ] `npx prisma generate` executed
- [ ] Backend starts without errors
- [ ] Firebase initialized successfully
- [ ] Test notification endpoint works
- [ ] Token registration works
- [ ] Notification history works
- [ ] Unread count works

---

## 🎯 Next Steps

1. ✅ Complete backend setup (follow steps above)
2. ⏳ Setup frontend (see `QUICK_START_NOTIFICATIONS.md`)
3. ⏳ Test end-to-end flow
4. ⏳ Add cron jobs for automated notifications
5. ⏳ Integrate into payment flow
6. ⏳ Deploy to production

---

## 📚 Related Documentation

- `QUICK_START_NOTIFICATIONS.md` - Quick start guide
- `NOTIFICATION_IMPLEMENTATION_STEPS.md` - Detailed implementation
- `FIREBASE_NOTIFICATION_SETUP.md` - Architecture overview
- `NOTIFICATION_SUMMARY.md` - Summary and reference

---

**Ready!** Follow the steps above and your backend will be ready for notifications! 🚀
