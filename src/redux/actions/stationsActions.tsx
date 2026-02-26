import axios from 'axios';
import { Dispatch } from 'redux';
import { ThunkAction } from 'redux-thunk';
import { RootState } from '../store';
import {
    FETCH_STATIONS_FAILURE,
    FETCH_STATIONS_REQUEST,
    FETCH_STATIONS_SUCCESS,
    StationsAction,
} from '../types/stationsActionTypes';

const getStationEndpoints = (baseUrlRaw: string): string[] => {
  const baseUrl = (baseUrlRaw || '').trim().replace(/\/+$/, '');
  if (!baseUrl) return [];

  const endpoints = [`${baseUrl}/stations/`];

  // Gateway on :8080 can be down while station service on :8090 is healthy.
  if (baseUrl.includes(':8080')) {
    endpoints.push(`${baseUrl.replace(':8080', ':8090')}/v1/stations/`);
  }

  if (!baseUrl.includes(':8090')) {
    endpoints.push(`${baseUrl}/v1/stations/`);
  }

  return Array.from(new Set(endpoints));
};


// Fetch stations action using REST API
export const fetchStations = (): ThunkAction<
  Promise<void>,
  RootState,
  undefined,
  StationsAction
> => {
  return async (dispatch: Dispatch<StationsAction>) => {
    dispatch({ type: FETCH_STATIONS_REQUEST });

    try {
      const serverBase = process.env.EXPO_PUBLIC_SERVER_URL || '';
      console.log('SERVER URL:', serverBase);

      const stationEndpoints = getStationEndpoints(serverBase);
      let lastError: any = null;

      for (const endpoint of stationEndpoints) {
        try {
          const response = await axios.get(endpoint, { timeout: 10000 });
          dispatch({
            type: FETCH_STATIONS_SUCCESS,
            payload: response.data,
          });
          return;
        } catch (error: any) {
          lastError = error;
          const details = {
            message: error?.message,
            code: error?.code,
            status: error?.response?.status,
            url: error?.config?.url,
            response: error?.response?.data,
            toJSON: typeof error?.toJSON === 'function' ? error.toJSON() : undefined,
          };
          console.log('Station endpoint failed:', endpoint, JSON.stringify(details));
        }
      }

      throw lastError || new Error('Failed to fetch stations');
    } catch (error: any) {
      console.log(error);
      dispatch({
        type: FETCH_STATIONS_FAILURE,
        error:
          error.response?.data?.message ||
          error.message ||
          'Failed to fetch stations',
      });
    }
  };
};
