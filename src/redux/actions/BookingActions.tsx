import { Dispatch } from 'redux';
import { apiClient } from '../../utils/apiClient';
import { logger } from '../../utils/logger';
import { displayLocalNotification, scheduleBookingReminder } from '../../utils/notifications';
import { AppDispatch } from '../store';

// Action Types
export const FETCH_BOOKINGS_SUCCESS = 'FETCH_BOOKINGS_SUCCESS';
export const FETCH_BOOKING_SUCCESS = 'FETCH_BOOKING_SUCCESS';
export const CREATE_BOOKING_SUCCESS = 'CREATE_BOOKING_SUCCESS';
export const UPDATE_BOOKING_SUCCESS = 'UPDATE_BOOKING_SUCCESS';
export const DELETE_BOOKING_SUCCESS = 'DELETE_BOOKING_SUCCESS';

// Action Creators
export const fetchBookingsSuccess = (bookings: any) => ({
  type: FETCH_BOOKINGS_SUCCESS,
  payload: bookings,
});

export const fetchBookingSuccess = (booking: any) => ({
  type: FETCH_BOOKING_SUCCESS,
  payload: booking,
});

export const createBookingSuccess = (booking: any) => ({
  type: CREATE_BOOKING_SUCCESS,
  payload: booking,
});

export const updateBookingSuccess = (booking: any) => ({
  type: UPDATE_BOOKING_SUCCESS,
  payload: booking,
});

export const deleteBookingSuccess = (bookingId: any) => ({
  type: DELETE_BOOKING_SUCCESS,
  payload: bookingId,
});

// Thunk Actions
export const fetchBookings = () => {
  return async (dispatch: AppDispatch) => {
    try {
      const response = await apiClient.get<any>(`${process.env.EXPO_PUBLIC_SERVER_URL}/booking`);
      dispatch({ type: 'SET_BOOKINGS', payload: response.data });
    } catch (error) {
      logger.error('Failed to fetch bookings', { error });
    }
  };
};
export const fetchUserBookings = (token: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      const base = process.env.EXPO_PUBLIC_SERVER_URL || '';
      const normalizedToken = (token || '').trim();
      const authHeader = normalizedToken.startsWith('Bearer ')
        ? normalizedToken
        : `Bearer ${normalizedToken}`;
      const rawToken = normalizedToken.replace(/^Bearer\s+/i, '');
      const attempts = [
        () => apiClient.post<any>(`${base}/booking/user/token`, token, {
          headers: { 'Content-Type': 'text/plain' },
        }),
        () => apiClient.post<any>(`${base}/booking/user`, { token }, {
          headers: { 'Content-Type': 'application/json' },
        }),
        () => apiClient.get<any>(`${base}/booking/user`, {
          headers: { Authorization: authHeader },
        }),
        () => apiClient.get<any>(`${base}/booking/user`, {
          headers: { Authorization: rawToken },
        }),
        () => apiClient.get<any>(`${base}/booking/user`, {
          headers: { token: rawToken },
        }),
        () => apiClient.get<any>(`${base}/booking/user`, {
          params: { token: rawToken },
        }),
        () => apiClient.get<any>(`${base}/v1/bookings/user`, {
          headers: { Authorization: authHeader },
        }),
      ];

      let response: any;
      let lastError: any = null;

      for (const attempt of attempts) {
        try {
          response = await attempt();
          if (response) break;
        } catch (error: any) {
          lastError = error;
          if (error?.response?.status === 400) {
            logger.warn('User bookings 400 response', { data: error?.response?.data });
          }
          if (![400, 404, 405].includes(error?.response?.status)) {
            throw error;
          }
        }
      }

      if (!response) {
        throw lastError || new Error('User bookings endpoint unavailable');
      }
      logger.info('User bookings fetched successfully', { count: response.data?.length });
      dispatch({ type: 'SET_BOOKINGS', payload: response.data });
    } catch (error: any) {
      logger.error('Failed to fetch user bookings', { error: error.message });
    }
  };
};

