/**
 * Centralized API endpoints configuration
 * All API endpoints in one place for easy maintenance
 */

const BASE_URL = process.env.EXPO_PUBLIC_SERVER_URL || '';

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    SIGN_IN: '/auth/sign-in',
    SIGN_UP: '/auth/sign-up',
    SIGN_OUT: '/auth/sign-out',
    REFRESH_TOKEN: '/auth/refresh-token',
    VALIDATE_TOKEN: '/auth/validate',
  },

  // Stations & Car Washes
  STATIONS: {
    LIST: ['/stations', '/api/stations', '/v1/stations'], // Fallback endpoints
    DETAIL: (id: string) => `/stations/${id}`,
    SEARCH: '/stations/search',
  },

  // Programs
  PROGRAMS: {
    LIST: (stationId: string) => [
      `/stations/${stationId}/programs`,
      `/api/stations/${stationId}/programs`,
      `/v1/stations/${stationId}/programs`,
    ],
    DETAIL: (programId: string) => `/programs/${programId}`,
  },

  // Bookings
  BOOKINGS: {
    LIST: '/bookings',
    USER_BOOKINGS: ['/booking/user', '/api/booking/user', '/v1/bookings/user'], // Fallback endpoints
    DETAIL: (id: string) => `/bookings/${id}`,
    CREATE: '/bookings',
    UPDATE: (id: string) => `/bookings/${id}`,
    DELETE: (id: string) => `/bookings/${id}`,
    CANCEL: (id: string) => `/bookings/${id}/cancel`,
  },

  // Cars
  CARS: {
    LIST: '/cars',
    DETAIL: (id: string) => `/cars/${id}`,
    REGISTER: '/cars/register',
    UPDATE: (id: string) => `/cars/${id}`,
    DELETE: (id: string) => `/cars/${id}`,
    INSPECTION: (licensePlate: string) => `/cars/inspection/${licensePlate}`,
  },

  // User Profile
  USER: {
    PROFILE: '/user/profile',
    UPDATE: '/user/profile',
    UPDATE_PASSWORD: '/user/change-password',
    DELETE_ACCOUNT: '/user/account',
  },

  // Payment
  PAYMENT: {
    CREATE_INTENT: '/payment/create-payment-intent',
    CONFIRM_PAYMENT: '/payment/confirm',
    HISTORY: '/payment/history',
    DETAIL: (id: string) => `/payment/${id}`,
  },

  // Repair Shops
  REPAIR: {
    LIST: ['/api/repairshops', '/repairshops', '/v1/repairshops'],
    DETAIL: (id: string) => `/repairshops/${id}`,
    SERVICES: (id: string) => `/repairshops/${id}/services`,
  },

  // Repair Bookings (z-repair service)
  REPAIR_BOOKINGS: {
    LIST: '/api/repair-bookings',
    CREATE: '/api/repair-bookings',
    DETAIL: (id: string) => `/api/repair-bookings/${id}`,
    UPDATE_STATUS: (id: string) => `/api/repair-bookings/${id}/status`,
    DELETE: (id: string) => `/api/repair-bookings/${id}`,
  },

  // Vehicle Inspection (z-repair service)
  VEHICLE_INSPECTION: {
    LAST_INSPECTION: (plate: string) => `/api/vehicles/${plate}/last-inspection`,
    NEXT_INSPECTION: (plate: string) => `/api/vehicles/${plate}/next-inspection`,
    INSPECTION_STATUS: (plate: string) => `/api/vehicles/${plate}/inspection`,
  },

  // AI Assistant
  AI: {
    CHAT: ['/api/zcare-ai', '/zcare-ai', '/v1/zcare-ai'],
  },

  // Washes
  WASHES: {
    LIST: '/washes',
    DETAIL: (id: string) => `/washes/${id}`,
    ACTIVE: '/washes/active',
  },
};

/**
 * Build full URL for an endpoint
 */
export const buildEndpoint = (endpoint: string | string[]): string | string[] => {
  if (Array.isArray(endpoint)) {
    return endpoint.map(e => `${BASE_URL}${e}`.replace(/\/+/g, '/'));
  }
  return `${BASE_URL}${endpoint}`.replace(/\/+/g, '/');
};

/**
 * Get fallback endpoints (tries multiple URLs in order)
 */
export const getFallbackEndpoints = (endpoints: string[]): string[] => {
  return buildEndpoint(endpoints) as string[];
};

export default API_ENDPOINTS;
