import axios from 'axios';

import { Dispatch } from 'redux';
import { displayLocalNotification } from '../../utils/notifications';
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
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_SERVER_URL}/booking/user/token`,
        token, 
        {
          headers: {
            'Content-Type': 'text/plain', 
          },
        }
      );

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
      const response = await axios.put(
        process.env.EXPO_PUBLIC_SERVER_URL+ `/booking/${bookingId}`,
        booking,
      );
      dispatch(updateBookingSuccess(response.data));
            await displayLocalNotification(
                'Booking updated Successfully!', 
                `${response.data}!`
              );
      
      // Handle navigation or other actions here
    } catch (error) {
      console.log(error);
      // Handle error messages
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
      // Handle navigation or other actions here
    } catch (error) {
      console.log(error);
      // Handle error messages
    }
  };
};
