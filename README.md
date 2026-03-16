# Zcare Mobile App

React Native + Expo app for Zcare users to manage cars, book washes/repairs, and receive inspection reminders.

## Requirements

- Node.js 18+
- Expo CLI
- iOS/Android simulator or device

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start the app:

```bash
npx expo start
```

## Environment

Set in `.env` or your shell:

- `EXPO_PUBLIC_SERVER_URL` (API gateway base URL)
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` (maps)

## Push Notifications (FCM)

The app registers an FCM token and sends it to the backend:

```
PUT /v1/users/{id}/fcm-token?fcmToken=...
```

Ensure Firebase is configured in the backend (`FIREBASE_CREDENTIALS_PATH`) and the device has permission to receive notifications.

## Payments (Stripe)

Stripe payments are created via:

```
POST /payment/create-payment-intent
```

The app includes `stationId` in the request so the backend can apply the 1 EUR platform fee and route the remainder to the provider’s connected account.

Connected account IDs are Stripe Connect IDs in the format `acct_...`, stored on the service provider and updated via:

```
PUT /v1/service-provider/{id}/stripe-account?stripeAccountId=acct_...
```

Quick onboarding link flow will be added later (Stripe AccountLink).

## Inspection Bookings & Reminders

- Inspection status is fetched from z-repair and displayed in **My Cars**.
- Inspection bookings use:

```
POST /api/repair-bookings/inspection
```

- Reminder banners show due soon / overdue in English, Arabic, and Finnish.

## Tests

```bash
npm test
```
