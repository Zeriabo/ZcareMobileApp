/**
 * Input validation utilities for common use cases
 */

export const ValidationErrors = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Invalid email address',
  INVALID_PHONE: 'Invalid phone number',
  INVALID_DATE: 'Invalid date',
  INVALID_URL: 'Invalid URL',
  MIN_LENGTH: (min: number) => `Must be at least ${min} characters`,
  MAX_LENGTH: (max: number) => `Must be no more than ${max} characters`,
  PATTERN_MISMATCH: 'Invalid format',
  PASSWORD_WEAK: 'Password must be at least 8 characters with uppercase, lowercase, and numbers',
};

export const Validators = {
  /**
   * Check if value is not empty
   */
  required: (value: any): boolean => {
    if (typeof value === 'string') return value.trim().length > 0;
    return value !== null && value !== undefined;
  },

  /**
   * Validate email address
   */
  email: (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  /**
   * Validate phone number (basic)
   */
  phone: (value: string): boolean => {
    // Remove all spaces, dashes, parentheses, and dots for validation
    const cleaned = value.replace(/[\s\-\.\(\)]/g, '');
    // Check if it starts with optional + and has 10-15 digits
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    return phoneRegex.test(cleaned);
  },

  /**
   * Validate date format (YYYY-MM-DD)
   */
  date: (value: string): boolean => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(value)) return false;
    const date = new Date(value);
    return date instanceof Date && !isNaN(date.getTime());
  },

  /**
   * Validate URL
   */
  url: (value: string): boolean => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Validate minimum length
   */
  minLength: (value: string, min: number): boolean => {
    return value.length >= min;
  },

  /**
   * Validate maximum length
   */
  maxLength: (value: string, max: number): boolean => {
    return value.length <= max;
  },

  /**
   * Validate strong password (8+ chars, 1 uppercase, 1 lowercase, 1 number)
   */
  strongPassword: (value: string): boolean => {
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return strongRegex.test(value);
  },

  /**
   * Validate number value
   */
  number: (value: any): boolean => {
    // Reject null, undefined, and non-numeric types
    if (value === null || value === undefined) return false;
    const num = Number(value);
    return !isNaN(num) && isFinite(num);
  },

  /**
   * Validate positive number
   */
  positiveNumber: (value: any): boolean => {
    return Validators.number(value) && value > 0;
  },

  /**
   * Validate integer
   */
  integer: (value: any): boolean => {
    return Number.isInteger(value);
  },
};

/**
 * Validate multiple fields at once
 */
export const validateForm = (
  data: Record<string, any>,
  rules: Record<string, ((value: any) => boolean)[]>
): Record<string, string> => {
  const errors: Record<string, string> = {};

  for (const [field, validators] of Object.entries(rules)) {
    const value = data[field];

    for (const validator of validators) {
      if (!validator(value)) {
        errors[field] = `${field} is invalid`;
        break;
      }
    }
  }

  return errors;
};

/**
 * Safe null/undefined check with optional fallback
 */
export const sanitizeValue = <T>(value: T | null | undefined, fallback?: T): T | undefined => {
  return value !== null && value !== undefined ? value : fallback;
};

/**
 * Safely access nested properties
 */
export const safeGet = (obj: any, path: string, defaultValue?: any): any => {
  try {
    const value = path.split('.').reduce((acc, part) => acc?.[part], obj);
    return value !== undefined ? value : defaultValue;
  } catch {
    return defaultValue;
  }
};

/**
 * Trim and normalize string values
 */
export const normalizeString = (value: string | null | undefined): string => {
  return (value || '').trim();
};

/**
 * Safely parse JSON
 */
export const safeJsonParse = <T>(json: string, fallback?: T): T | undefined => {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
};
