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

/**
 * Mock catalog SKUs (repair services)
 */
export const mockGetCatalogSkus = (): any => {
  return [
    {
      id: '1',
      name: 'Oil Change',
      description: 'Standard oil change with filter replacement',
      durationMinutes: 30,
      priceAmount: 4500,
      priceCurrency: 'EUR',
      active: true,
    },
    {
      id: '2',
      name: 'Brake Service',
      description: 'Complete brake inspection and pad replacement',
      durationMinutes: 90,
      priceAmount: 15000,
      priceCurrency: 'EUR',
      active: true,
    },
    {
      id: '3',
      name: 'Tire Rotation',
      description: 'Tire rotation and pressure check',
      durationMinutes: 45,
      priceAmount: 3500,
      priceCurrency: 'EUR',
      active: true,
    },
    {
      id: '4',
      name: 'Engine Diagnostic',
      description: 'Full engine diagnostic scan and report',
      durationMinutes: 60,
      priceAmount: 8500,
      priceCurrency: 'EUR',
      active: true,
    },
    {
      id: '5',
      name: 'Battery Replacement',
      description: 'Battery testing and replacement service',
      durationMinutes: 30,
      priceAmount: 12000,
      priceCurrency: 'EUR',
      active: true,
    },
    {
      id: '6',
      name: 'Air Filter Replacement',
      description: 'Engine and cabin air filter replacement',
      durationMinutes: 20,
      priceAmount: 3000,
      priceCurrency: 'EUR',
      active: true,
    },
    {
      id: '7',
      name: 'Transmission Service',
      description: 'Transmission fluid change and inspection',
      durationMinutes: 75,
      priceAmount: 18000,
      priceCurrency: 'EUR',
      active: true,
    },
    {
      id: '8',
      name: 'Wheel Alignment',
      description: 'Four-wheel alignment service',
      durationMinutes: 60,
      priceAmount: 9500,
      priceCurrency: 'EUR',
      active: true,
    },
    {
      id: '9',
      name: 'AC Service',
      description: 'Air conditioning recharge and inspection',
      durationMinutes: 45,
      priceAmount: 7500,
      priceCurrency: 'EUR',
      active: true,
    },
    {
      id: '10',
      name: 'General Inspection',
      description: 'Comprehensive vehicle safety inspection',
      durationMinutes: 90,
      priceAmount: 6500,
      priceCurrency: 'EUR',
      active: true,
    },
  ];
};

/**
 * Mock vehicle lookups
 */
export const mockGetVehicleData = (registrationNumber: string): any => {
  // Normalize plate
  const normalized = registrationNumber.toUpperCase().replace(/\s/g, '');

  // Mock vehicle database
  const vehicles: { [key: string]: any } = {
    'ABC123': {
      registrationNumber: 'ABC-123',
      make: 'Toyota',
      model: 'Camry',
      year: 2020,
      vin: 'JT2BF18K5M0094120',
      backgroundColor: '#2E8B57',
      foreignInformation: false,
      attributes: {
        make: 'Toyota',
        model: 'Camry',
        yearOfManufacture: 2020,
        colour: 'Green',
        engineType: 'Petrol',
      },
    },
    'TRAFFI001': {
      registrationNumber: 'TRAFFI-001',
      make: 'Volkswagen',
      model: 'Golf',
      year: 2021,
      vin: 'WVWZZZ3CZ9E123456',
      backgroundColor: '#FF6B6B',
      foreignInformation: false,
      attributes: {
        make: 'Volkswagen',
        model: 'Golf',
        yearOfManufacture: 2021,
        colour: 'Red',
        engineType: 'Diesel',
      },
    },
    'XYZ789': {
      registrationNumber: 'XYZ-789',
      make: 'BMW',
      model: '3 Series',
      year: 2019,
      vin: 'WBADT43452G915187',
      backgroundColor: '#4169E1',
      foreignInformation: false,
      attributes: {
        make: 'BMW',
        model: '3 Series',
        yearOfManufacture: 2019,
        colour: 'Blue',
        engineType: 'Petrol',
      },
    },
    'DEMO001': {
      registrationNumber: 'DEMO-001',
      make: 'Mercedes-Benz',
      model: 'C-Class',
      year: 2022,
      vin: 'WDDWF4CC9NF123456',
      backgroundColor: '#DAA520',
      foreignInformation: false,
      attributes: {
        make: 'Mercedes-Benz',
        model: 'C-Class',
        yearOfManufacture: 2022,
        colour: 'Gold',
        engineType: 'Petrol',
      },
    },
  };

  return vehicles[normalized] || null;
};

/**
 * Mock inspection status
 */
export const mockGetInspectionStatus = (registrationNumber: string, thresholdDays: number = 30): any => {
  const vehicle = mockGetVehicleData(registrationNumber);
  if (!vehicle) return null;

  const lastInspectionDate = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000); // 200 days ago
  const nextInspectionDate = new Date(lastInspectionDate.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year later
  const daysUntilDue = Math.ceil((nextInspectionDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  const dueWithinThreshold = daysUntilDue <= thresholdDays;

  return {
    registrationNumber: vehicle.registrationNumber,
    lastInspectionDate: lastInspectionDate.toISOString().split('T')[0],
    nextInspectionDate: nextInspectionDate.toISOString().split('T')[0],
    daysUntilDue,
    dueWithinThreshold,
    thresholdDays,
    message: dueWithinThreshold ? `Due in ${daysUntilDue} days` : 'Inspection valid',
  };
};

export const mockGetLastInspection = (registrationNumber: string): any => {
  const status = mockGetInspectionStatus(registrationNumber, 30);
  if (!status) return null;

  return {
    registrationNumber: status.registrationNumber,
    lastInspectionDate: status.lastInspectionDate,
    message: status.message,
  };
};

export const mockGetNextInspection = (registrationNumber: string): any => {
  const status = mockGetInspectionStatus(registrationNumber, 30);
  if (!status) return null;

  return {
    registrationNumber: status.registrationNumber,
    lastInspectionDate: status.lastInspectionDate,
    nextInspectionDate: status.nextInspectionDate,
    message: `Next inspection due on ${status.nextInspectionDate}`,
  };
};
