# Pending Rent Calculator Service - Complete Guide

## 🎯 Overview

The **PendingRentCalculatorService** is a comprehensive service that calculates detailed pending rent information for tenants, including monthly breakdowns, overdue amounts, recommendations, and statistics.

## 📊 What It Calculates

Based on your tenant data, the service provides:

### 📅 **Monthly Breakdown**
- **Which months** are pending (e.g., "October 2025", "November 2025")
- **Expected vs Paid amounts** for each month
- **Days overdue** for each pending month
- **Status** of each month (FULLY_PENDING, PARTIALLY_PAID, OVERDUE)

### 💰 **Financial Summary**
- **Total pending amount** across all months
- **Partial payment amounts** (like your ₹3000 partial for Tamizh vannan)
- **Overdue amounts** (payments past grace period)
- **Advance balance** available to offset pending amounts

### 🚨 **Smart Recommendations**
- **NO_ACTION**: All payments up to date
- **FOLLOW_UP**: Single month pending
- **URGENT_FOLLOW_UP**: Multiple months pending
- **NOTICE**: Overdue payments requiring immediate action
- **EVICTION_WARNING**: Severe overdue situation (2+ months)

## 🔧 API Endpoints Created

### 1. **Individual Tenant Details**
```
GET /tenants/{id}/pending-rent-details
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "tenant": {
      "id": 313,
      "name": "Tamizh vannan",
      "tenant_id": "TNT455928601",
      "room": "RM001",
      "bed": "BED3",
      "current_rent": "5000"
    },
    "pending_rent_details": {
      "totalPendingAmount": 8000,
      "totalPartialAmount": 3000,
      "totalOverdueAmount": 5000,
      "totalPendingMonths": 2,
      "totalOverdueMonths": 1,
      "pendingMonths": [
        {
          "month": "2025-07",
          "monthName": "July 2025",
          "startDate": "2025-07-31T00:00:00.000Z",
          "endDate": "2025-08-30T00:00:00.000Z",
          "expectedAmount": 5000,
          "paidAmount": 2000,
          "pendingAmount": 3000,
          "status": "PARTIALLY_PAID",
          "daysPending": 104,
          "isOverdue": true,
          "payments": [...]
        },
        {
          "month": "2025-11",
          "monthName": "November 2025",
          "startDate": "2025-11-01T00:00:00.000Z",
          "endDate": "2025-11-30T00:00:00.000Z",
          "expectedAmount": 5000,
          "paidAmount": 0,
          "pendingAmount": 5000,
          "status": "FULLY_PENDING",
          "daysPending": 11,
          "isOverdue": true,
          "payments": []
        }
      ],
      "hasAnyPending": true,
      "hasPartialPayments": true,
      "hasOverduePayments": true,
      "totalAdvancePaid": 2000,
      "hasAdvancePayment": true,
      "advanceBalance": 0,
      "nextDueDate": "2025-08-30T00:00:00.000Z",
      "nextDueAmount": 3000,
      "gracePeriodDays": 5,
      "penaltyAmount": 320,
      "lastPaymentDate": "2025-09-30T00:00:00.000Z",
      "lastPaymentAmount": 5000,
      "totalPaymentsMade": 3,
      "averageMonthlyPayment": 4000,
      "recommendedAction": "NOTICE",
      "recommendationReason": "1 month(s) overdue, immediate payment required"
    }
  }
}
```

### 2. **All Tenants Summary**
```
GET /tenants/pending-rent-summary?page=1&limit=50
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "s_no": 313,
      "name": "Tamizh vannan",
      "total_pending_amount": 8000,
      "pending_months_count": 2,
      "is_overdue": true,
      "recommended_action": "NOTICE",
      "pending_rent_details": { ... }
    }
  ],
  "summary": {
    "total_tenants": 3,
    "tenants_with_pending": 1,
    "tenants_overdue": 1,
    "total_pending_amount": 8000,
    "tenants_need_follow_up": 0,
    "tenants_need_notice": 1
  }
}
```

### 3. **Overdue Tenants Only**
```
GET /tenants/overdue-tenants?min_amount=1000
```

### 4. **Dashboard Statistics**
```
GET /tenants/pending-rent-stats
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "total_tenants": 3,
    "tenants_with_pending": 1,
    "tenants_overdue": 1,
    "tenants_partial": 1,
    "total_pending_amount": 8000,
    "total_overdue_amount": 8000,
    "average_pending_per_tenant": 2666.67,
    "tenants_need_follow_up": 0,
    "tenants_need_notice": 1,
    "pending_by_months": [
      {
        "month": "2025-07",
        "monthName": "July 2025",
        "tenants_count": 1,
        "total_pending": 3000,
        "overdue_count": 1
      },
      {
        "month": "2025-11",
        "monthName": "November 2025",
        "tenants_count": 1,
        "total_pending": 5000,
        "overdue_count": 1
      }
    ]
  }
}
```

## 🏗️ Service Architecture

### **Core Service**
- `PendingRentCalculatorService` - Main calculation engine
- Located in `/modules/common/` for reusability

### **Integration Points**
- `TenantService` - Added new methods for pending rent calculations
- `TenantController` - Added new endpoints
- Uses existing Prisma models and relationships

### **Key Features**

