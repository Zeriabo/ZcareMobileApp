/**
 * Inspection Status Notification Service
 * Monitors vehicle inspection statuses and sends notifications
 */

import { notifyInspectionOverdue, notifyInspectionDueSoon } from './notifications';
import * as repairService from './repairService';
import { logger } from './logger';

interface InspectionCheckResult {
  plate: string;
  status: 'overdue' | 'due-soon' | 'ok' | 'unknown';
  daysUntilDue?: number;
}

/**
 * Check inspection status for a vehicle and send notification if needed
 */
export const checkAndNotifyInspectionStatus = async (
  registrationPlate: string,
  thresholdDays: number = 30
): Promise<InspectionCheckResult> => {
  try {
    const inspection = await repairService.getInspectionStatus(
      registrationPlate,
      thresholdDays
    );

    const result: InspectionCheckResult = {
      plate: registrationPlate,
      status: 'ok',
      daysUntilDue: inspection.daysUntilDue,
    };

    // Check if overdue
    if (inspection.daysUntilDue < 0) {
      result.status = 'overdue';
      await notifyInspectionOverdue(registrationPlate, inspection.daysUntilDue);
      logger.warn('Inspection overdue notification sent', {
        plate: registrationPlate,
        daysOverdue: Math.abs(inspection.daysUntilDue),
      });
    }
    // Check if due within threshold
    else if (
      inspection.daysUntilDue >= 0 &&
      inspection.daysUntilDue <= thresholdDays
    ) {
      result.status = 'due-soon';
      await notifyInspectionDueSoon(
        registrationPlate,
        inspection.daysUntilDue
      );
      logger.info('Inspection due soon notification sent', {
        plate: registrationPlate,
        daysUntil: inspection.daysUntilDue,
      });
    }

    return result;
  } catch (error: any) {
    logger.error('Failed to check inspection status', {
      plate: registrationPlate,
      error: error?.message,
    });
    return {
      plate: registrationPlate,
      status: 'unknown',
    };
  }
};

/**
 * Batch check inspection status for multiple vehicles
 */
export const checkAndNotifyMultipleVehicles = async (
  registrationPlates: string[],
  thresholdDays: number = 30
): Promise<InspectionCheckResult[]> => {
  const results = await Promise.all(
    registrationPlates.map((plate) =>
      checkAndNotifyInspectionStatus(plate, thresholdDays)
    )
  );

  const overdue = results.filter((r) => r.status === 'overdue');
  const dueSoon = results.filter((r) => r.status === 'due-soon');

  if (overdue.length > 0) {
    logger.warn(`${overdue.length} vehicles have overdue inspections`);
  }
  if (dueSoon.length > 0) {
    logger.info(`${dueSoon.length} vehicles have inspections due soon`);
  }

  return results;
};

/**
 * Initialize periodic inspection checking
 * Checks all user vehicles every 24 hours
 */
export const initializePeriodicInspectionChecks = (
  registrationPlates: string[],
  intervalHours: number = 24
) => {
  if (registrationPlates.length === 0) {
    logger.debug('No vehicles to monitor for inspections');
    return null;
  }

  const intervalMs = intervalHours * 60 * 60 * 1000;

  // Check immediately on initialization
  checkAndNotifyMultipleVehicles(registrationPlates).catch((error) => {
    logger.error('Initial inspection check failed', { error: error?.message });
  });

  // Then check periodically
  const intervalId = setInterval(() => {
    checkAndNotifyMultipleVehicles(registrationPlates).catch((error) => {
      logger.error('Periodic inspection check failed', { error: error?.message });
    });
  }, intervalMs);

  logger.info('Periodic inspection checks initialized', {
    vehicleCount: registrationPlates.length,
    intervalHours,
  });

  return intervalId;
};

/**
 * Stop periodic inspection checking
 */
export const stopPeriodicInspectionChecks = (intervalId: NodeJS.Timeout | null) => {
  if (intervalId) {
    clearInterval(intervalId);
    logger.info('Periodic inspection checks stopped');
  }
};
