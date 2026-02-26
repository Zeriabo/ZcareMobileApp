/**
 * Centralized API client with interceptors, error handling, and request/response logging
 */

import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { logger } from './logger';

interface ApiErrorResponse {
  message: string;
  status: number;
  code?: string;
  details?: any;
}

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

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

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        logger.debug(`API Response: ${response.status} from ${response.config.url}`, {
          data: this.sanitizeData(response.data),
        });
        return response;
      },
      (error: AxiosError) => {
        const errorResponse: ApiErrorResponse = {
          message: error.message,
          status: error.response?.status || 0,
          code: error.code,
          details: error.response?.data,
        };

        logger.error(`API Error: ${error.config?.url}`, error, errorResponse);
        return Promise.reject(errorResponse);
      }
    );
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
