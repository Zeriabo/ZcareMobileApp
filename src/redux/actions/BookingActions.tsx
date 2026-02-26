import axios from 'axios';

import { Dispatch } from 'redux';
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
      const response = await axios.get(`${process.env.EXPO_PUBLIC_SERVER_URL}/booking`);
      dispatch({ type: 'SET_BOOKINGS', payload: response.data });
    } catch (error) {
      console.log(error);
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
        () => axios.post(`${base}/booking/user/token`, token, {
          headers: { 'Content-Type': 'text/plain' },
        }),
        () => axios.post(`${base}/booking/user`, { token }, {
          headers: { 'Content-Type': 'application/json' },
        }),
        () => axios.get(`${base}/booking/user`, {
          headers: { Authorization: authHeader },
        }),
        () => axios.get(`${base}/booking/user`, {
          headers: { Authorization: rawToken },
        }),
        () => axios.get(`${base}/booking/user`, {
          headers: { token: rawToken },
        }),
        () => axios.get(`${base}/booking/user`, {
          params: { token: rawToken },
        }),
        () => axios.get(`${base}/v1/bookings/user`, {
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
            console.error('User bookings 400 response:', error?.response?.data);
          }
          if (![400, 404, 405].includes(error?.response?.status)) {
            throw error;
          }
        }
      }

      if (!response) {
        throw lastError || new Error('User bookings endpoint unavailable');
      }
     console.log('User bookings response:', response.data);
      dispatch({ type: 'SET_BOOKINGS', payload: response.data });
    } catch (error: any) {
      console.error('Error fetching user bookings:', error);
    }
  };
};

export const fetchBooking = (bookingId: any) => {
  return async (dispatch: any) => {
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_SERVER_URL+ `/booking/${bookingId}`,
      );
      dispatch(fetchBookingSuccess(response.data));
    } catch (error) {
      console.log(error);
    }
  };
};

//wrong json
export const createBooking = (bookingInput: any) => {
  console.log('Booking payload:', bookingInput);
  return async (dispatch: Dispatch) => {
    try {
      const response = await axios.post(
        process.env.EXPO_PUBLIC_SERVER_URL + '/booking',
        bookingInput,
      );
      console.log('Booking API response:', response);

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
      console.error('Booking API error:', error);
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
        () => axios.patch(`${base}/v1/bookings/${bookingId}/schedule`, { scheduledTime: booking?.scheduledTime }),
        () => axios.patch(`${base}/booking/${bookingId}/schedule`, { scheduledTime: booking?.scheduledTime }),
        () => axios.put(`${base}/booking/${bookingId}`, booking),
        () => axios.put(`${base}/v1/bookings/${bookingId}`, booking),
        () => axios.patch(`${base}/booking/${bookingId}`, { scheduledTime: booking?.scheduledTime }),
        () => axios.patch(`${base}/v1/bookings/${bookingId}`, { scheduledTime: booking?.scheduledTime }),
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

      dispatch(updateBookingSuccess(response.data));
      dispatch({ type: 'UPDATE_BOOKING', payload: response.data });
            await displayLocalNotification(
                'Booking updated Successfully!', 
                `${response.data}!`
              );
      return response.data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };
};

export const deleteBooking = (bookingId: any) => {
  return async (dispatch: any) => {
    try {
      await axios.delete(
        process.env.EXPO_PUBLIC_SERVER_URL+ `/booking/${bookingId}`,
      );
      dispatch(deleteBookingSuccess(bookingId));
      dispatch({ type: 'DELETE_BOOKING', payload: bookingId });
      return true;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };
};
