# Firebase Setup Guide

## Environment Variables

Add the following variables to your `.env` file:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=indianpgmanagement
FIREBASE_PRIVATE_KEY_ID=54ece26736cce054b131204e27e60b0856078f9b
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC4T1nUzhxjJGll\nsa8RNfXvigFDs75CxfRa1BfR2vJSDegGWm6OslOuI3i2Ako3dCyn5T2vg2aTmCz1\nUoVH7pT8Gjb9GcveYbYkP56Kgh7pJIKx4czs+F1Ipa1jIP+ob0GCAKPc9bcK+k33\n9Mvhvl7RvMnSDtwCDn2sKge/3uKLBa9K1Ya/5XgZIxn37FrF55G86HfWIJTwCsdR\n2Z8IBJiGaTtEID7Cbi4Uh/yFf4JvSFxzEM1vRRStqtglmuZ6xy8eZx2uRHaBYGO3\npt1adxLiwKjG291FfAQoCXM11qFFwIMSqYHSD0OAv/5TaAG1ARgkIp8Uh/+GZCVi\nkpzx5M3TAgMBAAECggEAFUMuOVMXykYylIVFjYY8m4g/shhDzD86+9l48ABCsT2i\ndU0scPDYn3+/Frw35KLV3f6fuaY+iKtnEFwXPR+kd1rs2hEGSF7cXN0sBI2TVFEe\ndLf4ZKQYWt+mG4f8hmljVMSPItgD6FPM99x5Qs8r8CVH4SBOuDwEun5Uy4lCeEga\n0bZpHAyJW4MGg4Dbp6s43d/rGqG8KhGnHIqLNBnJE0v0A5lWEx3sebH7+C0qdzY5\neiEv7gdarXtXRt7FCHbXr6xCRMQaxJ3wkbOMEAY4ovdkTCgjLkRgBlWWmiIhGBdl\nVefV60nGH7KQSaix94pM+Ds1dhhTh5Hu9ncWTHx5fQKBgQDr1FgQCTDQ7d91Gw6G\nr7ICM2ycZsgx4o2ncwZc7ENCsDB1uQEfkVVdEvseACHsKvE4sT7mMMDWr98OkWOy\n4tuxMfz6iVg8HjaHqBjDYqqP9YxrlP6i/txz8bncyRBtxgIZouyArOnjwHd3eFFB\n/DP+sDZKJvPyQI/NEbHVOEp/RwKBgQDIEvNE9R87K5cBxi89bMbnhPzZKiP2GOOP\n+ZYh3l33ct//I0tas+HKXYy+wTEkAobTSxVmzh/996IDGayMHO1MXlsjomVg8lWV\ncMfbpVb113tWJenp7coH856Rk0yeUghqcSvrYr+CNG8yFEvWYiB/KvLK4vy+TCDz\n2y2mm3U7FQKBgQCngooWweB51yztSo2z36KKa6qPIXa78Fd8BHkVkgBooyuYwxNo\nL9w5o1zZv3BZB1uWUFgEO8cN95hyCZWOoBM6tu4hq2MQOMm07BLC3heW7+yREiEY\n9/zxIldJ20ufHZGqUg65i5kK3FA/fSgCvbjVBKdbXnXSskcye4ockMJhywKBgGvX\ncxLfQRdGtp15MqtcP5Y5Y4S2py2WWsqXEGpvDp07aSt/3bUlMnY+mIeVYKR1TDEF\nzqJcRnhBCy26n/vh97JrRZrehOCNnr3vTXrCEy5uGIfl5cB2sKg6k2UKTYkk1G5z\nU+YLkwhetPT8ZahHuhZxku7zDKKSLEzk/iVItBbFAoGBAOneCAlEdsPmLE7zD8Tj\nzw5T3k2vn/wIo8jQ2AWiQs5V73Hh4eRTyc32CXpAL1SmLs8y54YxsjcWCmD6z0rX\npfnlwTbhthXjfPuaT+nTBsgGWFI2N+jkv+8IcxTeRVMutxsvZSuZ8inO8WzUUXic\nMdBzHUC/7Va2A9aJnfloyWsQ\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@indianpgmanagement.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=100537293576616721090
```

## Important Notes

1. **Private Key Format**: The private key must be wrapped in quotes and use `\n` for line breaks
2. **Security**: Never commit your `.env` file to version control
3. **Production**: Use secure secret management services (AWS Secrets Manager, Azure Key Vault, etc.)

## Verification

After adding the variables, restart your application. You should see:
```
✅ Firebase Admin initialized successfully
```

If you see an error, check that:
- All three required variables are set: `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`
- The private key format is correct with `\n` line breaks
- The private key is wrapped in double quotes
