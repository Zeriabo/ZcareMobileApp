import axios from 'axios';
import { Dispatch } from 'redux';
import {
  FETCH_WASHES_REQUEST,
  FETCH_WASHES_SUCCESS,
  FETCH_WASHES_FAILURE,
  WashesAction,
} from '../types/washesActionTypes';
import { RootState } from '../store';
import { ThunkAction } from 'redux-thunk';

export const SELECT_WASHES = 'SELECT_WASHES';

export const fetchWashesBooked = (
  carId: number,
): ThunkAction<Promise<void>, RootState, undefined, WashesAction> => {
  return async (dispatch: Dispatch<WashesAction>) => {
    dispatch({ type: FETCH_WASHES_REQUEST });
    try {
      // Fallback implementation using REST bookings endpoint.
      const response = await axios.get(`${process.env.EXPO_PUBLIC_SERVER_URL}/booking`);
      const washes = Array.isArray(response.data) ? response.data : [];
      const carWashes = washes.filter((wash: any) => Number(wash?.car?.carId) === Number(carId));

      dispatch({
        type: FETCH_WASHES_SUCCESS,
        payload: carWashes,
      });
    } catch (error: any) {
      console.log(error);
      dispatch({
        type: FETCH_WASHES_FAILURE,
        error: error?.response?.data?.message || error?.message || 'Failed to fetch washes',
      });
    }
  };
};
