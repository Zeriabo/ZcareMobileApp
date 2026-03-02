/**
 * Repair Redux Reducer
 * Manages repair bookings and inspection data state
 */

import { RepairState, RepairBooking, InspectionData, REPAIR_ACTION_TYPES } from '../types/repairTypes';

const initialState: RepairState = {
  bookings: [],
  selectedBooking: null,
  loading: false,
  error: null,
  inspectionData: new Map(),
};

interface RepairAction {
  type: string;
  payload?: any;
}

const repairReducer = (state = initialState, action: RepairAction): RepairState => {
  switch (action.type) {
    // Booking actions
    case REPAIR_ACTION_TYPES.SET_REPAIR_BOOKINGS:
      return {
        ...state,
        bookings: action.payload || [],
        error: null,
      };

    case REPAIR_ACTION_TYPES.SET_SELECTED_REPAIR_BOOKING:
      return {
        ...state,
        selectedBooking: action.payload,
      };

    case REPAIR_ACTION_TYPES.ADD_REPAIR_BOOKING:
      return {
        ...state,
        bookings: [...state.bookings, action.payload],
        error: null,
      };

    case REPAIR_ACTION_TYPES.UPDATE_REPAIR_BOOKING:
      return {
        ...state,
        bookings: state.bookings.map((booking) =>
          booking.id === action.payload.id ? action.payload : booking
        ),
        selectedBooking:
          state.selectedBooking?.id === action.payload.id ? action.payload : state.selectedBooking,
        error: null,
      };

    case REPAIR_ACTION_TYPES.DELETE_REPAIR_BOOKING:
      return {
        ...state,
        bookings: state.bookings.filter((booking) => booking.id !== action.payload),
        selectedBooking: state.selectedBooking?.id === action.payload ? null : state.selectedBooking,
        error: null,
      };

    // Inspection actions
    case REPAIR_ACTION_TYPES.SET_INSPECTION_DATA:
      return {
        ...state,
        inspectionData: new Map(action.payload || []),
      };

    case REPAIR_ACTION_TYPES.SET_INSPECTION_DATA_FOR_PLATE:
      const { plate, data } = action.payload;
      const newInspectionMap = new Map(state.inspectionData);
      newInspectionMap.set(plate, data);
      return {
        ...state,
        inspectionData: newInspectionMap,
      };

    // Loading & Error
    case REPAIR_ACTION_TYPES.SET_REPAIR_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    case REPAIR_ACTION_TYPES.SET_REPAIR_ERROR:
      return {
        ...state,
        error: action.payload,
      };

    case REPAIR_ACTION_TYPES.CLEAR_REPAIR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

export default repairReducer;
