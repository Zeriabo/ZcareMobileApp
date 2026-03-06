/**
 * Repair Redux Actions
 * Async actions for repair bookings and vehicle inspection
 */

import { logger } from '../../utils/logger';
import {
    notifyRepairBookingCreated,
    notifyInspectionDueSoon,
    notifyInspectionOverdue,
    notifyRepairStatusChanged,
    scheduleRepairReminder
} from '../../utils/notifications';
import * as repairService from '../../utils/repairService';
import { AppDispatch } from '../store';
import {
    CreateRepairBookingRequest,
    InspectionData,
    REPAIR_ACTION_TYPES
} from '../types/repairTypes';

const inspectionNotificationCache = new Map<string, string>();

/**
 * Fetch all repair bookings
 */
export const fetchRepairBookings = () => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch({
        type: REPAIR_ACTION_TYPES.SET_REPAIR_LOADING,
        payload: true,
      });

      const bookings = await repairService.listRepairBookings();
      dispatch({
        type: REPAIR_ACTION_TYPES.SET_REPAIR_BOOKINGS,
        payload: bookings,
      });

      logger.info('Repair bookings fetched successfully', { count: bookings.length });
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to fetch repair bookings';
      dispatch({
        type: REPAIR_ACTION_TYPES.SET_REPAIR_ERROR,
        payload: errorMessage,
      });
      logger.error('Failed to fetch repair bookings', { error: errorMessage });
    } finally {
      dispatch({
        type: REPAIR_ACTION_TYPES.SET_REPAIR_LOADING,
        payload: false,
      });
    }
  };
};

/**
 * Fetch a specific repair booking
 */
export const fetchRepairBooking = (bookingId: string | number) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch({
        type: REPAIR_ACTION_TYPES.SET_REPAIR_LOADING,
        payload: true,
      });

      const booking = await repairService.getRepairBooking(bookingId);
      dispatch({
        type: REPAIR_ACTION_TYPES.SET_SELECTED_REPAIR_BOOKING,
        payload: booking,
      });

      logger.info('Repair booking fetched', { bookingId });
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to fetch repair booking';
      dispatch({
        type: REPAIR_ACTION_TYPES.SET_REPAIR_ERROR,
        payload: errorMessage,
      });
      logger.error('Failed to fetch repair booking', { error: errorMessage });
    } finally {
      dispatch({
        type: REPAIR_ACTION_TYPES.SET_REPAIR_LOADING,
        payload: false,
      });
    }
  };
};

/**
 * Create a new repair booking
 */
export const createRepairBooking = (data: CreateRepairBookingRequest) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch({
        type: REPAIR_ACTION_TYPES.SET_REPAIR_LOADING,
        payload: true,
      });

      const newBooking = await repairService.createRepairBooking(data);
      dispatch({
        type: REPAIR_ACTION_TYPES.ADD_REPAIR_BOOKING,
        payload: newBooking,
      });

      // Send booking created notification
      await notifyRepairBookingCreated(
        data.vehicleRegistrationNumber,
        data.scheduledDate
      );

      // Schedule repair reminder
      await scheduleRepairReminder(data.scheduledDate, data.vehicleRegistrationNumber);

      logger.info('Repair booking created', { bookingId: newBooking.id });
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to create repair booking';
      dispatch({
        type: REPAIR_ACTION_TYPES.SET_REPAIR_ERROR,
        payload: errorMessage,
      });
      logger.error('Failed to create repair booking', { error: errorMessage });
      throw error;
    } finally {
      dispatch({
        type: REPAIR_ACTION_TYPES.SET_REPAIR_LOADING,
        payload: false,
      });
    }
  };
};

/**
 * Update repair booking status
 */
export const updateRepairBookingStatus = (bookingId: string | number, status: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch({
        type: REPAIR_ACTION_TYPES.SET_REPAIR_LOADING,
        payload: true,
      });

      const updatedBooking = await repairService.updateRepairBookingStatus(bookingId, status);
      dispatch({
        type: REPAIR_ACTION_TYPES.UPDATE_REPAIR_BOOKING,
        payload: updatedBooking,
      });

      // Send status changed notification
      await notifyRepairStatusChanged(
        updatedBooking.vehicleRegistrationNumber,
        status
      );

      logger.info('Repair booking status updated', { bookingId, status });
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to update repair booking';
      dispatch({
        type: REPAIR_ACTION_TYPES.SET_REPAIR_ERROR,
        payload: errorMessage,
      });
      logger.error('Failed to update repair booking', { error: errorMessage });
      throw error;
    } finally {
      dispatch({
        type: REPAIR_ACTION_TYPES.SET_REPAIR_LOADING,
        payload: false,
      });
    }
  };
};

