/**
 * Centralized API client with interceptors, error handling, and request/response logging
 */

import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { logger } from './logger';
import * as mockPaymentApi from './mockPaymentApi';

interface ApiErrorResponse {
  message: string;
  status: number;
  code?: string;
  details?: any;
}

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;
  private mockMode: boolean = false;

  constructor(baseURL: string = '') {
    this.baseURL = baseURL || (process.env.EXPO_PUBLIC_SERVER_URL || '');
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Enable/disable mock mode for payment endpoints
   */
  setMockMode(enabled: boolean) {
    this.mockMode = enabled;
    logger.info(`Mock mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if mock mode is enabled
   */
  isMockMode(): boolean {
    return this.mockMode;
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        logger.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
          params: config.params,
          data: config.data ? this.sanitizeData(config.data) : undefined,
        });
        return config;
      },
      (error) => {
        logger.error('Request interceptor error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor with mock support
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        logger.debug(`API Response: ${response.status} from ${response.config.url}`, {
          data: this.sanitizeData(response.data),
        });
        return response;
      },
      (error: AxiosError) => {
        const url = error.config?.url || '';
        const method = error.config?.method?.toUpperCase() || 'GET';

        // Always try mock data for vehicle endpoints on error
        const isVehicleEndpoint = url?.includes('/vehicles/');
        const isCatalogEndpoint = url?.includes('/catalog/skus');

        if (isVehicleEndpoint || isCatalogEndpoint || this.mockMode) {
          const mockResponse = this.getMockResponse(method, url, error.config?.data);
          if (mockResponse !== null && mockResponse?.error !== 'Vehicle not found') {
            logger.info(`✅ Using MOCK response for ${method} ${url}`, {
              mockData: this.sanitizeData(mockResponse)
            });
            return Promise.resolve({
              status: 200,
              statusText: 'OK (Mock)',
              data: mockResponse,
              headers: {},
              config: error.config,
            } as AxiosResponse);
          } else if (isVehicleEndpoint && error.response?.status === 404) {
            // Vehicle not found in mock data - return 404
            logger.debug(`Vehicle not found: ${url}`);
          }
        }

        const errorResponse: ApiErrorResponse = {
          message: error.message,
          status: error.response?.status || 0,
          code: error.code,
          details: error.response?.data,
        };

        logger.error(`API Error: ${error.config?.url}`, errorResponse);
        return Promise.reject(errorResponse);
      }
    );
  }

  /**
   * Get mock response for payment and booking endpoints
   */
  private getMockResponse(method: string, url: string, data?: any): any | null {
    // Payment endpoints (POST only)
    if (method === 'POST') {
      if (url?.includes('/payment/create-payment-intent')) {
        return mockPaymentApi.mockCreatePaymentIntent(typeof data === 'string' ? JSON.parse(data) : data);
      }

      if (url?.includes('/payment/setup-intent') || url?.includes('/payment/create-setup-intent')) {
        return mockPaymentApi.mockCreateSetupIntent();
      }

      if (url?.includes('/payment/confirm-payment')) {
        const clientSecret = typeof data === 'string' ? JSON.parse(data) : data;
        return mockPaymentApi.mockConfirmPayment(clientSecret?.clientSecret || clientSecret || '');
      }

      if (url?.includes('/payment/saved-cards') || url?.includes('/payment/cards')) {
        return mockPaymentApi.mockAttachPaymentMethod(typeof data === 'string' ? JSON.parse(data) : data);
      }
    }

    // Booking endpoints (GET)
    if (method === 'GET') {
      // Match booking detail endpoints: /booking/123, /bookings/123, /v1/bookings/123, etc.
      const bookingMatch = url?.match(/\/(?:booking|bookings)(?:\/v1)?\/(\d+)/) || 
                          url?.match(/\/v1\/bookings\/(\d+)/);
      if (bookingMatch && bookingMatch[1]) {
        return mockPaymentApi.mockGetBookingDetail(bookingMatch[1]);
      }

      // Saved cards list
      if (url?.includes('/payment/saved-cards') || url?.includes('/payment/cards')) {
        return mockPaymentApi.mockGetSavedCards();
      }

      // Catalog SKUs (repair services)
      if (url?.includes('/catalog/skus') || url?.includes('/api/catalog/skus')) {
        return mockPaymentApi.mockGetCatalogSkus();
      }

      // Vehicle inspection status: /api/vehicles/{plate}/inspection?thresholdDays=30
      const inspectionMatch = url?.match(/\/vehicles\/([^/?]+)\/inspection/);
      if (inspectionMatch && inspectionMatch[1]) {
        const plate = inspectionMatch[1];
        const thresholdMatch = url?.match(/thresholdDays=(\d+)/);
        const threshold = thresholdMatch ? parseInt(thresholdMatch[1], 10) : 30;
        const mockStatus = mockPaymentApi.mockGetInspectionStatus(plate, threshold);
        return mockStatus || { error: 'Vehicle not found', status: 404 };
      }

      // Vehicle last inspection: /api/vehicles/{plate}/last-inspection
      const lastInspectionMatch = url?.match(/\/vehicles\/([^/?]+)\/last-inspection/);
      if (lastInspectionMatch && lastInspectionMatch[1]) {
        const plate = lastInspectionMatch[1];
        const mockLastInspection = mockPaymentApi.mockGetLastInspection(plate);
        return mockLastInspection || { error: 'Vehicle not found', status: 404 };
      }

      // Vehicle next inspection: /api/vehicles/{plate}/next-inspection
      const nextInspectionMatch = url?.match(/\/vehicles\/([^/?]+)\/next-inspection/);
      if (nextInspectionMatch && nextInspectionMatch[1]) {
        const plate = nextInspectionMatch[1];
        const mockNextInspection = mockPaymentApi.mockGetNextInspection(plate);
        return mockNextInspection || { error: 'Vehicle not found', status: 404 };
      }

      // Vehicle lookup: /api/vehicles/{plate}
      const vehicleMatch = url?.match(/\/vehicles\/([^/?]+)(?:\?|$)/);
      if (vehicleMatch && vehicleMatch[1]) {
        const plate = vehicleMatch[1];
        const mockVehicle = mockPaymentApi.mockGetVehicleData(plate);
        return mockVehicle || { error: 'Vehicle not found', status: 404 };
      }
    }

    return null;
  }

  /**
   * Remove sensitive data from logs
   */
  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') return data;

    const sanitized = { ...data };
    const sensitiveKeys = ['token', 'password', 'secret', 'apiKey', 'Authorization'];

    for (const key of sensitiveKeys) {
      if (key in sanitized) {
        sanitized[key] = '***REDACTED***';
      }
    }

    return sanitized;
  }

  /**
   * Set authorization token
   */
  setAuthToken(token: string | null) {
    if (token) {
      this.client.defaults.headers.common['Authorization'] = token.startsWith('Bearer ')
        ? token
        : `Bearer ${token}`;
    } else {
      delete this.client.defaults.headers.common['Authorization'];
    }
  }

  /**
   * GET request
   */
  async get<T>(url: string, config?: any): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  /**
   * POST request
   */
  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  /**
   * PUT request
   */
  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  /**
   * PATCH request
   */
  async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string, config?: any): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  /**
   * Update base URL (useful for environment changes)
   */
  setBaseURL(url: string) {
    this.baseURL = url;
    this.client.defaults.baseURL = url;
  }
}

export const apiClient = new ApiClient();
export type { ApiErrorResponse };
export default apiClient;