#### 📊 **Monthly Period Calculation**
- Automatically generates expected monthly periods from check-in date
- Handles partial months and pro-rated amounts
- Accounts for different month lengths

#### 💳 **Payment Matching**
- Matches payments to correct monthly periods
- Handles overlapping payment periods
- Supports partial payments and multiple payments per month

#### ⏰ **Overdue Detection**
- 5-day grace period before marking overdue
- Calculates exact days pending
- Penalty calculation (2% per month overdue)

#### 🎯 **Smart Recommendations**
- Analyzes payment history and current status
- Provides actionable recommendations
- Escalation levels based on severity

## 📱 Mobile App Integration

### **Service Functions to Add**

Create these functions in your mobile tenant service:

```typescript
// Get detailed pending rent for a tenant
export const getTenantPendingRentDetails = async (tenantId: number, headers: any) => {
  const response = await axiosInstance.get(`/tenants/${tenantId}/pending-rent-details`, {
    headers
  });
  return response.data;
};

// Get all tenants with pending rent summary
export const getAllTenantsPendingRentSummary = async (params: any, headers: any) => {
  const response = await axiosInstance.get('/tenants/pending-rent-summary', {
    params,
    headers
  });
  return response.data;
};

// Get overdue tenants
export const getOverdueTenants = async (minAmount: number, headers: any) => {
  const response = await axiosInstance.get('/tenants/overdue-tenants', {
    params: { min_amount: minAmount },
    headers
  });
  return response.data;
};

// Get pending rent statistics
export const getPendingRentStats = async (headers: any) => {
  const response = await axiosInstance.get('/tenants/pending-rent-stats', {
    headers
  });
  return response.data;
};
```

### **UI Components to Create**

#### 1. **Pending Rent Details Card**
```tsx
const PendingRentDetailsCard = ({ tenantId }) => {
  const [details, setDetails] = useState(null);
  
  useEffect(() => {
    getTenantPendingRentDetails(tenantId, headers)
      .then(response => setDetails(response.data));
  }, [tenantId]);

  return (
    <Card>
      <Text>Total Pending: ₹{details?.pending_rent_details.totalPendingAmount}</Text>
      <Text>Months Pending: {details?.pending_rent_details.totalPendingMonths}</Text>
      <Text>Recommendation: {details?.pending_rent_details.recommendedAction}</Text>
      
      {details?.pending_rent_details.pendingMonths.map(month => (
        <View key={month.month}>
          <Text>{month.monthName}: ₹{month.pendingAmount}</Text>
          <Text>Status: {month.status}</Text>
          {month.isOverdue && <Text>⚠️ {month.daysPending} days overdue</Text>}
        </View>
      ))}
    </Card>
  );
};
```

#### 2. **Dashboard Statistics**
```tsx
const PendingRentStats = () => {
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    getPendingRentStats(headers)
      .then(response => setStats(response.data));
  }, []);

  return (
    <View>
      <StatCard 
        title="Total Pending" 
        value={`₹${stats?.total_pending_amount}`}
        color="#EF4444"
      />
      <StatCard 
        title="Overdue Tenants" 
        value={stats?.tenants_overdue}
        color="#DC2626"
      />
      <StatCard 
        title="Need Notice" 
        value={stats?.tenants_need_notice}
        color="#F59E0B"
      />
    </View>
  );
};
```

## 🔧 Configuration

### **Customizable Settings**
```typescript
// In the service constructor
private readonly GRACE_PERIOD_DAYS = 5; // Days before marking overdue
private readonly PENALTY_RATE = 0.02; // 2% penalty per month
```

### **Recommendation Thresholds**
- **FOLLOW_UP**: 1 month pending
- **URGENT_FOLLOW_UP**: 2+ months pending
- **NOTICE**: Any overdue payments
- **EVICTION_WARNING**: 2+ months overdue

## 🚀 Usage Examples

### **For Your Current Data**

**Tamizh vannan (TNT455928601)**:
- **July 2025**: ₹2000 paid, ₹3000 pending (PARTIAL)
- **November 2025**: ₹0 paid, ₹5000 pending (OVERDUE)
- **Total Pending**: ₹8000
- **Recommendation**: NOTICE (overdue payments)
- **Days Overdue**: 104 days for July, 11 days for November

**Arul (TNT133096881)**:
- **All payments up to date**
- **Recommendation**: NO_ACTION

**Arun marii (TNT126064383)**:
- **All payments up to date**
- **Has advance and refund payments**
- **Recommendation**: NO_ACTION

## 📈 Benefits

### **For Property Managers**
- **Clear visibility** into which months are pending
- **Actionable recommendations** for follow-up
- **Automated overdue detection**
- **Comprehensive financial overview**

### **For Tenants**
- **Transparent breakdown** of pending amounts
- **Clear payment history**
- **Understanding of overdue status**

### **For Business**
- **Better cash flow management**
- **Reduced manual calculation errors**
- **Automated follow-up prioritization**
- **Comprehensive reporting**

## 🔄 Next Steps

1. **Test the API endpoints** with your current tenant data
2. **Integrate into mobile app** using the provided service functions
3. **Create UI components** for displaying pending rent details
4. **Add to dashboard** for overview statistics
5. **Implement notifications** based on recommendations

The service is now ready to provide comprehensive pending rent analysis for all your tenants! 🎉
