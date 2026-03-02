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
        // If mock mode is enabled and this is a payment/booking endpoint, use mock data
        if (this.mockMode && error.config?.url) {
          const method = error.config.method?.toUpperCase() || 'GET';
          const mockResponse = this.getMockResponse(method, error.config.url, error.config.data);
          if (mockResponse !== null) {
            logger.info(`✅ Using MOCK response for ${method} ${error.config.url}`, {
              mockData: this.sanitizeData(mockResponse)
            });
            return Promise.resolve({
              status: 200,
              statusText: 'OK (Mock)',
              data: mockResponse,
              headers: {},
              config: error.config,
            } as AxiosResponse);
          } else {
            logger.warn(`Mock mode enabled but no mock handler for ${method} ${error.config.url}`);
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