/**
 * Cancel a repair booking
 */
export const cancelRepairBooking = (bookingId: string | number) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch({
        type: REPAIR_ACTION_TYPES.SET_REPAIR_LOADING,
        payload: true,
      });

      const cancelledBooking = await repairService.cancelRepairBooking(bookingId);
      dispatch({
        type: REPAIR_ACTION_TYPES.UPDATE_REPAIR_BOOKING,
        payload: cancelledBooking,
      });

      await notifyRepairStatusChanged(
        cancelledBooking.vehicleRegistrationNumber,
        'CANCELLED'
      );

      logger.info('Repair booking cancelled', { bookingId });
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to cancel repair booking';
      dispatch({
        type: REPAIR_ACTION_TYPES.SET_REPAIR_ERROR,
        payload: errorMessage,
      });
      logger.error('Failed to cancel repair booking', { error: errorMessage });
      throw error;
    } finally {
      dispatch({
        type: REPAIR_ACTION_TYPES.SET_REPAIR_LOADING,
        payload: false,
      });
    }
  };
};

/**
 * Fetch inspection status for a vehicle
 */
export const fetchInspectionStatus = (registrationPlate: string, thresholdDays: number = 30) => {
  return async (dispatch: AppDispatch) => {
    try {
      const status = await repairService.getInspectionStatus(registrationPlate, thresholdDays);

      const notificationDate = new Date().toISOString().slice(0, 10);
      const notificationState = status.daysUntilDue < 0 ? 'overdue' : status.dueWithinThreshold ? 'due-soon' : 'ok';
      const notificationKey = `${registrationPlate}:${notificationState}:${notificationDate}`;

      if (!inspectionNotificationCache.has(notificationKey)) {
        if (status.daysUntilDue < 0) {
          await notifyInspectionOverdue(registrationPlate, status.daysUntilDue);
          inspectionNotificationCache.set(notificationKey, notificationDate);
        } else if (status.dueWithinThreshold) {
          await notifyInspectionDueSoon(registrationPlate, status.daysUntilDue);
          inspectionNotificationCache.set(notificationKey, notificationDate);
        }
      }

      dispatch({
        type: REPAIR_ACTION_TYPES.SET_INSPECTION_DATA_FOR_PLATE,
        payload: {
          plate: registrationPlate,
          data: status,
        },
      });

      logger.info('Inspection status fetched', { plate: registrationPlate });
    } catch (error: any) {
      const status = error?.status || error?.response?.status;
      
      // 404 means no inspection data exists - this is not an error condition
      if (status === 404) {
        dispatch({
          type: REPAIR_ACTION_TYPES.SET_INSPECTION_DATA_FOR_PLATE,
          payload: {
            plate: registrationPlate,
            data: null, // No inspection data available
          },
        });
        logger.debug('No inspection data available', { plate: registrationPlate });
      } else {
        // Only log actual errors (not 404s)
        logger.error('Failed to fetch inspection status', {
          plate: registrationPlate,
          error: error?.message,
          status,
        });
      }
    }
  };
};

/**
 * Fetch last inspection date for a vehicle
 */
export const fetchLastInspection = (registrationPlate: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      const inspection = await repairService.getLastInspection(registrationPlate);
      const data: InspectionData = {
        registrationNumber: inspection.registrationNumber,
        lastInspectionDate: inspection.lastInspectionDate,
        message: inspection.message,
      };

      dispatch({
        type: REPAIR_ACTION_TYPES.SET_INSPECTION_DATA_FOR_PLATE,
        payload: {
          plate: registrationPlate,
          data,
        },
      });

      logger.info('Last inspection fetched', { plate: registrationPlate });
    } catch (error: any) {
      logger.error('Failed to fetch last inspection', {
        plate: registrationPlate,
        error: error?.message,
      });
    }
  };
};

/**
 * Fetch next inspection date for a vehicle
 */
export const fetchNextInspection = (registrationPlate: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      const inspection = await repairService.getNextInspection(registrationPlate);
      const data: InspectionData = {
        registrationNumber: inspection.registrationNumber,
        lastInspectionDate: inspection.lastInspectionDate,
        message: inspection.message,
      };

      dispatch({
        type: REPAIR_ACTION_TYPES.SET_INSPECTION_DATA_FOR_PLATE,
        payload: {
          plate: registrationPlate,
          data,
        },
      });

      logger.info('Next inspection fetched', { plate: registrationPlate });
    } catch (error: any) {
      logger.error('Failed to fetch next inspection', {
        plate: registrationPlate,
        error: error?.message,
      });
    }
  };
};

/**
 * Clear repair error
 */
export const clearRepairError = () => ({
  type: REPAIR_ACTION_TYPES.CLEAR_REPAIR_ERROR,
});
