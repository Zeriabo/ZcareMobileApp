import { Dispatch } from 'redux';
import { ThunkAction } from 'redux-thunk';
import { apiClient } from '../../utils/apiClient';
import { logger } from '../../utils/logger';
import { RootState } from '../store';
import {
    FETCH_WASHES_FAILURE,
    FETCH_WASHES_REQUEST,
    FETCH_WASHES_SUCCESS,
    WashesAction,
} from '../types/washesActionTypes';

export const SELECT_WASHES = 'SELECT_WASHES';

export const fetchWashesBooked = (
  carId: number,
): ThunkAction<Promise<void>, RootState, undefined, WashesAction> => {
  return async (dispatch: Dispatch<WashesAction>) => {
    dispatch({ type: FETCH_WASHES_REQUEST });
    try {
      // Fallback implementation using REST bookings endpoint.
      logger.debug('Fetching booked washes', { carId });
      const response = await apiClient.get<any>(`${process.env.EXPO_PUBLIC_SERVER_URL}/booking`);
      
      // apiClient returns data directly
      const washesData = Array.isArray(response) 
        ? response 
        : (Array.isArray(response?.data) ? response.data : Object.values(response || {}));
      
      const carWashes = washesData.filter((wash: any) => Number(wash?.car?.carId) === Number(carId));

      logger.info('Washes fetched successfully', { count: carWashes.length, carId });
      dispatch({
        type: FETCH_WASHES_SUCCESS,
        payload: carWashes,
      });
    } catch (error: any) {
      logger.error('Failed to fetch washes', { carId, error: error.message });
      dispatch({
        type: FETCH_WASHES_FAILURE,
        error: error?.response?.data?.message || error?.message || 'Failed to fetch washes',
      });
    }
  };
};
