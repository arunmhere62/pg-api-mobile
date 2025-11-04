# 🧪 API Testing Guide

## ✅ Your API is Live!

**Base URL:** `https://pg-api-mobile.onrender.com`

## 🌐 Test in Browser

### 1. Health Check
```
https://pg-api-mobile.onrender.com/api/v1/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-04T..."
}
```

### 2. Swagger API Documentation
```
https://pg-api-mobile.onrender.com/api/docs
```

This opens interactive API documentation where you can:
- ✅ See all endpoints
- ✅ Test API calls
- ✅ View request/response schemas

### 3. Root Endpoint
```
https://pg-api-mobile.onrender.com
```

## 📱 Test with Postman

### Setup Base URL
1. Open Postman
2. Create new collection: "PG API"
3. Set variable: `baseUrl = https://pg-api-mobile.onrender.com`

### Test Endpoints

#### 1. Health Check
```
GET {{baseUrl}}/api/v1/health
```

#### 2. Send OTP
```
POST {{baseUrl}}/api/v1/auth/send-otp
Content-Type: application/json

{
  "phone_no": "9876543210"
}
```

#### 3. Verify OTP
```
POST {{baseUrl}}/api/v1/auth/verify-otp
Content-Type: application/json

{
  "phone_no": "9876543210",
  "otp": "123456"
}
```

#### 4. Get Tenants (with JWT)
```
GET {{baseUrl}}/api/v1/tenants
Authorization: Bearer <your_jwt_token>
X-PG-Location-Id: 1
X-Organization-Id: 1
X-User-Id: 1
```

## 💻 Test with cURL

### Health Check
```bash
curl https://pg-api-mobile.onrender.com/api/v1/health
```

### Send OTP
```bash
curl -X POST https://pg-api-mobile.onrender.com/api/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone_no": "9876543210"}'
```

### Verify OTP
```bash
curl -X POST https://pg-api-mobile.onrender.com/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone_no": "9876543210", "otp": "123456"}'
```

### Get Tenants (with token)
```bash
curl https://pg-api-mobile.onrender.com/api/v1/tenants \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-PG-Location-Id: 1" \
  -H "X-Organization-Id: 1" \
  -H "X-User-Id: 1"
```

## 📱 Connect Mobile App

Update your mobile app's API base URL:

### In `mob-ui/src/services/core/axiosInstance.ts`

```typescript
const API_BASE_URL = 'https://pg-api-mobile.onrender.com/api/v1';
```

Or use environment variables:

```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000/api/v1'  // Local dev
  : 'https://pg-api-mobile.onrender.com/api/v1';  // Production
```

## ⚠️ Important Notes

### 1. Free Instance Spin Down
Render free tier spins down after 15 minutes of inactivity.

**First request after spin down:**
- ⏱️ Takes 30-60 seconds to wake up
- ⏱️ Subsequent requests are fast

**Solution:** Upgrade to paid plan ($7/month) for always-on instance.

### 2. Cold Start Handling

In your mobile app, add retry logic:

```typescript
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds for first request
});

// Retry on timeout
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    if (error.code === 'ECONNABORTED' && !error.config.__isRetry) {
      error.config.__isRetry = true;
      return axiosInstance(error.config);
    }
    return Promise.reject(error);
  }
);
```

### 3. CORS Configuration

Your API already has CORS enabled for all origins:

```typescript
app.enableCors({
  origin: true,  // ✅ Allows all origins
  credentials: true,
});
```

## 🎯 Quick Test Checklist

- [ ] Open Swagger docs in browser
- [ ] Test health endpoint
- [ ] Send OTP to your phone
- [ ] Verify OTP
- [ ] Get JWT token
- [ ] Test protected endpoint with token
- [ ] Update mobile app base URL
- [ ] Test login from mobile app
- [ ] Test tenant list from mobile app

## 📊 Monitor Your API

### Render Dashboard
- **Logs:** Real-time application logs
- **Metrics:** CPU, Memory, Response times
- **Events:** Deployments, restarts

### Check API Status
```bash
# Quick health check
curl -I https://pg-api-mobile.onrender.com/api/v1/health

# Should return:
HTTP/2 200
```

## 🐛 Troubleshooting

### Issue: "Connection timeout"
**Cause:** Free instance is spinning up (cold start)

**Solution:** Wait 30-60 seconds and retry

### Issue: "401 Unauthorized"
**Cause:** Missing or invalid JWT token

**Solution:** 
1. Login to get fresh token
2. Add `Authorization: Bearer <token>` header

### Issue: "CORS error"
**Cause:** Browser blocking request

**Solution:** Already configured! If still issues, check:
- API is running
- Correct base URL
- No typos in endpoint

## ✅ Success Indicators

Your API is working if:
- ✅ Swagger docs load
- ✅ Health endpoint returns 200
- ✅ Can send OTP
- ✅ Can verify OTP and get token
- ✅ Protected routes work with token

## 🚀 Next Steps

1. **Test all endpoints** via Swagger
2. **Update mobile app** with production URL
3. **Test mobile app** login flow
4. **Monitor logs** in Render dashboard
5. **Consider upgrading** to paid plan to avoid cold starts

---

**Your API is live and working!** 🎉

Base URL: `https://pg-api-mobile.onrender.com`
