# Mock Payment API

This module provides mock responses for payment API endpoints. It's useful for development and testing when the backend server is unavailable.

## Files

- **`mockPaymentApi.ts`** - Mock data generators for payment API responses
- **`mockApiConfig.ts`** - Configuration utilities to enable/disable mock mode
- **`apiClient.ts`** - Modified to support mock mode (automatic fallback on API errors)

## How to Use

### Automatic Mock Mode (On API Errors)

When the backend API returns an error (like 503 Service Unavailable), the client will automatically use mock responses if mock mode is enabled.

### Enable Mock Mode Manually

In your component or action:

```typescript
import { enablePaymentMockMode } from '../utils/mockApiConfig';

// Enable mock mode
enablePaymentMockMode();

// Or toggle it
import { togglePaymentMockMode } from '../utils/mockApiConfig';
togglePaymentMockMode();
```

### Check Mock Mode Status

```typescript
import { isPaymentMockModeEnabled } from '../utils/mockApiConfig';

if (isPaymentMockModeEnabled()) {
  console.log('Mock mode is enabled');
}
```

### Disable Mock Mode

```typescript
import { disablePaymentMockMode } from '../utils/mockApiConfig';

disablePaymentMockMode();
```

## Mock Endpoints

The following endpoints are mocked:

### Payment Endpoints
- `/payment/create-payment-intent` - Returns a mock payment intent with client secret
- `/payment/setup-intent` or `/payment/create-setup-intent` - Returns a mock setup intent
- `/payment/confirm-payment` - Returns a mock payment confirmation
- `/payment/saved-cards`, `/payment/cards` - Returns mock saved cards list or attaches a payment method

### Catalog Endpoints
- `/api/catalog/skus` - Returns mock repair service catalog with pricing

### Booking Endpoints
- `/booking/{id}`, `/bookings/{id}` - Returns mock booking details with live status simulation

## Mock Data

All mock responses include realistic fields:

### Payment Intent
```json
{
  "id": "pi_*",
  "clientSecret": "seti_*_secret_*",
  "paymentIntentId": "pi_*",
  "client_secret": "seti_*_secret_*",
  "status": "requires_payment_method",
  "amount": 2000,
  "currency": "USD"
}
```

### Setup Intent
```json
{
  "id": "seti_*",
  "clientSecret": "seti_*_secret_*",
  "setupIntentClientSecret": "seti_*_secret_*",
  "client_secret": "seti_*_secret_*",
  "status": "requires_payment_method"
}
```

### Catalog SKU (Repair Service)
```json
{
  "id": "1",
  "name": "Oil Change",
  "description": "Standard oil change with filter replacement",
  "durationMinutes": 30,
  "priceAmount": 4500,
  "priceCurrency": "EUR",
  "active": true
}
```

Returns an array of 10 repair services including:
- Oil Change
- Brake Service
- Tire Rotation
- Engine Diagnostic
- Battery Replacement
- Air Filter Replacement
- Transmission Service
- Wheel Alignment
- AC Service
- General Inspection

## Development Tips

1. **Enable mock mode when backend is down**: Use `enablePaymentMockMode()` to test UI without backend
2. **Test payment flows**: All payment screens will work with mock data
3. **Keep it realistic**: Mock data uses realistic Stripe-like IDs and secrets
4. **Future enhancement**: Add mock response customization per request if needed

## How It Works

1. When an API request fails and mock mode is enabled, the response interceptor catches the error
2. It checks if the URL matches a payment endpoint
3. If matched, it returns mock data instead of the error
4. The app continues as if a real response was received
5. All logs show `(Mock)` in the status text to indicate mock usage

## Troubleshooting

If mock mode isn't working:

1. Ensure `enablePaymentMockMode()` was called
2. Check the logs for `(Mock)` status text
3. Verify the endpoint URL matches the patterns in `getMockResponse()`
4. Make sure you're using payment endpoints, not other API endpoints
