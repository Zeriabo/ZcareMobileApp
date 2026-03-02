/**
 * Mock Payment API Service
 * Provides mock responses for payment API endpoints
 */

export interface MockPaymentIntentResponse {
  id: string;
  clientSecret: string;
  paymentIntentId: string;
  client_secret: string;
  status: 'requires_payment_method' | 'succeeded';
  amount: number;
  currency: string;
}

export interface MockSetupIntentResponse {
  id: string;
  clientSecret: string;
  setupIntentClientSecret: string;
  client_secret: string;
  status: 'requires_payment_method' | 'succeeded';
}

// Generate unique IDs
const generateId = (prefix: string): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Generate client secret
const generateClientSecret = (): string => {
  return `seti_${Math.random().toString(36).substr(2, 24)}_secret_${Math.random().toString(36).substr(2, 24)}`;
};

/**
 * Mock payment intent creation
 */
export const mockCreatePaymentIntent = (payload: any): MockPaymentIntentResponse => {
  const clientSecret = generateClientSecret();
  const intentId = generateId('pi');

  return {
    id: intentId,
    clientSecret,
    paymentIntentId: intentId,
    client_secret: clientSecret,
    status: 'requires_payment_method',
    amount: payload?.program?.price || 2000,
    currency: 'USD',
  };
};

/**
 * Mock setup intent creation (for saved cards)
 */
export const mockCreateSetupIntent = (): MockSetupIntentResponse => {
  const clientSecret = generateClientSecret();
  const intentId = generateId('seti');

  return {
    id: intentId,
    clientSecret,
    setupIntentClientSecret: clientSecret,
    client_secret: clientSecret,
    status: 'requires_payment_method',
  };
};

/**
 * Mock payment confirmation
 */
export const mockConfirmPayment = (clientSecret: string): any => {
  return {
    paymentIntent: {
      id: generateId('pi'),
      clientSecret,
      status: 'succeeded',
      amount: 2000,
      currency: 'USD',
    },
  };
};

/**
 * Mock saved cards list
 */
export const mockGetSavedCards = (): any => {
  return {
    cards: [
      {
        id: generateId('card'),
        last4: '4242',
        brand: 'visa',
        expMonth: 12,
        expYear: 2025,
      },
    ],
  };
};

/**
 * Mock attach payment method
 */
export const mockAttachPaymentMethod = (payload: any): any => {
  return {
    id: generateId('pm'),
    object: 'payment_method',
    type: 'card',
    status: 'attached',
  };
};

/**
 * Mock booking detail with live wash status
 * Matches the backend response from GET /v1/bookings/{id}
 */
export const mockGetBookingDetail = (bookingId: string | number): any => {
  // Simulate wash progression based on time
  const now = Date.now();
  const seed = Number(bookingId) || 1;
  const progressBase = (now % 100000) / 1000; // Changes over time
  
  // Cycle through statuses for realism (10 seconds per status)
  const statusCycle = Math.floor((now / 10000) % 5);
  const statuses = ['PURCHASED', 'QUEUING', 'STARTED', 'IN_PROGRESS', 'FINISHED'];
  const status = statuses[statusCycle];
  
  const progress = status === 'FINISHED' ? 100 : 
                   status === 'IN_PROGRESS' ? Math.min(95, 50 + Math.round(progressBase / 2)) :
                   status === 'STARTED' ? 25 :
                   status === 'QUEUING' ? 15 :
                   0;

  // Match backend response structure exactly
  return {
    id: Number(bookingId),
    status: status,  // Backend returns string: "PURCHASED", "QUEUING", etc.
    executed: status === 'FINISHED',
    scheduledTime: new Date(now - 600000).toISOString(),
    qrCode: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...mock_qr_${bookingId}`,
    bookingType: 'WASH',
    deliveryAddress: null,
    deliveryLatitude: null,
    deliveryLongitude: null,
    washingProgramId: 1,
    stationId: 1,
    carId: seed,
    // Additional fields for frontend display
    progress,
    progressPercent: progress,
  };
};
