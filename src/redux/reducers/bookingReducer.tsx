// bookingReducer.ts

import { Booking } from '../types/bookingTypes'; // Import your booking type

// Define the state interface
export interface BookingState {
  bookings: Booking[];
  selectedBooking: Booking | null;
}

// Define initial state
const initialState: BookingState = {
  bookings: [],
  selectedBooking: null,
};

// Reducer function
const bookingReducer = (state = initialState, action: any): BookingState => {
  switch (action.type) {

    case 'FETCH_BOOKINGS_SUCCESS':
      return { ...state, bookings: action.payload };
    case 'SET_BOOKINGS':
      return {
        ...state,
        bookings: action.payload,
      };
    case 'SET_SELECTED_BOOKING':
      return {
        ...state,
        selectedBooking: action.payload,
      };
    case 'CREATE_BOOKING':
    case 'CREATE_BOOKING_SUCCESS':
      return {
        ...state,
        bookings: [...state.bookings, action.payload],
      };
    case 'UPDATE_BOOKING':
    case 'UPDATE_BOOKING_SUCCESS':
      const updatedBookings = state.bookings.map(booking =>
        booking.id === action.payload.id ? action.payload : booking,
      );
      return {
        ...state,
        bookings: updatedBookings,
      };
    case 'DELETE_BOOKING':
    case 'DELETE_BOOKING_SUCCESS':
      const filteredBookings = state.bookings.filter(
        booking => booking.id !== action.payload,
      );
      return {
        ...state,
        bookings: filteredBookings,
      };
    default:
      return state;
  }
};

export default bookingReducer;