export const fetchBooking = (bookingId: any) => {
  return async (dispatch: any) => {
    try {
      const response = await apiClient.get<any>(
        process.env.EXPO_PUBLIC_SERVER_URL+ `/booking/${bookingId}`,
      );
      dispatch(fetchBookingSuccess(response.data));
    } catch (error) {
      logger.error('Failed to fetch booking', { bookingId, error });
    }
  };
};

//wrong json
export const createBooking = (bookingInput: any) => {
  logger.debug('Creating booking', { bookingInput });
  return async (dispatch: Dispatch) => {
    try {
      const response = await apiClient.post<any>(
        process.env.EXPO_PUBLIC_SERVER_URL + '/booking',
        bookingInput,
      );
      logger.info('Booking created successfully', { booking: response.data });

      // Dispatch a success action
      dispatch(createBookingSuccess(response.data));
      await displayLocalNotification(
                'Booking Successful', 
                `${(!response.data.executed)?'Valid':'Not Valid'}`
              );
      const isRepair =
        response?.data?.bookingType === 'REPAIR' ||
        !!response?.data?.repairShopId ||
        !response?.data?.washingProgramId;
      await scheduleBookingReminder(
        bookingInput?.scheduledTime || response?.data?.scheduledTime,
        isRepair ? 'Repair booking' : 'Wash booking'
      );
      
      // ✅ Return response data so the component can use it
      return response.data;
    } catch (error) {
      logger.error('Failed to create booking', { error });
      throw error; // ✅ Re-throw so your component can catch it
    }
  };
};

export const updateBooking = (bookingId: any, booking: any) => {
  return async (dispatch: any) => {
    try {
      const base = process.env.EXPO_PUBLIC_SERVER_URL;
      let response: any;
      const attempts = [
        () => apiClient.patch<any>(`${base}/v1/bookings/${bookingId}/schedule`, { scheduledTime: booking?.scheduledTime }),
        () => apiClient.patch<any>(`${base}/booking/${bookingId}/schedule`, { scheduledTime: booking?.scheduledTime }),
        () => apiClient.put<any>(`${base}/booking/${bookingId}`, booking),
        () => apiClient.put<any>(`${base}/v1/bookings/${bookingId}`, booking),
        () => apiClient.patch<any>(`${base}/booking/${bookingId}`, { scheduledTime: booking?.scheduledTime }),
        () => apiClient.patch<any>(`${base}/v1/bookings/${bookingId}`, { scheduledTime: booking?.scheduledTime }),
      ];

      let lastError: any = null;
      for (const attempt of attempts) {
        try {
          response = await attempt();
          if (response) break;
        } catch (error: any) {
          lastError = error;
          // only continue fallback on not-found/method-not-allowed
          if (![404, 405].includes(error?.response?.status)) {
            throw error;
          }
        }
      }

      if (!response) {
        throw lastError || new Error('Update booking endpoint unavailable');
      }

      logger.info('Booking updated successfully', { bookingId });
      dispatch(updateBookingSuccess(response.data));
      dispatch({ type: 'UPDATE_BOOKING', payload: response.data });
            await displayLocalNotification(
                'Booking updated Successfully!', 
                `${response.data}!`
              );
      return response.data;
    } catch (error) {
      logger.error('Failed to update booking', { bookingId, error });
      throw error;
    }
  };
};

export const deleteBooking = (bookingId: any) => {
  return async (dispatch: any) => {
    try {
      await apiClient.delete(
        process.env.EXPO_PUBLIC_SERVER_URL+ `/booking/${bookingId}`,
      );
      logger.info('Booking deleted successfully', { bookingId });
      dispatch(deleteBookingSuccess(bookingId));
      dispatch({ type: 'DELETE_BOOKING', payload: bookingId });
      return true;
    } catch (error) {
      logger.error('Failed to delete booking', { bookingId, error });
      throw error;
    }
  };
};
