/**
 * Mock API Configuration
 * Easily enable/disable mock mode for payment endpoints
 */

import { apiClient } from '../utils/apiClient';
import { logger } from '../utils/logger';

/**
 * Enable mock mode for all payment endpoints
 * This is useful for testing without a backend server
 */
export const enablePaymentMockMode = () => {
  try {
    apiClient.setMockMode(true);
    logger.info('Payment mock mode enabled');
  } catch (error) {
    logger.error('Failed to enable mock mode', error);
  }
};

/**
 * Disable mock mode
 */
export const disablePaymentMockMode = () => {
  try {
    apiClient.setMockMode(false);
    logger.info('Payment mock mode disabled');
  } catch (error) {
    logger.error('Failed to disable mock mode', error);
  }
};

/**
 * Check if mock mode is enabled
 */
export const isPaymentMockModeEnabled = (): boolean => {
  return apiClient.isMockMode();
};

/**
 * Toggle mock mode
 */
export const togglePaymentMockMode = () => {
  if (isPaymentMockModeEnabled()) {
    disablePaymentMockMode();
  } else {
    enablePaymentMockMode();
  }
};
